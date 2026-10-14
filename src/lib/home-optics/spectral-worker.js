import { Matrix4 } from 'three';
import { makeTriangleGeometry } from '../../components/home/prism-geometry';
import { BeamField } from './beam-field.js';
import { ObserverField } from './observer-field.js';
import { makeReceiver, makeBackReceiver } from './receiver.js';

const geometry = makeTriangleGeometry();
const field = new BeamField(geometry);
const space = new ObserverField({ oriented: true });
let generation = 0;

self.onmessage = async ({ data }) => {
  const token = ++generation;
  if (data.type === 'cancel') return;
  const matrix = new Matrix4().fromArray(data.matrix);
  const receivers = [makeReceiver(), makeBackReceiver()];
  const sourceSamplesPerBand = data.sourceSamplesPerBand ?? 64;
  for (const band of data.bands) {
    if (token !== generation) return;
    const begin = performance.now();
    field.rebuild(matrix, sourceSamplesPerBand, data.glass, data.source ? band.power : 0, data.extinction, receivers, band.ior);
    space.update(field.records, receivers);
    const nodes = new Float32Array(space.nodeCount * 8), beams = new Float32Array(field.records.length * 8);
    for (let i = 0; i < space.nodeCount; i++) {
      nodes.set(space.nodes.subarray(i * 4, i * 4 + 4), i * 8);
      nodes.set(space.nodes.subarray(4096 * 4 + i * 4, 4096 * 4 + i * 4 + 4), i * 8 + 4);
    }
    for (let i = 0; i < field.records.length; i++) {
      beams.set(space.beams.subarray(i * 4, i * 4 + 4), i * 8);
      beams.set(space.beams.subarray(2048 * 4 + i * 4, 2048 * 4 + i * 4 + 4), i * 8 + 4);
    }
    const oriented = new Float32Array(space.oriented.subarray(0, space.nodeCount * 16));
    const flux = field.receiverHits.reduce((sum, hit) => sum + hit.power, 0);
    self.postMessage({ epoch: data.epoch, stage: data.stage, index: band.index, nodeCount: space.nodeCount, recordCount: field.records.length,
      nodes, beams, oriented, flux, workerMs: performance.now() - begin, sourceSamples: sourceSamplesPerBand },
    [nodes.buffer, beams.buffer, oriented.buffer]);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (token === generation) self.postMessage({ epoch: data.epoch, stage: data.stage, done: true });
};
