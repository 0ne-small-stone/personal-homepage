import { AdditiveBlending, BackSide, BoxGeometry, DataTexture, FloatType, InstancedBufferAttribute, InstancedMesh, Matrix4, Quaternion, RGBAFormat, ShaderMaterial, Vector3 } from './node_modules/three/build/three.module.js';
import { PrismRaySolver } from './ray.js';

// A local, single-scattering photon-beam estimator. No screen-space line width.
// World units and haze coefficients are a declared virtual scene model.
export const AIR_EXTINCTION = .025;
export const AIR_SCATTERING = .02;
export const APERTURE_RADIUS = .035;
export const KERNEL_RADIUS = .009;
const MAX_SEGMENTS = 2048, SOURCE_POWER = 16;
export function fresnel(cosine, n1, n2) {
  const sin2 = (n1 / n2) ** 2 * (1 - cosine * cosine);
  if (sin2 >= 1) return 1;
  const transmitted = Math.sqrt(1 - sin2);
  const rs = (n1 * cosine - n2 * transmitted) / (n1 * cosine + n2 * transmitted);
  const rp = (n2 * cosine - n1 * transmitted) / (n2 * cosine + n1 * transmitted);
  return (rs * rs + rp * rp) / 2;
}
export function prismPlanes(geometry) {
  const position = geometry.attributes.position, indices = geometry.index;
  const result = [], a = new Vector3(), b = new Vector3(), c = new Vector3(), normal = new Vector3();
  for (let i = 0; i < (indices?.count ?? position.count); i += 3) {
    a.fromBufferAttribute(position, indices ? indices.getX(i) : i);
    b.fromBufferAttribute(position, indices ? indices.getX(i + 1) : i + 1);
    c.fromBufferAttribute(position, indices ? indices.getX(i + 2) : i + 2);
    normal.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
    if (normal.lengthSq() < .5) continue;
    const distance = normal.dot(a);
    if (!result.some(p => Math.abs(p[3] - distance) < 1e-5 && normal.distanceTo(new Vector3(...p.slice(0, 3))) < 1e-5)) result.push([...normal, distance]);
  }
  return result;
}
export class BeamField {
  constructor(geometry) {
    this.solver = new PrismRaySolver(geometry);
    this.records = [];
    this.planes = prismPlanes(geometry);
    const values = new Float32Array(this.planes.length * 4);
    this.planes.forEach((plane, i) => values.set(plane, i * 4));
    this.planeTexture = new DataTexture(values, this.planes.length, 1, RGBAFormat, FloatType); this.planeTexture.needsUpdate = true;
    this.material = new ShaderMaterial({ side: BackSide, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      blending: AdditiveBlending,
      uniforms: { planeMap: { value: this.planeTexture }, planeCount: { value: this.planes.length }, inversePrism: { value: new Matrix4() }, radius: { value: KERNEL_RADIUS }, sigmaT: { value: AIR_EXTINCTION }, sigmaS: { value: AIR_SCATTERING }, hasGlass: { value: true } },
      vertexShader: `attribute vec3 beamA; attribute vec3 beamB; attribute float flux;
        varying vec3 vWorld; varying vec3 vA; varying vec3 vB; varying float vFlux;
        void main(){vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);vWorld=world.xyz;vA=beamA;vB=beamB;vFlux=flux;gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader: `precision highp float; uniform sampler2D planeMap; uniform int planeCount; uniform mat4 inversePrism; uniform float radius,sigmaT,sigmaS; uniform bool hasGlass;
        varying vec3 vWorld,vA,vB; varying float vFlux;
        bool insideGlass(vec3 point){if(!hasGlass)return false;vec3 local=(inversePrism*vec4(point,1.)).xyz;
          for(int i=0;i<512;i++){if(i>=planeCount)break;vec4 plane=texelFetch(planeMap,ivec2(i,0),0);if(dot(plane.xyz,local)>plane.w+.000001)return false;}return true;}
        void main(){if(sigmaS<=0.)discard;vec3 eye=cameraPosition;vec3 view=normalize(vWorld-eye);vec3 axis=normalize(vB-vA);float len=length(vB-vA);
          vec3 relative=eye-vA;float along=dot(relative,axis),slope=dot(view,axis);vec3 across=relative-axis*along,side=view-axis*slope;
          float qa=dot(side,side),qb=dot(across,side),qc=dot(across,across)-16.*radius*radius;
          float nearT=.1,farT=50.;if(qa>.000001){float discriminant=qb*qb-qa*qc;if(discriminant<=0.)discard;float root=sqrt(discriminant);nearT=max(nearT,(-qb-root)/qa);farT=min(farT,(-qb+root)/qa);}else if(qc>0.)discard;
          if(abs(slope)>.000001){float a=-along/slope,b=(len-along)/slope;nearT=max(nearT,min(a,b));farT=min(farT,max(a,b));}else if(along<0.||along>len)discard;
          if(farT<=nearT)discard;float dt=(farT-nearT)/16.;float result=0.;
          for(int i=0;i<16;i++){float t=nearT+(float(i)+.5)*dt;vec3 point=eye+view*t;if(insideGlass(point))continue;float u=along+slope*t;float distance2=dot(across+side*t,across+side*t);
            float density=exp(-distance2/(2.*radius*radius))/(6.28318530718*radius*radius);
            float attenuation=exp(-sigmaT*(u+t));float g=.2,cosine=dot(axis,-view);float phase=(1.-g*g)/(12.56637061436*pow(1.+g*g-2.*g*cosine,1.5));
            result+=vFlux*density*sigmaS*phase*attenuation*dt;}
          gl_FragColor=vec4(vec3(result),1.);}` });
    this.mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), this.material, MAX_SEGMENTS);
    this.mesh.geometry.setAttribute('beamA', new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS * 3), 3));
    this.mesh.geometry.setAttribute('beamB', new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS * 3), 3));
    this.mesh.geometry.setAttribute('flux', new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS), 1));
    this.mesh.frustumCulled = false; this.mesh.count = 0;
  }
  rebuild(matrix, count, hasGlass = true, sourcePower = SOURCE_POWER, extinction = AIR_EXTINCTION) {
    this.records.length = 0;
    const direction = new Vector3(1, .2532532084998948, 0).normalize();
    const up = new Vector3(-direction.y, direction.x, 0), depth = new Vector3(0, 0, 1);
    const source = new Vector3(-12, -12 * .2532532084998948, 0), queue = [];
    for (let sample = 0; sample < count; sample++) {
      const r = APERTURE_RADIUS * Math.sqrt((sample + .5) / count), theta = sample * 2.399963229728653;
      const origin = source.clone().addScaledVector(up, r * Math.cos(theta)).addScaledVector(depth, r * Math.sin(theta));
      queue.push({ origin, direction: direction.clone(), power: sourcePower / count, inside: false, depth: 0 });
    }
    while (queue.length && this.records.length < MAX_SEGMENTS) {
      const path = queue.pop();
      if (!hasGlass) { this.add(path.origin, path.origin.clone().addScaledVector(path.direction, 24), path.power, true); continue; }
      this.solver.trace(matrix, path.origin, path.direction, 1.45, path.inside);
      let power = path.power, start = path.origin.clone();
      for (let i = 0; i < this.solver.eventCount; i++) {
        const event = this.solver.events[i], length = start.distanceTo(event.point);
        if (event.n1 === 1) { this.add(start, event.point, power); power *= Math.exp(-extinction * length); }
        if (event.kind === 'refract') {
          const reflection = fresnel(Math.max(0, -event.incoming.dot(event.normal)), event.n1, event.n2);
          if (path.depth < 3 && power * reflection > sourcePower / count * .0001) queue.push({ origin: event.point.clone().addScaledVector(event.normal, this.solver.epsilon * 2), direction: event.incoming.clone().reflect(event.normal), power: power * reflection, inside: event.n1 > 1, depth: path.depth + 1 });
          power *= 1 - reflection;
        }
        start.copy(event.point);
      }
      if (this.solver.status === 'miss') this.add(this.solver.points[0], this.solver.points[1], power, true);
      if (this.solver.status === 'exited') this.add(this.solver.points[this.solver.count - 2], this.solver.points[this.solver.count - 1], power, true);
    }
    const matrixInstance = new Matrix4(), quaternion = new Quaternion(), axis = new Vector3(), center = new Vector3();
    this.records.forEach((beam, i) => {
      axis.copy(beam.b).sub(beam.a); const length = axis.length(); axis.normalize(); center.copy(beam.a).add(beam.b).multiplyScalar(.5);
      quaternion.setFromUnitVectors(new Vector3(0, 0, 1), axis); matrixInstance.compose(center, quaternion, new Vector3(KERNEL_RADIUS * 8, KERNEL_RADIUS * 8, length));
      this.mesh.setMatrixAt(i, matrixInstance);
      this.mesh.geometry.attributes.beamA.setXYZ(i, ...beam.a); this.mesh.geometry.attributes.beamB.setXYZ(i, ...beam.b); this.mesh.geometry.attributes.flux.setX(i, beam.power);
    });
    this.mesh.count = this.records.length; this.mesh.instanceMatrix.needsUpdate = true;
    for (const name of ['beamA', 'beamB', 'flux']) this.mesh.geometry.attributes[name].needsUpdate = true;
    this.material.uniforms.inversePrism.value.copy(matrix).invert(); this.material.uniforms.hasGlass.value = hasGlass;
  }
  add(a, b, power, terminal = false) { if (this.records.length < MAX_SEGMENTS && a.distanceToSquared(b) > 1e-12) this.records.push({ a: a.clone(), b: b.clone(), power, terminal }); }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); this.planeTexture.dispose(); }
}
