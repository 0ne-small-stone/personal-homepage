import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLyrics, currentLyric, matchesLyricRecording } from '../../src/lib/music-lyrics.ts';
import { parseMusicCatalog } from '../../src/lib/music.ts';

test('LRC fractions, repeated timestamps, translations, blank breaks and offset are preserved', () => {
  const parsed = parseLyrics('[ar:测试]\n[offset:100]\n[00:02.3][00:06.030]一句\n[00:02.3]translation\n[00:04.000]\n[00:99.0]invalid');
  assert.deepEqual(parsed.lines, [{ time: 2.4, text: '一句\ntranslation' }, { time: 4.1, text: '' }, { time: 6.13, text: '一句' }]);
  assert.equal(currentLyric(parsed.lines, 2), -1);assert.equal(currentLyric(parsed.lines, 2.4), 0);
  assert.equal(currentLyric(parsed.lines, 6.2), 2);assert.equal(currentLyric(parsed.lines, 4.2), 1);
});
test('malformed/plain/oversize lyrics never manufacture a timeline', () => {
  assert.equal(parseLyrics('普通歌词\n没有时间戳').lines.length, 0);
  assert.equal(parseLyrics('普通歌词\n没有时间戳').plain, '普通歌词\n没有时间戳');
  assert.deepEqual(parseLyrics('x'.repeat(65537)), { lines: [], plain: '' });
  assert.equal(currentLyric([], 5), -1);assert.equal(currentLyric([{ time: 0, text: 'x' }], NaN), -1);
});
test('catalog roundtrip keeps bounded lyrics and strips unknown private fields', () => {
  const catalog = parseMusicCatalog({ version: 1, tracks: [{ id: 'id', title: 'test', lyrics: '[00:01]x', localPath: 'private' }] });
  assert.equal(catalog.tracks[0].lyrics, '[00:01]x');assert.ok(!JSON.stringify(catalog).includes('private'));
});
test('different live/studio recordings or durations cannot use each others lyric timing', () => {
  const track = { title: 'Echoes', artist: 'Pink Floyd', album: 'BBC', duration: 1618.334 };
  assert.equal(matchesLyricRecording({ trackName: 'Echoes', artistName: 'Pink Floyd', albumName: 'BBC', duration: 1618 }, track), true);
  assert.equal(matchesLyricRecording({ trackName: 'Echoes', artistName: 'Pink Floyd', albumName: 'Meddle', duration: 1411 }, track), false);
  assert.equal(matchesLyricRecording({ trackName: 'Echoes', artistName: 'Pink Floyd', albumName: 'BBC', duration: 1650 }, track), false);
});
