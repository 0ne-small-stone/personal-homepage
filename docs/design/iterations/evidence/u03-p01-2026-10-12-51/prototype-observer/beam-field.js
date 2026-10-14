import { AdditiveBlending, BackSide, BoxGeometry, DataTexture, FloatType, InstancedBufferAttribute, InstancedMesh, Matrix4, Quaternion, RGBAFormat, ShaderMaterial, Vector3 } from './node_modules/three/build/three.module.js';
import { PrismRaySolver } from './ray.js';
import { intersectReceiver, receiverUniforms } from './receiver.js';

// A local, single-scattering photon-beam estimator. No screen-space line width.
// World units and haze coefficients are a declared virtual scene model.
export const AIR_EXTINCTION = .025;
export const AIR_SCATTERING = .02;
export const APERTURE_RADIUS = .035;
export const KERNEL_RADIUS = .009;
const MAX_SEGMENTS = 2048, SOURCE_POWER = 16;
export function fresnel(cosine, n1, n2) {
  if(n1===n2)return 0;
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
    this.receiverHits = []; this.receiver = null;
    this.planes = prismPlanes(geometry);
    geometry.computeBoundingBox();
    const values = new Float32Array(this.planes.length * 4);
    this.planes.forEach((plane, i) => values.set(plane, i * 4));
    this.planeTexture = new DataTexture(values, this.planes.length, 1, RGBAFormat, FloatType); this.planeTexture.needsUpdate = true;
    this.material = new ShaderMaterial({ side: BackSide, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      blending: AdditiveBlending,
      uniforms: { ...receiverUniforms(null), ...receiverUniforms(null,'back'), observerTransport:{value:true}, glassMin: { value: geometry.boundingBox.min.clone() }, glassMax: { value: geometry.boundingBox.max.clone() }, planeMap: { value: this.planeTexture }, planeCount: { value: this.planes.length }, inversePrism: { value: new Matrix4() }, radius: { value: KERNEL_RADIUS }, sigmaT: { value: AIR_EXTINCTION }, sigmaS: { value: AIR_SCATTERING }, hasGlass: { value: true } },
      vertexShader: `attribute vec3 beamA; attribute vec3 beamB; attribute float flux;
        varying vec3 vWorld; varying vec3 vA; varying vec3 vB; varying float vFlux;
        void main(){vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);vWorld=world.xyz;vA=beamA;vB=beamB;vFlux=flux;gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader: `precision highp float; uniform sampler2D planeMap; uniform int planeCount; uniform mat4 inversePrism; uniform float radius,sigmaT,sigmaS; uniform bool hasGlass;
        varying vec3 vWorld,vA,vB; varying float vFlux;
        uniform bool receiverEnabled;uniform vec4 receiverPlane;uniform vec3 receiverCenter,receiverU,receiverV,receiverSize;
        uniform bool backEnabled,observerTransport;uniform vec4 backPlane;uniform vec3 backCenter,backU,backV,backSize;
        float backDistance(vec3 eye,vec3 view){if(!backEnabled)return 50.;float denominator=dot(backPlane.xyz,view);if(abs(denominator)<.000001)return 50.;float t=(backPlane.w-dot(backPlane.xyz,eye))/denominator;if(t<=0.)return 50.;vec3 relative=eye+view*t-backCenter;return abs(dot(relative,backU))<=backSize.x&&abs(dot(relative,backV))<=backSize.y?t:50.;}
        float receiverDistance(vec3 eye,vec3 view){if(!receiverEnabled)return 50.;float denominator=dot(receiverPlane.xyz,view);if(abs(denominator)<.000001)return 50.;
          float t=(receiverPlane.w-dot(receiverPlane.xyz,eye))/denominator;if(t<=0.)return 50.;vec3 relative=eye+view*t-receiverCenter;
          return abs(dot(relative,receiverU))<=receiverSize.x&&abs(dot(relative,receiverV))<=receiverSize.y?t:50.;}
        uniform vec3 glassMin,glassMax;
        vec2 glassInterval(vec3 eye,vec3 view,float nearT,float farT){if(!hasGlass)return vec2(1.,0.);vec3 origin=(inversePrism*vec4(eye,1.)).xyz,dir=(inversePrism*vec4(view,0.)).xyz;
          // Clip one observation ray against the actual convex hull, instead of testing all 16 integration points.
          for(int j=0;j<3;j++){if(abs(dir[j])<.000000001){if(origin[j]<glassMin[j]-.0001||origin[j]>glassMax[j]+.0001)return vec2(1.,0.);}
            else{float a=(glassMin[j]-.0001-origin[j])/dir[j],b=(glassMax[j]+.0001-origin[j])/dir[j];nearT=max(nearT,min(a,b));farT=min(farT,max(a,b));if(farT<nearT)return vec2(1.,0.);}}
          for(int i=0;i<512;i++){if(i>=planeCount)break;vec4 plane=texelFetch(planeMap,ivec2(i,0),0);float d=dot(plane.xyz,dir),distance=plane.w+.000001-dot(plane.xyz,origin);
            if(abs(d)<.000000001){if(distance<0.)return vec2(1.,0.);}else if(d<0.)nearT=max(nearT,distance/d);else farT=min(farT,distance/d);if(farT<nearT)return vec2(1.,0.);}
          return vec2(nearT,farT);}
        void main(){if(sigmaS<=0.)discard;vec3 eye=cameraPosition;vec3 view=normalize(vWorld-eye);vec3 axis=normalize(vB-vA);float len=length(vB-vA);
          vec3 relative=eye-vA;float along=dot(relative,axis),slope=dot(view,axis);vec3 across=relative-axis*along,side=view-axis*slope;
          float qa=dot(side,side),qb=dot(across,side),qc=dot(across,across)-16.*radius*radius;
          float nearT=.1,farT=min(receiverDistance(eye,view),backDistance(eye,view));if(observerTransport){vec2 first=glassInterval(eye,view,.1,farT);if(first.y>=first.x)farT=min(farT,first.x);}
          if(qa>.000001){float discriminant=qb*qb-qa*qc;if(discriminant<=0.)discard;float root=sqrt(discriminant);nearT=max(nearT,(-qb-root)/qa);farT=min(farT,(-qb+root)/qa);}else if(qc>0.)discard;
          if(abs(slope)>.000001){float a=-along/slope,b=(len-along)/slope;nearT=max(nearT,min(a,b));farT=min(farT,max(a,b));}else if(along<0.||along>len)discard;
          if(farT<=nearT)discard;float dt=(farT-nearT)/16.;float result=0.,t0=nearT+.5*dt;vec3 offset=across+side*t0;
          float r2=radius*radius;float weight=exp(-dot(offset,offset)/(2.*r2)-sigmaT*(along+(1.+slope)*t0))/(6.28318530718*r2);
          // The midpoint Gaussian/Beer exponent is quadratic in t. Recurrence evaluates the same 16 weights with three exponentials.
          float ratio=exp(-(dot(offset,side)*dt+.5*qa*dt*dt)/r2-sigmaT*(1.+slope)*dt),ratioDecay=exp(-qa*dt*dt/r2);
          float g=.2,cosine=dot(axis,-view);float phase=(1.-g*g)/(12.56637061436*pow(1.+g*g-2.*g*cosine,1.5));vec2 glass=observerTransport?vec2(1.,0.):glassInterval(eye,view,nearT,farT);
          for(int i=0;i<16;i++){float t=t0+float(i)*dt;if(t<glass.x||t>glass.y)result+=weight;weight*=ratio;ratio*=ratioDecay;}
          gl_FragColor=vec4(vec3(result*vFlux*sigmaS*phase*dt),1.);}` });
    this.mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), this.material, MAX_SEGMENTS);
    this.mesh.geometry.setAttribute('beamA', new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS * 3), 3));
    this.mesh.geometry.setAttribute('beamB', new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS * 3), 3));
    this.mesh.geometry.setAttribute('flux', new InstancedBufferAttribute(new Float32Array(MAX_SEGMENTS), 1));
    this.mesh.frustumCulled = false; this.mesh.count = 0;
  }
  rebuild(matrix, count, hasGlass = true, sourcePower = SOURCE_POWER, extinction = AIR_EXTINCTION, receiver = null, ior=1.45) {
    this.records.length = 0;
    this.receiverHits.length = 0; this.receivers=Array.isArray(receiver)?receiver.filter(Boolean):receiver?[receiver]:[];this.receiver=this.receivers[0]??null;this.extinction = extinction;
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
      this.solver.trace(matrix, path.origin, path.direction, ior, path.inside);
      let power = path.power, start = path.origin.clone(),inside=path.inside;
      for (let i = 0; i < this.solver.eventCount; i++) {
        const event = this.solver.events[i], length = start.distanceTo(event.point);
        if (!inside) { if(this.add(start, event.point, power)) { power = 0; break; } power *= Math.exp(-extinction * length); }
        if (event.kind === 'refract') {
          const reflection = fresnel(Math.max(0, -event.incoming.dot(event.normal)), event.n1, event.n2);
          if (path.depth < 3 && power * reflection > sourcePower / count * .0001) queue.push({ origin: event.point.clone().addScaledVector(event.normal, this.solver.epsilon * 2), direction: event.incoming.clone().reflect(event.normal), power: power * reflection, inside, depth: path.depth + 1 });
          power *= 1 - reflection;
          inside=!inside;
        }
        start.copy(event.point);
      }
      if (power > 0 && this.solver.status === 'miss') this.add(this.solver.points[0], this.solver.points[1], power, true);
      if (power > 0 && this.solver.status === 'exited') this.add(this.solver.points[this.solver.count - 2], this.solver.points[this.solver.count - 1], power, true);
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
    const receiverValues = {...receiverUniforms(this.receivers[0]??null),...receiverUniforms(this.receivers[1]??null,'back')};
    for(const name of Object.keys(receiverValues)) this.material.uniforms[name].value = receiverValues[name].value;
  }
  add(a, b, power, terminal = false) {
    if(this.records.length >= MAX_SEGMENTS || a.distanceToSquared(b) <= 1e-12) return false;
    const direction = b.clone().sub(a).normalize();let hit=null,receiverId=-1;
    this.receivers.forEach((receiver,i)=>{const candidate=intersectReceiver(receiver,a,direction,a.distanceTo(b));if(candidate&&(!hit||candidate.distance<hit.distance)){hit=candidate;receiverId=i;}});
    if(hit) this.receiverHits.push({ ...hit, direction, power: power * Math.exp(-this.extinction * hit.distance),receiverId,receiver:this.receivers[receiverId] });
    this.records.push({ a: a.clone(), b: hit ? hit.point : b.clone(), power, terminal: terminal || Boolean(hit), receiverHit: Boolean(hit),receiverId });
    return Boolean(hit);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); this.planeTexture.dispose(); }
}
