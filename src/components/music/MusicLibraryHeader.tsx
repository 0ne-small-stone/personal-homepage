import { MusicIcon } from './RadioNowPlaying';
import type {ReactNode} from 'react';

export default function MusicLibraryHeader({ mode, onMode, query, onQuery, searchLabel, account }: {
  mode: 'cloud' | 'netease'; onMode: (mode: 'cloud' | 'netease') => void;
  query: string; onQuery: (query: string) => void; searchLabel: string;account?:ReactNode;
}) {
  return <header className="radio-topline">
    <div className="radio-heading"><a className="radio-back" href={`${import.meta.env.BASE_URL}#radio`} aria-label="返回首页"><MusicIcon name="back" /></a><h1>Echoes</h1></div>
    <div className="music-header-tools">
      <div className="radio-mode" role="group" aria-label="音源模式"><button type="button" aria-pressed={mode === 'cloud'} onClick={() => onMode('cloud')}>本地收藏</button><button type="button" aria-pressed={mode === 'netease'} onClick={() => onMode('netease')}>网易云音乐</button></div>
      <label className="radio-search"><span className="radio-sr-only">{searchLabel}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg><input type="search" value={query} onChange={event => onQuery(event.currentTarget.value)} placeholder="搜索歌曲、歌手或专辑" /></label>
      {account}
    </div>
  </header>;
}
