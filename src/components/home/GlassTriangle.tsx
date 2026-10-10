import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { ExtrudeGeometry, Shape, Path, Vector2, Vector3, Scene, type Mesh } from 'three';
import type { JourneyModel } from './scene-state';
import { GlassRotation } from './glass-rotation';
import GlassOptics from './GlassOptics';
import GlassReflectionEnvironment from './GlassReflectionEnvironment';
import GlassEdgeLight from './GlassEdgeLight';

function roundedTriangle(points: Vector2[], radius: number, target: Shape | Path) {
  const entries = points.map((v, i) => v.clone().lerp(points[(i + points.length - 1) % points.length], radius));
  const exits = points.map((v, i) => v.clone().lerp(points[(i + 1) % points.length], radius));
  target.moveTo(entries[0].x, entries[0].y);
  points.forEach((v, i) => {
    if (i) target.lineTo(entries[i].x, entries[i].y);
    target.quadraticCurveTo(v.x, v.y, exits[i].x, exits[i].y);
  });
  target.lineTo(entries[0].x, entries[0].y);
  target.closePath();
}

export function makeTriangleGeometry() {
  // SYSTEM 9.3.1 / 33A: widen the construction, including its hole, before extrusion.
  const vertices = [new Vector2(0, 1.42), new Vector2(-1.23 * 1.14, -.71), new Vector2(1.23 * 1.14, -.71)];
  const shape = new Shape();
  roundedTriangle(vertices, .035, shape);
  const hole = new Path();
  roundedTriangle(vertices.map(v => v.clone().multiplyScalar(.55)).reverse(), .05, hole);
  shape.holes.push(hole);
  const geometry = new ExtrudeGeometry(shape, { depth: .90, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 4, curveSegments: 16, steps: 1 });
  geometry.translate(0, -.16, -.09);
  geometry.computeVertexNormals();
  // One local calibration: the outline bounds and rotation anchor share the origin.
  // This translation preserves the shape/material and never cancels pointer feedback.
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.computeBoundingBox();
  return geometry;
}

export default function GlassTriangle({ model, paused, mobile, hover, low, detailed }: { model: JourneyModel; paused: boolean; mobile: boolean; hover: boolean; low: boolean; detailed:boolean }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(makeTriangleGeometry, []);
  const reflectionScene = useMemo(() => new Scene(), []);
  const rotation = useMemo(() => new GlassRotation(), []);
  const { viewport, camera, size } = useThree();
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, rawDt) => {
    if (!mesh.current) return;
    const diagnostics = rotation.step(model, rawDt, paused, hover);
    // Latest user correction: one central anchor, no chapter-driven side placement.
    mesh.current.position.set(0, 0, 0);
    const currentView=viewport.getCurrentViewport(camera,new Vector3(0,0,0));
    const box = geometry.boundingBox!;
    const mobileScale = Math.min(currentView.height * .44 / (box.max.y - box.min.y), currentView.width * .84 / (box.max.x - box.min.x));
    mesh.current.scale.setScalar(mobile ? mobileScale * .575 : .6555);
    mesh.current.quaternion.copy(rotation.quaternion);
    // Temporary old wall handoff, independent of the four-card index.
    mesh.current.visible = paused || model.motion.raw.wall < (.3 / .35);
    if (document.documentElement.dataset.motionDiagnostics === 'true') {
      model.motion.glassRotation = diagnostics;
      mesh.current.updateMatrixWorld();
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
  return <>
    {detailed && <GlassReflectionEnvironment scene={reflectionScene} />}
    <mesh ref={mesh} geometry={geometry}>
      {detailed ? <GlassOptics mesh={mesh} low={low} reflectionScene={reflectionScene} /> : <MeshTransmissionMaterial samples={low ? 2 : 4} resolution={low ? 256 : 512} transmission={1} roughness={.08} thickness={.25} ior={1.45} chromaticAberration={.015} anisotropicBlur={0} distortion={0} temporalDistortion={0} backside={false} color="#ffffff" envMapIntensity={.8} specularIntensity={.35} />}
      <GlassEdgeLight mesh={mesh} geometry={geometry} model={model} mobile={mobile} />
    </mesh>
  </>;
}
