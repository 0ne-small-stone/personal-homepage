import { queryOptions } from '@tanstack/react-query';
import type { NetEaseAccountState } from './netease-core';

export interface MusicAccountState extends NetEaseAccountState {
  available: boolean; local?: boolean; saved?: boolean; persistenceError?: string;
}
export const emptyMusicAccount: MusicAccountState = { available: false, authorized: false, account: null };
export const musicAccountKey = ['music-service', 'account'] as const;
export function musicAccountOptions(request: typeof fetch = fetch) {
  return queryOptions({ queryKey: musicAccountKey, staleTime: 15_000, gcTime: 300_000,
    retry: false, retryOnMount: false, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async ({ signal }): Promise<MusicAccountState> => {
      const response = await request(`${import.meta.env?.BASE_URL ?? '/personal-homepage/'}api/music/playback/account`, {
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      });
      if (!response.ok) throw Error('账号服务未接通。');
      const next = await response.json();
      if (next.available !== true || typeof next.authorized !== 'boolean') throw Error('账号服务未接通。');
      return next;
    },
  });
}
