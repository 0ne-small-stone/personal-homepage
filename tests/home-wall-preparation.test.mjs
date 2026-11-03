import test from 'node:test';
import assert from 'node:assert/strict';
import {BoxGeometry,Group,InstancedBufferAttribute,InstancedMesh,MeshStandardMaterial,PerspectiveCamera,PointLight,DirectionalLight,Scene,ShaderMaterial} from 'three';
import {prepareWallPrograms} from '../src/components/home/prepare-wall-programs.mjs';

function fixture(failAt=0) {
  const scene=new Scene(),wall=new Group(),camera=new PerspectiveCamera();wall.visible=false;scene.add(wall);camera.layers.set(0);
  const directional=new DirectionalLight(),point=new PointLight();directional.layers.set(0);point.layers.set(2);scene.add(directional);wall.add(point);
  const geometry=new BoxGeometry(),material=new MeshStandardMaterial(),portalMaterial=new ShaderMaterial();
  const meshes=[0,1].map(()=>{const mesh=new InstancedMesh(geometry,material,4);mesh.instanceColor=new InstancedBufferAttribute(new Float32Array(12),3);wall.add(mesh);return mesh;});
  let target=null,face=2,mip=3;const calls=[],targetObject={id:'portal'};
  const gl={toneMapping:4,getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,
    setRenderTarget(value,newFace=0,newMip=0){target=value;face=newFace;mip=newMip;},
    compile(object,cam,targetScene){
      const lights=[];targetScene.traverseVisible(o=>{if(o.isLight&&o.layers.test(cam.layers))lights.push(o.type);});
      const children=[];object.traverse(o=>{if(o.isMesh)children.push(o);});
      calls.push({target,tone:gl.toneMapping,layers:cam.layers.mask,visible:wall.visible,lights,children,ortho:cam.isOrthographicCamera});
      assert.equal(meshes[0].parent,wall);assert.equal(meshes[1].parent,wall);
      if(calls.length===failAt)throw Error('compile-failure-'+failAt);
    }};
  const run=()=>prepareWallPrograms(gl,scene,camera,wall,targetObject,portalMaterial);
  const restored=()=>{assert.equal(target,null);assert.equal(face,2);assert.equal(mip,3);assert.equal(gl.toneMapping,4);assert.equal(camera.layers.mask,1);assert.equal(wall.visible,false);assert.equal(directional.layers.mask,1);assert.equal(point.layers.mask,4);assert.equal(meshes[0].parent,wall);};
  const cleanup=()=>{geometry.dispose();material.dispose();portalMaterial.dispose();meshes.forEach(m=>m.dispose());};
  return {run,restored,cleanup,calls,targetObject,meshes,geometry,material,portalMaterial};
}

test('prepares exactly the world, linear wall target and private quad without drawing',()=>{
  const f=fixture();let originalDisposed=false;f.geometry.addEventListener('dispose',()=>{originalDisposed=true;});
  try {
    assert.equal(f.run(),true);f.restored();assert.equal(originalDisposed,false);assert.equal(f.calls.length,3);
    const [main,capture,quad]=f.calls;
    assert.equal(main.target,null);assert.equal(main.tone,4);assert.equal(main.layers,5);assert.deepEqual(main.lights,['PointLight','DirectionalLight']);
    assert.equal(capture.target,f.targetObject);assert.equal(capture.tone,0);assert.equal(capture.layers,4);assert.deepEqual(capture.lights,['PointLight','DirectionalLight']);
    for(const call of [main,capture])for(let i=0;i<2;i++){
      assert.equal(call.children[i].geometry,f.geometry);assert.equal(call.children[i].material,f.material);
      assert.equal(call.children[i].instanceColor,f.meshes[i].instanceColor);assert.equal(call.children[i].instanceMatrix,f.meshes[i].instanceMatrix);
    }
    assert.equal(quad.target,null);assert.equal(quad.tone,4);assert.equal(quad.ortho,true);assert.deepEqual(quad.lights,[]);assert.equal(quad.children[0].material,f.portalMaterial);
  }finally{f.cleanup();}
});
test('every compile failure restores visibility, layers, target, tone and shared ownership',()=>{
  for(const at of [1,2,3]){const f=fixture(at);try{assert.throws(f.run,new RegExp('compile-failure-'+at));f.restored();}finally{f.cleanup();}}
});
test('an absent wall mesh is a finite no-op',()=>{
  let called=false;assert.equal(prepareWallPrograms({compile(){called=true;}},new Scene(),new PerspectiveCamera(),new Group(),{},new ShaderMaterial()),false);assert.equal(called,false);
});
