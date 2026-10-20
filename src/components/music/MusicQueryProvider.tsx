import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMusicQueryClient } from '../../lib/music-query';
import { musicAccountKey } from '../../lib/music-account';

export default function MusicQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createMusicQueryClient);
  useEffect(() => {
    const changed = () => { void client.invalidateQueries({ queryKey: musicAccountKey, exact: true }); };
    window.addEventListener('netease-account-change', changed);
    return () => { window.removeEventListener('netease-account-change', changed); client.clear(); };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
