import {BufferGeometry,Float32BufferAttribute,Group,InstancedMesh,Mesh,NoToneMapping,OrthographicCamera,Scene} from 'three';

// Submit only the measured wall and private-portal material variants. No draw,
// clear, extra loading gate or clock. Compile shells share the real attributes
// and materials, but never reparent or change the real meshes.
export function prepareWallPrograms(gl,scene,camera,wall,target,portalMaterial) {
  const shells=new Group(),instances=[];
  wall.traverse(object=>{
    if(!object.isInstancedMesh)return;
    const mesh=new InstancedMesh(object.geometry,object.material,1);
    mesh.instanceMatrix=object.instanceMatrix;mesh.instanceColor=object.instanceColor;
    shells.add(mesh);instances.push(mesh);
  });
  if(!instances.length)return false;
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3));
  geometry.setAttribute('uv',new Float32BufferAttribute([0,2,0,0,2,0],2));
  const quad=new Mesh(geometry,portalMaterial),quadCamera=new OrthographicCamera(-1,1,1,-1,0,1);
  const old={target:gl.getRenderTarget(),face:gl.getActiveCubeFace(),mip:gl.getActiveMipmapLevel(),tone:gl.toneMapping,layers:camera.layers.mask,visible:wall.visible};
  const lights=[];
  scene.traverse(object=>{if(object.isLight)lights.push([object.layers,object.layers.mask]);});
  try {
    wall.visible=true;
    // Exact main-world lighting with the wall visible (layer 0 + 2).
    camera.layers.set(0);camera.layers.enable(2);
    gl.compile(shells,camera,scene);
    // Exact linear offscreen wall path. Target dimensions do not enter the
    // program key; leave the portal's real capture size/cache uninitialized.
    for(const [layers]of lights)layers.enable(2);
    camera.layers.set(2);gl.toneMapping=NoToneMapping;gl.setRenderTarget(target);
    gl.compile(shells,camera,scene);
    gl.setRenderTarget(old.target,old.face,old.mip);gl.toneMapping=old.tone;
    // FullScreenQuad renders a private object against an empty scene/camera.
    gl.compile(quad,quadCamera,new Scene());
    return true;
  } finally {
    wall.visible=old.visible;for(const [layers,mask]of lights)layers.mask=mask;
    camera.layers.mask=old.layers;gl.toneMapping=old.tone;gl.setRenderTarget(old.target,old.face,old.mip);
    geometry.dispose();for(const mesh of instances)mesh.dispose();
  }
}
