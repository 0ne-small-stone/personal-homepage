import { z } from 'astro/zod';
import rawWebsites from './websites.json' with { type: 'json' };
import { websiteCategories, websiteIcons, websiteBrands, type Website } from '../lib/website-directory.ts';
export * from '../lib/website-directory.ts';

export const websiteSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1),
  url: z.url({ protocol: /^https?$/ }).refine(value => { if (!URL.canParse(value)) return false; const url = new URL(value); return !url.username && !url.password; }, '网址不能包含账号或密码'),
  description: z.string().trim().min(1),
  category: z.enum(websiteCategories.map(item => item.id)),
  tags: z.array(z.string()).optional(),
  icon: z.enum(websiteIcons),
  featured: z.boolean().optional(),
  portrait: z.literal('li-zhi').optional(),
  brand: z.enum(websiteBrands).optional(),
});
export const websitesSchema = z.array(websiteSchema).superRefine((entries, ctx) => {
  const ids = new Set<string>(); const urls = new Set<string>();
  entries.forEach((entry, index) => {
    if (!URL.canParse(entry.url)) return;
    const url = new URL(entry.url).href;
    if (ids.has(entry.id)) ctx.addIssue({code:'custom',path:[index,'id'],message:'网站 ID 重复'});
    if (urls.has(url)) ctx.addIssue({code:'custom',path:[index,'url'],message:'网站 URL 重复'});
    ids.add(entry.id); urls.add(url);
  });
});
export function validateWebsites(entries: readonly Website[]): void { websitesSchema.parse(entries); }
export const websites: readonly Website[] = websitesSchema.parse(rawWebsites);
