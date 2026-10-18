import { z } from 'astro/zod';
import english from './profile-en.json' with { type: 'json' };
import chinese from './profile-zh-CN.json' with { type: 'json' };

const text = z.string().trim().min(1);
const paragraphs = z.array(text).min(1);
const experienceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  period: text, title: text, role: text, paragraphs,
});
export type ProfileExperience = z.infer<typeof experienceSchema>;
export const profileSchema = z.object({
  name: text, nickname: text, university: text, major: text,
  email: z.email(),
  github: z.url({ protocol: /^https$/ }).refine(value => { if (!URL.canParse(value)) return false; const url = new URL(value); return !url.username && !url.password; }),
  introduction: paragraphs,
  experiences: z.array(experienceSchema).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, '经历 ID 不能重复'),
  capabilities: z.array(z.object({ title: text, items: paragraphs, description: text })),
  learning: text,
  life: paragraphs,
  traces: z.array(z.object({
    name: text, label: text, path: z.enum(['knowledge', 'showcase', 'gallery', 'music']),
  })).refine(rows => new Set(rows.map(row => row.path)).size === rows.length, '栏目地址不能重复'),
});

export type SomeoneLanguage = 'en' | 'zh-CN';
export const profile = profileSchema.parse(english);
export const profiles: Record<SomeoneLanguage, z.infer<typeof profileSchema>> = {
  en: profile,
  'zh-CN': profileSchema.parse(chinese),
};
