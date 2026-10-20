import {createCipheriv, createDecipheriv, createHash, randomBytes} from 'node:crypto';

const defaultTtl = 30 * 86400000;
const unavailable = () => Error('音乐会话已失效，请重新登录。');
const hashId = id => createHash('sha256').update(id).digest('hex');
const validId = id => typeof id === 'string' && /^[\w-]{43}$/.test(id) && Buffer.from(id, 'base64url').toString('base64url') === id;
const timestamp = value => value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);

function decodeKey(key) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(key)) throw Error('会话密钥必须是32字节的标准Base64。');
  const bytes = Buffer.from(key, 'base64');
  if (bytes.length !== 32 || bytes.toString('base64') !== key) { bytes.fill(0); throw Error('会话密钥必须是32字节的标准Base64。'); }
  return bytes;
}

function sessions(backend, {key, now = Date.now, ttlMs = defaultTtl}) {
  const secret = decodeKey(key);
  if (typeof now !== 'function' || !Number.isSafeInteger(ttlMs) || ttlMs <= 0) { secret.fill(0); throw Error('会话有效期配置无效。'); }
  let initialized, closed = false, closing;
  const pending = new Set(), queues = new WeakMap();
  function clock() {
    const at = now();
    if (!Number.isSafeInteger(at) || !Number.isFinite(new Date(at).getTime()) || !Number.isFinite(new Date(at + ttlMs).getTime())) throw Error('会话时间无效。');
    return at;
  }
  function ready() {
    if (closed) return Promise.reject(Error('会话存储已关闭。'));
    return initialized ??= Promise.resolve().then(() => backend.ready());
  }
  function run(operation) {
    if (closed) return Promise.reject(Error('会话存储已关闭。'));
    const job = ready().then(() => { if (closed) throw Error('会话存储已关闭。'); return operation(); });
    pending.add(job); job.then(() => pending.delete(job), () => pending.delete(job));
    return job;
  }
  function currentHash(session) {
    if (!session || !validId(session.id) || session.hash !== hashId(session.id)) throw unavailable();
    return session.hash;
  }
  // An account's existing store follows this same object after token rotation.
  // Serialize its writes/rotation/revocation so a queued logout uses the new hash.
  function withSession(session, operation) {
    try { currentHash(session); } catch (error) { return Promise.reject(error); }
    const previous = queues.get(session) || Promise.resolve();
    const job = run(() => previous.catch(() => {}).then(() => operation(currentHash(session))));
    queues.set(session, job.catch(() => {}));
    return job;
  }
  function seal(cookie, hash) {
    if (typeof cookie !== 'string' || !cookie || Buffer.byteLength(cookie) > 65536) throw Error('网易云登录凭据无效。');
    const iv = randomBytes(12), plain = Buffer.from(cookie);
    try {
      const cipher = createCipheriv('aes-256-gcm', secret, iv);
      cipher.setAAD(Buffer.from(`music-session:v1:${hash}`));
      const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
      return 'v1:' + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
    } finally { plain.fill(0); }
  }
  function unseal(value, hash) {
    if (value == null) return null;
    let plain;
    try {
      if (typeof value !== 'string' || !/^v1:[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 88000) throw Error();
      const packed = Buffer.from(value.slice(3), 'base64');
      if (packed.length < 29 || packed.length > 65564 || packed.toString('base64') !== value.slice(3)) throw Error();
      const decipher = createDecipheriv('aes-256-gcm', secret, packed.subarray(0, 12));
      decipher.setAAD(Buffer.from(`music-session:v1:${hash}`));
      decipher.setAuthTag(packed.subarray(12, 28));
      plain = Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]);
      return plain.toString('utf8');
    } catch { throw Error('保存的网易云登录无法读取，请重新登录。'); }
    finally { plain?.fill(0); }
  }
  async function create() {
    return run(async () => {
      const id = randomBytes(32).toString('base64url'), hash = hashId(id), at = clock();
      await backend.insert(hash, null, at + ttlMs, at);
      return {id, hash, expiresAt: at + ttlMs};
    });
  }
  async function lookup(id) {
    if (!validId(id)) return null;
    return run(async () => {
      const hash = hashId(id), row = await backend.find(hash, clock());
      return row ? {id, hash, expiresAt: timestamp(row.expires_at)} : null;
    });
  }
  function credentialStore(session) {
    currentHash(session);
    return {
      load: () => withSession(session, async hash => { const row = await backend.find(hash, clock()); return row ? unseal(row.ciphertext, hash) : null; }),
      save: cookie => withSession(session, async hash => {
        if (!await backend.update(hash, seal(cookie, hash), clock())) throw unavailable();
      }),
      clear: () => withSession(session, hash => backend.update(hash, null, clock()).then(() => {})),
    };
  }
  function rotate(session) {
    return withSession(session, async oldHash => {
      const id = randomBytes(32).toString('base64url'), hash = hashId(id);
      const expiresAt = await backend.rotate(oldHash, hash, clock, ttlMs, value => value == null ? null : seal(unseal(value, oldHash), hash));
      Object.assign(session, {id, hash, expiresAt});
      return session;
    });
  }
  function revoke(session) { return withSession(session, hash => backend.remove(hash)); }
  function prune() { return run(() => backend.prune(clock())); }
  function close() {
    if (!closing) {
      closed = true;
      closing = Promise.allSettled([...pending, ...(initialized ? [initialized] : [])]).then(() => { secret.fill(0); backend.close?.(); });
    }
    return closing;
  }
  return {ready, create, lookup, credentialStore, rotate, revoke, prune, close};
}

/** PostgreSQL is injected. The caller owns pool.end(); close() only closes this store. */
export function createPostgresSessions({pool, key, now = Date.now, ttlMs = defaultTtl} = {}) {
  if (!pool || typeof pool.query !== 'function' || typeof pool.connect !== 'function') throw Error('需要PostgreSQL连接池。');
  const active = async (client, hash, at, lock = false) => {
    const result = await client.query(`SELECT ciphertext, expires_at FROM music_sessions WHERE token_hash = $1 AND expires_at > $2${lock ? ' FOR UPDATE' : ''}`, [hash, new Date(at)]);
    if (result.rows[0]) return result.rows[0];
    await client.query('DELETE FROM music_sessions WHERE token_hash = $1 AND expires_at <= $2', [hash, new Date(at)]);
    return null;
  };
  const backend = {
    ready: async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS music_sessions (
        token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
        ciphertext TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )`);
      await pool.query('CREATE INDEX IF NOT EXISTS music_sessions_expires_at_idx ON music_sessions (expires_at)');
    },
    insert: (hash, ciphertext, expiresAt, at) => pool.query('INSERT INTO music_sessions (token_hash, ciphertext, expires_at, created_at) VALUES ($1, $2, $3, $4)', [hash, ciphertext, new Date(expiresAt), new Date(at)]),
    find: (hash, at) => active(pool, hash, at),
    update: async (hash, ciphertext, at) => {
      const result = await pool.query('UPDATE music_sessions SET ciphertext = $2 WHERE token_hash = $1 AND expires_at > $3 RETURNING token_hash', [hash, ciphertext, new Date(at)]);
      if (!result.rowCount) await pool.query('DELETE FROM music_sessions WHERE token_hash = $1 AND expires_at <= $2', [hash, new Date(at)]);
      return result.rowCount > 0;
    },
    remove: hash => pool.query('DELETE FROM music_sessions WHERE token_hash = $1', [hash]).then(() => {}),
    prune: async at => {
      const result = await pool.query('DELETE FROM music_sessions WHERE token_hash IN (SELECT token_hash FROM music_sessions WHERE expires_at <= $1 ORDER BY expires_at LIMIT 1000)', [new Date(at)]);
      return result.rowCount;
    },
    rotate: async (oldHash, hash, clock, ttlMs, migrate) => {
      const client = await pool.connect();
      let committed = false;
      try {
        await client.query('BEGIN');
        const row = await active(client, oldHash, clock(), true), at = clock();
        if (!row || timestamp(row.expires_at) <= at) {
          // Commit expiry deletion, rather than undoing it in the error rollback.
          await client.query('DELETE FROM music_sessions WHERE token_hash = $1 AND expires_at <= $2', [oldHash, new Date(at)]);
          await client.query('COMMIT'); committed = true;
          throw unavailable();
        }
        const expiresAt = at + ttlMs, ciphertext = migrate(row.ciphertext);
        await client.query('INSERT INTO music_sessions (token_hash, ciphertext, expires_at, created_at) VALUES ($1, $2, $3, $4)', [hash, ciphertext, new Date(expiresAt), new Date(at)]);
        await client.query('DELETE FROM music_sessions WHERE token_hash = $1', [oldHash]);
        await client.query('COMMIT'); committed = true;
        return expiresAt;
      } catch (error) { if (!committed) try { await client.query('ROLLBACK'); } catch { /* Keep the original failure. */ } throw error; }
      finally { client.release(); }
    },
  };
  return sessions(backend, {key, now, ttlMs});
}

/** Test fixture only: ephemeral memory must never replace PostgreSQL in production. */
export function createMemorySessions({key = randomBytes(32).toString('base64'), now = Date.now, ttlMs = defaultTtl} = {}) {
  const rows = new Map();
  const find = (hash, at) => { const row = rows.get(hash); if (row && row.expires_at > at) return row; rows.delete(hash); return null; };
  return sessions({
    ready: async () => {},
    insert: async (hash, ciphertext, expiresAt, at) => { if (rows.has(hash)) throw Error('会话冲突。'); rows.set(hash, {ciphertext, expires_at: expiresAt, created_at: at}); },
    find: async (hash, at) => find(hash, at),
    update: async (hash, ciphertext, at) => { const row = find(hash, at); if (!row) return false; row.ciphertext = ciphertext; return true; },
    remove: async hash => { rows.delete(hash); },
    prune: async at => {
      let removed = 0;
      for (const [hash, row] of rows) if (row.expires_at <= at) { rows.delete(hash); if (++removed === 1000) break; }
      return removed;
    },
    rotate: async (oldHash, hash, clock, ttlMs, migrate) => {
      const at = clock(), row = find(oldHash, at); if (!row) throw unavailable();
      const ciphertext = migrate(row.ciphertext), expiresAt = at + ttlMs;
      rows.set(hash, {ciphertext, expires_at: expiresAt, created_at: at}); rows.delete(oldHash);
      return expiresAt;
    },
    close: () => rows.clear(),
  }, {key, now, ttlMs});
}
