import assert from 'node:assert/strict';
import test from 'node:test';
import { articleDateSchema } from '../../src/lib/article-date.ts';

test('native blog YAML Date remains a Date', () => {
  const value = new Date('2026-10-08T00:00:00.000Z');
  assert.equal(articleDateSchema.parse(value)?.toISOString(), value.toISOString());
});

for (const value of ['2026-10-08', '2024-02-29']) {
  test(`Pages CMS date ${value} becomes a native blog Date`, () => {
    const result = articleDateSchema.parse(value);
    assert(result instanceof Date);
    assert.equal(result.toISOString(), `${value}T00:00:00.000Z`);
  });
}

test('native non-blog and virtual pages can omit date', () => {
  assert.equal(articleDateSchema.parse(undefined), undefined);
});

for (const value of [
  '2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-10-00',
  '2026-10-08T00:00:00Z', '2026-1-8', '', null, 0, new Date('invalid'),
]) {
  test(`invalid article date ${String(value)} is rejected`, () => {
    assert.equal(articleDateSchema.safeParse(value).success, false);
  });
}
