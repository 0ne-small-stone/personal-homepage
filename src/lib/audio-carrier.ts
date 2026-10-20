import { audioSession } from './audio-session';

let installed = false, mounting = false, mounted = false;
/** Native persisted carrier first; React and the floating UI follow actual playback. */
export function installAudioCarrier() {
  if (installed) return;
  installed = true;
  const show = async () => {
    if (mounting || mounted || !audioSession.getSnapshot().track) return;
    const container = document.getElementById('lssh-player-ui');
    if (!container) return;
    mounting = true;
    try {
      const [{ createElement }, { createRoot }, { default: Player }] = await Promise.all([
        import('react'), import('react-dom/client'), import('../components/music/PersistentPlayer'),
      ]);
      createRoot(container).render(createElement(Player));
      mounted = true;
    } catch { container.dataset.loadError = 'true'; }
    finally { mounting = false; }
  };
  const initialize = () => {
    const carrier = document.getElementById('lssh-global-audio');
    if (carrier instanceof HTMLAudioElement) {
      carrier.dataset.sessionId ||= crypto.randomUUID();
      audioSession.bind(carrier);
    }
    void show();
  };
  initialize();
  audioSession.subscribe(() => { void show(); });
  document.addEventListener('astro:page-load', initialize);
  document.addEventListener('astro:before-swap', audioSession.beginNavigation);
  document.addEventListener('astro:after-swap', audioSession.finishNavigation);
}
