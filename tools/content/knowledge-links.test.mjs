import test from 'node:test';
import assert from 'node:assert/strict';
import { knowledgeIndex, resolveBacklinks, resolveRelated } from '../../src/lib/knowledge-links.ts';

const entry = (entryId, kind = 'note', related = [], draft = false) => ({
  id: `knowledge/${kind}/${entryId}`,
  filePath: `src/content/docs/knowledge/${kind}/${entryId}.md`,
  data: { entryId, kind, related, draft, title: entryId },
});

test('three knowledge types resolve in declared order, independently of collection order', () => {
  const source = entry('source', 'article', ['book', 'article', 'note']);
  const targets = [entry('note'), entry('article', 'article'), entry('book', 'resource')];
  assert.deepEqual(resolveRelated(source, knowledgeIndex([...targets, source])).map(e => e.data.kind), ['resource', 'article', 'note']);
});

test('stable entryId follows a changed native route and title', () => {
  const source = entry('source', 'article', ['note']);
  const target = { ...entry('note'), id: 'knowledge/notes/renamed', data: { ...entry('note').data, title: '修改后的标题' } };
  assert.deepEqual(resolveRelated(source, knowledgeIndex([source, target])), [target]);
});

test('duplicate targets and self references do not produce duplicate links', () => {
  const source = entry('source', 'note', ['source', 'book', 'book', 'article', 'book']);
  assert.deepEqual(resolveRelated(source, knowledgeIndex([source, entry('book', 'resource'), entry('article', 'article')])).map(e => e.data.entryId), ['book', 'article']);
});

test('existing draft targets are excluded without exposing their metadata', () => {
  const source = entry('source', 'article', ['draft-note']);
  assert.deepEqual(resolveRelated(source, knowledgeIndex([source, entry('draft-note', 'note', [], true)])), []);
});

test('draft sources do not publish relations or block on unfinished references', () => {
  const source = entry('draft', 'article', ['unfinished-reference'], true);
  assert.deepEqual(resolveRelated(source, knowledgeIndex([source])), []);
});

test('unknown published references report the actual source file and unknown ID', () => {
  const source = entry('source', 'article', ['missing-entry']);
  assert.throws(() => knowledgeIndex([source]), error => error.message.includes(source.filePath) && error.message.includes('missing-entry'));
});

test('all published sources are validated, including entries outside the current page', () => {
  assert.throws(() => knowledgeIndex([entry('valid'), entry('other', 'resource', ['missing-entry'])]), /other\.md.*missing-entry/);
});

test('duplicate stable IDs across published and draft entries are rejected', () => {
  assert.throws(() => knowledgeIndex([entry('duplicate'), entry('duplicate', 'article', [], true)]), /重复知识条目 ID：duplicate/);
});

test('missing stable identity is diagnosed at its source', () => {
  const source = entry('missing'); delete source.data.entryId;
  assert.throws(() => knowledgeIndex([source]), /缺少 entryId 或 kind.*missing\.md/);
});

test('a declared forward link does not invent a reverse relation', () => {
  const source = entry('source', 'article', ['target']);
  const target = entry('target');
  assert.deepEqual(resolveRelated(target, knowledgeIndex([source, target])), []);
});

test('backlinks contain exactly the published sources declaring this target, across all types', () => {
  const target = entry('target');
  const sources = [entry('book', 'resource', ['target']), entry('article', 'article', ['target']), entry('note', 'note', ['target'])];
  assert.deepEqual(resolveBacklinks(target, knowledgeIndex([target, entry('unrelated'), ...sources])), sources);
});

test('adding and removing a forward relation updates both ends without editing the target', () => {
  const target = entry('target');
  for (const related of [[], ['target'], []]) {
    const source = entry('source', 'article', related);
    const index = knowledgeIndex([source, target]);
    assert.equal(resolveRelated(source, index).includes(target), related.length === 1);
    assert.equal(resolveBacklinks(target, index).includes(source), related.length === 1);
    assert.deepEqual(target.data.related, []);
  }
});

test('draft sources and targets never contribute backlinks, even in development collections', () => {
  const target = entry('target');
  const draftTarget = entry('draft-target', 'note', [], true);
  const published = entry('published', 'article', ['target', 'draft-target']);
  const draft = entry('draft-source', 'article', ['target', 'unfinished'], true);
  const index = knowledgeIndex([target, draftTarget, published, draft]);
  assert.deepEqual(resolveBacklinks(target, index), [published]);
  assert.deepEqual(resolveBacklinks(draftTarget, index), []);
});

test('publish and unpublish a source adds and removes its backlink', () => {
  const target = entry('target');
  for (const draft of [true, false, true]) {
    const source = entry('source', 'note', ['target'], draft);
    assert.deepEqual(resolveBacklinks(target, knowledgeIndex([source, target])), draft ? [] : [source]);
  }
});

test('duplicate references and self references never duplicate or create self backlinks', () => {
  const target = entry('target', 'note', ['target']);
  const source = entry('source', 'article', ['target', 'target', 'source']);
  const index = knowledgeIndex([source, target]);
  assert.deepEqual(resolveBacklinks(target, index), [source]);
  assert.deepEqual(resolveBacklinks(source, index), []);
});

test('backlinks follow the source current route and title after renaming', () => {
  const target = entry('target');
  const source = { ...entry('source', 'article', ['target']), id: 'knowledge/blog/renamed', data: { ...entry('source', 'article', ['target']).data, title: '新标题' } };
  assert.deepEqual(resolveBacklinks(target, knowledgeIndex([target, source])), [source]);
});

test('empty and missing targets have no backlinks and no inferred relations', () => {
  const target = entry('target');
  const index = knowledgeIndex([target, entry('other')]);
  assert.deepEqual(resolveBacklinks(target, index), []);
  assert.deepEqual(resolveBacklinks(undefined, index), []);
});

test('every backlink is exactly the inverse of a validated public forward edge', () => {
  const entries = [entry('a', 'resource', ['b', 'c', 'b']), entry('b', 'article', ['a', 'b']), entry('c', 'note', ['b', 'draft']), entry('draft', 'note', ['a'], true)];
  const index = knowledgeIndex(entries);
  for (const target of entries) for (const source of entries) {
    assert.equal(resolveBacklinks(target, index).includes(source), resolveRelated(source, index).includes(target));
  }
});
