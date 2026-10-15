import type { ReactNode } from 'react';
export type LibraryView = 'albums' | 'songs' | 'discover';

export default function LibrarySidebar({ view, onView, onDiscover, source, children }: {
  view: LibraryView; onView: (view: 'albums' | 'songs') => void; onDiscover?: () => void; source: string; children?: ReactNode;
}) {
  return <aside className="music-library-sidebar" aria-label={`${source}音乐库分类`}>
    <nav aria-label="曲库视图">
      <button type="button" aria-pressed={view === 'albums'} onClick={() => onView('albums')}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>专辑</button>
      <button type="button" aria-pressed={view === 'songs'} onClick={() => onView('songs')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></svg>歌曲</button>
      {onDiscover && <button type="button" aria-pressed={view === 'discover'} onClick={onDiscover}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>找音乐</button>}
    </nav>
    {children && <div className="music-sidebar-footer"><p>{source}</p>{children}</div>}
  </aside>;
}
