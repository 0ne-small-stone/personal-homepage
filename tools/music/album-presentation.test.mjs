import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import {fileURLToPath} from 'node:url';
const compiled = await build({entryPoints:[fileURLToPath(new URL('../../src/lib/album-presentation.ts',import.meta.url))],bundle:true,write:false,format:'esm',platform:'node'});
const { albumIdentity, jacketPacking, jacketClearance, jacketChoreography } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const song = {id:'one',album:'The Dark Side of the Moon',albumArtist:'Pink Floyd',artist:'Pink Floyd'};

test('same album remains stable across songs, casing, whitespace and cover changes', () => {
  assert.equal(albumIdentity(song), albumIdentity({...song,id:'two',album:'  The   Dark Side of the Moon  ',albumArtist:'PINK FLOYD',coverUrl:'new-cover'}));
  assert.equal(albumIdentity({...song,artist:'Guest singer'}),albumIdentity(song));
});
test('different artists/albums and unidentified albums never share a transition identity', () => {
  assert.notEqual(albumIdentity(song),albumIdentity({...song,album:'Wish You Were Here'}));
  assert.notEqual(albumIdentity(song),albumIdentity({...song,albumArtist:'Other band'}));
  assert.notEqual(albumIdentity({...song,album:'未标注专辑'}),albumIdentity({...song,id:'two',album:'未标注专辑'}));
});
test('packed record fits inside the square sleeve with a visible paper margin', () => {
  const w = 725, h = 440, sleeve = {left:0,top:.04*h,size:.56*w};
  const d = .62*w*380/450;
  const packed = {x:.38*w+d/2+jacketPacking.x/100*d,y:.05*h+.62*w*10/450+d/2+jacketPacking.y/100*d,r:d*jacketPacking.scale/2};
  assert.ok(packed.x-packed.r>sleeve.left);
  assert.ok(packed.x+packed.r<sleeve.left+sleeve.size);
  assert.ok(packed.y-packed.r>sleeve.top);
  assert.ok(packed.y+packed.r<sleeve.top+sleeve.size);
  assert.equal(jacketPacking.scale,1, 'a real disc must not shrink to fit the jacket');
});

test('the old jacket rests after packing and the new jacket rests before ejection', () => {
  const {stow,leave,arrive,eject,settle,total} = jacketChoreography;
  assert.ok(leave.start - stow.start - stow.duration >= 200);
  assert.ok(arrive.start >= leave.start + leave.duration);
  assert.ok(eject.start - arrive.start - arrive.duration >= 250);
  assert.equal(total, settle.start + settle.duration);
});

test('the entire circle clears the tilted paper silhouette before changing depth', () => {
  for (const w of [725,160,136,110]) {
    const d=.62*w*380/450;
    const discLeft=.38*w+jacketClearance.x/100*d;
    const a=5*Math.PI/180;
    const paperRight=.56*w/2*(1+Math.cos(a)+Math.sin(a));
    assert.ok(discLeft>paperRight+.02*w, 'clearance includes the paper edge');
  }
});

test('both depth switches occur during the non-overlapping stationary rests', () => {
  const {clear,behind,stow,eject,front,settle}=jacketChoreography;
  assert.ok(behind.start>clear.start+clear.duration);
  assert.ok(behind.start+behind.duration<stow.start);
  assert.ok(front.start>eject.start+eject.duration);
  assert.ok(front.start+front.duration<settle.start);
  assert.ok(settle.start-eject.start-eject.duration>=500, 'full extraction pauses before foreground return');
  assert.ok(settle.duration>=900, 'foreground return remains a slow, separate gesture');
});
