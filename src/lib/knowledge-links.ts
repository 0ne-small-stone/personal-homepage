type KnowledgeKind = 'resource' | 'article' | 'note';

interface KnowledgeEntry {
  id: string;
  filePath?: string;
  data: {
    entryId?: string;
    kind?: KnowledgeKind;
    draft?: boolean;
    related: string[];
  };
}

/** Business entryId is stable across changes to the native collection ID/route. */
export function knowledgeIndex<T extends KnowledgeEntry>(entries: T[]) {
  const index = new Map<string, T>();
  for (const entry of entries) {
    const { entryId, kind } = entry.data;
    if (!entryId || !kind) throw new Error(`知识条目缺少 entryId 或 kind：${entry.filePath ?? entry.id}`);
    if (index.has(entryId)) throw new Error(`重复知识条目 ID：${entryId}（${entry.filePath ?? entry.id}）`);
    index.set(entryId, entry);
  }
  // Validate every published source, including external redirects and PDF entries.
  for (const entry of entries) if (!entry.data.draft) resolveRelated(entry, index);
  return index;
}

export function resolveRelated<T extends KnowledgeEntry>(source: T | undefined, index: ReadonlyMap<string, T>): T[] {
  if (!source || source.data.draft) return [];
  const targets: T[] = [];
  for (const id of new Set(source.data.related)) {
    if (id === source.data.entryId) continue;
    const target = index.get(id);
    if (!target) throw new Error(`未知关联 ID：${source.filePath ?? source.id} → related: ${id}`);
    if (!target.data.draft) targets.push(target);
  }
  return targets;
}

/** Invert the same public forward links; never infer or store a second relation. */
export function resolveBacklinks<T extends KnowledgeEntry>(target: T | undefined, index: ReadonlyMap<string, T>): T[] {
  if (!target || target.data.draft) return [];
  return [...index.values()].filter((source) =>
    resolveRelated(source, index).some((related) => related.data.entryId === target.data.entryId));
}
