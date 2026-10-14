import { useEffect, useRef, useState } from 'react';
import { audioSession } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';
import FloatingMusicPlayer from './FloatingMusicPlayer';
import '../../styles/floating-player.css';

export default function PersistentPlayer() {
  const state = useAudioSession();
  const audio = useRef<HTMLAudioElement>(null);
  const [onMusicPage, setOnMusicPage] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const restore = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const carrier = audio.current;if (!carrier) return;
    carrier.dataset.sessionId ||= crypto.randomUUID();audioSession.bind(carrier);
    const route = () => {
      const onMusic = location.pathname.replace(/\/$/, '') === `${import.meta.env.BASE_URL}music/`.replace(/\/$/, '');
      setOnMusicPage(onMusic);if (onMusic) setDismissed(false);
    };
    route();document.addEventListener('astro:page-load', route);
    document.addEventListener('astro:before-swap', audioSession.beginNavigation);
    document.addEventListener('astro:after-swap', audioSession.finishNavigation);
    return () => {
      document.removeEventListener('astro:page-load', route);
      document.removeEventListener('astro:before-swap', audioSession.beginNavigation);
      document.removeEventListener('astro:after-swap', audioSession.finishNavigation);
    };
  }, []);
  const visible = Boolean(state.track) && !onMusicPage;
  useEffect(() => {
    const reserve = () => document.body.toggleAttribute('data-radio-mini', visible);
    reserve();document.addEventListener('astro:page-load', reserve);
    return () => document.removeEventListener('astro:page-load', reserve);
  }, [visible]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = state.track ? new MediaMetadata({ title: state.track.title, artist: state.track.artist, album: state.track.album, artwork: state.track.coverUrl ? [{ src: state.track.coverUrl }] : [] }) : null;
  }, [state.track]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => void audioSession.play());
    navigator.mediaSession.setActionHandler('pause', audioSession.pause);
    navigator.mediaSession.setActionHandler('previoustrack', () => audioSession.next(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => audioSession.next(1));
    navigator.mediaSession.setActionHandler('seekto', action => { if (action.seekTime !== undefined) audioSession.seek(action.seekTime); });
  }, []);
  function hideWindow() { setDismissed(true);requestAnimationFrame(() => restore.current?.focus()); }
  function restoreWindow() { setDismissed(false);requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.lssh-floating-play')?.focus()); }
  return <div className="lssh-audio-carrier"><audio id="lssh-global-audio" ref={audio} preload="none" />
    {state.track && <FloatingMusicPlayer state={state} open={visible && !dismissed} onHide={hideWindow} />}
    {visible && dismissed && <button ref={restore} type="button" className="lssh-floating-restore" aria-label={`打开音乐悬窗：${state.track?.title}`} onClick={restoreWindow}>{state.track?.coverUrl && <img src={state.track.coverUrl} alt="" width="28" height="28" />}<span>打开音乐悬窗</span></button>}
  </div>;
}
