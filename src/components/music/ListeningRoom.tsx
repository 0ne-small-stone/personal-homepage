import {useAudioSession} from './useAudioSession';
import '../../styles/music-return.css';
import { DivisionBellReturnButton } from '../navigation/DivisionBellReturn';
import { useRef, useState } from 'react';
import { qualityLabel } from '../../lib/music';
import VinylTurntable from './VinylTurntable';
import { PlaybackControls, type PlaybackPresentation } from './RadioNowPlaying';
import LyricPanel from './LyricPanel';
import { cancelNativeDialog, useNativeDialog } from './useNativeDialog';

/** View-only dialog: the owning audio runtime stays mounted while this opens/closes. */
export default function ListeningRoom(input: PlaybackPresentation & {
  error?: string; onClose: () => void; open?: boolean;
}) {
  const open = input.open ?? true;
  const live=useAudioSession(open);
  const props={...input,time:live.track?.id===input.track?.id?live.time:input.time};
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const [seekVersion, setSeekVersion] = useState(0);
  const seek = (time: number) => { setSeekVersion(value => value + 1);props.onSeek(time); };
  useNativeDialog(dialog, open, back);
  return <dialog ref={dialog} className="music-listening-room" aria-labelledby="music-listening-title" onCancel={event => cancelNativeDialog(event, props.onClose)}>
    <header className="music-room-header"><DivisionBellReturnButton ref={back} onClick={props.onClose} className="music-room-back music-page-return" label="返回音乐库" compact /><span>{props.source}</span></header>
    <div className="music-room-body">
      <section className="music-room-turntable"><VinylTurntable track={props.track} playing={props.playing} progress={props.duration ? props.time / props.duration : 0} onToggle={props.onToggle} active={open} /><div key={props.track?.id || 'empty'} className="music-room-info"><h2 id="music-listening-title">{props.track?.title || '等待第一首歌'}</h2><p className="music-room-artist">{props.track?.artist || '从音乐库选择一首歌'}</p><p className="music-room-album">{props.track?.album}</p></div></section>
      {open&&<LyricPanel track={props.track} time={props.time} playing={props.playing && open} seekVersion={seekVersion} canSeek={open && Boolean(props.duration)} onSeek={seek} />}
    </div>
    {props.error && <p className="radio-error" role="alert">{props.error}</p>}
    {props.notice && <p className="radio-hint" role="status">{props.notice} <a href={`https://music.163.com/#/song?id=${props.track?.id}`} target="_blank" rel="noopener noreferrer">在网易云完整收听（新窗口）</a></p>}
    <footer className="music-room-footer"><div className="music-room-current"><span>{props.waiting ? '正在缓冲' : props.track ? qualityLabel(props.track) : props.source}</span></div><PlaybackControls {...props} onSeek={seek} /></footer>
  </dialog>;
}
