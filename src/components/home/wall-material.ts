import { MeshStandardMaterial } from 'three';
import { brickScale } from './wall-assembly';

/** Standard matte shading with a restrained local edge falloff; no shadow render target. */
export function makeWallMaterial(seam = false) {
  const material=new MeshStandardMaterial({color:'#ffffff',roughness:seam?1:.97,metalness:0});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float stoneFloor;\nvarying float vStoneHeight;\nvarying vec3 vStoneLocal;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>\nvStoneLocal=position/${brickScale.toFixed(3)};\nvStoneHeight=(instanceMatrix*vec4(position,1.)).y-stoneFloor;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vStoneHeight;\nvarying vec3 vStoneLocal;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        if(vStoneHeight < -.00001) discard;
        ${seam?'':`
        float edge=min(.56-abs(vStoneLocal.x),.24-abs(vStoneLocal.y));
        float softness=mix(.95,1.,smoothstep(.003,.040,edge));
        float faceLight=mix(.94,1.035,clamp((vStoneLocal.y+.24)/.48,0.,1.));
        diffuseColor.rgb*=softness*faceLight;`}`);
  };
  material.customProgramCacheKey=()=> `${seam?'lssh-mortar-foundation-v2':'lssh-matte-stone-v4'}:${brickScale}`;
  return material;
}
