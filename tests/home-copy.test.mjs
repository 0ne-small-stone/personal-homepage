import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workCopyState } from '../src/components/home/copy-state.ts';

test('both card handoffs have only one readable copy group, including stopped midpoints', () => {
  for (let step = 0; step <= 4000; step++) {
    const index = step / 1000;
    const states = [0, 1, 2].map(item => workCopyState(index, item));
    assert.ok(states.filter(state => state.visible).length <= 1, `overlapping titles at ${index}`);
    assert.ok(states.filter(state => state.interactive).length <= 1);
    states.forEach((state, item) => {
      if (state.visible) assert.equal(Math.round(index), item + 1, 'copy belongs to a different dominant card');
      if (state.interactive) assert.equal(state.opacity, 1, 'a fading CTA remained clickable');
    });
  }
  for (const index of [1.5, 2.5]) assert.ok([0, 1, 2].every(item => !workCopyState(index, item).visible));
});

test('copy remains continuous and reversible under slow scroll, reversal and arbitrary jumps', () => {
  const path = [1, 1.2, 1.37, 1.5, 1.63, 2, 2.3, 2.5, 2.7, 3, 2.1, 1.3, 2.8];
  const forward = path.map(index => [0, 1, 2].map(item => workCopyState(index, item)));
  const reverse = [...path].reverse().map(index => [0, 1, 2].map(item => workCopyState(index, item))).reverse();
  assert.deepEqual(forward, reverse);
  for (let step = 1; step <= 4000; step++) {
    for (const item of [0, 1, 2]) {
      const previous = workCopyState((step - 1) / 1000, item), next = workCopyState(step / 1000, item);
      assert.ok(Math.abs(next.opacity - previous.opacity) < .007);
      if (next.visible && previous.visible) assert.ok(Math.abs(next.y - previous.y) < .055);
    }
  }
});

test('centers restore full copy and matching CTA; prepare clears all copy without a timed tail', () => {
  for (const item of [0, 1, 2]) {
    assert.deepEqual(workCopyState(item + 1, item), { opacity: 1, visible: true, interactive: true, y: -0 });
    for (const index of [1, 1.37, 1.5, 2, 2.63, 3]) {
      const hidden = workCopyState(index, item, true);
      assert.equal(hidden.opacity, 0); assert.equal(hidden.visible, false); assert.equal(hidden.interactive, false);
      assert.deepEqual(workCopyState(index, item), workCopyState(index, item), 'state depends on elapsed time');
    }
  }
});
