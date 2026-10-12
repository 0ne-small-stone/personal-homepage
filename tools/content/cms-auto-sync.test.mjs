import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncCandidates, validateChange } from './cms-auto-sync.mjs';

const sha = 'a'.repeat(40), newer = 'b'.repeat(40), derived = 'c'.repeat(40);
const block = (text) => `before\n          # BEGIN GENERATED KNOWLEDGE OPTIONS\n${text}\n          # END GENERATED KNOWLEDGE OPTIONS\nafter\n`;
function fixture(overrides = {}) {
  const calls = [];
  const args = {
    repo: '0ne-small-stone/personal-homepage', ref: 'refs/heads/codex/content-edit', event: 'push', sha,
    before: block('old'), after: block('new'), sleep: async () => {},
    api: async (path, method = 'GET', body) => {
      calls.push({ path, method, body });
      if (path.includes('/git/ref/')) return { object: { sha } };
      if (method === 'GET') return { tree: { sha: 'parent-tree' } };
      if (path.endsWith('/git/commits')) return { sha: derived };
      return { sha: 'blob-or-tree' };
    }, ...overrides,
  };
  return { args, calls };
}
test('no change makes no API writes or dispatch', async () => {
  const { args, calls } = fixture({ after: block('old') });
  assert.equal((await syncCandidates(args)).status, 'unchanged'); assert.equal(calls.length, 0);
});
test('only generated region may change', () => {
  assert.throws(() => validateChange(block('old'), block('new') + 'other'), /outside/);
  assert.throws(() => validateChange('none', block('new')), /unique/);
});
test('main, PR, other branches and repositories are refused', async () => {
  for (const override of [{ ref: 'refs/heads/main' }, { event: 'pull_request' }, { ref: 'refs/heads/codex/home-edit' }, { repo: 'other/repo' }]) {
    const { args, calls } = fixture(override);
    await assert.rejects(syncCandidates(args), /scope/); assert.equal(calls.length, 0);
  }
});
test('newer Save before writing is retained', async () => {
  const { args } = fixture({ api: async () => ({ object: { sha: newer } }) });
  assert.equal((await syncCandidates(args)).status, 'superseded');
});
test('derived commit touches only config and validates the resulting head', async () => {
  const { args, calls } = fixture();
  assert.equal((await syncCandidates(args)).commit, derived);
  assert.deepEqual(calls.find((c) => c.path.endsWith('/git/trees')).body.tree.map((x) => x.path), ['.pages.yml']);
  assert.deepEqual(calls.find((c) => c.path.endsWith('/git/commits') && c.method === 'POST').body.parents, [sha]);
  assert.deepEqual(calls.find((c) => c.method === 'PATCH').body, { sha: derived, force: false });
  assert.deepEqual(calls.at(-1).body, { ref: 'codex/content-edit' });
});
test('non-force ref conflict from a concurrent Save exits without dispatch', async () => {
  const { args, calls } = fixture(); const original = args.api; let raced = false;
  args.api = async (...params) => {
    if (params[1] === 'PATCH') { raced = true; throw Object.assign(new Error('conflict'), { status: 422 }); }
    if (raced && params[0].includes('/git/ref/')) return { object: { sha: newer } };
    return original(...params);
  };
  assert.equal((await syncCandidates(args)).status, 'superseded');
  assert.equal(calls.some((c) => c.path.endsWith('/dispatches')), false);
});
test('permission failures fail explicitly without updating the branch', async () => {
  const { args } = fixture({ api: async () => { throw Object.assign(new Error('403'), { status: 403 }); } });
  await assert.rejects(syncCandidates(args), /403/);
});
test('dispatch retries transient failure; unchanged rerun cannot recurse', async () => {
  const { args } = fixture(); const original = args.api; let attempts = 0;
  args.api = async (...params) => { if (params[0].endsWith('/dispatches') && ++attempts < 3) throw new Error('unavailable'); return original(...params); };
  assert.equal((await syncCandidates(args)).status, 'updated'); assert.equal(attempts, 3);
  assert.equal((await syncCandidates({ ...args, before: args.after, event: 'workflow_dispatch' })).status, 'unchanged');
});
test('permanent dispatch failure reports the committed SHA and recovery action', async () => {
  const { args } = fixture(); const original = args.api;
  args.api = async (...params) => { if (params[0].endsWith('/dispatches')) throw new Error('403'); return original(...params); };
  await assert.rejects(syncCandidates(args), new RegExp(`${derived}; dispatch failed`));
});
