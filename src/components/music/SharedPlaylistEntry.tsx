import type {MouseEvent} from 'react';

export default function SharedPlaylistEntry({id, officialUrl, onOpen}: {
  id: string;
  officialUrl: string;
  onOpen?: () => void;
}) {
  const query = new URLSearchParams({mode: 'netease', view: 'detail', kind: 'playlist', id});
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (!onOpen || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen();
  }
  return <section className="music-public-entry" aria-labelledby="shared-playlist-title">
    <div><h2 id="shared-playlist-title">Echoes 共享歌单</h2><p>从小石收藏的歌开始。无需登录即可查看曲目。</p></div>
    <div className="music-public-actions">
      <a href={`?${query}`} onClick={open}>查看曲目</a>
      <a href={officialUrl} target="_blank" rel="noopener noreferrer">在网易云收听<span aria-hidden="true"> ↗</span></a>
    </div>
  </section>;
}
