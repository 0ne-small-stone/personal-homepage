import { z } from 'astro/zod';
import settings from '../data/blog-settings.json';

// Reject malformed CMS settings rather than silently changing site behavior.
export const blogSettings = z.object({
  tagBrowsingEnabled: z.boolean(),
}).strict().parse(settings);
