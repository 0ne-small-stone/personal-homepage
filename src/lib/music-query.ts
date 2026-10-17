import { QueryClient, infiniteQueryOptions, queryOptions, type InfiniteData } from '@tanstack/react-query';
import type { NetEaseData, NetEaseKind, NetEasePodcastCategory, NetEaseView } from './netease-core';

export interface MusicRoute {
  view: NetEaseView;
  kind: NetEaseKind;
  id: string;
  query: string;
  category: NetEasePodcastCategory;
}
export type MusicRead = <T = NetEaseData>(input: Record<string, unknown>, signal?: AbortSignal) => Promise<T>;

export function createMusicQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: typeof window === 'undefined' ? Infinity : 5 * 60_000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });
}

export const musicScope = (accountId: string) => accountId ? `account:${accountId}` : 'anonymous';
export const musicKeys = {
  scope: (scope: string) => ['netease-read', scope] as const,
  catalog: (scope: string, route: MusicRoute) => [...musicKeys.scope(scope), 'catalog', route] as const,
  read: (scope: string, input: Record<string, unknown>) => [...musicKeys.scope(scope), 'read', input] as const,
};

const readActions = new Set(['browse', 'search', 'detail', 'lyrics', 'liked-ids', 'jobs']);
export function musicReadOptions<T>(scope: string, input: Record<string, unknown>, request: MusicRead) {
  if (!readActions.has(String(input.action)) || input.refresh === true) {
    throw new Error('该操作必须显式执行，不能作为缓存读取。');
  }
  return queryOptions({
    queryKey: musicKeys.read(scope, input),
    queryFn: ({ signal }) => request<T>(input, signal),
  });
}

export function catalogInput(route: MusicRoute, page: number): Record<string, unknown> {
  if (route.view === 'search') return { action: 'search', keyword: route.query, kind: route.kind, page };
  if (route.view === 'detail') return { action: 'detail', id: route.id, kind: route.kind, page };
  return { action: 'browse', view: route.view, category: route.category, page };
}

export function catalogQueryOptions(scope: string, route: MusicRoute, request: MusicRead) {
  return infiniteQueryOptions({
    queryKey: musicKeys.catalog(scope, route),
    queryFn: ({ signal, pageParam }) => request<NetEaseData>(catalogInput(route, pageParam), signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => lastPage.more ? lastPageParam + 1 : undefined,
    staleTime: ['daily', 'heart', 'fm', 'history'].includes(route.view) ? 0 : 30_000,
  });
}

export function mergeMusicPages(pages: NetEaseData[] = []): NetEaseData {
  if (!pages.length) return {};
  const unique = <T extends { id: string }>(rows: T[]) => [...new Map(rows.map(row => [row.id, row])).values()];
  const cards = unique(pages.flatMap(page => page.cards ?? []));
  const cardIds = new Set(cards.map(card => card.id));
  return {
    ...pages.at(-1),
    tracks: unique(pages.flatMap(page => page.tracks ?? [])),
    cards,
    popular: unique(pages.flatMap(page => page.popular ?? [])).filter(card => !cardIds.has(card.id)),
  };
}

// Preserve page boundaries/cursors when the existing UI updates detail metadata.
export function updateMusicData(
  current: InfiniteData<NetEaseData, number> | undefined,
  update: NetEaseData | ((data: NetEaseData) => NetEaseData),
): InfiniteData<NetEaseData, number> | undefined {
  if (!current) return current;
  const before = mergeMusicPages(current.pages);
  const after = typeof update === 'function' ? update(before) : update;
  const patch = Object.fromEntries(Object.entries(after).filter(([key, value]) => !Object.is(value, before[key as keyof NetEaseData])));
  return { ...current, pages: current.pages.map(page => ({ ...page, ...patch })) };
}
