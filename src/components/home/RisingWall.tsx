import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, Matrix4, type Group, type InstancedMesh } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { JourneyModel } from './scene-state';
const columns=23,rows=19,count=columns*rows;
export default function RisingWall({model}:{model:JourneyModel}){
  const group=useRef<Group>(null),bricks=useRef<InstancedMesh>(null);
  const geometry=useMemo(()=>new RoundedBoxGeometry(1.12,.48,.16,2,.012),[]);
  useEffect(()=>{
    const mesh=bricks.current;if(!mesh)return;
    const matrix=new Matrix4();const base=new Color('#e8e4dc');
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
      const i=row*columns+column;
      matrix.makeTranslation((column-(columns-1)/2)*1.13+(row%2)*.565,(row-(rows-1)/2)*.49,0);
      mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,base.clone().multiplyScalar(1-((row*7+column*3)%5)*.006));
    }
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    return ()=>geometry.dispose();
  },[geometry]);
  useFrame(()=>{
    if(!group.current)return;const rise=MathUtils.smoothstep(model.progress,4.65,4.98);
    group.current.visible=rise>0;group.current.position.set(0,MathUtils.lerp(-11,0,rise),-1);
  },-1);
  return <group ref={group}>
    <mesh position={[0,0,-.1]}><planeGeometry args={[28,10]} /><meshStandardMaterial color="#bcb9b3" roughness={1} /></mesh>
    <instancedMesh ref={bricks} args={[geometry,undefined,count]} frustumCulled={false}><meshStandardMaterial color="#ffffff" roughness={.93} metalness={0} /></instancedMesh>
  </group>;
}
