import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box2, BufferGeometry, DoubleSide, Float32BufferAttribute, MathUtils, MeshPhysicalMaterial, ShaderMaterial, Vector2, Vector3, type ExtrudeGeometry, type Group, type Mesh } from 'three';
import type { JourneyModel } from './scene-state';

const coreVertex = /* glsl */`
  varying vec3 localPosition;
  varying vec3 localNormal;
  void main() {
    localPosition = position; localNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const coreFragment = /* glsl */`
  uniform float sideZ;
  uniform float bevelWidth;
  uniform float lightIntensity;
  varying vec3 localPosition;
  varying vec3 localNormal;
  void main() {
    vec3 n = normalize(localNormal);
    float outer = step(0.0, dot(n.xy, localPosition.xy));
    vec2 outward = n.xy * mix(-1.0, 1.0, outer);
    float lit = .60 + .40 * smoothstep(-.1, .8,
      dot(normalize(outward + vec2(.00001)), normalize(vec2(-.85, .25))));
    float face = mix(.55, 1.0, step(0.0, localPosition.z));
    float band = smoothstep(.01, .06, abs(n.z)) * (1.0 - smoothstep(.98, .9998, abs(n.z)));
    float t = (abs(localPosition.z) - sideZ) / bevelWidth;
    float feather = sin(3.14159265 * clamp(t, 0.0, 1.0));
    float alpha = band * feather * .06 * lit * mix(.85, 1.0, outer) * face * lightIntensity;
    if (alpha < .0005) discard;
    gl_FragColor = vec4(vec3(1.0), min(alpha, .94));
    #include <colorspace_fragment>
  }
`;
const haloVertex = /* glsl */`
  uniform float haloWidth;
  attribute vec2 outward;
  attribute float bandOffset;
  attribute float strength;
  varying float vOffset;
  varying float vStrength;
  void main() {
    vec3 p = position; p.xy += outward * bandOffset * haloWidth;
    vOffset = bandOffset; vStrength = strength;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const haloFragment = /* glsl */`
  uniform float lightIntensity;
  varying float vOffset;
  varying float vStrength;
  void main() {
    float spread = exp(-pow(vOffset / .46, 2.0));
    float fade = 1.0 - smoothstep(.75, 1.0, vOffset);
    float alpha = vStrength * .26 * spread * fade * lightIntensity;
    if (alpha < .0005) discard;
    gl_FragColor = vec4(vec3(1.0), min(alpha, .94));
    #include <colorspace_fragment>
  }
`;
const surfaceFragment = /* glsl */`
  uniform vec3 outerPlanes[3];
  uniform vec3 innerPlanes[3];
  uniform float sideZ;
  uniform float lightIntensity;
  varying vec3 localPosition;
  void main() {
    float outerDistance = 100.0, innerDistance = -100.0;
    for (int i = 0; i < 3; i++) {
      outerDistance = min(outerDistance, outerPlanes[i].z - dot(outerPlanes[i].xy, localPosition.xy));
      innerDistance = max(innerDistance, dot(innerPlanes[i].xy, localPosition.xy) - innerPlanes[i].z);
    }
    float distance = min(max(outerDistance, 0.0), max(innerDistance, 0.0));
    float nearEdge = exp(-pow(distance / .27, 2.0));
    float rear = mix(.65, 1.0, smoothstep(-sideZ, sideZ, localPosition.z));
    float alpha = (.020 + .14 * nearEdge) * rear * lightIntensity;
    if (alpha < .0005) discard;
    gl_FragColor = vec4(vec3(1.0), alpha);
    #include <colorspace_fragment>
  }
`;

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
function makeHalo(geometry: ExtrudeGeometry) {
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
  const xyz: number[] = [], outward: number[] = [], offsets: number[] = [], strengths: number[] = [], indices: number[] = [];
  const light = new Vector2(-.85, .25).normalize();
  const planes: Vector3[][] = [];
  loops.forEach((loop, kind) => {
    const points = [...loop.values()].sort((a, b) => Math.atan2(a.p.y, a.p.x) - Math.atan2(b.p.y, b.p.x));
    planes.push(edgePlanes(points));
    for (const face of [1, -1]) {
      const start = offsets.length;
      points.forEach(({ p, n }) => {
        n.normalize();
        const facing = n.dot(light) * (kind === 0 ? 1 : -1);
        const alpha = (kind === 0 ? 1 : .85) * (.60 + .40 * MathUtils.smoothstep(facing, -.1, .8)) * (face === 1 ? 1 : .55);
        for (const offset of [0, 1]) {
          const widthScale = kind === 0 ? 1 : .72;
          xyz.push(p.x, p.y, sideZ * face); outward.push(n.x * widthScale, n.y * widthScale); offsets.push(offset); strengths.push(alpha);
        }
      });
      for (let i = 0; i < points.length; i++) {
        const a = start + i * 2, b = start + ((i + 1) % points.length) * 2;
        // Double-sided strips are depth-tested against the original solid glass.
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  });
  const halo = new BufferGeometry();
  halo.setAttribute('position', new Float32BufferAttribute(xyz, 3));
  halo.setAttribute('outward', new Float32BufferAttribute(outward, 2));
  halo.setAttribute('bandOffset', new Float32BufferAttribute(offsets, 1));
  halo.setAttribute('strength', new Float32BufferAttribute(strengths, 1));
  halo.setIndex(indices); halo.computeBoundingSphere();
  return { halo, sideZ, planes };
}

export default function GlassEdgeLight({ mesh, geometry, model, mobile }: { mesh: RefObject<Mesh | null>; geometry: ExtrudeGeometry; model: JourneyModel; mobile: boolean }) {
  const group = useRef<Group>(null), center = useMemo(() => new Vector3(), []);
  const { viewport, camera, size } = useThree();
  const owned = useMemo(() => {
    const { halo, sideZ, planes } = makeHalo(geometry);
    const core = new ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      vertexShader: coreVertex, fragmentShader: coreFragment,
      uniforms: { sideZ: { value: sideZ }, bevelWidth: { value: geometry.parameters.options.bevelThickness ?? .025 }, lightIntensity: { value: 1 } } });
    const soft = new ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide,
      vertexShader: haloVertex, fragmentShader: haloFragment, uniforms: { haloWidth: { value: .04 }, lightIntensity: { value: 1 } } });
    // This shared-geometry light layer works with both custom and ordinary glass.
    const surface = new ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      vertexShader: coreVertex, fragmentShader: surfaceFragment,
      uniforms: { outerPlanes: { value: planes[0] }, innerPlanes: { value: planes[1] }, sideZ: { value: sideZ }, lightIntensity: { value: 1 } } });
    return { halo, core, soft, surface };
  }, [geometry]);
  useEffect(() => () => { owned.halo.dispose(); owned.core.dispose(); owned.soft.dispose(); owned.surface.dispose(); }, [owned]);
  useFrame(() => {
    const parent = mesh.current;
    if (!parent || !group.current) return;
    // Pausing must not make a new light linger in the completed Wall scene.
    // Drei's ordinary capture (priority0) discards only the parent material.
    group.current.visible = parent.visible && model.motion.raw.wall < (.3 / .35) && !(parent.material instanceof MeshPhysicalMaterial);
    // Reuse WorkCard's incoming 0..0.5 index interval; reverse scroll restores it.
    const lightIntensity = 1 - MathUtils.smoothstep(model.motion.rendered.index, 0, .5);
    owned.core.uniforms.lightIntensity.value = lightIntensity;
    owned.soft.uniforms.lightIntensity.value = lightIntensity;
    owned.surface.uniforms.lightIntensity.value = lightIntensity;
    const view = viewport.getCurrentViewport(camera, parent.getWorldPosition(center));
    const haloPixels = mobile ? 32 : 56;
    owned.soft.uniforms.haloWidth.value = view.width / size.width * haloPixels / parent.scale.x;
  }, -.7);
  useFrame(() => {
    // Restore after ordinary capture, before the existing main compositor(priority1).
    if (group.current) group.current.visible = Boolean(mesh.current?.visible && model.motion.raw.wall < (.3 / .35));
  }, .1);
  // GlassOptics hides this parent mesh during capture, excluding the light assembly.
  return <group ref={group} userData={{ lsshGlassLight: 'assembly' }}>
    <mesh geometry={geometry} material={owned.surface} dispose={null} renderOrder={20} userData={{ lsshGlassLight: 'surface' }} raycast={() => {}} />
    <mesh geometry={owned.halo} material={owned.soft} dispose={null} frustumCulled={false} renderOrder={21} userData={{ lsshGlassLight: 'halo' }} raycast={() => {}} />
    <mesh geometry={geometry} material={owned.core} dispose={null} renderOrder={22} userData={{ lsshGlassLight: 'core' }} raycast={() => {}} />
  </group>;
}
