import {createMusicDeviceSessionManager, throwMusicAbort, waitForMusic, type MusicDeviceStorage} from './music-device-session.ts';

type MusicApiConfig = {apiOrigin?: string; pageOrigin?: string; storage?: MusicDeviceStorage; crypto?: Crypto; now?: () => number};
function apiOrigin(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw Error('音乐 API 必须配置为 HTTPS Origin。'); }
  if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password) throw Error('音乐 API 必须是无路径、参数或凭据的 HTTPS Origin。');
  return url.origin;
}

/** Cross-site authorization is scoped to the two explicit music API route families. */
export function createMusicApiTransport(config: MusicApiConfig = {}) {
  const remote = config.apiOrigin ? apiOrigin(config.apiOrigin) : undefined;
  let manager: ReturnType<typeof createMusicDeviceSessionManager> | undefined;
  return async function transport(input: RequestInfo | URL, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<Response> {
    if (!remote) return fetcher(input, {...init, credentials: 'same-origin', cache: 'no-store'});
    const origin = config.pageOrigin ?? globalThis.location?.origin;
    let source: URL;
    try { source = new URL(input instanceof Request ? input.url : String(input), origin); }
    catch { return fetcher(input, {...init, credentials: 'same-origin', cache: 'no-store'}); }
    if (!origin || source.origin !== origin || source.username || source.password || !/^\/personal-homepage\/api\/music\/(?:netease|playback\/[^/].*)$/.test(source.pathname)) {
      return fetcher(input, {...init, credentials: 'same-origin', cache: 'no-store'});
    }
    const request = input instanceof Request ? input : undefined;
    const signal = init.signal === undefined ? request?.signal : init.signal;
    throwMusicAbort(signal);
    const method = (init.method ?? request?.method ?? 'GET').toUpperCase();
    const body = init.body === undefined && request?.body ? await waitForMusic(request.clone().text(), signal) : init.body;
    if (body != null && typeof body !== 'string') throw new TypeError('跨站音乐 API 仅接受 JSON 文本请求。');
    if (body && (method === 'GET' || method === 'HEAD')) throw new TypeError('GET 音乐请求不能包含正文。');
    const bodyText = typeof body === 'string' ? body : '';
    const target = new URL(source.pathname + source.search, remote);
    manager ??= createMusicDeviceSessionManager({...config, apiOrigin: remote, pageOrigin: origin});
    const options: RequestInit = request ? {method: request.method, headers: request.headers, mode: request.mode, redirect: request.redirect, referrer: request.referrer, referrerPolicy: request.referrerPolicy, integrity: request.integrity, keepalive: request.keepalive, ...init} : {...init};
    for (let attempt = 0; attempt < 2; attempt++) {
      throwMusicAbort(signal);
      const identity = await waitForMusic(manager.get(fetcher), signal);
      const proof = await waitForMusic(manager.proof(identity, target, method, bodyText), signal);
      throwMusicAbort(signal);
      const headers = new Headers(options.headers);
      for (const [key, value] of Object.entries(proof)) headers.set(key, value);
      let response: Response;
      try { response = await waitForMusic(fetcher(target.href, {...options, method, headers, body: method === 'GET' || method === 'HEAD' ? undefined : body, signal, credentials: 'omit', cache: 'no-store', mode: 'cors', redirect: 'error'}), signal); }
      catch (error) { throwMusicAbort(signal); throw error; }
      throwMusicAbort(signal);
      if (response.status !== 401) return response;
      let invalid = false;
      try { invalid = (await waitForMusic(response.clone().json(), signal))?.code === 'device_session_invalid'; }
      catch (error) { throwMusicAbort(signal); }
      if (!invalid) return response;
      await waitForMusic(manager.invalidate(identity.session.id), signal);
      if (attempt) return response;
    }
    throw Error('音乐设备授权无法恢复，请重试。');
  };
}

const transport = createMusicApiTransport({apiOrigin: import.meta.env?.PUBLIC_MUSIC_API_ORIGIN});
/** No configured API Origin preserves the local service's existing cookie transport. */
export function musicApiFetch(input: RequestInfo | URL, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<Response> {
  return transport(input, init, fetcher);
}
