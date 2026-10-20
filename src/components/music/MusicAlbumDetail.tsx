import '../../styles/music-return.css';
import AlbumArtwork from './AlbumArtwork';
import { DivisionBellReturnButton } from '../navigation/DivisionBellReturn';

export default function MusicAlbumDetail({ title, artist, coverUrl, trackCount, onBack, onPlay, disabled = false }: {
  title: string; artist: string; coverUrl?: string | null; trackCount: number;
  onBack: () => void; onPlay: () => void; disabled?: boolean;
}) {
  return <>
    <DivisionBellReturnButton type="button" className="music-page-return" label="返回专辑" onClick={onBack} compact />
    <header className="music-album-detail">
      <AlbumArtwork src={coverUrl} title={title} artist={artist} />
      <div><h2>{title}</h2><p>{artist}</p><small>{trackCount} 首歌曲</small>
        <div className="music-album-actions"><button type="button" className="radio-primary" disabled={disabled} onClick={onPlay}>播放专辑</button></div>
      </div>
    </header>
  </>;
}
