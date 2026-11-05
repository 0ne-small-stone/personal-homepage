import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSelection, dragIntent, exhibitPose, releaseSelection } from '../src/components/showcase/gallery-state.ts';

test('筛选后的展览不能越过首尾，空集合也不会产生负索引', () => {
  assert.equal(clampSelection(-1, 6), 0);
  assert.equal(clampSelection(6, 6), 5);
  assert.equal(clampSelection(3, 2), 1);
  assert.equal(clampSelection(0, 0), 0);
});

test('小幅抖动不锁定手势，纵向和斜向输入留给页面滚动', () => {
  assert.equal(dragIntent(6, 3), 'pending');
  assert.equal(dragIntent(40, 12), 'horizontal');
  assert.equal(dragIntent(15, 40), 'vertical');
  assert.equal(dragIntent(30, 30), 'vertical');
});

test('拖动松手只前进或后退一件；小位移与边缘拖动归位', () => {
  assert.equal(releaseSelection(2, 6, -110, 600), 3);
  assert.equal(releaseSelection(2, 6, 110, 600), 1);
  assert.equal(releaseSelection(2, 6, -20, 600), 2);
  assert.equal(releaseSelection(0, 6, 120, 600), 0);
  assert.equal(releaseSelection(5, 6, -120, 600), 5);
  assert.equal(releaseSelection(0, 2, -55, 280), 1);
});

test('中央作品最靠近，两侧对称退后；减少动画撤旋转且不改变选择位置', () => {
  const center = exhibitPose(0);
  const left = exhibitPose(-1);
  const right = exhibitPose(1);
  assert.equal(center.opacity, 1);
  assert.equal(center.z, 0);
  assert.equal(left.x, -right.x);
  assert.equal(left.z, right.z);
  assert.equal(left.rotate, -right.rotate);
  assert.ok(center.layer > right.layer);
  assert.ok(center.opacity > right.opacity);
  const reduced = exhibitPose(1, true);
  assert.equal(reduced.rotate, 0);
  assert.equal(reduced.x, right.x);
  assert.equal(exhibitPose(5).opacity, 0);
});
