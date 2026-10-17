import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sharedPlaylistData} from '../../src/lib/netease-snapshot.ts';

const snapshot = JSON.parse(await readFile(new URL('../../src/data/music/netease-playlist.json', import.meta.url),'utf8'));
const route = (view, extras={}) => ({view,kind:'playlist',id:'',query:'',...extras});

test('unavailable service keeps the actual shared playlist, without personal recommendation data', () => {
  const data = sharedPlaylistData(snapshot,route('home'));
  assert.equal(data.cards[0].id,snapshot.id);
  assert.equal(data.cards[0].count,snapshot.tracks.length);
  assert.equal(data.tracks,undefined);
  assert.equal(data.ownerId,undefined);
});
test('shared playlist detail preserves all tracks and metadata without inventing account authority', () => {
  const original = JSON.stringify(snapshot);
  const data = sharedPlaylistData(snapshot,route('detail',{id:snapshot.id}));
  assert.equal(data.total,snapshot.tracks.length);
  assert.deepEqual(data.tracks.map(track=>track.id),snapshot.tracks.map(track=>track.id));
  assert.ok(data.tracks.every(track=>!track.artistId&&!track.albumId));
  assert.equal(data.ownerId,undefined);
  assert.equal(JSON.stringify(snapshot),original);
});
test('snapshot search handles full-width text and case while returning only existing songs', () => {
  const data = sharedPlaylistData(snapshot,route('search',{kind:'song',query:' ｐＩＮＫ ｆＬＯＹＤ '}));
  assert.ok(data.tracks.length>0);
  assert.ok(data.tracks.every(track=>track.artist==='Pink Floyd'));
  assert.equal(sharedPlaylistData(snapshot,route('search',{kind:'song',query:'no such song here'})).total,0);
});
test('personal modes and unknown detail IDs never substitute the shared snapshot as recommendations', () => {
  for (const view of ['daily','heart','fm','liked','cloud','history','podcasts']) {
    const data = sharedPlaylistData(snapshot,route(view));
    assert.equal(data.tracks,undefined);
    assert.equal(data.cards,undefined);
    assert.ok(data.warnings[0].includes('服务'));
    assert.equal(data.more,false);
  }
  assert.equal(sharedPlaylistData(snapshot,route('detail',{id:'123'})).tracks,undefined);
});
