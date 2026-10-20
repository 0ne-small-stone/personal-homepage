import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash, randomBytes} from 'node:crypto';
import {Miniflare} from 'miniflare';
import {canonicalProof, createDeviceSessions} from './device-sessions.mjs';

const origin = 'https://0ne-small-stone.github.io';
const api = 'https://music.example.test/personal-homepage/api/music/netease';
const key = Buffer.alloc(32, 23).toString('base64');
const b64 = value => Buffer.from(value).toString('base64url');
const text = value => new TextEncoder().encode(value);
const sha = value => createHash('sha256').update(value).digest('base64url');
const cookie = 'synthetic-netease-cookie-never-for-a-real-account';

test('device sessions against a real Miniflare D1 database', async t => {
  const mf = new Miniflare({workers: [{config: {
    name: 'device-sessions-test', compatibilityDate: '2026-10-20',
    manifest: {mainModule: 'index.js', modules: {'index.js': {type: 'esm', contents: 'export default {fetch(){return new Response("fixture")}}'}}},
    env: {DB: {type: 'd1', id: 'device-sessions-test'}},
  }}]});
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('DB');
  const migration = await readFile(new URL('../../migrations/0001_sessions.sql', import.meta.url), 'utf8');
  for (const sql of migration.split(';').map(value => value.trim()).filter(Boolean)) await db.prepare(sql).run();
  let at;
  const store = () => createDeviceSessions({db, key, now: () => at});
  t.beforeEach(async () => {
    at = 1800000000000;
    await db.batch([db.prepare('DELETE FROM music_device_nonces'), db.prepare('DELETE FROM music_device_sessions'), db.prepare('DELETE FROM music_rate_limits')]);
  });
  async function device(sessions = store(), boundOrigin = origin) {
    const keys = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign', 'verify']);
    const publicJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
    const enrollment = await sessions.enroll({publicJwk, origin: boundOrigin});
    return {sessions, keys, publicJwk, ...enrollment};
  }
  async function proof(device, {body = '{"title":"月光"}', method = 'POST', url = api, boundOrigin = origin, time = String(at), nonce = randomBytes(16).toString('base64url'), signingKey = device.keys.privateKey, id = device.id} = {}) {
    const target = new URL(url);
    // Independent protocol construction: catch accidental shared-helper changes.
    const payload = ['echoes-device-v1', id, time, nonce, method.toUpperCase(), target.pathname + target.search, boundOrigin, sha(body)].join('\n');
    const signature = await crypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, signingKey, text(payload));
    assert.equal(signature.byteLength, 64);
    const headers = {'Origin': boundOrigin, 'X-Music-Session': id, 'X-Music-Time': time, 'X-Music-Nonce': nonce, 'X-Music-Proof': b64(signature)};
    return {request: new Request(url, {method, headers, ...(!['GET', 'HEAD'].includes(method) ? {body} : {})}), body};
  }
  const authenticate = (device, signed) => device.sessions.authenticate(signed.request, signed.body, origin);
  const rejectsAuth = promise => assert.rejects(promise, error => error.status === 401);
  async function stageQr(sessions, session, qr) {
    const generation = await sessions.beginQr(session);
    assert.equal(await sessions.setQr(session, qr, generation), true);
    return generation;
  }

  await t.test('canonical helper exactly binds UTF-8 body, original time, uppercase method, query and origin', async () => {
    const input = {id: 'id', time: '1800000000000', nonce: 'nonce', method: 'post', path: '/api/music?q=%E6%9C%88&space=a%20b', origin, bodyText: '{"title":"月光"}'};
    const expected = `echoes-device-v1\nid\n1800000000000\nnonce\nPOST\n/api/music?q=%E6%9C%88&space=a%20b\n${origin}\n${sha(input.bodyText)}`;
    assert.equal(await canonicalProof(input), expected);
  });

  await t.test('registration stores only token hash and public key; configuration rejects invalid keys/origins/JWK', async () => {
    for (const invalid of [undefined, '', key + '\n', key.slice(0, -1), 'A'.repeat(42) + 'B=', randomBytes(31).toString('base64')]) assert.throws(() => createDeviceSessions({db, key: invalid}), /32字节/);
    const enrolled = await device();
    assert.equal(Buffer.from(enrolled.id, 'base64url').length, 32);
    assert.equal(enrolled.expiresAt, at + 30 * 86400000);
    const rows = (await db.prepare('SELECT * FROM music_device_sessions').all()).results;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].token_hash, createHash('sha256').update(enrolled.id).digest('hex'));
    assert.equal(JSON.stringify(rows).includes(enrolled.id), false);
    assert.equal(rows[0].origin, origin);
    for (const badOrigin of ['http://example.test', origin + '/', origin + '/personal-homepage', 'https://x@y.test']) await assert.rejects(store().enroll({origin: badOrigin, publicJwk: enrolled.publicJwk}), error => error.status === 400);
    await assert.rejects(store().enroll({origin, publicJwk: {...enrolled.publicJwk, d: 'private-key'}}), error => error.status === 400);
    await assert.rejects(store().enroll({origin, publicJwk: {...enrolled.publicJwk, x: 'AA'}}), error => error.status === 400);
  });

  await t.test('only one concurrent use succeeds; replay remains rejected after store recreation', async () => {
    const owner = await device(), signed = await proof(owner);
    const outcomes = await Promise.allSettled([authenticate(owner, signed), authenticate(owner, signed)]);
    assert.equal(outcomes.filter(value => value.status === 'fulfilled').length, 1);
    assert.equal(outcomes.filter(value => value.status === 'rejected' && value.reason.status === 401).length, 1);
    await rejectsAuth(store().authenticate(signed.request, signed.body, origin));
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM music_device_nonces').first()).count, 1);
  });

  await t.test('wrong body, origin, method, path/query or signing key never consumes a nonce', async () => {
    const owner = await device(), other = await device(), signed = await proof(owner, {url: api + '?q=moon&n=1'});
    await rejectsAuth(owner.sessions.authenticate(signed.request, signed.body + ' ', origin));
    await rejectsAuth(owner.sessions.authenticate(signed.request, signed.body, 'https://another.example.test'));
    const changed = new Headers(signed.request.headers); changed.set('Origin', 'https://another.example.test');
    await rejectsAuth(owner.sessions.authenticate(new Request(signed.request.url, {method: 'POST', headers: changed}), signed.body, origin));
    await rejectsAuth(owner.sessions.authenticate(new Request(signed.request.url, {method: 'GET', headers: signed.request.headers}), signed.body, origin));
    await rejectsAuth(owner.sessions.authenticate(new Request(api + '?n=1&q=moon', {method: 'POST', headers: signed.request.headers}), signed.body, origin));
    const wrongKey = await proof(owner, {nonce: signed.request.headers.get('X-Music-Nonce'), signingKey: other.keys.privateKey});
    await rejectsAuth(authenticate(owner, wrongKey));
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM music_device_nonces').first()).count, 0);
    assert.equal((await authenticate(owner, signed)).id, owner.id);
  });

  await t.test('registered origin is checked even with a correctly signed alternate-origin request', async () => {
    const owner = await device(), otherOrigin = 'https://other.example.test';
    const signed = await proof(owner, {boundOrigin: otherOrigin});
    await rejectsAuth(owner.sessions.authenticate(signed.request, signed.body, otherOrigin));
  });

  await t.test('proofs enforce raw64 format, canonical encoding, 128-bit nonce and a ±60-second window', async () => {
    const owner = await device();
    for (const overrides of [{time: String(at - 60001)}, {time: String(at + 60001)}, {time: '0' + at}, {nonce: b64(randomBytes(15))}]) await rejectsAuth(authenticate(owner, await proof(owner, overrides)));
    const signed = await proof(owner);
    for (const bad of [b64(randomBytes(63)), b64(randomBytes(65)), signed.request.headers.get('X-Music-Proof') + '=']) {
      const headers = new Headers(signed.request.headers); headers.set('X-Music-Proof', bad);
      await rejectsAuth(owner.sessions.authenticate(new Request(api, {method: 'POST', headers}), signed.body, origin));
    }
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM music_device_nonces').first()).count, 0);
    await authenticate(owner, await proof(owner, {time: String(at - 60000)}));
    await authenticate(owner, await proof(owner, {time: String(at + 60000)}));
  });

  await t.test('nonce pruning cannot enable replay of an otherwise still-valid future-dated proof', async () => {
    const owner = await device(), signed = await proof(owner, {time: String(at + 60000)});
    await authenticate(owner, signed); at += 120000;
    assert.equal((await owner.sessions.prune()).nonces, 0);
    await rejectsAuth(authenticate(owner, signed));
    at++;
    assert.equal((await owner.sessions.prune()).nonces, 1);
    await rejectsAuth(authenticate(owner, signed));
  });

  await t.test('AES-GCM ciphertext is randomized, session-bound and independent of the public device key', async () => {
    const a = await device(), b = await device();
    const first = await authenticate(a, await proof(a)), second = await authenticate(b, await proof(b));
    const credentials = a.sessions.credentialStore(first);
    await credentials.save(cookie);
    const row = await db.prepare('SELECT credential_cipher FROM music_device_sessions WHERE token_hash = ?').bind(first.hash).first();
    await credentials.save(cookie);
    const next = await db.prepare('SELECT credential_cipher FROM music_device_sessions WHERE token_hash = ?').bind(first.hash).first();
    assert.notEqual(row.credential_cipher, next.credential_cipher);
    assert.equal(JSON.stringify(next).includes(cookie), false);
    assert.equal(await store().credentialStore(first).load(), cookie);
    const wrongSecret = createDeviceSessions({db, key: Buffer.alloc(32, 24).toString('base64'), now: () => at});
    await assert.rejects(wrongSecret.credentialStore(first).load(), error => error.status === 503);
    await db.prepare('UPDATE music_device_sessions SET credential_cipher = ? WHERE token_hash = ?').bind(next.credential_cipher, second.hash).run();
    await assert.rejects(b.sessions.credentialStore(second).load(), error => error.status === 503);
    const parts = next.credential_cipher.split('.'), bytes = Buffer.from(parts[2], 'base64url'); bytes[0] ^= 1; parts[2] = b64(bytes);
    await db.prepare('UPDATE music_device_sessions SET credential_cipher = ? WHERE token_hash = ?').bind(parts.join('.'), first.hash).run();
    await assert.rejects(credentials.load(), error => error.status === 503);
  });

  await t.test('QR secret and expiry survive store recreation, stay encrypted and cannot be swapped into credentials', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const qr = {key: 'synthetic-qr-secret', expiresAt: at + 180000};
    await owner.sessions.credentialStore(session).save(cookie); const generation = await stageQr(owner.sessions, session, qr);
    const row = await db.prepare('SELECT * FROM music_device_sessions WHERE token_hash = ?').bind(session.hash).first();
    assert.equal(JSON.stringify(row).includes(qr.key), false); assert.equal(JSON.stringify(row).includes(cookie), false);
    assert.deepEqual(await store().getQr(session), {...qr, generation});
    await db.prepare('UPDATE music_device_sessions SET credential_cipher = ? WHERE token_hash = ?').bind(row.qr_cipher, session.hash).run();
    await assert.rejects(owner.sessions.credentialStore(session).load(), error => error.status === 503);
    at = qr.expiresAt;
    assert.equal(await owner.sessions.getQr(session), null);
    assert.equal((await db.prepare('SELECT qr_cipher FROM music_device_sessions WHERE token_hash = ?').bind(session.hash).first()).qr_cipher, null);
    await stageQr(owner.sessions, session, {key: 'new-qr', expiresAt: at + 1000}); await owner.sessions.clearQr(session);
    assert.equal(await owner.sessions.getQr(session), null);
  });

  await t.test('same-account sessions remain isolated; revocation and expiry cannot be revived by a saved adapter', async () => {
    const a = await device(), b = await device();
    const first = await authenticate(a, await proof(a)), second = await authenticate(b, await proof(b));
    const one = a.sessions.credentialStore(first), two = b.sessions.credentialStore(second);
    await one.save(cookie); await two.save(cookie); await one.clear();
    assert.equal(await one.load(), null); assert.equal(await two.load(), cookie);
    await one.save(cookie); await a.sessions.revoke(first);
    await rejectsAuth(authenticate(a, await proof(a)));
    assert.equal(await one.load(), null); await rejectsAuth(one.save(cookie));
    assert.equal(await two.load(), cookie);
    at = second.expiresAt;
    await rejectsAuth(authenticate(b, await proof(b))); assert.equal(await two.load(), null);
    await rejectsAuth(two.save(cookie)); await rejectsAuth(b.sessions.beginQr(second));
    assert.equal(await b.sessions.setQr(second, {key: 'late', expiresAt: at + 1000}, 1), false);
  });

  await t.test('QR generations invalidate late upstream keys after cancellation or a new request', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const first = await owner.sessions.beginQr(session);
    assert.equal(await owner.sessions.clearQr(session), true);
    assert.equal(await owner.sessions.setQr(session, {key: 'late-after-cancel', expiresAt: at + 1000}, first), false);
    assert.equal(await owner.sessions.getQr(session), null);
    const second = await owner.sessions.beginQr(session), third = await store().beginQr(session);
    assert.ok(first < second && second < third);
    assert.equal(await owner.sessions.setQr(session, {key: 'late-after-replacement', expiresAt: at + 1000}, second), false);
    assert.equal(await store().setQr(session, {key: 'newest', expiresAt: at + 1000}, third), true);
    assert.equal(await owner.sessions.setQr(session, {key: 'duplicate-response', expiresAt: at + 1000}, third), false);
    assert.deepEqual(await owner.sessions.getQr(session), {key: 'newest', expiresAt: at + 1000, generation: third});
    await owner.sessions.revoke(session);
    assert.equal(await store().setQr(session, {key: 'revoked', expiresAt: at + 1000}, third), false);
  });

  await t.test('an old QR expiry response only clears the matching key and cannot clear a replacement', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    await stageQr(owner.sessions, session, {key: 'first', expiresAt: at + 1000});
    const generation = await stageQr(owner.sessions, session, {key: 'second', expiresAt: at + 1000});
    assert.equal(await owner.sessions.clearQr(session, 'first'), false);
    assert.deepEqual(await store().getQr(session), {key: 'second', expiresAt: at + 1000, generation});
    assert.equal(await owner.sessions.clearQr(session, 'second'), true);
    assert.equal(await store().getQr(session), null);
    assert.equal(await owner.sessions.setQr(session, {key: 'second', expiresAt: at + 1000}, generation), false);
  });

  await t.test('a repeated upstream QR key cannot bypass the generation check for a late 803', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const old = await stageQr(owner.sessions, session, {key: 'repeated-key', expiresAt: at + 1000});
    const current = await stageQr(owner.sessions, session, {key: 'repeated-key', expiresAt: at + 1000});
    assert.equal(await owner.sessions.completeQr(session, 'repeated-key', 'old-login', old), false);
    assert.equal(await owner.sessions.completeQr(session, 'repeated-key', 'new-login', current), true);
    assert.equal(await owner.sessions.credentialStore(session).load(), 'new-login');
  });

  await t.test('a late 800 for a repeated upstream QR key cannot clear a newer generation', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const key = 'same-unikey';
    const old = await stageQr(owner.sessions, session, {key, expiresAt: at + 1000});
    const current = await stageQr(owner.sessions, session, {key, expiresAt: at + 1000});
    assert.equal(await owner.sessions.clearQr(session, key, old), false);
    for (const invalid of [0, -1, 1.5, '1', NaN]) assert.equal(await owner.sessions.clearQr(session, key, invalid), false);
    assert.deepEqual(await store().getQr(session), {key, expiresAt: at + 1000, generation: current});
    assert.equal(await owner.sessions.clearQr(session, key, current), true);
    assert.equal(await store().getQr(session), null);
    assert.equal(await owner.sessions.setQr(session, {key, expiresAt: at + 1000}, current), false);
  });

  await t.test('clearing an invalid old credential cannot remove a newer login, even if the cookie text repeats', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const credentials = owner.sessions.credentialStore(session);
    await credentials.save('old-cookie');
    await credentials.save('new-cookie');
    assert.equal(await credentials.clearIfMatches('old-cookie'), false);
    assert.equal(await credentials.load(), 'new-cookie');
    let replaced = false;
    const gated = {
      batch: queries => db.batch(queries),
      prepare(sql) {
        const prepared = db.prepare(sql);
        return {bind(...values) {
          const bound = prepared.bind(...values);
          return {run: async () => {
            if (!replaced && sql.includes('AND credential_cipher = ?')) { replaced = true; await credentials.save('new-cookie'); }
            return bound.run();
          }, first: () => bound.first()};
        }};
      },
    };
    const delayed = createDeviceSessions({db: gated, key, now: () => at}).credentialStore(session);
    assert.equal(await delayed.clearIfMatches('new-cookie'), false);
    assert.equal(await credentials.load(), 'new-cookie');
    assert.equal(await credentials.clearIfMatches('new-cookie'), true);
    assert.equal(await credentials.clearIfMatches('new-cookie'), false);
    assert.equal(await credentials.load(), null);
  });

  await t.test('cancelled, replaced or expired QR cannot complete a late login; completion is single-use', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const credentials = owner.sessions.credentialStore(session);
    await credentials.save('previous-verified-login');
    const cancelled = await stageQr(owner.sessions, session, {key: 'cancelled', expiresAt: at + 1000});
    await owner.sessions.clearQr(session);
    assert.equal(await owner.sessions.completeQr(session, 'cancelled', cookie, cancelled), false);
    assert.equal(await credentials.load(), 'previous-verified-login');
    const replaced = await stageQr(owner.sessions, session, {key: 'replaced', expiresAt: at + 1000});
    const current = await stageQr(owner.sessions, session, {key: 'current', expiresAt: at + 1000});
    assert.equal(await owner.sessions.completeQr(session, 'replaced', cookie, replaced), false);
    assert.equal((await owner.sessions.getQr(session)).key, 'current');
    assert.equal(await owner.sessions.completeQr(session, 'current', cookie, current), true);
    assert.equal(await credentials.load(), cookie);
    assert.equal(await owner.sessions.completeQr(session, 'current', 'late-overwrite', current), false);
    assert.equal(await credentials.load(), cookie);
    const row = await db.prepare('SELECT qr_cipher, qr_key_hash, qr_expires_at FROM music_device_sessions WHERE token_hash = ?').bind(session.hash).first();
    assert.deepEqual(row, {qr_cipher: null, qr_key_hash: null, qr_expires_at: null});
    const expired = await stageQr(owner.sessions, session, {key: 'expired', expiresAt: at + 1000}); at += 1000;
    assert.equal(await owner.sessions.completeQr(session, 'expired', 'late-overwrite', expired), false);
    assert.equal(await credentials.load(), cookie);
    await owner.sessions.revoke(session);
    assert.equal(await owner.sessions.completeQr(session, 'expired', 'late-overwrite', expired), false);
    assert.equal(await credentials.load(), null);
  });

  await t.test('cancellation after QR verification but before completion update wins atomically', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const generation = await stageQr(owner.sessions, session, {key: 'race', expiresAt: at + 1000});
    const gated = {
      batch: queries => db.batch(queries),
      prepare(sql) {
        const prepared = db.prepare(sql);
        return {bind(...values) {
          const bound = prepared.bind(...values);
          return {run: async () => {
            if (sql.includes('SET credential_cipher = ?, qr_cipher = NULL')) await owner.sessions.clearQr(session);
            return bound.run();
          }};
        }};
      },
    };
    const restarted = createDeviceSessions({db: gated, key, now: () => at});
    assert.equal(await restarted.completeQr(session, 'race', cookie, generation), false);
    assert.equal(await owner.sessions.credentialStore(session).load(), null);
  });

  await t.test('loading an expired QR cannot clear a concurrently replaced fresh QR', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    await stageQr(owner.sessions, session, {key: 'old', expiresAt: at + 1000}); at += 1000;
    let replaced = false;
    const gated = {
      batch: queries => db.batch(queries),
      prepare(sql) {
        const prepared = db.prepare(sql);
        return {bind(...values) {
          const bound = prepared.bind(...values);
          return {run: () => bound.run(), first: async () => {
            const old = await bound.first();
            if (!replaced && sql.includes('SELECT credential_cipher, qr_cipher')) {
              replaced = true; await stageQr(owner.sessions, session, {key: 'fresh', expiresAt: at + 1000});
            }
            return old;
          }};
        }};
      },
    };
    assert.equal(await createDeviceSessions({db: gated, key, now: () => at}).getQr(session), null);
    assert.equal((await owner.sessions.getQr(session)).key, 'fresh');
  });

  await t.test('revocation between verification and replay insertion rejects authentication atomically', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    const gated = {
      batch: queries => db.batch(queries),
      prepare(sql) {
        const prepared = db.prepare(sql);
        return {bind(...values) {
          const bound = prepared.bind(...values);
          return {first: () => bound.first(), run: async () => {
            if (sql.includes('INSERT INTO music_device_nonces')) await owner.sessions.revoke(session);
            return bound.run();
          }};
        }};
      },
    };
    const restarted = createDeviceSessions({db: gated, key, now: () => at}), signed = await proof(owner);
    await rejectsAuth(restarted.authenticate(signed.request, signed.body, origin));
  });

  await t.test('indexed cleanup deletes at most 1000 expired rows per table and preserves live data', async () => {
    const owner = await device(), session = await authenticate(owner, await proof(owner));
    await owner.sessions.credentialStore(session).save(cookie);
    const statements = [];
    for (let index = 0; index < 1003; index++) {
      const idHash = index.toString(16).padStart(64, '0');
      statements.push(db.prepare('INSERT INTO music_device_sessions (token_hash, origin, public_jwk, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').bind(idHash, origin, '{}', at - 1, at - 2000));
      statements.push(db.prepare('INSERT INTO music_device_nonces (token_hash, nonce_hash, expires_at) VALUES (?, ?, ?)').bind(idHash, idHash, at - 1));
      statements.push(db.prepare('INSERT INTO music_rate_limits (bucket, count, expires_at) VALUES (?, ?, ?)').bind('expired-' + index, 1, at - 1));
    }
    statements.push(db.prepare('INSERT INTO music_rate_limits (bucket, count, expires_at) VALUES (?, ?, ?)').bind('active', 2, at + 1000));
    for (let start = 0; start < statements.length; start += 100) await db.batch(statements.slice(start, start + 100));
    assert.deepEqual(await owner.sessions.prune(), {nonces: 1000, sessions: 1000, rates: 1000});
    assert.deepEqual(await owner.sessions.prune(), {nonces: 3, sessions: 3, rates: 3});
    assert.deepEqual(await owner.sessions.prune(), {nonces: 0, sessions: 0, rates: 0});
    assert.equal((await db.prepare("SELECT count FROM music_rate_limits WHERE bucket = 'active'").first()).count, 2);
    assert.equal(await owner.sessions.credentialStore(session).load(), cookie);
    const indexes = (await db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all()).results.map(row => row.name);
    assert.ok(indexes.includes('music_device_sessions_expiry')); assert.ok(indexes.includes('music_device_nonces_expiry'));
    assert.ok(indexes.includes('music_rate_limits_expiry'));
  });
});
