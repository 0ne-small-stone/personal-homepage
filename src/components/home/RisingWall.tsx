import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, Color, DynamicDrawUsage, InstancedBufferAttribute, Matrix4, type Group, type InstancedMesh } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { JourneyModel } from './scene-state';
import { assemblyLayout, brickLanding, brickState, wallBrick, wallBuild, wallColumns, wallRows } from './wall-assembly';
import { makeWallMaterial } from './wall-material';

const count=wallColumns*wallRows;
export default function RisingWall({model,quiet}:{model:JourneyModel;quiet:boolean}) {
  const group=useRef<Group>(null),bricks=useRef<InstancedMesh>(null),mortar=useRef<InstancedMesh>(null);
  const {scene,camera}=useThree();
  const floors=useMemo(()=>({brick:new InstancedBufferAttribute(new Float32Array(count),1).setUsage(DynamicDrawUsage),
    seam:new InstancedBufferAttribute(new Float32Array(count),1).setUsage(DynamicDrawUsage)}),[]);
  const geometry=useMemo(()=>new RoundedBoxGeometry(wallBrick.width,wallBrick.height,wallBrick.depth,3,wallBrick.bevel).setAttribute('stoneFloor',floors.brick),[floors]);
  const material=useMemo(()=>makeWallMaterial(),[]),seamMaterial=useMemo(()=>makeWallMaterial(true),[]);
  // Each brick carries its own seam support; no complete pale backing before assembly.
  const support=useMemo(()=>new BoxGeometry(wallBrick.stepX,wallBrick.stepY,wallBrick.seamDepth).setAttribute('stoneFloor',floors.seam),[floors]);
  const matrix=useMemo(()=>new Matrix4(),[]);
  const turn=useMemo(()=>new Matrix4(),[]);
  const tones=useMemo(()=>({base:new Color('#e5e3dc'),seam:new Color('#bbb9b3'),color:new Color()}),[]);
  const previous=useRef(''),revision=useRef(0);
  const summary=useRef({settled:0,falling:0,drawn:0,rows:0,samples:[] as {id:number;row:number;column:number;x:number;y:number;progress:number}[]});
  useEffect(()=>{
    const mesh=bricks.current;if(!mesh)return;
    const base=new Color('#e8e4dc'),color=new Color();
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);mortar.current?.instanceMatrix.setUsage(DynamicDrawUsage);
    for(let row=0;row<wallRows;row++)for(let column=0;column<wallColumns;column++) {
      mesh.setColorAt(row*wallColumns+column,color.copy(base).multiplyScalar(1-((row*7+column*3)%5)*.006));
    }
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    return ()=>{geometry.dispose();support.dispose();material.dispose();seamMaterial.dispose();};
  },[geometry,support,material,seamMaterial]);
  useEffect(()=>{
    const root=group.current;if(!root)return;
    root.traverse(object=>object.layers.set(2));scene.userData.lsshWallGroup=root;
    return ()=>{if(scene.userData.lsshWallGroup===root) {
      delete scene.userData.lsshWallGroup;delete scene.userData.lsshWallRevision;delete scene.userData.lsshWallBuild;
    }};
  },[scene]);
  useFrame(()=>{
    const root=group.current,mesh=bricks.current,seams=mortar.current;if(!root||!mesh||!seams)return;
    const e=model.motion.rendered.expand,w=model.motion.rendered.wall,build=quiet?0:wallBuild(e,w);
    root.position.set(0,0,-1);
    root.visible=!quiet&&e>=.999&&model.motion.portalCovered&&build>0;
    const halfWidth=1/Math.abs(camera.projectionMatrix.elements[0]),halfHeight=1/Math.abs(camera.projectionMatrix.elements[5]);
    const layout=assemblyLayout(halfWidth,halfHeight);
    const dimensions=[halfWidth.toFixed(5),halfHeight.toFixed(5)].join(':');
    const key=build===0?'empty':build===1?`complete:${dimensions}`:[build.toFixed(7),dimensions].join(':');
    if(key!==previous.current) {
      previous.current=key;
      const stats={settled:0,falling:0,drawn:0,rows:layout.rows,samples:[] as typeof summary.current.samples};
      let slot=0;
      for(let row=layout.minRow;row<=layout.maxRow;row++)for(let column=layout.minColumn;column<=layout.maxColumn;column++) {
        const i=row*wallColumns+column,state=brickState(build,row,column,layout);
        if(!state.visible)continue;
        const floor=brickLanding(row,column).y;
        floors.brick.setX(slot,floor-wallBrick.height/2);floors.seam.setX(slot,floor-wallBrick.stepY/2);
        if(state.visible) {
          if(state.progress===1)matrix.makeTranslation(state.x,state.y,0);
          else {matrix.makeRotationX(state.tiltX);turn.makeRotationY(state.tiltY);matrix.multiply(turn);matrix.setPosition(state.x,state.y,state.z);}
          stats.drawn++;
          if(state.progress===1)stats.settled++;else stats.falling++;
          if(column===Math.floor((layout.minColumn+layout.maxColumn)/2)&&stats.samples.length<6)stats.samples.push({id:i,row,column,x:state.x,y:state.y,progress:state.progress});
        } else matrix.makeScale(0,0,0);
        const light=.055+(.34-.055)*state.reveal;
        mesh.setColorAt(slot,tones.color.copy(tones.base).multiplyScalar(light*(1-((row*7+column*3)%5)*.008)));
        seams.setColorAt(slot,tones.color.copy(tones.seam).multiplyScalar(light));
        mesh.setMatrixAt(slot,matrix);
        if(state.visible){matrix.elements[12]-=wallBrick.seamOffset*matrix.elements[8];matrix.elements[13]-=wallBrick.seamOffset*matrix.elements[9];matrix.elements[14]-=wallBrick.seamOffset*matrix.elements[10];}
        seams.setMatrixAt(slot,matrix);slot++;
      }
      mesh.count=seams.count=slot;
      mesh.instanceMatrix.needsUpdate=true;seams.instanceMatrix.needsUpdate=true;
      floors.brick.needsUpdate=true;floors.seam.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;if(seams.instanceColor)seams.instanceColor.needsUpdate=true;
      summary.current=stats;revision.current++;
    }
    scene.userData.lsshWallRevision=revision.current;scene.userData.lsshWallBuild=build;
    if(document.documentElement.dataset.motionDiagnostics==='true')model.motion.wall={raw:model.motion.raw.wall,rise:w,build,
      position:root.position.toArray(),visible:root.visible,revision:revision.current,...summary.current};
  },-1);
  return <group ref={group}>
    <pointLight position={[-3,3.8,4.4]} intensity={14} decay={2} color="#f3f1eb" />
    <instancedMesh ref={mortar} args={[support,seamMaterial,count]} frustumCulled={false} />
    <instancedMesh ref={bricks} args={[geometry,material,count]} frustumCulled={false} />
  </group>;
}
