import * as THREE from 'three';

export function createStarfield(scene){
  const geometry=new THREE.PlaneGeometry(2,2);
  const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
    uniforms:{uVisibility:{value:0},uAspect:{value:1},uTangent:{value:1},uOffset:{value:new THREE.Vector2()}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}`,
    fragmentShader:`
      varying vec2 vUv;uniform float uVisibility,uAspect,uTangent;uniform vec2 uOffset;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float stars(vec2 uv,float scale,float threshold){
        vec2 cell=floor(uv*scale),local=fract(uv*scale)-.5;
        float seed=hash(cell),enabled=step(threshold,seed);
        vec2 center=vec2(hash(cell+17.3),hash(cell+63.7))*.65-.325;
        float d=length(local-center);
        return enabled*(exp(-d*d/.0018)*mix(.035,.14,hash(cell+41.1))+exp(-d*d/.013)*.006);
      }
      void main(){
        vec2 ray=(vUv-.5)*vec2(uAspect,1.0)*uTangent;
        vec2 sky=ray+uOffset;
        float light=stars(sky,65.0,.981)+stars(sky*1.11+7.3,120.0,.996);
        vec3 color=vec3(.75,.83,1.0)*light;
        gl_FragColor=vec4(color*uVisibility,1.0);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=-1000;scene.add(mesh);
  return {
    update(progress,aspect,fov,x,y){
      const t=Math.max(0,Math.min(1,(progress-.25)/.6));
      material.uniforms.uVisibility.value=t*t*(3-2*t);material.uniforms.uAspect.value=aspect;
      material.uniforms.uTangent.value=Math.tan(THREE.MathUtils.degToRad(fov/2));
      material.uniforms.uOffset.value.set(x*.0001,-y*.0001);mesh.visible=progress>0;
    },
    dispose(){scene.remove(mesh);geometry.dispose();material.dispose();}
  };
}
