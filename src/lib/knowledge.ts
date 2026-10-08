import { getCollection } from 'astro:content';
import { knowledgeIndex, resolveBacklinks, resolveRelated } from './knowledge-links';

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

export async function knowledgeRelations(entryId: string | undefined) {
  if (!entryId) return { related: [], backlinks: [] };
  const documents = await getCollection('docs', ({ id }) => id.startsWith('knowledge/'));
  const index = knowledgeIndex(documents);
  const entry = index.get(entryId);
  return {
    related: resolveRelated(entry, index),
    backlinks: resolveBacklinks(entry, index).sort((a, b) =>
      a.data.title.localeCompare(b.data.title, 'zh-CN', { numeric: true }) ||
      a.data.entryId!.localeCompare(b.data.entryId!)),
  };
}
