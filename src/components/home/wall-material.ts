import { MeshStandardMaterial } from 'three';

/** Standard matte shading with a restrained local edge falloff; no shadow render target. */
export function makeWallMaterial() {
  const material=new MeshStandardMaterial({color:'#ffffff',roughness:.97,metalness:0});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStoneLocal;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvStoneLocal=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStoneLocal;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float edge=min(.56-abs(vStoneLocal.x),.24-abs(vStoneLocal.y));
        float softness=mix(.95,1.,smoothstep(.003,.040,edge));
        float faceLight=mix(.94,1.035,clamp((vStoneLocal.y+.24)/.48,0.,1.));
        diffuseColor.rgb*=softness*faceLight;`);
  };
  material.customProgramCacheKey=()=> 'lssh-matte-stone-v2';
  return material;
}
