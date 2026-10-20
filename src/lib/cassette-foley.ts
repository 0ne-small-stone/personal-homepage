type CassetteSound = 'insert' | 'eject';
export type CassetteFoley = {
  unlock(): void;
  play(kind: CassetteSound, durationMs: number): () => void;
  dispose(): void;
};

/** One quiet, finite mechanical gesture; never owns or changes music playback. */
export function createCassetteFoley(): CassetteFoley {
  let context: AudioContext | null = null;
  let ready: Promise<void> = Promise.resolve();
  let current: (() => void) | null = null;
  let disposed = false;
  const noop = () => {};

  // Call directly from a trusted pointer/keyboard gesture, before awaiting anything.
  function unlock() {
    if (disposed || typeof window === 'undefined') return;
    try {
      if (!context || context.state === 'closed') {
        const Context = window.AudioContext ?? (window as Window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
        if (!Context) return;
        context = new Context({latencyHint: 'interactive'});
      }
      ready = context.state === 'running' ? Promise.resolve() : context.resume().catch(noop);
    } catch { ready = Promise.resolve(); }
  }

  function play(kind: CassetteSound, durationMs: number) {
    current?.();
    const audio = context;
    if (disposed || !audio || (typeof document !== 'undefined' && document.hidden) || !Number.isFinite(durationMs) || durationMs <= 0) return noop;
    const media = typeof document === 'undefined' ? null
      : document.querySelector<HTMLAudioElement>('audio#lssh-global-audio') ?? document.querySelector<HTMLAudioElement>('audio');
    const volume = () => media?.muted ? 0 : Math.max(0, Math.min(1, Number.isFinite(media?.volume) ? media!.volume : .65));
    if (!volume()) return noop;

    let stopped = false, pending = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onVolumeChange = noop;
    const nodes: AudioNode[] = [], sources: AudioBufferSourceNode[] = [];
    function stop() {
      if (stopped) return;
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      media?.removeEventListener('volumechange', onVolumeChange);
      for (const source of sources) {
        source.onended = null;
        try { source.stop(); } catch { /* Already ended, or never started. */ }
      }
      for (const node of nodes) { try { node.disconnect(); } catch { /* Closed/unsupported audio is silent. */ } }
      sources.length = 0; nodes.length = 0;
      if (current === stop) current = null;
    }
    current = stop;

    void ready.then(() => {
      if (stopped || disposed || context !== audio || audio.state !== 'running' || (typeof document !== 'undefined' && document.hidden)) { stop(); return; }
      try {
        const duration = Math.min(8, Math.max(.16, durationMs / 1000));
        const start = audio.currentTime + .008;
        const master = audio.createGain(); nodes.push(master);
        master.gain.value = .18 * volume(); master.connect(audio.destination);
        onVolumeChange = () => {
          if (stopped) return;
          try { master.gain.setValueAtTime(.18 * volume(), audio.currentTime); } catch { stop(); }
        };
        media?.addEventListener('volumechange', onVolumeChange);

        // Filtered noise only: no oscillators, pitched notes or borrowed recordings.
        function rub(offset: number, length: number, level: number, frequency: number, impact = false) {
          const source = audio!.createBufferSource(); sources.push(source); nodes.push(source);
          const filter = audio!.createBiquadFilter(); nodes.push(filter);
          const gain = audio!.createGain(); nodes.push(gain);
          const buffer = audio!.createBuffer(1, Math.max(1, Math.ceil(length * audio!.sampleRate)), audio!.sampleRate);
          const samples = buffer.getChannelData(0);
          let soft = 0;
          for (let i = 0; i < samples.length; i++) {
            const white = Math.random() * 2 - 1;
            soft = (soft + .04 * white) / 1.04;
            samples[i] = white * .55 + soft * 2;
          }
          source.buffer = buffer;
          filter.type = impact ? 'lowpass' : 'bandpass';
          filter.frequency.value = frequency; filter.Q.value = impact ? .7 : .6;
          source.connect(filter); filter.connect(gain); gain.connect(master);
          const at = start + offset, end = at + length;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(level, at + Math.min(impact ? .002 : .025, length * .18));
          gain.gain.linearRampToValueAtTime(level * (impact ? .28 : .72), at + length * .62);
          gain.gain.linearRampToValueAtTime(0, end);
          pending++;
          source.onended = () => { if (!stopped && --pending === 0) stop(); };
          source.start(at); source.stop(end);
        }
        const tap = (position: number, level: number, frequency = 1100) =>
          rub(duration * position, Math.min(.045, duration * .025), level, frequency, true);

        if (kind === 'insert') {
          tap(.01, .11, 900);
          rub(duration * .035, duration * .365, .052, 1250);
          // The pause at .42–.53 stays quiet; friction resumes with vertical travel.
          rub(duration * .55, duration * .385, .065, 760);
          tap(.96, .16, 1550); tap(.974, .085, 420);
        } else {
          tap(.012, .15, 1400); tap(.026, .075, 420);
          rub(duration * .07, duration * .37, .06, 820);
          rub(duration * .56, duration * .35, .046, 1200);
          tap(.955, .075, 850);
        }
        // Wall-clock fallback also releases nodes if the browser suspends the context.
        timer = setTimeout(stop, (duration + .12) * 1000);
      } catch { stop(); }
    }).catch(stop);
    return stop;
  }

  function dispose() {
    if (disposed) return;
    disposed = true; current?.();
    const audio = context; context = null; ready = Promise.resolve();
    try { void audio?.close().catch(noop); } catch { /* Audio is optional. */ }
  }

  return {unlock, play, dispose};
}
