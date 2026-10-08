import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';
import { articleDateSchema } from './lib/article-date';

export const collections = {
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: (context) => blogSchema(context).extend({
        date: articleDateSchema,
        // Virtual blog lists and custom Starlight pages also use this schema.
        // Real knowledge entries are validated by publishedKnowledge().
        entryId: z.string().regex(/^[a-z0-9-]+$/).optional(),
        kind: z.enum(['resource', 'article', 'note']).optional(),
        topics: z.array(z.string()).default([]),
        example: z.boolean().default(false),
        related: z.array(z.string()).default([]),
        source: z.discriminatedUnion('format', [
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            format: z.literal('pdf'),
            author: z.string().optional(),
            bytes: z.number().int().positive(),
            pages: z.number().int().positive(),
            // Public attachments use portable, same-origin static paths.
            file: z.string().regex(/^materials\/[a-z0-9-]+\.pdf$/).optional(),
            sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
          }).refine((source) => Boolean(source.file) === Boolean(source.sha256), {
            message: 'Public PDF source.file and source.sha256 must be supplied together.',
          }),
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            format: z.literal('link'),
            author: z.string(),
            url: z.url({ protocol: /^https$/ }),
          }),
        ]).optional(),
      }),
    }),
  }),
};
