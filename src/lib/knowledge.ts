import { getCollection } from 'astro:content';

export const kindLabels = {
  resource: '资料',
  article: '文章',
  note: '笔记',
} as const;

export async function publishedKnowledge() {
  const documents = await getCollection('docs', ({ id, data }) => id.startsWith('knowledge/') && !data.draft);
  const entries = documents.map((entry) => {
    const { entryId, kind } = entry.data;
    if (!entryId || !kind) throw new Error(`知识条目缺少 entryId 或 kind：${entry.id}`);
    return { ...entry, data: { ...entry.data, entryId, kind } };
  });
  const stableIds = new Set<string>();
  for (const entry of entries) {
    if (stableIds.has(entry.data.entryId)) {
      throw new Error(`重复知识条目 ID：${entry.data.entryId}`);
    }
    stableIds.add(entry.data.entryId);
  }
  return entries.sort((a, b) => a.data.title.localeCompare(b.data.title, 'zh-CN'));
}
