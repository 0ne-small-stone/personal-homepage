import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { CubeTexture, DataTexture, RGBAFormat, ShaderMaterial, Vector2, NoToneMapping, type Mesh, type Scene } from 'three';
import { PRISM_LIGHT_LAYER } from './prism-ray';

const vertexShader = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-view.xyz);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * view;
  }
`;
const fragmentShader = /* glsl */`
  uniform sampler2D uScene;
  uniform samplerCube uEnvironment;
  uniform vec2 uResolution;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(vView);
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 ray = refract(-view, n, 1.0 / 1.45);
    vec2 displacement = (ray.xy + n.xy * 0.45) * 0.075;
    vec3 transmitted;
    transmitted.r = texture2D(uScene, clamp(uv + displacement * 1.025, 0.001, 0.999)).r;
    transmitted.g = texture2D(uScene, clamp(uv + displacement, 0.001, 0.999)).g;
    transmitted.b = texture2D(uScene, clamp(uv + displacement * 0.975, 0.001, 0.999)).b;
    float edge = pow(1.0 - abs(dot(n,view)), 4.0);
    vec3 worldView = normalize(vWorldPosition - cameraPosition);
    vec3 reflected = reflect(worldView, normalize(vWorldNormal));
    vec3 light = min(textureCube(uEnvironment, reflected).rgb, vec3(0.85));
    vec3 color = mix(transmitted, light, 0.015 + edge * 0.82);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function GlassOptics({mesh,low,reflectionScene}:{mesh:RefObject<Mesh|null>;low:boolean;reflectionScene:Scene}) {
  const {size}=useThree();
  const width=low?256:512;
  const target=useFBO(width,Math.max(128,Math.round(width*size.height/size.width)));
  const empty=useMemo(()=>{
    const image={data:new Uint8Array([0,0,0,255]),width:1,height:1};
    const texture=new DataTexture(image.data,1,1,RGBAFormat);texture.needsUpdate=true;
    const cube=new CubeTexture(Array.from({length:6},()=>texture));cube.needsUpdate=true;
    return {texture,cube};
  },[]);
  const material=useMemo(()=>new ShaderMaterial({toneMapped:false,vertexShader,fragmentShader,uniforms:{uScene:{value:target.texture},uEnvironment:{value:empty.cube},uResolution:{value:new Vector2()}}}),[target,empty]);
  useEffect(()=>()=>{material.dispose();empty.texture.dispose();empty.cube.dispose();},[material,empty]);
  useFrame(({gl,scene,camera})=>{
    const object=mesh.current;if(!object?.visible)return;
    const visible=object.visible,oldTarget=gl.getRenderTarget(),oldTone=gl.toneMapping;
    object.visible=false;
    const layers=camera.layers.mask;
    // Foreground WORKS cards are composited after glass and never enter its snapshot.
    try{camera.layers.disable(1);camera.layers.disable(PRISM_LIGHT_LAYER);gl.toneMapping=NoToneMapping;gl.setRenderTarget(target);gl.render(scene,camera);}finally{camera.layers.mask=layers;gl.setRenderTarget(oldTarget);gl.toneMapping=oldTone;object.visible=visible;}
    material.uniforms.uScene.value=target.texture;
    const environment=reflectionScene.environment ?? scene.environment;
    if(environment instanceof CubeTexture)material.uniforms.uEnvironment.value=environment;
    gl.getDrawingBufferSize(material.uniforms.uResolution.value);
  },-.5);
  return <primitive object={material} attach="material" />;
}
