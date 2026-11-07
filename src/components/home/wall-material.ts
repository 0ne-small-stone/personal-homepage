import { MeshStandardMaterial } from 'three';
import { brickScale } from './wall-assembly';

/** Standard matte shading with a restrained local edge falloff; no shadow render target. */
export function makeWallMaterial(seam = false) {
  const material=new MeshStandardMaterial({color:'#ffffff',roughness:seam?1:.97,metalness:0});
  material.onBeforeCompile=shader=>{
    const brickVaryings=seam?'':'varying vec3 vStoneLocal;\nvarying vec3 vStoneFront;';
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      attribute float stoneFloor;
      varying float vStoneHeight;
      ${brickVaryings}`)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vStoneHeight=(instanceMatrix*vec4(position,1.)).y-stoneFloor;
        ${seam?'':`vStoneLocal=position/${brickScale};
        vStoneFront=normalMatrix*instanceMatrix[2].xyz;`}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying float vStoneHeight;
      ${brickVaryings}`);
    if(!seam) {
      // Use a screen-aware falloff and let the bevel share some of the front lighting.
      shader.fragmentShader=shader.fragmentShader
        .replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
          float frontWeight=.93*smoothstep(-.027,.030,vStoneLocal.z);
          normal=normalize(mix(normal,normalize(vStoneFront),frontWeight));`)
        .replace('#include <color_fragment>',`#include <color_fragment>
          vec2 edge=vec2(.56,.24)-abs(vStoneLocal.xy);
          vec2 feather=max(vec2(.027),1.35*fwidth(vStoneLocal.xy));
          vec2 face=smoothstep(vec2(0.),feather,edge);
          diffuseColor.rgb*=mix(.93,1.,face.x*face.y);`);
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      if(vStoneHeight < -.00001) discard;`);
  };
  material.customProgramCacheKey=()=> `${seam?'lssh-mortar-foundation-v3':'lssh-matte-stone-v6'}:${brickScale}`;
  return material;
}
