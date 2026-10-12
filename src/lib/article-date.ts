import { z } from 'astro/zod';

// Pages CMS writes quoted ISO dates; starlight-blog consumes Date objects.
export const articleDateSchema = z.union([
  z.date(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, '请输入有效的 yyyy-MM-dd 日期。').transform((value) => new Date(`${value}T00:00:00.000Z`)),
]).optional();
