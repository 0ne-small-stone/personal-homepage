import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector2, Vector3, type ExtrudeGeometry, type Mesh } from 'three';
import type { JourneyModel } from './scene-state';
import GlassGlow from './GlassGlow';
import { smooth01 } from './wall-assembly';

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

// Extract only the solid prism's actual outer bevel/side junction.
function getLightContours(geometry: ExtrudeGeometry) {
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  const sideZ = geometry.boundingBox!.max.z - (geometry.parameters.options.bevelThickness ?? .025);
  const loop = new Map<string, { p: Vector2 }>();
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(positions.getZ(i) - sideZ) > 1e-5 || Math.abs(normals.getZ(i)) > 1e-4) continue;
    const p = new Vector2(positions.getX(i), positions.getY(i));
    loop.set(`${p.x.toFixed(6)},${p.y.toFixed(6)}`, { p });
  }
  const points = [...loop.values()].sort((a, b) => Math.atan2(a.p.y, a.p.x) - Math.atan2(b.p.y, b.p.x));
  return edgePlanes(points);
}

export default function GlassEdgeLight({ mesh, geometry, model, mobile, quiet }: { mesh: RefObject<Mesh | null>; geometry: ExtrudeGeometry; model: JourneyModel; mobile: boolean; quiet: boolean }) {
  const { scene } = useThree();
  const glow = useMemo(() => new GlassGlow(geometry, getLightContours(geometry)), [geometry]);
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
    glow.outlineProgress=model.loading.active?smooth01(model.loading.progress/.36):1;
    const open=1-MathUtils.smoothstep(model.motion.rendered.expand,0,.12);
    const reveal=1-MathUtils.smoothstep(model.motion.rendered.wall,.86,1);
    glow.intensity = parent.visible ? quiet ? 1 : open*reveal : 0;
  }, -.7);
  return null;
}
