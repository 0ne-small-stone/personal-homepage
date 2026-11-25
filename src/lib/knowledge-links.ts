type KnowledgeKind = 'resource' | 'article' | 'note';

interface KnowledgeEntry {
  id: string;
  filePath?: string;
  data: {
    entryId?: string;
    kind?: KnowledgeKind;
    draft?: boolean;
    related: string[];
    series?: string;
    sidebar?: { order?: number };
  };
}

/** Business entryId is stable across changes to the native collection ID/route. */
export function knowledgeIndex<T extends KnowledgeEntry>(entries: T[]) {
  const index = new Map<string, T>();
  const seriesOrders = new Map<string, Set<number>>();
  for (const entry of entries) {
    const { entryId, kind, series, draft, sidebar } = entry.data;
    if (!entryId || !kind) throw new Error(`知识条目缺少 entryId 或 kind：${entry.filePath ?? entry.id}`);
    if (index.has(entryId)) throw new Error(`重复知识条目 ID：${entryId}（${entry.filePath ?? entry.id}）`);
    index.set(entryId, entry);
    if (series && !draft) {
      const order = sidebar?.order;
      if (order === undefined || !Number.isFinite(order)) throw new Error(`系列 ${series} 缺少有效章节顺序：${entry.filePath ?? entry.id}`);
      const orders = seriesOrders.get(series) ?? new Set<number>();
      if (orders.has(order)) throw new Error(`系列 ${series} 的章节顺序 ${order} 重复：${entry.filePath ?? entry.id}`);
      orders.add(order);
      seriesOrders.set(series, orders);
    }
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

function chapterOrder(a: KnowledgeEntry, b: KnowledgeEntry) {
  return a.data.sidebar!.order! - b.data.sidebar!.order!;
}

/** Each destination has one place after the reader, with chapter navigation first. */
export function resolveReadingLinks<T extends KnowledgeEntry>(entry: T | undefined, index: ReadonlyMap<string, T>) {
  const series = entry?.data.series;
  const chapters = series && !entry?.data.draft
    ? [...index.values()].filter((item) => item.data.series === series && !item.data.draft).sort(chapterOrder)
    : [];
  const position = entry ? chapters.indexOf(entry) : -1;
  const previous = position > 0 ? chapters[position - 1] : undefined;
  const next = position >= 0 ? chapters[position + 1] : undefined;
  const forward = resolveRelated(entry, index);
  const remaining = forward.filter((item) => item !== previous && item !== next);
  const related = remaining.filter((item) => !series || item.data.series !== series);
  const otherChapters = series ? remaining.filter((item) => item.data.series === series).sort(chapterOrder) : [];
  // A reference book can point to an entire series without being part of its sequence.
  const linkedSeries = related[0]?.data.series;
  if (linkedSeries && related.every((item) => item.data.series === linkedSeries)) related.sort(chapterOrder);
  const placed = new Set([...forward, previous, next]);
  const backlinks = resolveBacklinks(entry, index).filter((item) => !placed.has(item));
  return { previous, next, related, otherChapters, backlinks };
}
