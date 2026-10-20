import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCassetteFoley} from '../../src/lib/cassette-foley.ts';

const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture(t, {failStart = false} = {}) {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const instances = [];
  let resolveResume, rejectResume;
  const resume = new Promise((resolve, reject) => { resolveResume = resolve; rejectResume = reject; });
  class Param {
    value = 0;
    setValueAtTime(value) { this.value = value; }
    linearRampToValueAtTime() {}
  }
  class Node {
    disconnects = 0;
    connect(target) { return target; }
    disconnect() { this.disconnects++; }
  }
  class Source extends Node {
    starts = []; stops = []; loop = false; onended = null;
    start(at) { if (failStart) throw Error('unsupported source'); this.starts.push(at); }
    stop(at = 10) { this.stops.push(at); }
    finish() { this.onended?.(); }
  }
  class Context {
    state = 'suspended'; currentTime = 10; sampleRate = 8000;
    destination = new Node(); nodes = []; sources = []; closes = 0;
    constructor() { instances.push(this); }
    resume() { return resume.then(() => { if (this.state !== 'closed') this.state = 'running'; }); }
    close() { this.closes++; this.state = 'closed'; return Promise.resolve(); }
    add(node) { this.nodes.push(node); return node; }
    createGain() { return this.add(Object.assign(new Node(), {gain: new Param()})); }
    createBiquadFilter() { return this.add(Object.assign(new Node(), {frequency: new Param(), Q: new Param()})); }
    createBufferSource() { const source = this.add(new Source()); this.sources.push(source); return source; }
    createBuffer(_channels, length) { const samples = new Float32Array(length); return {getChannelData: () => samples}; }
  }
  const media = Object.assign(new EventTarget(), {muted: false, volume: .75});
  const document = {hidden: false, querySelector: () => media};
  Object.defineProperty(globalThis, 'window', {configurable: true, writable: true, value: {AudioContext: Context}});
  Object.defineProperty(globalThis, 'document', {configurable: true, writable: true, value: document});
  const foley = createCassetteFoley();
  t.after(() => {
    foley.dispose();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete globalThis.window;
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else delete globalThis.document;
  });
  return {foley, instances, media, document, resolveResume, rejectResume};
}

test('factory and play are lazy before an explicit gesture unlock', t => {
  const {foley, instances} = fixture(t);
  foley.play('insert', 1850)();
  assert.equal(instances.length, 0);
  foley.unlock();
  assert.equal(instances.length, 1);
});

test('cancel before asynchronous resume prevents every source from starting', async t => {
  const {foley, instances, resolveResume} = fixture(t);
  foley.unlock(); const stop = foley.play('insert', 1850);
  stop(); stop(); resolveResume(); await flush();
  assert.equal(instances[0].nodes.length, 0);
});

test('dispose during resume closes the context and prevents future sound', async t => {
  const {foley, instances, resolveResume} = fixture(t);
  foley.unlock(); foley.play('eject', 1100); foley.dispose();
  resolveResume(); await flush(); foley.unlock(); foley.play('insert', 1850);
  assert.equal(instances.length, 1);
  assert.equal(instances[0].closes, 1);
  assert.equal(instances[0].nodes.length, 0);
});

test('hidden tabs are silent both before play and after delayed resume', async t => {
  const {foley, instances, document, resolveResume} = fixture(t);
  foley.unlock(); document.hidden = true; foley.play('insert', 1850);
  document.hidden = false; foley.play('eject', 1100); document.hidden = true;
  resolveResume(); await flush();
  assert.equal(instances[0].nodes.length, 0);
});

test('master mute/volume are observed without changing the music element', async t => {
  const {foley, instances, media, resolveResume} = fixture(t);
  foley.unlock(); media.muted = true; foley.play('insert', 1850);
  resolveResume(); await flush(); assert.equal(instances[0].nodes.length, 0);
  media.muted = false; const stop = foley.play('insert', 1850); await flush();
  const master = instances[0].nodes[0], initialGain = master.gain.value;
  media.volume = .25; media.dispatchEvent(new Event('volumechange'));
  assert.ok(master.gain.value > 0 && master.gain.value < initialGain);
  media.muted = true; media.dispatchEvent(new Event('volumechange'));
  assert.equal(master.gain.value, 0);
  assert.equal(media.volume, .25); assert.equal(media.muted, true);
  stop(); const gainAfterStop = master.gain.value;
  media.muted = false; media.volume = 1; media.dispatchEvent(new Event('volumechange'));
  assert.equal(master.gain.value, gainAfterStop, 'volume listener is detached after stop');
});

test('all sources receive finite stops and natural completion disconnects the graph', async t => {
  const {foley, instances, resolveResume} = fixture(t);
  foley.unlock(); const stop = foley.play('insert', 1850); resolveResume(); await flush();
  const context = instances[0]; assert.ok(context.sources.length > 0);
  for (const source of context.sources) {
    assert.equal(source.loop, false);
    assert.ok(source.starts.every(Number.isFinite));
    assert.ok(source.stops.some(at => Number.isFinite(at) && at > source.starts[0] && at < context.currentTime + 2));
  }
  for (const source of context.sources) source.finish();
  assert.ok(context.nodes.every(node => node.disconnects === 1));
  stop(); assert.ok(context.nodes.every(node => node.disconnects === 1), 'cleanup is idempotent');
});

test('resume rejection and partial graph failure stay silent and clean up', async t => {
  await t.test('resume rejection creates no nodes', async t => {
    const {foley, instances, rejectResume} = fixture(t);
    foley.unlock(); foley.play('insert', 1850); rejectResume(Error('autoplay denied')); await flush();
    assert.equal(instances[0].nodes.length, 0);
  });
  await t.test('failed source start disconnects the partial graph', async t => {
    const {foley, instances, resolveResume} = fixture(t, {failStart: true});
    foley.unlock(); foley.play('eject', 1100); resolveResume(); await flush();
    assert.ok(instances[0].nodes.length > 0);
    assert.ok(instances[0].nodes.every(node => node.disconnects === 1));
  });
});
