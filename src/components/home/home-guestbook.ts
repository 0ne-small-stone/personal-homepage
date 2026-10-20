import { ConnectionAttempt, parentMessage } from './guestbook-protocol.mjs';
let mounted: HTMLElement | null = null;
let disposeMounted = () => {};
function install() {
  const root = document.querySelector<HTMLElement>('[data-home-guestbook]');
  if (root === mounted) return;
  disposeMounted();
  if (!root) return;
  const dialog = root.querySelector<HTMLDialogElement>('dialog');
  const open = root.querySelector<HTMLButtonElement>('[data-open-guestbook]');
  if (!dialog || !open) return;
  mounted = root;
  const controller = new AbortController(), options = {signal:controller.signal};
  const mount = root.querySelector<HTMLElement>('[data-guestbook-mount]')!;
  const status = root.querySelector<HTMLElement>('[data-guestbook-status]')!;
  const retry = root.querySelector<HTMLButtonElement>('[data-retry-guestbook]')!;
  const link = root.querySelector<HTMLAnchorElement>('[data-guestbook-discussion]')!;
  const fixture = root.querySelector<HTMLElement>('[data-guestbook-fixture]')!;
  const body = document.body;
  let frame: HTMLIFrameElement | null = null, attempt: ConnectionAttempt | null = null;
  let saved: {x:number; y:number; overflow:string} | null = null;
  let disposed = false, attempts = 0;
  const preview = ['127.0.0.1','localhost','[::1]'].includes(location.hostname)
    ? new URL(location.href).searchParams.get('guestbookPreview') : null;
  function restorePosition(y: number, focusOrigin: string) {
    if (body.dataset.homeMotion === 'ready' && !body.classList.contains('home-quiet') && !body.classList.contains('home-static'))
      document.dispatchEvent(new CustomEvent('lssh:home-restore',{detail:{y,focusOrigin,reason:'guestbook'}}));
    else window.scrollTo({left:saved?.x || 0,top:y,behavior:'instant'});
  }
  function showState(state: string) {
    const retryFocused = document.activeElement === retry;
    root!.dataset.guestbookState = state;
    mount.setAttribute('aria-busy',String(state === 'connecting'));
    retry.hidden = !['error','timeout'].includes(state);
    if (retryFocused && retry.hidden && dialog!.open)
      root!.querySelector<HTMLButtonElement>('[data-close-guestbook]')?.focus({preventScroll:true});
    status.textContent = ({connecting:'正在连接留言区…',ready:'留言区已连接。',
      empty:'这里还没有公开留言。你可以成为第一个留下回声的人。',
      error:'留言区暂时未能连接。可以重新连接，或在 GitHub 查看。',
      timeout:'连接时间较长。可以重新连接，或在 GitHub 查看。',idle:''} as Record<string,string>)[state] || '';
  }
  function releaseFrame() {
    attempt?.dispose(); attempt = null; frame?.remove(); frame = null; mount.replaceChildren();
  }
  function connect() {
    releaseFrame(); showState('connecting');
    const url = new URL(root!.dataset.embedUrl!,location.origin);
    const simulated = attempts++ === 0 && ['timeout','script-error'].includes(preview || '');
    if (simulated) url.searchParams.set('guestbookPreview',preview!);
    fixture.hidden = !simulated;
    frame = document.createElement('iframe');
    frame.title = '留言内容'; frame.src = url.href; frame.className = 'home-guestbook-frame'; frame.height = '380';
    frame.setAttribute('allow','clipboard-write'); mount.append(frame);
    attempt = new ConnectionAttempt(() => {releaseFrame();showState('timeout');});
  }
  function finish(restore: boolean) {
    releaseFrame(); showState('idle'); open!.setAttribute('aria-expanded','false');
    if (saved) {
      body.style.overflow = saved.overflow;
      if (restore && root!.isConnected) {
        restorePosition(saved.y,open!.id); open!.focus({preventScroll:true});
      }
      saved = null;
    }
  }
  open.addEventListener('click',() => {
    if (dialog.open || disposed) return;
    saved = {x:scrollX,y:scrollY,overflow:body.style.overflow};
    root!.dataset.guestbookReturnY = String(saved.y);
    restorePosition(saved.y,'');
    dialog.showModal(); body.style.overflow = 'hidden'; open.setAttribute('aria-expanded','true'); connect();
  },options);
  root.querySelector('[data-close-guestbook]')!.addEventListener('click',() => dialog.close(),options);
  dialog.addEventListener('close',() => finish(true),options);
  retry.addEventListener('click',connect,options);
  window.addEventListener('message',event => {
    if (!dialog.open || !attempt?.active) return;
    const message = parentMessage(event,frame?.contentWindow,location.origin,root!.dataset.repo!);
    if (!message) return;
    if (typeof message.height === 'number') {if (frame) frame.height = String(message.height);return;}
    if (message.state === 'connecting') return;
    attempt.settle(); if (message.url) link.href = message.url; showState(message.state);
    if (message.state === 'error') releaseFrame();
  },options);
  disposeMounted = () => {
    if (disposed) return;
    disposed = true; controller.abort(); if (dialog.open) dialog.close(); finish(false); mounted = null;
  };
}
document.addEventListener('astro:before-swap',() => disposeMounted());
window.addEventListener('pagehide',() => disposeMounted());
document.addEventListener('astro:page-load',install);
window.addEventListener('pageshow',install);
install();
