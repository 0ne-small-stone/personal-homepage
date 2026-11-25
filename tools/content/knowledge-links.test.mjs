import test from 'node:test';
import assert from 'node:assert/strict';
import { knowledgeIndex, resolveBacklinks, resolveReadingLinks, resolveRelated } from '../../src/lib/knowledge-links.ts';

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

const chapter = (entryId, series, order, related = [], draft = false) => {
  const document = entry(entryId, 'resource', related, draft);
  return { ...document, data: { ...document.data, series, sidebar: { order } } };
};

test('split chapters follow their declared order, never an adjacent series, book or draft', () => {
  const upper = chapter('physics-9-upper', 'physics', 9);
  const lower = chapter('physics-9-lower', 'physics', 9.1);
  const ten = chapter('physics-10', 'physics', 10);
  const lecture = chapter('probability-0', 'probability', 0);
  const index = knowledgeIndex([ten, lecture, lower, entry('book'), chapter('draft', 'physics', 9.05, [], true), upper]);
  assert.equal(resolveReadingLinks(upper, index).previous, undefined);
  assert.equal(resolveReadingLinks(upper, index).next, lower);
  assert.equal(resolveReadingLinks(lower, index).previous, upper);
  assert.equal(resolveReadingLinks(lower, index).next, ten);
  assert.equal(resolveReadingLinks(ten, index).next, undefined);
  assert.equal(resolveReadingLinks(lecture, index).next, undefined);
});

test('a zero-based series and its reciprocal, incoming-only and supplemental links each have one destination', () => {
  const zero = chapter('zero', 'probability', 0, ['three', 'two', 'one', 'book', 'book', 'zero', 'draft']);
  const one = chapter('one', 'probability', 1, ['zero']);
  const two = chapter('two', 'probability', 2, ['zero']);
  const three = chapter('three', 'probability', 3, ['zero']);
  const book = entry('book', 'resource', ['zero', 'one', 'three', 'two']);
  const note = entry('note', 'note', ['zero']);
  const index = knowledgeIndex([three, book, two, note, chapter('draft', 'probability', 4, ['zero'], true), zero, one]);
  assert.deepEqual(resolveReadingLinks(zero, index), {
    previous: undefined, next: one, related: [book], otherChapters: [two, three], backlinks: [note],
  });
  assert.deepEqual(resolveReadingLinks(book, index), {
    previous: undefined, next: undefined, related: [zero, one, two, three], otherChapters: [], backlinks: [],
  });
});

test('legacy notes keep distinct outgoing and incoming links without inferred chapter navigation', () => {
  const source = entry('source', 'note', ['article']);
  const article = entry('article', 'article', ['source']);
  const book = entry('book', 'resource', ['source']);
  const index = knowledgeIndex([book, source, article]);
  assert.deepEqual(resolveReadingLinks(source, index), {
    previous: undefined, next: undefined, related: [article], otherChapters: [], backlinks: [book],
  });
  assert.deepEqual(resolveReadingLinks(undefined, index), {
    previous: undefined, next: undefined, related: [], otherChapters: [], backlinks: [],
  });
});

test('published series members require a unique numeric order within their own series', () => {
  assert.throws(() => knowledgeIndex([chapter('chapter-a', 'physics', undefined)]), /physics.*chapter-a/);
  assert.throws(() => knowledgeIndex([chapter('a', 'physics', 9), chapter('b', 'physics', 9)]), /physics.*9.*b/);
  assert.doesNotThrow(() => knowledgeIndex([chapter('a', 'physics', 0), chapter('b', 'probability', 0), chapter('draft', 'physics', 0, [], true)]));
});
