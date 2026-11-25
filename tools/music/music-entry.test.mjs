import assert from 'node:assert/strict';
import test from 'node:test';
import {listeningModeLoginPrompt, musicEntryMode} from '../../src/lib/music-entry.ts';

test('anonymous public music opens online, including a static build served on localhost', () => {
  for (const origin of ['https://littlestonestillhere.com', 'http://127.0.0.1:4499']) {
    const entry = new URL('/music/', origin);
    assert.equal(musicEntryMode(entry, undefined, false), 'netease');
    assert.equal(musicEntryMode(entry, 'cloud', false), 'cloud');
    assert.equal(musicEntryMode(entry, undefined, true), 'cloud');
  }
});

test('explicit modes, legacy local views and the download bookmark override the current source', () => {
  const read = (suffix, source) => musicEntryMode(new URL('https://example.test/music/'+suffix), source, false);
  for (const suffix of ['?mode=cloud', '?view=songs', '?view=albums', '?view=discover', '#radio-download']) {
    assert.equal(read(suffix, 'netease'), 'cloud');
  }
  assert.equal(read('?mode=netease&view=discover', 'cloud'), 'netease');
  assert.equal(read('?mode=netease&view=detail&kind=playlist&id=18476425375', 'cloud'), 'netease');
});

test('anonymous listening modes ask visitors to sign in and only verified expiry asks for a new scan', () => {
  assert.match(listeningModeLoginPrompt('daily', false), /登录网易云后.*每日推荐/);
  assert.match(listeningModeLoginPrompt('heart', false), /心动模式/);
  assert.match(listeningModeLoginPrompt('fm', false, '保存的登录已失效，请重新扫码。'), /已失效/);
  assert.doesNotMatch(listeningModeLoginPrompt('daily', false, '缓存不可用'), /过期|失效/);
  assert.equal(listeningModeLoginPrompt('daily', true), '');
  assert.equal(listeningModeLoginPrompt('detail', false), '');
});
