import test from 'node:test';
import assert from 'node:assert/strict';
import { MeshBasicMaterial, ShaderLib, SRGBColorSpace, Texture } from 'three';
import {
  createReliefInteraction,
  installReliefInteraction,
  reliefSize,
  stepReliefInteraction,
} from '../../src/components/home/relief-interaction.mjs';
import { createReliefMaterial } from '../../src/components/home/relief-material.ts';

const frame = (state, seconds, fps) => {
  for (let count = 0; count < Math.round(seconds * fps); count++)
    stepReliefInteraction(state, 1 / fps, true);
};

function surface() {
  const hit = new EventTarget();
  hit.getBoundingClientRect = () => ({ left: 100, top: 50, width: 400, height: 200 });
  const entry = new EventTarget();
  const section = { dataset: { workActive: 'true' } };
  const host = new EventTarget();
  const doc = new EventTarget();
  const state = createReliefInteraction();
  let permitted = true;
  let wakeCount = 0;
  const cleanup = installReliefInteraction({
    state, hit, entry, section, host, doc,
    allowed: () => permitted,
    wake: () => wakeCount++,
  });
  return {
    state, hit, entry, section, host, doc, cleanup,
    set permitted(value) { permitted = value; },
    get wakeCount() { return wakeCount; },
  };
}

function pointer(target, type, props = {}) {
  const event = new Event(type);
  Object.assign(event, { pointerType: 'mouse', clientX: 300, clientY: 150 }, props);
  target.dispatchEvent(event);
}

test('damping is frame-rate independent and reaches rest inside the existing 1.2s wake window', () => {
  const slow = createReliefInteraction();
  const fast = createReliefInteraction();
  Object.assign(slow, { targetX: 1, targetY: -0.8, targetAmount: 1 });
  Object.assign(fast, slow);
  frame(slow, 0.2, 60);
  frame(fast, 0.2, 120);
  for (const key of ['x', 'y', 'amount'])
    assert.ok(Math.abs(slow[key] - fast[key]) < 1e-12, key);
  assert.ok(slow.x > 0 && slow.x < 1);
  assert.ok(slow.y < 0 && slow.y > -0.8);
  frame(slow, 1, 60);
  assert.deepEqual([slow.x, slow.y, slow.amount], [1, -0.8, 1]);
  Object.assign(slow, { targetX: 0, targetY: 0, targetAmount: 0 });
  frame(slow, 1.2, 60);
  assert.deepEqual([slow.x, slow.y, slow.amount], [0, 0, 0]);
});

test('disabled input freezes rendering state and a large resumed delta cannot jump to the target', () => {
  const state = createReliefInteraction();
  Object.assign(state, { targetX: 1, targetY: -1, targetAmount: 1 });
  const before = { ...state };
  stepReliefInteraction(state, 100, false);
  assert.deepEqual(state, before);
  stepReliefInteraction(state, -1, true);
  assert.deepEqual(state, before);
  stepReliefInteraction(state, 100, true);
  assert.ok(state.x > 0 && state.x < 0.6);
  assert.ok(state.y < 0 && state.y > -0.6);
  assert.ok(state.amount > 0 && state.amount < 0.6);
});

test('reliefSize keeps all three original landscape aspects inside the 8 by 4.5 carrier', () => {
  for (const aspect of [2020 / 778, 2035 / 773, 2022 / 778, 1, 0.5]) {
    const size = reliefSize(aspect);
    assert.ok(size.width > 0 && size.width <= 8);
    assert.ok(size.height > 0 && size.height <= 4.5);
    assert.ok(Math.abs(size.width / size.height - aspect) < 1e-12);
  }
});

test('pointer mapping uses local artwork coordinates and clamps outside samples', () => {
  const fixture = surface();
  try {
    pointer(fixture.hit, 'pointerenter', { clientX: 100, clientY: 50 });
    assert.deepEqual([fixture.state.targetX, fixture.state.targetY, fixture.state.targetAmount], [-1, 1, 1]);
    pointer(fixture.hit, 'pointermove', { clientX: 500, clientY: 250 });
    assert.deepEqual([fixture.state.targetX, fixture.state.targetY], [1, -1]);
    pointer(fixture.hit, 'pointermove', { clientX: 900, clientY: -50 });
    assert.deepEqual([fixture.state.targetX, fixture.state.targetY], [1, 1]);
    assert.equal(fixture.wakeCount, 3);
    assert.deepEqual([fixture.state.x, fixture.state.y, fixture.state.amount], [0, 0, 0]);
  } finally { fixture.cleanup(); }
});

test('paused/loading gate, inactive chapter, touch and collapsed artwork do not activate input', () => {
  const fixture = surface();
  try {
    fixture.permitted = false;
    pointer(fixture.hit, 'pointermove');
    fixture.permitted = true;
    fixture.section.dataset.workActive = 'false';
    pointer(fixture.hit, 'pointerenter');
    fixture.section.dataset.workActive = 'true';
    pointer(fixture.hit, 'pointermove', { pointerType: 'touch' });
    fixture.hit.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 100 });
    pointer(fixture.hit, 'pointermove');
    assert.equal(fixture.state.targetAmount, 0);
    assert.equal(fixture.wakeCount, 0);
  } finally { fixture.cleanup(); }
});

test('keyboard focus activates without pointer input and lifecycle events release targets', () => {
  const fixture = surface();
  try {
    fixture.permitted = false;
    fixture.entry.dispatchEvent(new Event('focus'));
    assert.equal(fixture.wakeCount, 0);
    fixture.permitted = true;
    fixture.entry.dispatchEvent(new Event('focus'));
    assert.equal(fixture.state.targetAmount, 0.65);
    const resets = [
      [fixture.entry, 'blur'], [fixture.host, 'blur'],
      [fixture.doc, 'visibilitychange'], [fixture.doc, 'lssh:home-controls-state'],
      [fixture.hit, 'pointerleave'], [fixture.hit, 'pointercancel'],
    ];
    for (const [target, type] of resets) {
      Object.assign(fixture.state, { targetX: 1, targetY: 1, targetAmount: 1 });
      const count = fixture.wakeCount;
      target.dispatchEvent(new Event(type));
      assert.deepEqual([fixture.state.targetX, fixture.state.targetY, fixture.state.targetAmount], [0, 0, 0], type);
      assert.equal(fixture.wakeCount, count + 1, type);
    }
  } finally { fixture.cleanup(); }
});

test('cleanup aborts every registered listener and leaves shared rendering values untouched', () => {
  const fixture = surface();
  Object.assign(fixture.state, { x: 0.3, y: -0.2, amount: 0.5, targetX: 1, targetY: 1, targetAmount: 1 });
  fixture.cleanup();
  const before = { ...fixture.state };
  pointer(fixture.hit, 'pointermove');
  pointer(fixture.hit, 'pointerenter');
  for (const [target, type] of [
    [fixture.hit, 'pointerleave'], [fixture.hit, 'pointercancel'],
    [fixture.entry, 'focus'], [fixture.entry, 'blur'], [fixture.host, 'blur'],
    [fixture.doc, 'visibilitychange'], [fixture.doc, 'lssh:home-controls-state'],
  ]) target.dispatchEvent(new Event(type));
  assert.deepEqual(fixture.state, before);
  assert.deepEqual([before.targetX, before.targetY, before.targetAmount], [0, 0, 0]);
  assert.equal(fixture.wakeCount, 0);
  fixture.cleanup();
});

test('material retains the discoverable shared map and disposes only its own resources', () => {
  const texture = new Texture({ width: 2020, height: 778 });
  let textureDisposals = 0;
  let materialDisposals = 0;
  texture.addEventListener('dispose', () => textureDisposals++);
  const material = createReliefMaterial(texture);
  material.addEventListener('dispose', () => materialDisposals++);
  assert.ok(material instanceof MeshBasicMaterial);
  assert.equal(material.map, texture);
  assert.equal(texture.colorSpace, SRGBColorSpace);
  assert.deepEqual(material.userData.reliefUniforms.imageSize.value.toArray(), [2020, 778]);
  assert.equal(material.transparent, true);
  assert.equal(material.depthTest, false);
  assert.equal(material.depthWrite, false);
  assert.equal(material.toneMapped, false);
  material.dispose();
  assert.equal(materialDisposals, 1);
  assert.equal(textureDisposals, 0);
  texture.dispose();
});

test('factory supports undecoded images, keeps per-card uniforms independent and preserves the standard shader output chain', () => {
  const texture = new Texture();
  const first = createReliefMaterial(texture);
  const second = createReliefMaterial(texture);
  try {
    assert.deepEqual(first.userData.reliefUniforms.imageSize.value.toArray(), [1600, 615]);
    assert.notEqual(first.userData.reliefUniforms, second.userData.reliefUniforms);
    assert.equal(first.customProgramCacheKey(), second.customProgramCacheKey());
    const original = ShaderLib.basic.fragmentShader;
    const shader = { vertexShader: ShaderLib.basic.vertexShader, fragmentShader: original, uniforms: {} };
    first.onBeforeCompile(shader);
    const uniforms = first.userData.reliefUniforms;
    assert.equal(shader.uniforms.reliefLight, uniforms.light);
    assert.equal(shader.uniforms.reliefAmount, uniforms.amount);
    assert.equal(shader.uniforms.reliefImageSize, uniforms.imageSize);
    uniforms.light.value.set(0.4, 0.2);
    uniforms.amount.value = 1;
    assert.deepEqual(shader.uniforms.reliefLight.value.toArray(), [0.4, 0.2]);
    assert.equal(shader.uniforms.reliefAmount.value, 1);
    assert.equal(second.userData.reliefUniforms.amount.value, 0);
    assert.equal(shader.vertexShader, ShaderLib.basic.vertexShader);
    assert.equal(shader.fragmentShader.includes('#include <map_fragment>'), false);
    const outputStart = '#include <color_fragment>';
    assert.equal(shader.fragmentShader.slice(shader.fragmentShader.indexOf(outputStart)),
      original.slice(original.indexOf(outputStart)));
  } finally {
    first.dispose(); second.dispose(); texture.dispose();
  }
});
