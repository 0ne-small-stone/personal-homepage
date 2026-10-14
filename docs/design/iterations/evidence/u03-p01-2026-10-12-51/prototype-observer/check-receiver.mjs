import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { Matrix4, Vector3 } from './node_modules/three/build/three.module.js';
import { makeTriangleGeometry } from './geometry.js';
import { BeamField, AIR_EXTINCTION } from './beam-field.js';
import { makeReceiver, intersectReceiver, surfaceIrradiance } from './receiver.js';
const geometry=makeTriangleGeometry(),field=new BeamField(geometry),receiver=makeReceiver(),matrix=new Matrix4().makeScale(.5,.5,.5),checks=[];
function test(name,fn){fn();checks.push(name);}
test('Finite sheet rejects parallel, behind-eye and out-of-bounds rays',()=>{
  assert.equal(intersectReceiver(receiver,receiver.center.clone().add(receiver.normal),receiver.u),null);
  assert.equal(intersectReceiver(receiver,receiver.center.clone().add(receiver.normal),receiver.normal),null);
  assert.equal(intersectReceiver(receiver,receiver.center.clone().addScaledVector(receiver.u,receiver.halfWidth+.1).add(receiver.normal),receiver.normal.clone().negate()),null);
});
// Independent surface grid checks the projected-area cosine and Gaussian normalization.
test('Oblique kernel integrates to packet power on a plane',()=>{
  const radius=.025,direction=receiver.normal.clone().negate().addScaledVector(receiver.u,.8).normalize(),cosine=Math.abs(direction.dot(receiver.normal)),power=1.7;
  const hit={point:receiver.center,direction,cosine,power},step=radius/12,extent=radius*7/cosine;let integral=0;
  for(let x=-extent;x<=extent;x+=step)for(let y=-extent;y<=extent;y+=step)integral+=surfaceIrradiance(hit,receiver.center.clone().addScaledVector(receiver.u,x).addScaledVector(receiver.v,y),radius)*step*step;
  assert.ok(Math.abs(integral-power)<power*.0001,`${integral} vs ${power}`);
});
field.rebuild(matrix,128,false,16,0,receiver);
test('No glass delivers the entire parallel source to the sheet',()=>{assert.equal(field.receiverHits.length,128);assert.ok(Math.abs(field.receiverHits.reduce((s,h)=>s+h.power,0)-16)<1e-10);});
test('Photon paths end at the actual finite receiver plane',()=>{for(const record of field.records){assert.equal(record.receiverHit,true);assert.ok(Math.abs(receiver.normal.dot(record.b.clone().sub(receiver.center)))<1e-9);assert.ok(record.b.x<5);}});
const straightY=field.receiverHits.reduce((s,h)=>s+h.point.y*h.power,0)/16;
field.rebuild(matrix,128,false,16,AIR_EXTINCTION,receiver);
const attenuatedFlux=field.receiverHits.reduce((s,h)=>s+h.power,0);
test('Beer attenuation is measured over each real source-to-sheet distance',()=>{const source=new Vector3(-12,-12*.2532532084998948,0);for(const h of field.receiverHits){const projected=h.point.clone().sub(source).dot(h.direction);assert.ok(Math.abs(h.power-.125*Math.exp(-AIR_EXTINCTION*projected))<1e-10);}});
field.rebuild(matrix,128,true,16,0,receiver);
const glassFlux=field.receiverHits.reduce((s,h)=>s+h.power,0),glassY=field.receiverHits.reduce((s,h)=>s+h.point.y*h.power,0)/glassFlux;
test('Actual prism moves the illuminated centroid below the straight source',()=>{assert.ok(glassY<-.8&&straightY>.9);assert.ok(glassFlux<16&&glassFlux>14);});
const rotation=new Matrix4().makeRotationY(.6).multiply(matrix);field.rebuild(rotation,128,true,16,0,receiver);
const turnedFlux=field.receiverHits.reduce((s,h)=>s+h.power,0),turnedY=field.receiverHits.reduce((s,h)=>s+h.point.y*h.power,0)/turnedFlux;
test('Rotating prism recomputes the receiver centroid without old paths',()=>assert.ok(turnedY>.6&&turnedY-glassY>1.5));
field.rebuild(matrix,128,true,0,AIR_EXTINCTION,receiver);
test('Source zero removes receiving flux and incident field power',()=>{assert.ok(field.receiverHits.every(h=>h.power===0));assert.ok(field.records.every(r=>r.power===0));});
field.rebuild(matrix,128,true,16,0,null);
test('Removing the receiver restores longer paths and clears every hit',()=>{assert.equal(field.receiverHits.length,0);assert.ok(field.records.some(r=>r.terminal&&r.b.x>10));});
const blocker={...receiver,center:new Vector3(-2,-2*.2532532084998948,0)};field.rebuild(matrix,128,true,16,0,blocker);
test('Opaque receiver before prism blocks source before any interface',()=>{assert.equal(field.records.length,128);assert.equal(field.receiverHits.length,128);assert.ok(field.records.every(r=>r.b.x<-1.9));});
field.dispose();geometry.dispose();
const result={passed:checks.length,checks,straightY,glassY,turnedY,glassFlux,turnedFlux,attenuatedFlux,sourceFlux:16,scope:'receiver transport / finite Gaussian surface estimate; full observer glass leg and multiple scattering pending'};
await fs.writeFile('docs/design/iterations/evidence/u03-p01-2026-10-12-51/white-receiver-transport.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
