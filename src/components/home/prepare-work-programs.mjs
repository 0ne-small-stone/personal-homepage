import {Group,Mesh,NoToneMapping} from 'three';

// Only the two measured card states and their real maps. No draw/clear, new
// target, visibility changes to the cards, or new ownership of shared assets.
export function prepareWorkPrograms(gl,scene,camera,cards,target,wall) {
  const shells=new Group(),textures=new Set();
  cards.traverse(object=>{
    if(!object.isMesh)return;
    shells.add(new Mesh(object.geometry,object.material));
    for(const material of Array.isArray(object.material)?object.material:[object.material])if(material.map)textures.add(material.map);
  });
  if(!shells.children.length)return false;
  const old={target:gl.getRenderTarget(),face:gl.getActiveCubeFace(),mip:gl.getActiveMipmapLevel(),tone:gl.toneMapping,layers:camera.layers.mask,wallVisible:wall?.visible};
  try {
    if(wall)wall.visible=false;
    // Final cards are rendered alone: layer 1, its actual light set and output.
    camera.layers.set(1);gl.compile(shells,camera,scene);
    // Drei's existing capture uses the original all-layer camera and a linear
    // target. Reuse the portal's owned target; no extra target is created.
    camera.layers.mask=old.layers;gl.toneMapping=NoToneMapping;gl.setRenderTarget(target);
    gl.compile(shells,camera,scene);
    for(const texture of textures)gl.initTexture(texture);
    return true;
  } finally {
    if(wall)wall.visible=old.wallVisible;
    camera.layers.mask=old.layers;gl.toneMapping=old.tone;gl.setRenderTarget(old.target,old.face,old.mip);
  }
}
