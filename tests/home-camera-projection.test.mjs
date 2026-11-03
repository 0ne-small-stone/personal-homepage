import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile}from 'node:fs/promises';
import {createRequire}from 'node:module';
import {dirname,join}from 'node:path';
import {MathUtils,Matrix4,PerspectiveCamera}from 'three';
import {claimCameraProjection,writeJourneyProjection}from '../src/components/home/camera-projection-owner.mjs';

// Use the installed, locked R3F resize routine rather than duplicating it.
const source=await readFile(join(dirname(createRequire(import.meta.url).resolve('@react-three/fiber')),'events-9ce18a08.esm.js'),'utf8');
const start=source.indexOf('function updateCamera(camera, size) {'),end=source.indexOf('\nconst isObject3D',start);
assert(start>=0&&end>start);const updateCamera=new Function('isOrthographicCamera','return ('+source.slice(start,end).trim()+')')(camera=>camera.isOrthographicCamera);

test('a frozen authored projection survives R3F resizing and releases cleanly',()=>{
  const camera=new PerspectiveCamera(40,16/9,.1,50);camera.layers.mask=9;
  camera.position.set(.2,.3,6);camera.projectionMatrix.copy(new Matrix4().makeOrthographic(-4,4,3,-3,.1,50));
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();const projection=camera.projectionMatrix.toArray(),position=camera.position.toArray();
  const release=claimCameraProjection(camera);updateCamera(camera,{width:390,height:844});
  assert.deepEqual(camera.projectionMatrix.toArray(),projection);assert.deepEqual(camera.position.toArray(),position);assert.equal(camera.layers.mask,15);
  release();assert.equal(Object.hasOwn(camera,'manual'),false);assert.equal(camera.layers.mask,9);
  updateCamera(camera,{width:390,height:844});assert.notDeepEqual(camera.projectionMatrix.toArray(),projection);assert.equal(camera.aspect,390/844);
  camera.layers.mask=17;release();assert.equal(camera.layers.mask,17,'cleanup is idempotent');
});
test('pre-existing manual false/true values and external layers are restored',()=>{
  for(const manual of [false,true]){const camera=new PerspectiveCamera();camera.manual=manual;camera.layers.mask=16;const release=claimCameraProjection(camera);assert.equal(camera.manual,true);assert.equal(camera.layers.mask,22);release();assert.equal(Object.hasOwn(camera,'manual'),true);assert.equal(camera.manual,manual);assert.equal(camera.layers.mask,16);}
});
test('normal authored camera updates remain available to CameraRig',()=>{
  const camera=new PerspectiveCamera();const release=claimCameraProjection(camera);const before=camera.projectionMatrix.toArray();
  camera.aspect=390/844;camera.fov=47;camera.updateProjectionMatrix();assert.notDeepEqual(camera.projectionMatrix.toArray(),before);release();
});

test('shared projection matches the prior CameraRig math at each blend and viewport',()=>{
  for(const [width,height]of [[1280,720],[390,844]])for(const zoom of [0,.45,1])for(const blend of [0,.3,1]){
    const camera=new PerspectiveCamera(40,16/9,.1,50),expected=camera.clone(),p=new Matrix4(),o=new Matrix4(),aspect=width/height,unit=.6;
    expected.aspect=aspect;expected.fov=35+18/aspect-4*zoom;expected.updateProjectionMatrix();p.copy(expected.projectionMatrix);
    const x=4*unit*Math.max(1,aspect),y=4*unit/Math.min(1,aspect);o.makeOrthographic(-x,x,y,-y,expected.near,expected.far,expected.coordinateSystem);
    for(let i=0;i<16;i++)expected.projectionMatrix.elements[i]=MathUtils.lerp(p.elements[i],o.elements[i],blend);
    expected.projectionMatrixInverse.copy(expected.projectionMatrix).invert();
    camera.position.set(.1,.2,6);const pose=camera.position.toArray(),orientation=camera.quaternion.toArray();
    writeJourneyProjection(camera,new Matrix4(),new Matrix4(),width,height,zoom,blend,unit);
    for(let i=0;i<16;i++)assert(Math.abs(camera.projectionMatrix.elements[i]-expected.projectionMatrix.elements[i])<1e-12);
    for(let i=0;i<16;i++)assert(Math.abs(camera.projectionMatrixInverse.elements[i]-expected.projectionMatrixInverse.elements[i])<1e-12);
    assert.deepEqual(camera.position.toArray(),pose);assert.deepEqual(camera.quaternion.toArray(),orientation);
  }
});
