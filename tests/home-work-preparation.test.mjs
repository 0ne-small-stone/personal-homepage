import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,PlaneGeometry,MeshBasicMaterial,Texture,Scene,PerspectiveCamera,DirectionalLight,PointLight} from 'three';
import {prepareWorkPrograms}from '../src/components/home/prepare-work-programs.mjs';

test('prepares the two actual card paths and only the three unique real maps',()=>{
  for(const fail of [0,1,2,3,4,5]){
    const scene=new Scene(),cards=new Group(),wall=new Group(),camera=new PerspectiveCamera();camera.layers.enable(1);camera.layers.enable(2);scene.add(cards,wall);
    scene.add(new DirectionalLight());const point=new PointLight();point.layers.set(2);wall.add(point);wall.visible=true;
    const geometry=new PlaneGeometry(),textures=[new Texture(),new Texture(),new Texture()],materials=[];
    for(const texture of textures){const carrier=new MeshBasicMaterial({toneMapped:false}),image=new MeshBasicMaterial({map:texture,toneMapped:false});materials.push(carrier,image);cards.add(new Mesh(geometry,carrier),new Mesh(geometry,image));}
    let target=null,face=2,mip=3,step=0;const calls=[],uploads=[],ownedTarget={};
    const gl={toneMapping:4,getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,setRenderTarget(t,f=0,m=0){target=t;face=f;mip=m;},
      compile(object,cam,targetScene){step++;const lights=[];targetScene.traverseVisible(o=>{if(o.isLight&&o.layers.test(cam.layers))lights.push(o.type);});calls.push({target,layers:cam.layers.mask,tone:gl.toneMapping,lights,children:object.children});if(step===fail)throw Error('fail');},
      initTexture(t){step++;uploads.push(t);if(step===fail)throw Error('fail');}};
    let sharedDisposed=false;geometry.addEventListener('dispose',()=>{sharedDisposed=true;});
    try {
      const run=()=>prepareWorkPrograms(gl,scene,camera,cards,ownedTarget,wall);
      if(fail)assert.throws(run,/fail/);else{
        assert.equal(run(),true);assert.equal(calls.length,2);assert.deepEqual(uploads,textures);
        assert.equal(calls[0].layers,2);assert.equal(calls[0].target,null);assert.deepEqual(calls[0].lights,[]);
        assert.equal(calls[1].layers,7);assert.equal(calls[1].target,ownedTarget);assert.equal(calls[1].tone,0);assert.deepEqual(calls[1].lights,['DirectionalLight']);
        calls[0].children.forEach((mesh,i)=>{assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,materials[i]);});
      }
      assert.equal(target,null);assert.equal(face,2);assert.equal(mip,3);assert.equal(gl.toneMapping,4);assert.equal(camera.layers.mask,7);assert.equal(wall.visible,true);assert.equal(sharedDisposed,false);
      assert.equal(cards.children.length,6);assert.equal(cards.parent,scene);
    }finally{geometry.dispose();materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  }
});
