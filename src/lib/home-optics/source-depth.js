import {WebGLRenderTarget,FloatType,RedFormat,ShaderMaterial,Mesh,Scene} from 'three';
// The first camera/glass intersection is wavelength-independent. Rasterize the
// actual mesh once per pose, then reuse its world distance for all source beams.
export class SourceDepth{
 constructor(geometry){this.target=new WebGLRenderTarget(1,1,{type:FloatType,format:RedFormat,depthBuffer:true});this.material=new ShaderMaterial({toneMapped:false,vertexShader:'varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:'varying vec3 vWorld;void main(){gl_FragColor=vec4(length(vWorld-cameraPosition),0.,0.,1.);}'});this.mesh=new Mesh(geometry,this.material);this.mesh.matrixAutoUpdate=false;this.scene=new Scene();this.scene.add(this.mesh);}
 resize(w,h){this.target.setSize(w,h);}
 update(renderer,prism,camera){this.mesh.matrix.copy(prism.matrixWorld);this.mesh.visible=prism.visible;renderer.setRenderTarget(this.target);renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.clear();renderer.render(this.scene,camera);renderer.setClearColor(0,1);}
 dispose(){this.target.dispose();this.material.dispose();}
}
