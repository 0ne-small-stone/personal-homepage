import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomBytes} from 'node:crypto';
import {createMemorySessions, createPostgresSessions} from './session-store.mjs';

const key = Buffer.alloc(32, 17).toString('base64');
const cookie = 'synthetic-login-cookie-for-session-tests';

// A query/transaction double, not a PostgreSQL integration test. Real crypto and
// the public store API are exercised; no real credentials, database or network.
function fakePool() {
  let rows = new Map(), fail = () => false;
  const queries = [], transactions = [];
  async function query(sql, values = [], transaction) {
    const text = sql.replace(/\s+/g, ' ').trim();
    queries.push({text, values});
    if (fail(text, values)) throw Error('synthetic database failure');
    const data = transaction || rows, [hash] = values;
    if (text.startsWith('CREATE TABLE') || text.startsWith('CREATE INDEX')) return {rows: [], rowCount: 0};
    if (text.startsWith('SELECT')) {
      const row = data.get(hash), valid = row && row.expires_at > values[1];
      return {rows: valid ? [{...row}] : [], rowCount: Number(Boolean(valid))};
    }
    if (text.startsWith('INSERT')) {
      if (data.has(hash)) throw Error('duplicate token hash');
      data.set(hash, {ciphertext: values[1], expires_at: values[2], created_at: values[3]});
      return {rows: [], rowCount: 1};
    }
    if (text.startsWith('UPDATE')) {
      const row = data.get(hash), valid = row && row.expires_at > values[2];
      if (valid) row.ciphertext = values[1];
      return {rows: valid ? [{token_hash: hash}] : [], rowCount: Number(Boolean(valid))};
    }
    if (text.startsWith('DELETE')) {
      if (text.includes('WHERE token_hash IN')) {
        const expired = [...data].filter(([, row]) => row.expires_at <= values[0]).sort((a, b) => a[1].expires_at - b[1].expires_at).slice(0, 1000);
        for (const [id] of expired) data.delete(id);
        return {rows: [], rowCount: expired.length};
      }
      const row = data.get(hash), allowed = values.length === 1 || row?.expires_at <= values[1];
      return {rows: [], rowCount: Number(Boolean(allowed && data.delete(hash)))};
    }
    throw Error('unexpected test query');
  }
  return {
    get rows() { return rows; }, queries, transactions,
    failWhen: check => { fail = check; },
    query: (sql, values) => query(sql, values),
    connect: async () => {
      let transaction;
      return {
        query: async (sql, values) => {
          if (sql === 'BEGIN') { transactions.push(sql); transaction = new Map([...rows].map(([id, row]) => [id, {...row}])); return {}; }
          if (sql === 'COMMIT') { transactions.push(sql); rows = transaction; transaction = undefined; return {}; }
          if (sql === 'ROLLBACK') { transactions.push(sql); transaction = undefined; return {}; }
          return query(sql, values, transaction);
        },
        release: () => transactions.push('release'),
      };
    },
  };
}

test('configuration accepts only a canonical 32-byte standard Base64 key', () => {
  for (const invalid of [undefined, '', 'secret', Buffer.alloc(32), randomBytes(31).toString('base64'), key.trimEnd() + '\n', key.slice(0, -1), '_'.repeat(43) + '=', 'A'.repeat(42) + 'B=']) {
    assert.throws(() => createPostgresSessions({pool: fakePool(), key: invalid}), /32字节/);
  }
  assert.throws(() => createPostgresSessions({pool: fakePool(), key, ttlMs: 0}), /有效期/);
});

test('database persists only token hashes and authenticated ciphertext; nonce changes each save', async t => {
  const pool = fakePool(), store = createPostgresSessions({pool, key}); t.after(() => store.close());
  const session = await store.create(), credentials = store.credentialStore(session);
  assert.match(session.id, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(Buffer.from(session.id, 'base64url').length, 32);
  assert.equal(session.hash, createHash('sha256').update(session.id).digest('hex'));
  assert.equal((await store.lookup(session.id)).expiresAt, session.expiresAt);
  await credentials.save(cookie);
  const first = pool.rows.get(session.hash).ciphertext;
  assert.equal(await credentials.load(), cookie);
  await credentials.save(cookie);
  assert.notEqual(pool.rows.get(session.hash).ciphertext, first);
  assert.equal(JSON.stringify([...pool.rows]).includes(cookie), false);
  assert.equal(JSON.stringify(pool.queries).includes(cookie), false);
  assert.equal(JSON.stringify(pool.queries).includes(session.id), false);
  assert.deepEqual(Object.keys(pool.rows.get(session.hash)).sort(), ['ciphertext', 'created_at', 'expires_at']);
});

test('tampering, a different key and copying ciphertext between sessions fail authentication', async t => {
  const pool = fakePool(), store = createPostgresSessions({pool, key}); t.after(() => store.close());
  const a = await store.create(), b = await store.create();
  await store.credentialStore(a).save(cookie);
  const sealed = pool.rows.get(a.hash).ciphertext;
  pool.rows.get(b.hash).ciphertext = sealed;
  await assert.rejects(store.credentialStore(b).load(), /无法读取/);
  const bytes = Buffer.from(sealed.slice(3), 'base64'); bytes[bytes.length - 1] ^= 1;
  pool.rows.get(a.hash).ciphertext = 'v1:' + bytes.toString('base64');
  await assert.rejects(store.credentialStore(a).load(), /无法读取/);
  pool.rows.get(a.hash).ciphertext = sealed;
  const wrongKey = createPostgresSessions({pool, key: Buffer.alloc(32, 18).toString('base64')}); t.after(() => wrongKey.close());
  await assert.rejects(wrongKey.credentialStore(a).load(), /无法读取/);
});

for (const mode of ['postgres', 'memory']) {
  test(`${mode}: same-account sessions remain independent; clear keeps the session active`, async t => {
    const store = mode === 'postgres' ? createPostgresSessions({pool: fakePool(), key}) : createMemorySessions({key}); t.after(() => store.close());
    const a = await store.create(), b = await store.create();
    const first = store.credentialStore(a), second = store.credentialStore(b);
    await first.save(cookie); await second.save(cookie);
    await first.clear();
    assert.equal(await first.load(), null); assert.ok(await store.lookup(a.id));
    assert.equal(await second.load(), cookie);
    await store.revoke(a); assert.equal(await second.load(), cookie);
  });

  test(`${mode}: expiry and revocation cannot be restored by saved account adapters`, async t => {
    let now = 1700000000000;
    const options = {key, now: () => now, ttlMs: 1000};
    const store = mode === 'postgres' ? createPostgresSessions({pool: fakePool(), ...options}) : createMemorySessions(options); t.after(() => store.close());
    const expired = await store.create(), oldStore = store.credentialStore(expired);
    assert.equal(expired.expiresAt, now + 1000);
    await oldStore.save(cookie); now += 1000;
    assert.equal(await store.lookup(expired.id), null);
    assert.equal(await oldStore.load(), null);
    await assert.rejects(oldStore.save(cookie), /失效/);
    await assert.rejects(store.rotate(expired), /失效/);
    const revoked = await store.create(), revokedStore = store.credentialStore(revoked);
    await revokedStore.save(cookie); await store.revoke(revoked);
    assert.equal(await store.lookup(revoked.id), null); assert.equal(await revokedStore.load(), null);
    await assert.rejects(revokedStore.save(cookie), /失效/);
    await assert.rejects(store.rotate(revoked), /失效/);
    await store.revoke(revoked);
  });

  test(`${mode}: rotation invalidates old IDs and migrates the existing adapter to the new AAD`, async t => {
    const store = mode === 'postgres' ? createPostgresSessions({pool: fakePool(), key}) : createMemorySessions({key}); t.after(() => store.close());
    const session = await store.create(), old = {...session}, credentials = store.credentialStore(session);
    await credentials.save(cookie);
    assert.equal(await store.rotate(session), session);
    assert.notEqual(session.id, old.id); assert.notEqual(session.hash, old.hash);
    assert.equal(await store.lookup(old.id), null); assert.ok(await store.lookup(session.id));
    assert.equal(await credentials.load(), cookie);
    await credentials.save(cookie + '-updated'); assert.equal(await credentials.load(), cookie + '-updated');
    assert.equal(await store.credentialStore(old).load(), null);
    await assert.rejects(store.credentialStore(old).save(cookie), /失效/);
  });

  test(`${mode}: rotation and queued revocation serialize on the same session object`, async t => {
    const store = mode === 'postgres' ? createPostgresSessions({pool: fakePool(), key}) : createMemorySessions({key}); t.after(() => store.close());
    const session = await store.create(), credentials = store.credentialStore(session);
    await credentials.save(cookie);
    const rotating = store.rotate(session), revoking = store.revoke(session);
    await rotating; await revoking;
    assert.equal(await store.lookup(session.id), null);
    await assert.rejects(credentials.save(cookie), /失效/);
  });

  test(`${mode}: a rejected expired rotation permanently removes that row`, async t => {
    let now = 1700000000000;
    const options = {key, now: () => now, ttlMs: 1000};
    const store = mode === 'postgres' ? createPostgresSessions({pool: fakePool(), ...options}) : createMemorySessions(options); t.after(() => store.close());
    const session = await store.create(), credentials = store.credentialStore(session);
    await credentials.save(cookie); now += 1000;
    await assert.rejects(store.rotate(session), /失效/);
    now -= 1000;
    assert.equal(await store.lookup(session.id), null);
    assert.equal(await credentials.load(), null);
    await assert.rejects(credentials.save(cookie), /失效/);
  });

  test(`${mode}: prune caps each batch at 1000 and preserves active credentials`, async t => {
    let now = 1700000000000;
    const pool = fakePool(), options = {key, now: () => now, ttlMs: 1000};
    const store = mode === 'postgres' ? createPostgresSessions({pool, ...options}) : createMemorySessions(options); t.after(() => store.close());
    let expired;
    for (let index = 0; index < 1005; index++) expired = await store.create();
    now += 1000;
    const active = await store.create(), credentials = store.credentialStore(active);
    await credentials.save(cookie);
    assert.equal(await store.prune(), 1000);
    assert.equal(await store.prune(), 5);
    assert.equal(await store.prune(), 0);
    assert.ok(await store.lookup(active.id)); assert.equal(await credentials.load(), cookie);
    assert.equal(await store.lookup(expired.id), null);
    await assert.rejects(store.credentialStore(expired).save(cookie), /失效/);
    if (mode === 'postgres') {
      assert.equal(pool.queries.filter(q => q.text.startsWith('CREATE INDEX')).length, 1);
      assert.ok(pool.queries.some(q => /DELETE FROM music_sessions WHERE token_hash IN \(SELECT token_hash.*LIMIT 1000\)/.test(q.text)));
    }
  });
}

test('failed rotation rolls back without mutating the caller or losing the credential', async t => {
  const pool = fakePool(), store = createPostgresSessions({pool, key}); t.after(() => store.close());
  const session = await store.create(), before = {...session}, credentials = store.credentialStore(session);
  await credentials.save(cookie);
  pool.failWhen(sql => sql.startsWith('INSERT'));
  await assert.rejects(store.rotate(session), /synthetic database failure/);
  assert.deepEqual(session, before); assert.equal(pool.rows.size, 1);
  assert.equal(await credentials.load(), cookie); assert.ok(await store.lookup(before.id));
  assert.deepEqual(pool.transactions, ['BEGIN', 'ROLLBACK', 'release']);
  pool.failWhen(() => false);
  await store.rotate(session);
  assert.deepEqual(pool.transactions.slice(-3), ['BEGIN', 'COMMIT', 'release']);
});

test('malformed tokens never query the database and closed stores reject subsequent work', async () => {
  const pool = fakePool(), store = createPostgresSessions({pool, key});
  for (const id of [undefined, '', 'a'.repeat(42), 'a'.repeat(44), '/'.repeat(43), '_'.repeat(43)]) assert.equal(await store.lookup(id), null);
  assert.equal(pool.queries.length, 0);
  await store.ready(); await store.ready();
  assert.equal(pool.queries.filter(q => q.text.startsWith('CREATE TABLE')).length, 1);
  assert.equal(pool.queries.filter(q => q.text.startsWith('CREATE INDEX')).length, 1);
  const session = await store.create(), credentials = store.credentialStore(session);
  await store.close(); await store.close();
  await assert.rejects(store.create(), /已关闭/); await assert.rejects(credentials.load(), /已关闭/); await assert.rejects(store.prune(), /已关闭/);
});

test('close drains an already running credential read before erasing its key', async () => {
  const pool = fakePool(), store = createPostgresSessions({pool, key});
  const session = await store.create(), credentials = store.credentialStore(session);
  await credentials.save(cookie);
  let enter, resume;
  const entered = new Promise(resolve => { enter = resolve; }), resumed = new Promise(resolve => { resume = resolve; });
  const query = pool.query;
  pool.query = async (sql, values) => { if (sql.startsWith('SELECT')) { enter(); await resumed; } return query(sql, values); };
  const reading = credentials.load(); await entered;
  let finished = false;
  const closing = store.close().then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false);
  resume(); assert.equal(await reading, cookie); await closing;
  await assert.rejects(credentials.load(), /已关闭/);
});
