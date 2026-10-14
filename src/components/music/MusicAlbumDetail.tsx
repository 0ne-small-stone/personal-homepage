import AlbumArtwork from './AlbumArtwork';
import { MusicIcon } from './RadioNowPlaying';

export default function MusicAlbumDetail({ title, artist, coverUrl, trackCount, onBack, onPlay, disabled = false }: {
  title: string; artist: string; coverUrl?: string | null; trackCount: number;
  onBack: () => void; onPlay: () => void; disabled?: boolean;
}) {
  return <>
    <button type="button" className="music-library-back" onClick={onBack}><MusicIcon name="back" /><span>返回专辑</span></button>
    <header className="music-album-detail">
      <AlbumArtwork src={coverUrl} title={title} artist={artist} />
      <div><h2>{title}</h2><p>{artist}</p><small>{trackCount} 首歌曲</small>
        <div className="music-album-actions"><button type="button" className="radio-primary" disabled={disabled} onClick={onPlay}>播放专辑</button></div>
      </div>
    </header>
  </>;
}
