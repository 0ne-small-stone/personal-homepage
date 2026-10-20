import { audioSession } from '../../lib/audio-session';

class AfterimageVideo extends HTMLElement {
  private abort?: AbortController;
  private playerAbort?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  connectedCallback() {
    if (this.abort) return;
    this.abort = new AbortController();
    this.setAttribute('data-enhanced', '');
    this.addEventListener('click', this.handleClick, { signal: this.abort.signal });
    window.addEventListener('pagehide', this.leave, { signal: this.abort.signal });
    this.addEventListener('keydown', event => { if (event.key === 'Escape' && !this.querySelector<HTMLElement>('.ai-video-screen')!.hidden) this.close(); }, { signal: this.abort.signal });
    const image = this.querySelector<HTMLImageElement>('.ai-video-poster img');
    const failed = () => { if (image) image.hidden = true; this.querySelector<HTMLElement>('.ai-cover-fallback')!.hidden = false; };
    image?.addEventListener('error', failed, { signal: this.abort.signal });
    if (image?.complete && !image.naturalWidth) failed();
  }
  disconnectedCallback() {
    this.close(false);
    this.abort?.abort(); this.abort = undefined;
  }
  private open() {
    const src = this.dataset.playerSrc || '';
    if (!src.startsWith('https://player.bilibili.com/player.html?bvid=BV')) return;
    clearTimeout(this.timer); this.playerAbort?.abort(); this.playerAbort = new AbortController();
    const { signal } = this.playerAbort;
    const screen = this.querySelector<HTMLElement>('.ai-video-screen')!;
    const status = this.querySelector<HTMLElement>('[data-video-status]')!;
    audioSession.pause();
    const frame = document.createElement('iframe');
    frame.title = `B站播放器：${this.dataset.playerTitle}`;
    frame.allow = 'fullscreen; picture-in-picture'; frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const loading = document.createElement('span');
    loading.className = 'ai-video-connecting'; loading.textContent = '正在连接 B站…';
    const loaded = () => {
      clearTimeout(this.timer); loading.remove(); screen.setAttribute('aria-busy', 'false');
      status.textContent = '可在播放器中尝试播放。如无法观看，可以重新连接或前往 B站。';
    };
    frame.addEventListener('load', loaded, { once: true, signal });
    frame.addEventListener('error', () => {
      clearTimeout(this.timer); loading.textContent = '暂时无法连接'; screen.setAttribute('aria-busy', 'false');
      status.textContent = '连接未完成，可以重新连接或前往 B站观看。';
    }, { once: true, signal });
    frame.src = src;
    screen.replaceChildren(frame, loading); screen.hidden = false; screen.setAttribute('aria-busy', 'true');
    this.querySelector<HTMLElement>('.ai-video-poster')!.hidden = true;
    this.querySelector<HTMLButtonElement>('[data-video-close]')!.hidden = false;
    this.querySelector<HTMLButtonElement>('[data-video-retry]')!.hidden = false;
    status.textContent = '正在连接 B站；播放权限由原站提供。';
    this.timer = setTimeout(() => {
      loading.textContent = '连接耗时较长'; screen.setAttribute('aria-busy', 'false');
      status.textContent = '连接耗时较长。可以重新连接、关闭播放器或前往 B站观看。';
    }, 12000);
    this.querySelector<HTMLButtonElement>('[data-video-close]')!.focus();
  }
  private close(restoreFocus = true) {
    clearTimeout(this.timer); this.timer = undefined;
    this.playerAbort?.abort(); this.playerAbort = undefined;
    const screen = this.querySelector<HTMLElement>('.ai-video-screen')!;
    screen.replaceChildren(); screen.hidden = true; screen.setAttribute('aria-busy', 'false');
    this.querySelector<HTMLElement>('.ai-video-poster')!.hidden = false;
    this.querySelector<HTMLButtonElement>('[data-video-close]')!.hidden = true;
    this.querySelector<HTMLButtonElement>('[data-video-retry]')!.hidden = true;
    this.querySelector<HTMLElement>('[data-video-status]')!.textContent = '播放器已关闭。可以再次打开。';
    if (restoreFocus) this.querySelector<HTMLButtonElement>('.ai-video-load')!.focus();
  }
  private leave = () => { if (!this.querySelector<HTMLElement>('.ai-video-screen')!.hidden) this.close(false); };
  private handleClick = (event: MouseEvent) => {
    const target = event.target as Element;
    if (target.closest('.ai-video-load, [data-video-retry]')) this.open();
    else if (target.closest('[data-video-close]')) this.close();
  };
}
if (!customElements.get('afterimage-video')) customElements.define('afterimage-video', AfterimageVideo);
