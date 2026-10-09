import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, MathUtils, ShaderMaterial, Vector2, Vector3, type ExtrudeGeometry, type Group, type Mesh } from 'three';
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
  uniform float pixelRatio;
  uniform float corePixels;
  uniform float lightIntensity;
  varying vec3 localPosition;
  varying vec3 localNormal;
  void main() {
    vec3 n = normalize(localNormal);
    float outer = step(0.0, dot(n.xy, localPosition.xy));
    vec2 outward = n.xy * mix(-1.0, 1.0, outer);
    float lit = .025 + .975 * smoothstep(-.1, .8,
      dot(normalize(outward + vec2(.00001)), normalize(vec2(-.85, .25))));
    float face = mix(.24, 1.0, step(0.0, localPosition.z));
    float band = smoothstep(.01, .06, abs(n.z)) * (1.0 - smoothstep(.98, .9998, abs(n.z)));
    float t = (abs(localPosition.z) - sideZ) / bevelWidth;
    float pixel = max(fwidth(t) * pixelRatio, .002);
    float halfWidth = min(.35, corePixels * .5 * pixel);
    float core = 1.0 - smoothstep(max(0.0, halfWidth - pixel * .6), halfWidth + pixel * .6, abs(t - .52));
    float feather = sin(3.14159265 * clamp(t, 0.0, 1.0));
    float alpha = band * (core * .68 + feather * .045) * lit * mix(.30, 1.0, outer) * face * lightIntensity;
    if (alpha < .0005) discard;
    gl_FragColor = vec4(vec3(1.0), min(alpha, .8));
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
    float fade = 1.0 - smoothstep(0.0, 1.0, vOffset);
    float alpha = vStrength * fade * fade * lightIntensity;
    if (alpha < .0005) discard;
    gl_FragColor = vec4(vec3(1.0), alpha);
    #include <colorspace_fragment>
  }
`;

// Extract the existing bevel/side junction. No second outline or hole model.
function makeHalo(geometry: ExtrudeGeometry) {
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  const sideZ = geometry.boundingBox!.max.z - (geometry.parameters.options.bevelThickness ?? .025);
  const loops = [new Map<string, { p: Vector2; n: Vector2 }>(), new Map<string, { p: Vector2; n: Vector2 }>()];
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(positions.getZ(i) - sideZ) > 1e-5 || Math.abs(normals.getZ(i)) > 1e-4) continue;
    const p = new Vector2(positions.getX(i), positions.getY(i)), n = new Vector2(normals.getX(i), normals.getY(i));
    const loop = loops[p.dot(n) > 0 ? 0 : 1], key = `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
    const item = loop.get(key);
    if (item) item.n.add(n); else loop.set(key, { p, n });
  }
  const xyz: number[] = [], outward: number[] = [], offsets: number[] = [], strengths: number[] = [], indices: number[] = [];
  const light = new Vector2(-.85, .25).normalize();
  loops.forEach((loop, kind) => {
    const points = [...loop.values()].sort((a, b) => Math.atan2(a.p.y, a.p.x) - Math.atan2(b.p.y, b.p.x));
    for (const face of [1, -1]) {
      const start = offsets.length;
      points.forEach(({ p, n }) => {
        n.normalize();
        const facing = n.dot(light) * (kind === 0 ? 1 : -1);
        const alpha = (kind === 0 ? .12 : .04) * (.025 + .975 * MathUtils.smoothstep(facing, -.1, .8)) * (face === 1 ? 1 : .24);
        for (const offset of [0, 1]) {
          xyz.push(p.x, p.y, sideZ * face); outward.push(n.x, n.y); offsets.push(offset); strengths.push(alpha);
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
  return { halo, sideZ };
}

export default function GlassEdgeLight({ mesh, geometry, model, mobile }: { mesh: RefObject<Mesh | null>; geometry: ExtrudeGeometry; model: JourneyModel; mobile: boolean }) {
  const group = useRef<Group>(null), center = useMemo(() => new Vector3(), []);
  const { viewport, camera, size, gl } = useThree();
  const owned = useMemo(() => {
    const { halo, sideZ } = makeHalo(geometry);
    const core = new ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      vertexShader: coreVertex, fragmentShader: coreFragment,
      uniforms: { sideZ: { value: sideZ }, bevelWidth: { value: geometry.parameters.options.bevelThickness ?? .025 }, pixelRatio: { value: 1 }, corePixels: { value: 1.8 }, lightIntensity: { value: 1 } } });
    const soft = new ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide,
      vertexShader: haloVertex, fragmentShader: haloFragment, uniforms: { haloWidth: { value: .04 }, lightIntensity: { value: 1 } } });
    return { halo, core, soft };
  }, [geometry]);
  useEffect(() => () => { owned.halo.dispose(); owned.core.dispose(); owned.soft.dispose(); }, [owned]);
  useFrame(() => {
    const parent = mesh.current;
    if (!parent || !group.current) return;
    // Pausing must not make a new light linger in the completed Wall scene.
    group.current.visible = parent.visible && model.motion.raw.wall < (.3 / .35);
    // Reuse WorkCard's incoming 0..0.5 index interval; reverse scroll restores it.
    const lightIntensity = 1 - MathUtils.smoothstep(model.motion.rendered.index, 0, .5);
    owned.core.uniforms.lightIntensity.value = lightIntensity;
    owned.soft.uniforms.lightIntensity.value = lightIntensity;
    const view = viewport.getCurrentViewport(camera, parent.getWorldPosition(center));
    owned.core.uniforms.pixelRatio.value = gl.getPixelRatio();
    owned.core.uniforms.corePixels.value = mobile ? 1.25 : 1.8;
    owned.soft.uniforms.haloWidth.value = view.width / size.width * (mobile ? 5 : 9) / parent.scale.x;
  }, -.7);
  // GlassOptics hides this parent mesh during capture, excluding both children.
  return <group ref={group} userData={{ lsshGlassLight: 'assembly' }}>
    <mesh geometry={owned.halo} material={owned.soft} dispose={null} frustumCulled={false} renderOrder={21} userData={{ lsshGlassLight: 'halo' }} raycast={() => {}} />
    <mesh geometry={geometry} material={owned.core} dispose={null} renderOrder={22} userData={{ lsshGlassLight: 'core' }} raycast={() => {}} />
  </group>;
}
