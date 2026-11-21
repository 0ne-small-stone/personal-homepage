import { z } from 'astro/zod';
import english from './profile-en.json' with { type: 'json' };
import chinese from './profile-zh-CN.json' with { type: 'json' };

const text = z.string().trim().min(1);
const paragraphs = z.array(text).min(1);
const experienceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  period: text, title: text, role: text, paragraphs: z.array(text).default([]),
  category: z.enum(['work', 'campus', 'service', 'awards']).default('work'),
  detail: z.boolean().default(false),
  aliases: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([]),
});
export type ProfileExperience = z.infer<typeof experienceSchema>;
export const profileSchema = z.object({
  name: text, nickname: text, university: text, major: text,
  email: z.email(),
  github: z.url({ protocol: /^https$/ }).refine(value => { if (!URL.canParse(value)) return false; const url = new URL(value); return !url.username && !url.password; }),
  introduction: paragraphs,
  education: z.array(experienceSchema).default([]),
  experiences: z.array(experienceSchema).refine(rows => {
    const anchors = rows.flatMap(row => [row.id, ...row.aliases]);
    return new Set(anchors).size === anchors.length;
  }, '���� ID �����ê�㲻���ظ�'),
  capabilities: z.array(z.object({ title: text, items: paragraphs, description: text.optional() })),
  learning: text,
  life: paragraphs,
  traces: z.array(z.object({
    name: text, label: text, path: z.enum(['knowledge', 'showcase', 'gallery', 'music']),
  })).refine(rows => new Set(rows.map(row => row.path)).size === rows.length, '��Ŀ��ַ�����ظ�'),
});

export type SomeoneLanguage = 'en' | 'zh-CN';
export const profile = profileSchema.parse(english);
export const profiles: Record<SomeoneLanguage, z.infer<typeof profileSchema>> = {
  en: profile,
  'zh-CN': profileSchema.parse(chinese),
};
