import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box2, MathUtils, Vector2, Vector3, type ExtrudeGeometry, type Mesh } from 'three';
import type { JourneyModel } from './scene-state';
import GlassGlow from './GlassGlow';

// The three longest segments are the actual straight sides between rounded corners.
function edgePlanes(points: { p: Vector2 }[]) {
  const center = points.reduce((sum, item) => sum.add(item.p), new Vector2()).divideScalar(points.length);
  return points.map(({ p }, i) => {
    const next = points[(i + 1) % points.length].p, delta = next.clone().sub(p);
    const n = new Vector2(delta.y, -delta.x).normalize();
    if (n.dot(p.clone().sub(center)) < 0) n.negate();
    return { length: delta.lengthSq(), plane: new Vector3(n.x, n.y, n.dot(p)) };
  }).sort((a, b) => b.length - a.length).slice(0, 3).map(item => item.plane);
}

// Extract the existing bevel/side junction. No second outline or hole model.
function getLightContours(geometry: ExtrudeGeometry) {
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  const sideZ = geometry.boundingBox!.max.z - (geometry.parameters.options.bevelThickness ?? .025);
  const shape = Array.isArray(geometry.parameters.shapes) ? geometry.parameters.shapes[0] : geometry.parameters.shapes;
  const paths = shape.extractPoints(geometry.parameters.options.curveSegments ?? 16);
  const pathCenter = new Box2().setFromPoints(paths.shape).getCenter(new Vector2());
  const bodyCenter = geometry.boundingBox!.getCenter(new Vector3());
  const offset = new Vector2(bodyCenter.x, bodyCenter.y).sub(pathCenter);
  const distanceToPath = (p: Vector2, points: Vector2[]) => {
    let distance = Infinity;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const dx = b.x - a.x, dy = b.y - a.y, x = p.x - offset.x - a.x, y = p.y - offset.y - a.y;
      const t = MathUtils.clamp((x * dx + y * dy) / (dx * dx + dy * dy || 1), 0, 1);
      distance = Math.min(distance, (x - t * dx) ** 2 + (y - t * dy) ** 2);
    }
    return distance;
  };
  const loops = [new Map<string, { p: Vector2; n: Vector2 }>(), new Map<string, { p: Vector2; n: Vector2 }>()];
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(positions.getZ(i) - sideZ) > 1e-5 || Math.abs(normals.getZ(i)) > 1e-4) continue;
    const p = new Vector2(positions.getX(i), positions.getY(i)), n = new Vector2(normals.getX(i), normals.getY(i));
    // Concave bevel corners can reverse a side normal; classify against the actual paths.
    const kind = distanceToPath(p, paths.shape) < distanceToPath(p, paths.holes[0]) ? 0 : 1;
    if ((n.dot(p.clone().sub(new Vector2(bodyCenter.x, bodyCenter.y))) > 0) !== (kind === 0)) n.negate();
    const loop = loops[kind], key = `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
    const item = loop.get(key);
    if (item) item.n.add(n); else loop.set(key, { p, n });
  }
  const planes = loops.map(loop => {
    const points = [...loop.values()].sort((a, b) => Math.atan2(a.p.y, a.p.x) - Math.atan2(b.p.y, b.p.x));
    return edgePlanes(points);
  });
  return { sideZ, planes };
}

export default function GlassEdgeLight({ mesh, geometry, model, mobile }: { mesh: RefObject<Mesh | null>; geometry: ExtrudeGeometry; model: JourneyModel; mobile: boolean }) {
  const { scene } = useThree();
  const glow = useMemo(() => new GlassGlow(geometry, getLightContours(geometry).planes), [geometry]);
  useEffect(() => {
    scene.userData.lsshGlassGlow = glow;
    const pageHide = (event: PageTransitionEvent) => {
      if (event.persisted) glow.suspend();
      else glow.dispose();
    };
    const beforeSwap = () => glow.dispose();
    window.addEventListener('pagehide', pageHide);
    document.addEventListener('astro:before-swap', beforeSwap);
    return () => {
      window.removeEventListener('pagehide', pageHide);
      document.removeEventListener('astro:before-swap', beforeSwap);
      if (scene.userData.lsshGlassGlow === glow) delete scene.userData.lsshGlassGlow;
      glow.dispose();
    };
  }, [glow, scene]);
  useFrame(() => {
    const parent = mesh.current;
    if (!parent) return;
    // Only the separate, blurred emitter contributes light. No white face overlays.
    glow.source = parent;
    glow.mobile = mobile;
    glow.intensity = parent.visible && model.motion.raw.wall < (.3 / .35)
      ? 1 - MathUtils.smoothstep(model.motion.rendered.index, 0, .5) : 0;
  }, -.7);
  return null;
}
