import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { Euler, Quaternion, Vector3, type Mesh } from 'three';
import type { JourneyModel } from './scene-state';
import { GlassRotation } from './glass-rotation';
import { makeTriangleGeometry } from './prism-geometry';
import GlassEdgeLight from './GlassEdgeLight';
import GlassPortalShape from './GlassPortalShape';

export default function GlassTriangle({ model, paused, hover, mobile,frozen=false }: { model: JourneyModel; paused: boolean; hover: boolean; mobile: boolean;frozen?:boolean }) {
  const mesh = useRef<Mesh>(null);
  const transmission = useRef<ComponentRef<typeof MeshTransmissionMaterial>>(null);
  const geometry = useMemo(makeTriangleGeometry, []);
  const portalShape = useMemo(() => new GlassPortalShape(geometry), [geometry]);
  const rotation = useMemo(() => new GlassRotation(), []);
  const authoredRotation = useMemo(() => new Quaternion(), []);
  const authoredEuler = useMemo(() => new Euler(), []);
  const { camera, size, scene } = useThree();
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const rawDt=model.frameDelta;
    if (!mesh.current||frozen) return;
    const diagnostics = rotation.step(model, rawDt, paused, hover);
    // Latest user correction: one central anchor, no chapter-driven side placement.
    mesh.current.position.set(0, 0, 0);
    const prepare=paused?0:model.motion.rendered.prepare,expand=paused?0:model.motion.rendered.expand;
    authoredEuler.set((.15*prepare+.5*expand)*Math.PI/2,-.1*prepare-.2*expand,0,'XYZ');
    authoredRotation.setFromEuler(authoredEuler);
    // Keep the calibrated half-size at rest; the authored side turn and modest
    // geometric opening belong only to this scroll-driven transition.
    mesh.current.scale.setScalar(.5*(1+.45*expand));
    mesh.current.quaternion.copy(rotation.quaternion).multiply(authoredRotation);
    mesh.current.updateMatrixWorld(true);
    portalShape.update(camera, mesh.current.matrixWorld, expand, size.width, size.height);
    scene.userData.lsshPortalQuad = portalShape.quad;
    scene.userData.lsshPortalFrontCovered = portalShape.frontCoversCorners;
    mesh.current.visible = paused || (model.motion.rendered.expand < .999 && model.motion.rendered.wall < .9999);
    // Drei checks material.visible, not the parent's visibility, before its
    // transmission capture. A covered prism must not render the wall again.
    if(transmission.current)transmission.current.visible=mesh.current.visible;
    scene.userData.lsshGlassMesh=mesh.current;
    if (document.documentElement.dataset.motionDiagnostics === 'true') {
      model.motion.glassRotation = diagnostics;
      mesh.current.updateMatrixWorld();
      const canvas = document.querySelector<HTMLCanvasElement>('.home-scene canvas');
      if (canvas) canvas.dataset.glassQuaternion = mesh.current.quaternion.toArray().map(value => value.toFixed(6)).join(',');
      const anchor = new Vector3().applyMatrix4(mesh.current.matrixWorld).project(camera);
      const positions = geometry.getAttribute('position'), point = new Vector3();
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.current.matrixWorld).project(camera);
        const x = (point.x + 1) * size.width / 2, y = (1 - point.y) * size.height / 2;
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      const box = geometry.boundingBox!;
      model.motion.glass = { anchor: mesh.current.position.toArray(), quaternion: mesh.current.quaternion.toArray(), scale: mesh.current.scale.x, visible: mesh.current.visible,
        projectedAnchor: [(anchor.x + 1) * size.width / 2, (1 - anchor.y) * size.height / 2], bounds: [left, top, right, bottom],
        centeredLocalBounds: [...box.min.toArray(), ...box.max.toArray()] };
      // A paused demand frame has no motion driver; expose the same read-only sample.
      document.dispatchEvent(new CustomEvent('lssh:glass-rotation', { detail: {
        time: performance.now(), y: scrollY, rotation: diagnostics, glass: model.motion.glass,
        initialization: model.motion.initialization, camera: model.motion.camera,
      } }));
    }
  },-1);
  useEffect(()=>()=>{
    if(scene.userData.lsshGlassMesh===mesh.current)delete scene.userData.lsshGlassMesh;
    if(scene.userData.lsshPortalQuad===portalShape.quad){delete scene.userData.lsshPortalQuad;delete scene.userData.lsshPortalFrontCovered;}
  },[scene,portalShape]);
  return <mesh ref={mesh} geometry={geometry}>
    <MeshTransmissionMaterial
      ref={transmission}
      transmission={1}
      ior={1.45}
      roughness={.08}
      thickness={.25}
      chromaticAberration={0}
      distortion={0}
      temporalDistortion={0}
      samples={mobile ? 2 : 4}
      resolution={mobile ? 256 : 512}
      backside={false}
      color="#ffffff"
      envMapIntensity={.8}
      specularIntensity={.35}
    />
    <GlassEdgeLight mesh={mesh} geometry={geometry} model={model} mobile={mobile} quiet={paused} />
  </mesh>;
}
