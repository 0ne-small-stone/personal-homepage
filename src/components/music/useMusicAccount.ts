import { useQuery, useQueryClient } from '@tanstack/react-query';
import { emptyMusicAccount, musicAccountOptions } from '../../lib/music-account';

/** Only the catalog gate owns polling; all buttons and views observe its cache. */
export function useMusicAccount(poll = false, enabled = true) {
  const client = useQueryClient();
  const query = useQuery({ ...musicAccountOptions(), enabled: enabled && typeof window !== 'undefined',
    refetchInterval: poll ? state => state.state.error ? false : 15_000 : false,
    refetchIntervalInBackground: false,
  });
  return { account: query.data ?? emptyMusicAccount, client, refetch: query.refetch,
    service: query.isPending ? 'checking' as const : query.error ? 'unavailable' as const : 'ready' as const };
}
