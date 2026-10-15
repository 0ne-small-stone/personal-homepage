import { resolveNetEasePlayback, type PlaybackResolution } from './netease-playback.ts';

export interface AudioTrack {
  id: string; title: string; artist: string; album: string;
  coverUrl?: string | null; audioUrl: string; source: 'cloud' | 'netease'; quality?:string;
}
export interface AudioState {
  track: AudioTrack | null; queue: AudioTrack[]; playing: boolean; waiting: boolean;
  time: number; duration: number; volume: number; error: string; notice: string; previewSeconds: number | null; repeat:'off'|'all'|'one';shuffle:boolean;quality:string;
}
const initial: AudioState = { track: null, queue: [], playing: false, waiting: false, time: 0, duration: 0, volume: .75, error: '', notice: '', previewSeconds: null,repeat:'off',shuffle:false,quality:'standard' };
const sameTrack = (a: AudioTrack | null, b: AudioTrack) => a?.id === b.id && a.source === b.source && a.audioUrl === b.audioUrl;
const finite = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const mediaErrorMessage = (source: AudioTrack['source'] | undefined, code?: number) => source === 'netease'
  ? code === 2 ? '网易云音频加载中断，请重新播放。' : '网易云音频暂时无法播放，请重试或在网易云打开。'
  : '音频暂时无法播放，请刷新音乐目录后重试。';

// The DOM carrier survives Astro navigation; pages never own its lifetime.
export function createAudioSession(resolvePlayback?: (track: AudioTrack) => Promise<PlaybackResolution>) {
  let state = initial;
  let element: HTMLAudioElement | null = null;
  let revision = 0;
  let playAttempt = 0;
  let navigation: { revision: number; resume: boolean } | null = null;
  const listeners = new Set<() => void>();
  let detach = () => {};
  const update = (patch: Partial<AudioState>) => { state = { ...state, ...patch };listeners.forEach(listener => listener()); };
  function getElement() {
    if (!element && typeof document !== 'undefined') {
      const carrier = document.getElementById('lssh-global-audio');
      if (carrier instanceof HTMLAudioElement) bind(carrier);
    }
    return element;
  }
  function bind(carrier: HTMLAudioElement) {
    if (element === carrier) return;
    detach();element = carrier;carrier.volume = state.volume;
    const handlers: Record<string, EventListener> = {
      playing: () => update({ playing: !carrier.paused && !carrier.ended, waiting: false, error: '' }),
      pause: () => update({ playing: !carrier.paused && !carrier.ended, waiting: false }),
      waiting: () => update({ waiting: true }),
      timeupdate: () => update({ time: finite(carrier.currentTime), playing: !carrier.paused && !carrier.ended }),
      loadedmetadata: () => update({ duration: finite(carrier.duration), waiting: false }),
      durationchange: () => update({ duration: finite(carrier.duration) }),
      ended: () => {
        update({ playing: false });
        if (state.previewSeconds) update({ notice: `${Math.round(state.previewSeconds)} 秒试听已结束，完整收听请在网易云打开。` });
        else if(state.repeat==='one'){carrier.currentTime=0;void play();}
        else next(1, true);
      },
      error: () => {
        if (carrier.error) update({ playing: false, waiting: false, error: mediaErrorMessage(state.track?.source, carrier.error.code) });
      },
    };
    Object.entries(handlers).forEach(([event, listener]) => carrier.addEventListener(event, listener));
    detach = () => Object.entries(handlers).forEach(([event, listener]) => carrier.removeEventListener(event, listener));
    if (state.track && carrier.getAttribute('src') !== state.track.audioUrl) { carrier.src = state.track.audioUrl;carrier.load(); }
  }
  async function play() {
    const carrier = getElement();if (!carrier || !state.track) return;
    const expected = revision;const attempt = ++playAttempt;const track = state.track;update({ error: '' });
    try {
      if (track.source === 'netease' && resolvePlayback) {
        update({ waiting: true });
        const resolved = await resolvePlayback(track);
        if (expected !== revision || attempt !== playAttempt) return;
        if (carrier.getAttribute('src') !== resolved.url) {
          const position = carrier.ended ? 0 : finite(carrier.currentTime);
          if (position) carrier.addEventListener('loadedmetadata', () => {
            if (expected === revision && attempt === playAttempt) seek(position);
          }, { once: true });
          carrier.src = resolved.url;carrier.load();
        }
        update({ notice: resolved.notice, previewSeconds: resolved.previewSeconds, waiting: false,quality:resolved.quality||track.quality||'standard' });
      }
      if (carrier.error) carrier.load();
      await carrier.play();
    } catch (error) {
      if (expected !== revision || attempt !== playAttempt) return;
      const name = error instanceof Error ? error.name : '';
      // Aborting an interrupted play is expected, not an unavailable audio source.
      if (name === 'AbortError') { update({ waiting: false, playing: !carrier.paused });return; }
      const message = name === 'NotAllowedError' ? '浏览器尚未允许播放，请再点击一次播放。'
        : error instanceof Error && name === 'Error' ? error.message
        : name === 'NotSupportedError' || carrier.error ? mediaErrorMessage(track.source, carrier.error?.code)
        : '播放服务暂时不可用，请稍后重试。';
      update({ waiting: false, playing: false, error: message });
    }
  }
  function pause() { revision++;getElement()?.pause();update({ playing: false, waiting: false }); }
  function beginNavigation() { navigation = { revision, resume: Boolean(element && !element.paused && state.track) }; }
  function finishNavigation() {
    const saved = navigation;navigation = null;
    // Some engines pause media while its persisted DOM is moved. Restore only
    // an uninterrupted user-started session; an explicit pause/selection wins.
    if (saved?.resume && saved.revision === revision && element?.paused && state.track) void play();
  }
  function select(track: AudioTrack, queue: AudioTrack[], autoPlay = false) {
    const carrier = getElement();
    if (sameTrack(state.track, track)) { update({ queue });if (autoPlay) void play();return; }
    revision++;carrier?.pause();
    update({ track, queue, playing: false, waiting: false, time: 0, duration: 0, error: '', notice: '', previewSeconds: null });
    if (carrier) {
      if (track.source === 'netease' && resolvePlayback) carrier.removeAttribute('src');
      else carrier.src = track.audioUrl;
      carrier.load();
    }
    if (autoPlay) void play();
  }
  function next(direction: -1 | 1, autoPlay = state.playing) {
    const index = state.queue.findIndex(track => state.track && sameTrack(state.track, track));
    const size=state.queue.length;let targetIndex=index+direction;
    if(state.shuffle&&size>1&&direction===1)targetIndex=(index+1+Math.floor(Math.random()*(size-1)))%size;
    else if(state.repeat==='all'&&size)targetIndex=(targetIndex+size)%size;
    const target = index >= 0 ? state.queue[targetIndex] : undefined;
    if (target) select(target, state.queue, autoPlay);
  }
  function seek(time: number) {
    const carrier = getElement();if (!carrier || !state.duration || !Number.isFinite(time)) return;
    const target = Math.min(state.duration, Math.max(0, time));carrier.currentTime = target;update({ time: target });
  }
  function setVolume(volume: number) {
    if (!Number.isFinite(volume)) return;
    const target = Math.min(1, Math.max(0, volume));const carrier = getElement();if (carrier) carrier.volume = target;update({ volume: target });
  }
  function stop() {
    revision++;const carrier = getElement();carrier?.pause();update({ ...initial, volume: state.volume });carrier?.removeAttribute('src');carrier?.load();
  }
  function setQuality(value:string){if(!['standard','exhigh','lossless','hires'].includes(value))return;const track=state.track;if(track?.source!=='netease'){update({quality:value});return;}revision++;update({quality:value,track:{...track,quality:value},queue:state.queue.map(item=>item.source==='netease'?{...item,quality:value}:item)});void play();}
  return { bind, getSnapshot: () => state, getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => { listeners.add(listener);return () => { listeners.delete(listener); }; },
    select, play, pause, toggle: () => state.playing || state.waiting ? pause() : void play(), next, seek, setVolume, stop, beginNavigation, finishNavigation,setQuality,setRepeat:(repeat:AudioState['repeat'])=>{if(['off','all','one'].includes(repeat))update({repeat});},setShuffle:(shuffle:boolean)=>update({shuffle:Boolean(shuffle)}) };
}
export const audioSession = createAudioSession(resolveNetEasePlayback);
