const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal: true});
const ttlMs = 30 * 86400000, proofWindowMs = 60000;
const invalid = () => Object.assign(Error('设备会话无效，请重新连接。'), {status: 401});
const badInput = () => Object.assign(Error('设备注册信息无效。'), {status: 400});

function base64(bytes) {
  let text = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) text += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(text);
}
const base64url = bytes => base64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function decodeUrl(value, min, max = min) {
  if (typeof value !== 'string' || value.length > Math.ceil(max * 4 / 3) || !/^[A-Za-z0-9_-]+$/.test(value)) throw invalid();
  let bytes;
  try { bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), char => char.charCodeAt(0)); }
  catch { throw invalid(); }
  if (bytes.length < min || bytes.length > max || base64url(bytes) !== value) throw invalid();
  return bytes;
}
const digest = async text => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
const hash = async text => [...await digest(text)].map(byte => byte.toString(16).padStart(2, '0')).join('');

/** time is the original decimal Unix-millisecond header; path includes URL search. */
export async function canonicalProof({id, time, nonce, method, path, origin, bodyText = ''}) {
  return `echoes-device-v1\n${id}\n${time}\n${nonce}\n${method.toUpperCase()}\n${path}\n${origin}\n${base64url(await digest(bodyText))}`;
}

function canonicalOrigin(origin) {
  try { const url = new URL(origin); if (url.protocol === 'https:' && url.origin === origin) return origin; } catch { /* Reject noncanonical or insecure origins. */ }
  throw badInput();
}
async function publicKey(jwk) {
  try {
    if (!jwk || typeof jwk !== 'object' || Array.isArray(jwk) || 'd' in jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw Error();
    decodeUrl(jwk.x, 32); decodeUrl(jwk.y, 32);
    const clean = {kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y};
    const key = await crypto.subtle.importKey('jwk', clean, {name: 'ECDSA', namedCurve: 'P-256'}, false, ['verify']);
    return {key, json: JSON.stringify(clean)};
  } catch { throw badInput(); }
}

/** D1 schema is migration-owned. Never create tables while serving requests. */
export function createDeviceSessions({db, key, now = Date.now} = {}) {
  if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function' || typeof now !== 'function') throw Error('需要D1数据库及有效时钟。');
  let raw;
  try {
    if (typeof key !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(key)) throw Error();
    raw = Uint8Array.from(atob(key), char => char.charCodeAt(0));
    if (raw.length !== 32 || base64(raw) !== key) throw Error();
  } catch { raw?.fill(0); throw Error('会话密钥必须是32字节的标准Base64。'); }
  const secret = crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']).finally(() => raw.fill(0));
  const clock = () => { const at = now(); if (!Number.isSafeInteger(at) || at < 0 || !Number.isSafeInteger(at + ttlMs)) throw Error('会话时间无效。'); return at; };
  const statement = (sql, ...values) => db.prepare(sql).bind(...values);
  const changes = result => { if (result?.success !== true || !Number.isSafeInteger(result.meta?.changes)) throw Error('会话数据库暂时不可用。'); return result.meta.changes; };
  async function identity(session) {
    if (!session) throw invalid();
    decodeUrl(session.id, 32);
    if (session.hash !== await hash(session.id)) throw invalid();
    try { canonicalOrigin(session.origin); } catch { throw invalid(); }
    return session.hash;
  }
  async function rowFor(session) {
    const tokenHash = await identity(session);
    return statement('SELECT credential_cipher, qr_cipher, qr_key_hash, qr_expires_at, qr_generation, expires_at FROM music_device_sessions WHERE token_hash = ? AND origin = ? AND expires_at > ?', tokenHash, session.origin, clock()).first();
  }
  async function seal(value, tokenHash, purpose) {
    const iv = crypto.getRandomValues(new Uint8Array(12)), plain = encoder.encode(value);
    try {
      const encrypted = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData: encoder.encode(`echoes-device-v1:${purpose}:${tokenHash}`), tagLength: 128}, await secret, plain));
      return `v1.${base64url(iv)}.${base64url(encrypted)}`;
    } finally { plain.fill(0); }
  }
  async function unseal(value, tokenHash, purpose) {
    if (value == null) return null;
    let plain;
    try {
      if (typeof value !== 'string' || value.length > 88000) throw Error();
      const [version, iv, ciphertext, extra] = value.split('.');
      if (version !== 'v1' || extra !== undefined) throw Error();
      plain = new Uint8Array(await crypto.subtle.decrypt({name: 'AES-GCM', iv: decodeUrl(iv, 12), additionalData: encoder.encode(`echoes-device-v1:${purpose}:${tokenHash}`), tagLength: 128}, await secret, decodeUrl(ciphertext, 17, 65552)));
      return decoder.decode(plain);
    } catch { throw Object.assign(Error('保存的登录信息无法读取，请重新登录。'), {status: 503}); }
    finally { plain?.fill(0); }
  }
  async function update(session, column, value, required = false) {
    const tokenHash = await identity(session);
    const count = changes(await statement(`UPDATE music_device_sessions SET ${column} = ? WHERE token_hash = ? AND origin = ? AND expires_at > ?`, value, tokenHash, session.origin, clock()).run());
    if (required && count !== 1) throw invalid();
  }
  async function enroll({publicJwk, origin} = {}) {
    canonicalOrigin(origin);
    const imported = await publicKey(publicJwk), id = base64url(crypto.getRandomValues(new Uint8Array(32))), tokenHash = await hash(id), at = clock();
    changes(await statement('INSERT INTO music_device_sessions (token_hash, origin, public_jwk, expires_at, created_at) VALUES (?, ?, ?, ?, ?)', tokenHash, origin, imported.json, at + ttlMs, at).run());
    return {id, expiresAt: at + ttlMs};
  }
  async function authenticate(request, bodyText, origin) {
    try { canonicalOrigin(origin); } catch { throw invalid(); }
    if (typeof bodyText !== 'string' || request.headers.get('Origin') !== origin) throw invalid();
    const id = request.headers.get('X-Music-Session'), time = request.headers.get('X-Music-Time'), nonce = request.headers.get('X-Music-Nonce');
    decodeUrl(id, 32); decodeUrl(nonce, 16, 64);
    const signature = decodeUrl(request.headers.get('X-Music-Proof'), 64);
    if (!/^(0|[1-9]\d{0,15})$/.test(time || '') || !Number.isSafeInteger(Number(time)) || Math.abs(clock() - Number(time)) > proofWindowMs) throw invalid();
    const tokenHash = await hash(id);
    const row = await statement('SELECT public_jwk, origin, expires_at FROM music_device_sessions WHERE token_hash = ? AND expires_at > ?', tokenHash, clock()).first();
    if (!row || row.origin !== origin) throw invalid();
    let imported;
    try { imported = await publicKey(JSON.parse(row.public_jwk)); } catch { throw invalid(); }
    const url = new URL(request.url);
    const payload = await canonicalProof({id, time, nonce, method: request.method, path: url.pathname + url.search, origin, bodyText});
    if (!await crypto.subtle.verify({name: 'ECDSA', hash: 'SHA-256'}, imported.key, signature, encoder.encode(payload))) throw invalid();
    const at = clock();
    if (Math.abs(at - Number(time)) > proofWindowMs || row.expires_at <= at) throw invalid();
    // Unique insertion is the replay gate, and rechecks revocation after verification.
    // Keep the nonce longer than the full possible lifetime of a future-dated proof.
    const consumed = changes(await statement(`INSERT INTO music_device_nonces (token_hash, nonce_hash, expires_at)
      SELECT token_hash, ?, ? FROM music_device_sessions
      WHERE token_hash = ? AND origin = ? AND expires_at > ? AND public_jwk = ?
      ON CONFLICT(token_hash, nonce_hash) DO NOTHING`, await hash(nonce), at + 2 * proofWindowMs + 1, tokenHash, origin, at, row.public_jwk).run());
    if (consumed !== 1) throw invalid();
    return {id, hash: tokenHash, origin, expiresAt: row.expires_at};
  }
  function credentialStore(session) {
    return {
      load: async () => { const row = await rowFor(session); return row ? unseal(row.credential_cipher, session.hash, 'credential') : null; },
      save: async cookie => {
        if (typeof cookie !== 'string' || !cookie || encoder.encode(cookie).length > 65536) throw Error('网易云登录凭据无效。');
        await update(session, 'credential_cipher', await seal(cookie, await identity(session), 'credential'), true);
      },
      clear: () => update(session, 'credential_cipher', null),
      clearIfMatches: async cookie => {
        if (typeof cookie !== 'string' || !cookie) return false;
        const row = await rowFor(session);
        if (!row?.credential_cipher || await unseal(row.credential_cipher, session.hash, 'credential') !== cookie) return false;
        // Compare ciphertext too: a newly saved login may contain the same cookie.
        return changes(await statement(`UPDATE music_device_sessions SET credential_cipher = NULL
          WHERE token_hash = ? AND origin = ? AND expires_at > ? AND credential_cipher = ?`,
        session.hash, session.origin, clock(), row.credential_cipher).run()) === 1;
      },
    };
  }
  async function getQr(session) {
    const row = await rowFor(session);
    if (!row?.qr_cipher) return null;
    let qr;
    try { qr = JSON.parse(await unseal(row.qr_cipher, session.hash, 'qr')); } catch { throw Object.assign(Error('保存的扫码信息无法读取。'), {status: 503}); }
    if (!qr || typeof qr.key !== 'string' || !qr.key || !Number.isSafeInteger(qr.expiresAt) || qr.expiresAt !== row.qr_expires_at || !Number.isSafeInteger(qr.generation) || qr.generation !== row.qr_generation || await hash(qr.key) !== row.qr_key_hash) throw Object.assign(Error('保存的扫码信息无法读取。'), {status: 503});
    const at = clock();
    if (qr.expiresAt <= at) {
      // A newer QR may have replaced this one while its ciphertext was read.
      changes(await statement('UPDATE music_device_sessions SET qr_cipher = NULL, qr_key_hash = NULL, qr_expires_at = NULL WHERE token_hash = ? AND origin = ? AND qr_key_hash = ? AND qr_generation = ? AND qr_expires_at <= ?', await identity(session), session.origin, row.qr_key_hash, row.qr_generation, at).run());
      return null;
    }
    return qr;
  }
  async function beginQr(session) {
    // Reserve a generation before requesting an upstream key. Cancellation and
    // another QR request can then invalidate an in-flight key response.
    const row = await statement(`UPDATE music_device_sessions
      SET qr_generation = qr_generation + 1, qr_cipher = NULL, qr_key_hash = NULL, qr_expires_at = NULL
      WHERE token_hash = ? AND origin = ? AND expires_at > ? AND qr_generation < 9007199254740991
      RETURNING qr_generation`, await identity(session), session.origin, clock()).first();
    if (!row || !Number.isSafeInteger(row.qr_generation)) throw invalid();
    return row.qr_generation;
  }
  async function setQr(session, qr, generation) {
    if (!qr || typeof qr.key !== 'string' || !qr.key || encoder.encode(qr.key).length > 4096 || !Number.isSafeInteger(qr.expiresAt) || qr.expiresAt <= clock()) throw Error('扫码信息无效。');
    if (!Number.isSafeInteger(generation) || generation < 1) return false;
    const tokenHash = await identity(session), ciphertext = await seal(JSON.stringify({key: qr.key, expiresAt: qr.expiresAt, generation}), tokenHash, 'qr');
    const keyHash = await hash(qr.key), at = clock();
    if (qr.expiresAt <= at) return false;
    const count = changes(await statement('UPDATE music_device_sessions SET qr_cipher = ?, qr_key_hash = ?, qr_expires_at = ? WHERE token_hash = ? AND origin = ? AND expires_at > ? AND qr_generation = ? AND qr_cipher IS NULL', ciphertext, keyHash, qr.expiresAt, tokenHash, session.origin, at, generation).run());
    return count === 1;
  }
  async function clearQr(session, expectedKey, expectedGeneration) {
    if (expectedKey !== undefined && (typeof expectedKey !== 'string' || !expectedKey || encoder.encode(expectedKey).length > 4096)) return false;
    if (expectedGeneration !== undefined && (!Number.isSafeInteger(expectedGeneration) || expectedGeneration < 1)) return false;
    const tokenHash = await identity(session);
    const count = changes(await statement(`UPDATE music_device_sessions
      SET qr_generation = qr_generation + 1, qr_cipher = NULL, qr_key_hash = NULL, qr_expires_at = NULL
      WHERE token_hash = ? AND origin = ? AND expires_at > ? AND qr_generation < 9007199254740991${expectedKey === undefined ? '' : ' AND qr_key_hash = ?'}${expectedGeneration === undefined ? '' : ' AND qr_generation = ?'}`,
    tokenHash, session.origin, clock(), ...(expectedKey === undefined ? [] : [await hash(expectedKey)]), ...(expectedGeneration === undefined ? [] : [expectedGeneration])).run());
    return count === 1;
  }
  async function completeQr(session, qrKey, cookie, generation) {
    if (typeof qrKey !== 'string' || !qrKey || encoder.encode(qrKey).length > 4096) return false;
    if (!Number.isSafeInteger(generation) || generation < 1) return false;
    if (typeof cookie !== 'string' || !cookie || encoder.encode(cookie).length > 65536) throw Error('网易云登录凭据无效。');
    const tokenHash = await identity(session), ciphertext = await seal(cookie, tokenHash, 'credential'), keyHash = await hash(qrKey), at = clock();
    const count = changes(await statement(`UPDATE music_device_sessions SET credential_cipher = ?, qr_cipher = NULL, qr_key_hash = NULL, qr_expires_at = NULL
      WHERE token_hash = ? AND origin = ? AND expires_at > ? AND qr_key_hash = ? AND qr_expires_at > ? AND qr_generation = ?`, ciphertext, tokenHash, session.origin, at, keyHash, at, generation).run());
    return count === 1;
  }
  async function revoke(session) { changes(await statement('DELETE FROM music_device_sessions WHERE token_hash = ? AND origin = ?', await identity(session), session.origin).run()); }
  async function prune() {
    const at = clock();
    const results = await db.batch([
      statement('DELETE FROM music_device_nonces WHERE rowid IN (SELECT rowid FROM music_device_nonces WHERE expires_at <= ? ORDER BY expires_at LIMIT 1000)', at),
      statement('DELETE FROM music_device_sessions WHERE token_hash IN (SELECT token_hash FROM music_device_sessions WHERE expires_at <= ? ORDER BY expires_at LIMIT 1000)', at),
      statement('DELETE FROM music_rate_limits WHERE bucket IN (SELECT bucket FROM music_rate_limits WHERE expires_at <= ? ORDER BY expires_at LIMIT 1000)', at),
    ]);
    return {nonces: changes(results[0]), sessions: changes(results[1]), rates: changes(results[2])};
  }
  return {enroll, authenticate, credentialStore, revoke, getQr, beginQr, setQr, clearQr, completeQr, prune};
}
