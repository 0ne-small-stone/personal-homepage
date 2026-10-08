import { getCollection } from 'astro:content';
import { knowledgeIndex, resolveRelated } from './knowledge-links';

export const kindLabels = {
  resource: '资料',
  article: '文章',
  note: '笔记',
} as const;

export async function publishedKnowledge() {
  const documents = await getCollection('docs', ({ id }) => id.startsWith('knowledge/'));
  knowledgeIndex(documents);
  const entries = documents.filter((entry) => !entry.data.draft).map((entry) => {
    const { entryId, kind } = entry.data;
    if (!entryId || !kind) throw new Error(`知识条目缺少 entryId 或 kind：${entry.id}`);
    return { ...entry, data: { ...entry.data, entryId, kind } };
  });
  return entries.sort((a, b) =>
    a.data.topics.join('/').localeCompare(b.data.topics.join('/'), 'zh-CN') ||
    a.data.title.localeCompare(b.data.title, 'zh-CN', { numeric: true }));
}

export async function relatedKnowledge(entryId: string | undefined) {
  if (!entryId) return [];
  const documents = await getCollection('docs', ({ id }) => id.startsWith('knowledge/'));
  const index = knowledgeIndex(documents);
  return resolveRelated(index.get(entryId), index);
}
