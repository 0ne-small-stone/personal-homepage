import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { BoxGeometry, PlaneGeometry, TextureLoader, SRGBColorSpace, MathUtils, Vector3, type Texture, type Group, type BufferGeometry, type MeshBasicMaterial } from 'three';
import type { JourneyModel } from './scene-state';
import { sceneUnitScale, workCount } from './works-motion';
import { homeWorkChapters } from './home-chapters';
import {createReliefMaterial} from './relief-material';
import {createReliefInteraction,installReliefInteraction,stepReliefInteraction,reliefSize} from './relief-interaction.mjs';

function curve(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) position.setZ(i, .2 * position.getZ(i) + 1.5 * Math.cos(position.getX(i) * Math.PI / 16) - 1);
  geometry.computeVertexNormals(); return geometry;
}

// Match the horizontal and depth radii; the front-facing card stays at z=-1.
const orbitRadius=11;

function WorkCard({ model, index, texture, imageAspect }: { model: JourneyModel; index: number; texture: Texture; imageAspect: number }) {
  const group=useRef<Group>(null),hit=useRef<HTMLAnchorElement|null>(null);
  const carrier=useRef<MeshBasicMaterial>(null);
  const interaction=useRef(createReliefInteraction()).current;
  const {size,camera}=useThree();
  const dimensions=useMemo(()=>reliefSize(imageAspect),[imageAspect]);
  texture.colorSpace=SRGBColorSpace;
  const material=useMemo(()=>createReliefMaterial(texture),[texture]);
  const projected=useMemo(()=>Array.from({length:4},()=>new Vector3()),[]);
  const geometries = useMemo(() => {
    const face = new PlaneGeometry(dimensions.width,dimensions.height,48,18);
    face.translate(0, 0, .1);
    return [curve(new BoxGeometry(dimensions.width,dimensions.height,.12,32,12,1)),curve(face)];
  },[dimensions]);
  useEffect(()=>()=>{geometries.forEach(geometry=>geometry.dispose());material.dispose();},[geometries,material]);
  useEffect(()=>{
    const section=document.getElementById(homeWorkChapters[index].id);
    const link=section?.querySelector<HTMLAnchorElement>('[data-relief-hit]');
    const entry=section?.querySelector<HTMLAnchorElement>('.home-cta');
    if(!section||!link||!entry)return;
    hit.current=link;
    const cleanup=installReliefInteraction({state:interaction,hit:link,entry,section,
      allowed:()=>!document.hidden&&!model.loading.active&&document.body.dataset.homePaused!=='true'&&!document.body.classList.contains('home-quiet'),
      wake:()=>model.invalidate()});
    return()=>{cleanup();hit.current=null;link.style.removeProperty('transform');link.style.removeProperty('width');link.style.removeProperty('height');};
  },[index,model,interaction]);
  useFrame(() => {
    if(!group.current)return;
    const u = model.motion.rendered.index, d = index + 1 - u;
    const sp = MathUtils.clamp((16 / 9 - size.width / size.height) / (16 / 9 - 9 / 16), 0, 1);
    const localScale = .9 + .1 * sp + .2 * (1 - Math.min(1, Math.abs(d)));
    const alpha = (1 - MathUtils.smoothstep(Math.abs(d), .8, 2.5)) * Math.min(1, 2 * u) * Math.min(1, 2 * (workCount + 1 - u));
    const responsiveScale = MathUtils.lerp(1, .6, sp) * sceneUnitScale;
    const enabled=!document.hidden&&document.body.dataset.homePaused!=='true'&&!model.loading.active;
    if(Math.abs(d)>.55||model.motion.rendered.prepare>.01){interaction.targetAmount=0;interaction.targetX=0;interaction.targetY=0;}
    stepReliefInteraction(interaction,model.frameDelta,enabled);
    group.current.position.set(orbitRadius*Math.sin(d)*responsiveScale, (-d * MathUtils.lerp(1, .6, sp) + .8 * sp) * sceneUnitScale+.35*responsiveScale, (orbitRadius * Math.cos(d) - orbitRadius - 1) * responsiveScale);
    group.current.rotation.set(-interaction.y*.045,.6*d+interaction.x*.065,-interaction.x*.006);
    group.current.scale.setScalar(localScale * responsiveScale);
    group.current.visible = alpha > .01;
    material.opacity=alpha;
    if(carrier.current)carrier.current.opacity=alpha;
    const uniforms=material.userData.reliefUniforms;
    uniforms.light.value.set(-.65+interaction.x*.45,.75+interaction.y*.45);uniforms.amount.value=interaction.amount;
    // The semantic link follows the actual projected artwork, including tilt.
    // It does not intercept scroll or depend on canvas raycasting.
    if(hit.current&&alpha>.01){
      group.current.updateWorldMatrix(true,false);
      const w=dimensions.width/2,h=dimensions.height/2,z=.2*.1+1.5*Math.cos(w*Math.PI/16)-1;
      projected[0].set(-w,-h,z);projected[1].set(w,-h,z);projected[2].set(-w,h,z);projected[3].set(w,h,z);
      for(const point of projected)point.applyMatrix4(group.current.matrixWorld).project(camera);
      const left=(Math.min(...projected.map(point=>point.x))+1)*size.width/2;
      const right=(Math.max(...projected.map(point=>point.x))+1)*size.width/2;
      const top=(1-Math.max(...projected.map(point=>point.y)))*size.height/2;
      const bottom=(1-Math.min(...projected.map(point=>point.y)))*size.height/2;
      hit.current.style.transform=`translate3d(${left}px,${top}px,0)`;
      hit.current.style.width=`${right-left}px`;hit.current.style.height=`${bottom-top}px`;
    }
    model.motion.cards[index] = { index, position: group.current.position.toArray(), rotationY: group.current.rotation.y, scale: group.current.scale.x, alpha, visible: group.current.visible };
  }, -1);
  return <group ref={group}>
    <mesh geometry={geometries[0]} layers-mask={2} renderOrder={100}><meshBasicMaterial ref={carrier} color="#000000" transparent opacity={1} depthTest={false} depthWrite={false} toneMapped={false} /></mesh>
    <mesh geometry={geometries[1]} layers-mask={2} renderOrder={101}><primitive object={material} attach="material" /></mesh>
  </group>;
}

function ImageWorkCard({ url, ...props }: { model: JourneyModel; index: number; url: string; imageAspect: number }) {
  const texture = useLoader(TextureLoader, url);
  return <WorkCard {...props} texture={texture} />;
}

export default function WorksScene({ model, projectUrl, neighborUrl, albumUrl }: { model: JourneyModel; projectUrl: string; neighborUrl: string; albumUrl: string }) {
  const root=useRef<Group>(null);const {scene}=useThree();
  useEffect(()=>{const group=root.current;if(!group)return;scene.userData.lsshWorkCards=group;
    return()=>{if(scene.userData.lsshWorkCards===group)delete scene.userData.lsshWorkCards;};},[scene]);
  const images = {
    album: { url: albumUrl, imageAspect: 2020 / 778 },
    radio: { url: neighborUrl, imageAspect: 2035 / 773 },
    projects: { url: projectUrl, imageAspect: 2022 / 778 },
  };
  return <group ref={root}>{homeWorkChapters.map((chapter, index) => <ImageWorkCard key={chapter.id} model={model} index={index} {...images[chapter.id]} />)}</group>;
}
