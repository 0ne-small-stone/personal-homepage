import { ConnectionAttempt, GISCUS_ORIGIN, officialMessage, ownEmbedLifecycle } from './guestbook-protocol.mjs';
import wallTheme from '../wall/giscus-theme.css?inline';
// Disposing this document also releases the official SDK's anonymous listeners.
// No global event patching, auth storage access, or parent-owned SDK session.
const embedded = window.parent !== window;
if (embedded) document.documentElement.dataset.embedded = 'true';
const host = document.querySelector<HTMLElement>('.giscus')!;
const config = document.body.dataset;
let deadline: ConnectionAttempt | null = null;
const controller = ownEmbedLifecycle(window,() => deadline?.dispose());
let themedFrame: HTMLIFrameElement | null = null;
const directStatus = document.querySelector<HTMLElement>('[data-standalone-status]')!;
const directRetry = document.querySelector<HTMLButtonElement>('[data-standalone-retry]')!;
const directState = (state: string) => {
  directStatus.textContent = ({ready:'留言区已连接。',empty:'这里还没有公开留言。',error:'留言区暂时无法连接，请重试或在 GitHub 查看。',timeout:'连接时间较长，请重试或在 GitHub 查看。'} as Record<string,string>)[state] || '';
  directRetry.hidden = !['error','timeout'].includes(state);
};
if (!embedded) deadline = new ConnectionAttempt(() => directState('timeout'));
directRetry.addEventListener('click',() => location.reload(),{signal:controller.signal});
const publish = (data: object) => {
  if (embedded) window.parent.postMessage({lsshGuestbook:data},location.origin);
  else if ('state' in data && typeof data.state === 'string') {deadline?.settle();directState(data.state);}
};
window.addEventListener('message',event => {
  const frame = host.querySelector<HTMLIFrameElement>('iframe');
  const message = officialMessage(event,frame?.contentWindow,config.repo!);
  if (!message) return;
  if (frame && themedFrame !== frame) {
    themedFrame = frame;
    frame.contentWindow?.postMessage({giscus:{setConfig:{theme:'data:text/css;charset=utf-8,'+encodeURIComponent(wallTheme)}}},GISCUS_ORIGIN);
  }
  if (typeof message.height === 'number') {publish({height:message.height+8});return;}
  publish(message);
},{signal:controller.signal});
const preview = ['127.0.0.1','localhost','[::1]'].includes(location.hostname)
  ? new URL(location.href).searchParams.get('guestbookPreview') : null;
if (preview === 'script-error') publish({state:'error'});
else if (preview !== 'timeout') {
  const script = document.createElement('script');
  script.src = GISCUS_ORIGIN+'/client.js'; script.async = true; script.crossOrigin = 'anonymous';
  const attrs = {repo:config.repo!,'repo-id':config.repoId!,category:config.category!,'category-id':config.categoryId!,
    mapping:'specific',term:config.term!,strict:'1','reactions-enabled':'0','emit-metadata':'1',
    'input-position':'top',theme:'light',lang:'zh-CN',loading:'eager'};
  for (const [name,value] of Object.entries(attrs)) script.setAttribute('data-'+name,value);
  script.onerror = () => publish({state:'error'});
  host.append(script);
}
