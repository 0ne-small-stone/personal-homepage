import AlbumArtwork from './AlbumArtwork';
import { formatDuration, type MusicTrack } from '../../lib/music';

type RowTrack = Pick<MusicTrack, 'id' | 'title' | 'artist' | 'album' | 'coverUrl' | 'duration'> & { albumArtist?: string };

/** Both catalogs use the same row geometry; this view owns no playback state. */
export default function MusicTrackList<T extends RowTrack>({ tracks, selectedId, onSelect }: {
  tracks: readonly T[]; selectedId: string; onSelect: (track: T) => void;
}) {
  return <div className="music-track-table">
    <div className="music-track-columns" aria-hidden="true"><span>#</span><span>歌曲 / 歌手</span><span>专辑</span><span>时长</span></div>
    <ol className="radio-track-list music-catalog-tracks">{tracks.map((track, index) => <li key={track.id}>
      <button type="button" className="radio-track" aria-label={`播放歌曲：${track.title}`} aria-pressed={selectedId === track.id} onClick={() => onSelect(track)}>
        <span className="radio-track-number" aria-hidden="true">{index + 1}</span>
        <span className="music-track-summary"><span className="music-track-art" aria-hidden="true"><AlbumArtwork src={track.coverUrl} title={track.album} artist={track.albumArtist || track.artist} /></span><span className="radio-track-info"><strong title={track.title}>{track.title}</strong><span title={track.artist}>{track.artist}</span></span></span>
        <span className="music-track-album" title={track.album}>{track.album}</span><span className="radio-track-meta">{formatDuration(track.duration)}</span>
      </button>
    </li>)}</ol>
  </div>;
}
