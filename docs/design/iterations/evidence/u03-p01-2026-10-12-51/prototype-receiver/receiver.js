import { DataTexture, DoubleSide, FloatType, Mesh, PlaneGeometry, RGBAFormat, ShaderMaterial, Vector3, Vector4 } from './node_modules/three/build/three.module.js';

// Diagnostic surface, not a proposed homepage wall/floor. All units are world units.
export function makeReceiver() {
  const angle = -.55;
  return { center: new Vector3(3.2, 0, -.7), normal: new Vector3(Math.sin(angle), 0, Math.cos(angle)),
    u: new Vector3(Math.cos(angle), 0, -Math.sin(angle)), v: new Vector3(0, 1, 0), halfWidth: 2, halfHeight: 1.8, albedo: .65, angle };
}

export function intersectReceiver(receiver, origin, direction, maxDistance = Infinity) {
  if (!receiver) return null;
  const denominator = receiver.normal.dot(direction);
  if (Math.abs(denominator) < 1e-9) return null;
  const distance = receiver.normal.dot(receiver.center.clone().sub(origin)) / denominator;
  if (distance <= 1e-7 || distance > maxDistance + 1e-8) return null;
  const point = origin.clone().addScaledVector(direction, distance), relative = point.clone().sub(receiver.center);
  if (Math.abs(relative.dot(receiver.u)) > receiver.halfWidth || Math.abs(relative.dot(receiver.v)) > receiver.halfHeight) return null;
  return { point, distance, cosine: Math.abs(denominator) };
}

export function surfaceIrradiance(hit, point, radius) {
  const offset = point.clone().sub(hit.point), along = offset.dot(hit.direction);
  const perpendicular2 = Math.max(0, offset.lengthSq() - along * along);
  return hit.power * hit.cosine * Math.exp(-perpendicular2 / (2 * radius * radius)) / (2 * Math.PI * radius * radius);
}

export class ReceiverSurface {
  constructor(receiver, radius, capacity = 2048) {
    this.receiver = receiver;
    this.data = new Float32Array(capacity * 8);
    this.texture = new DataTexture(this.data, capacity, 2, RGBAFormat, FloatType); this.texture.needsUpdate = true;
    this.material = new ShaderMaterial({ side: DoubleSide, toneMapped: false,
      uniforms: { hits: { value: this.texture }, hitCount: { value: 0 }, radius: { value: radius }, sigmaT: { value: 0 }, albedo: { value: receiver.albedo }, receiverNormal: { value: receiver.normal } },
      vertexShader: 'varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
      fragmentShader: `precision highp float;uniform sampler2D hits;uniform int hitCount;uniform float radius,sigmaT,albedo;uniform vec3 receiverNormal;varying vec3 vWorld;
        void main(){float irradiance=0.;
          for(int i=0;i<2048;i++){if(i>=hitCount)break;vec4 hit=texelFetch(hits,ivec2(i,0),0);vec4 direction=texelFetch(hits,ivec2(i,1),0);
            if(dot(cameraPosition-vWorld,receiverNormal)*dot(direction.xyz,receiverNormal)>=0.)continue;
            vec3 offset=vWorld-hit.xyz;float along=dot(offset,direction.xyz);float distance2=max(0.,dot(offset,offset)-along*along);
            // Same world kernel as the volume estimator; the cosine supplies the projected-area Jacobian.
            irradiance+=hit.w*direction.w*exp(-distance2/(2.*radius*radius))/(6.28318530718*radius*radius);}
          // A two-sided diagnostic sheet reflects only into the illuminated hemisphere.
          float radiance=irradiance*albedo/3.14159265359*exp(-sigmaT*distance(cameraPosition,vWorld));
          gl_FragColor=vec4(vec3(radiance),1.);}` });
    this.mesh = new Mesh(new PlaneGeometry(receiver.halfWidth * 2, receiver.halfHeight * 2), this.material);
    this.mesh.position.copy(receiver.center); this.mesh.rotation.y = receiver.angle;
  }
  update(hits, extinction) {
    const capacity = this.texture.image.width;
    this.data.fill(0);
    hits.forEach((hit, i) => { this.data.set([...hit.point, hit.power], i * 4); this.data.set([...hit.direction, hit.cosine], capacity * 4 + i * 4); });
    this.texture.needsUpdate = true; this.material.uniforms.hitCount.value = hits.length; this.material.uniforms.sigmaT.value = extinction;
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); this.texture.dispose(); }
}

export function receiverUniforms(receiver) {
  return { receiverEnabled: { value: Boolean(receiver) }, receiverPlane: { value: receiver ? new Vector4(...receiver.normal, receiver.normal.dot(receiver.center)) : new Vector4() },
    receiverCenter: { value: receiver?.center ?? new Vector3() }, receiverU: { value: receiver?.u ?? new Vector3(1, 0, 0) }, receiverV: { value: receiver?.v ?? new Vector3(0, 1, 0) },
    receiverSize: { value: new Vector3(receiver?.halfWidth ?? 0, receiver?.halfHeight ?? 0, 0) } };
}
