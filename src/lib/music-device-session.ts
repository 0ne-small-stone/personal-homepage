/** Only the device key and opaque service session live here; no NetEase credential is accepted. */
export type MusicDeviceSession = {id: string; expiresAt: number};
export type MusicDeviceRecord = {privateKey: CryptoKey; publicJwk: JsonWebKey; session?: MusicDeviceSession};
export interface MusicDeviceStorage {
  load(scope: string): Promise<MusicDeviceRecord | undefined>;
  save(scope: string, record: MusicDeviceRecord): Promise<void>;
}

const sessionLifetime = 30 * 86400000;
const encoder = new TextEncoder();
export function musicBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function opaqueId(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  try { return musicBase64url(Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='), char => char.charCodeAt(0))) === value; }
  catch { return false; }
}

/** IndexedDB structured-clones CryptoKey without ever exporting the private key. */
export function createIndexedDbMusicDeviceStorage(factory?: IDBFactory): MusicDeviceStorage {
  let opened: Promise<IDBDatabase> | undefined;
  function database() {
    if (opened) return opened;
    const pending = new Promise<IDBDatabase>((resolve, reject) => {
      const available = factory ?? globalThis.indexedDB;
      if (!available) { reject(Error('此浏览器无法保存音乐设备授权，请启用 IndexedDB。')); return; }
      const request = available.open('echoes-music-devices-v1', 1);
      let settled = false;
      const fail = (error: Error | DOMException) => { settled = true; reject(error); };
      request.onupgradeneeded = () => { request.result.createObjectStore('devices'); };
      request.onerror = () => fail(request.error || Error('音乐设备授权无法读取。'));
      request.onblocked = () => fail(Error('请关闭旧页面后重试音乐设备授权。'));
      request.onsuccess = () => {
        if (settled) { request.result.close(); return; }
        settled = true;
        request.result.onversionchange = () => { request.result.close(); opened = undefined; };
        resolve(request.result);
      };
    });
    opened = pending.catch(error => { opened = undefined; throw error; });
    return opened;
  }
  async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await database();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction('devices', mode), request = operation(tx.objectStore('devices'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(tx.error || request.error || Error('音乐设备授权无法保存。'));
    });
  }
  return {
    load: scope => transaction<MusicDeviceRecord | undefined>('readonly', store => store.get(scope)),
    save: async (scope, record) => { await transaction('readwrite', store => store.put(record, scope)); },
  };
}

export function throwMusicAbort(signal?: AbortSignal | null): void { if (signal?.aborted) throw signal.reason; }
/** One caller cancelling must not cancel registration needed by another caller. */
export function waitForMusic<T>(pending: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return pending;
  if (signal.aborted) { void pending.catch(() => {}); return Promise.reject(signal.reason); }
  return new Promise<T>((resolve, reject) => {
    const abort = () => { cleanup(); reject(signal.reason); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, {once: true});
    pending.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(signal.aborted ? signal.reason : error); });
  });
}

type DeviceConfig = {apiOrigin: string; pageOrigin: string; storage?: MusicDeviceStorage; crypto?: Crypto; now?: () => number};
export function createMusicDeviceSessionManager(config: DeviceConfig) {
  const secure = config.crypto ?? globalThis.crypto, storage = config.storage ?? createIndexedDbMusicDeviceStorage();
  const now = config.now ?? Date.now, scope = `${config.apiOrigin}\n${config.pageOrigin}`;
  let record: MusicDeviceRecord | undefined, initialized: Promise<void> | undefined;
  let enrollment: Promise<MusicDeviceRecord & {session: MusicDeviceSession}> | undefined;
  let writes: Promise<void> = Promise.resolve();
  function persist(value: MusicDeviceRecord) {
    const write = writes.then(() => storage.save(scope, value));
    writes = write.catch(() => {});
    return write;
  }
  function initialize() {
    return initialized ??= (async () => {
      if (!secure?.subtle) throw Error('此浏览器不支持音乐设备签名，请使用 HTTPS 与现代浏览器。');
      const saved = await storage.load(scope);
      if (saved?.privateKey?.type === 'private' && saved.privateKey.extractable === false && saved.privateKey.algorithm?.name === 'ECDSA' && (saved.privateKey.algorithm as EcKeyAlgorithm).namedCurve === 'P-256' && saved.privateKey.usages?.includes('sign') && saved.publicJwk?.kty === 'EC' && saved.publicJwk.crv === 'P-256' && opaqueId(saved.publicJwk.x) && opaqueId(saved.publicJwk.y) && !('d' in saved.publicJwk)) {
        record = {privateKey: saved.privateKey, publicJwk: {kty: 'EC', crv: 'P-256', x: saved.publicJwk.x, y: saved.publicJwk.y}, session: saved.session ? {id: saved.session.id, expiresAt: saved.session.expiresAt} : undefined}; return;
      }
      const keys = await secure.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign', 'verify']);
      const publicJwk = await secure.subtle.exportKey('jwk', keys.publicKey);
      const next = {privateKey: keys.privateKey, publicJwk};
      await persist(next); record = next;
    })().catch(error => { initialized = undefined; throw error; });
  }
  async function get(fetcher: typeof fetch): Promise<MusicDeviceRecord & {session: MusicDeviceSession}> {
    await initialize();
    if (record?.session && opaqueId(record.session.id) && Number.isSafeInteger(record.session.expiresAt) && record.session.expiresAt > now()) return record as MusicDeviceRecord & {session: MusicDeviceSession};
    return enrollment ??= (async () => {
      const current = record!;
      const response = await fetcher(`${config.apiOrigin}/personal-homepage/api/music/session`, {
        method: 'POST', credentials: 'omit', cache: 'no-store', mode: 'cors', redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: {'Content-Type': 'application/json'}, body: JSON.stringify({publicJwk: current.publicJwk}),
      });
      if (!response.ok) throw Error('音乐设备授权暂时不可用，请稍后重试。');
      const session: MusicDeviceSession = await response.json(), at = now();
      if (!session || !opaqueId(session.id) || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= at || session.expiresAt > at + sessionLifetime + 60000) throw Error('音乐设备授权响应无效。');
      const next = {...current, session: {id: session.id, expiresAt: session.expiresAt}};
      await persist(next); record = next;
      return next;
    })().finally(() => { enrollment = undefined; });
  }
  async function invalidate(id: string) {
    await initialize();
    if (record?.session?.id !== id) return;
    const next = {privateKey: record.privateKey, publicJwk: record.publicJwk};
    record = next; await persist(next);
  }
  async function proof(identity: MusicDeviceRecord & {session: MusicDeviceSession}, url: URL, method: string, body: string) {
    const timestamp = now();
    if (!Number.isSafeInteger(timestamp) || timestamp < 0) throw Error('设备时间无效，请校准时间后重试。');
    const time = String(timestamp), nonce = musicBase64url(secure.getRandomValues(new Uint8Array(16)));
    const digest = musicBase64url(new Uint8Array(await secure.subtle.digest('SHA-256', encoder.encode(body))));
    const canonical = `echoes-device-v1\n${identity.session.id}\n${time}\n${nonce}\n${method.toUpperCase()}\n${url.pathname}${url.search}\n${config.pageOrigin}\n${digest}`;
    const signature = new Uint8Array(await secure.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, identity.privateKey, encoder.encode(canonical)));
    if (signature.byteLength !== 64) throw Error('此浏览器无法生成音乐设备签名。');
    return {'X-Music-Session': identity.session.id, 'X-Music-Time': time, 'X-Music-Nonce': nonce, 'X-Music-Proof': musicBase64url(signature)};
  }
  return {get, invalidate, proof};
}
