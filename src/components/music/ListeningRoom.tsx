import { useEffect, useRef, useState } from 'react';
import { qualityLabel } from '../../lib/music';
import VinylTurntable from './VinylTurntable';
import { MusicIcon, PlaybackControls, type PlaybackPresentation } from './RadioNowPlaying';
import LyricPanel from './LyricPanel';

/** View-only dialog: the owning audio runtime stays mounted while this opens/closes. */
export default function ListeningRoom(props: PlaybackPresentation & {
  error?: string; onClose: () => void; open?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const [seekVersion, setSeekVersion] = useState(0);
  const open = props.open ?? true;
  const seek = (time: number) => { setSeekVersion(value => value + 1);props.onSeek(time); };
  useEffect(() => {
    const element = dialog.current;if (!element || !open) return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';element.showModal();back.current?.focus();
    return () => { element.close();document.body.style.overflow = overflow;origin?.focus({ preventScroll: true }); };
  }, [open]);
  return <dialog ref={dialog} className="music-listening-room" aria-labelledby="music-listening-title" onCancel={event => { event.preventDefault();props.onClose(); }}>
    <header className="music-room-header"><button ref={back} type="button" onClick={props.onClose} className="music-room-back"><MusicIcon name="back" /><span>返回音乐库</span></button><span>{props.source}</span></header>
    <div className="music-room-body">
      <section className="music-room-turntable"><VinylTurntable track={props.track} playing={props.playing} progress={props.duration ? props.time / props.duration : 0} onToggle={props.onToggle} active={open} /><div key={props.track?.id || 'empty'} className="music-room-info"><h2 id="music-listening-title">{props.track?.title || '等待第一首歌'}</h2><p className="music-room-artist">{props.track?.artist || '从音乐库选择一首歌'}</p><p className="music-room-album">{props.track?.album}</p></div></section>
      <LyricPanel track={props.track} time={props.time} playing={props.playing && open} seekVersion={seekVersion} canSeek={open && Boolean(props.duration)} onSeek={seek} />
    </div>
    {props.error && <p className="radio-error" role="alert">{props.error}</p>}
    {props.notice && <p className="radio-hint" role="status">{props.notice} <a href={`https://music.163.com/#/song?id=${props.track?.id}`} target="_blank" rel="noopener noreferrer">在网易云完整收听（新窗口）</a></p>}
    <footer className="music-room-footer"><div className="music-room-current"><span>{props.waiting ? '正在缓冲' : props.track ? qualityLabel(props.track) : props.source}</span></div><PlaybackControls {...props} onSeek={seek} /></footer>
  </dialog>;
}
