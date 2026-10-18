import test from 'node:test';
import assert from 'node:assert/strict';
import { profileSchema, profiles } from '../../src/data/profile.ts';
import { websitesSchema, websites } from '../../src/data/websites.ts';

test('editable profiles reject broken contact links, empty paragraphs and duplicate anchors', () => {
  for (const profile of Object.values(profiles)) assert.equal(profileSchema.safeParse(profile).success, true);
  const profile = profiles.en;
  for (const patch of [
    { email: 'invalid' }, { github: 'javascript:alert(1)' }, { github: 'https://user:secret@example.com/' },
    { introduction: [' '] }, { experiences: [profile.experiences[0], profile.experiences[0]] },
    { traces: [{ name: 'x', label: 'x', path: '../private' }] },
  ]) assert.equal(profileSchema.safeParse({ ...profile, ...patch }).success, false);
});

test('CMS website updates reject unknown icons/categories, malformed URLs and duplicate identities', () => {
  const site = { id: 'example', name: 'Example', url: 'https://example.com/deep/path?lang=zh-CN', description: 'Description', category: 'learning', icon: 'terminal' };
  assert.equal(websitesSchema.safeParse([site]).success, true);
  for (const patch of [
    { icon: 'missing-icon' }, { category: 'unknown' }, { url: 'not a URL' },
    { url: 'javascript:alert(1)' }, { url: 'https://user:secret@example.com/' },
    { id: 'invalid id' }, { name: '' }, { tags: 'tag' },
  ]) assert.equal(websitesSchema.safeParse([{ ...site, ...patch }]).success, false);
  assert.equal(websitesSchema.safeParse([site, { ...site, id: 'other' }]).success, false);
  assert.equal(websitesSchema.safeParse([site, { ...site, url: 'https://other.example.com/' }]).success, false);
  assert.equal(websitesSchema.safeParse([]).success, true);
  assert.equal(websitesSchema.safeParse(websites).success, true);
});
