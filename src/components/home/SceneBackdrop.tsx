import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, ShaderMaterial, Vector2, Vector3, type Mesh, MathUtils } from 'three';
import type { JourneyModel } from './scene-state';
import { backdropState } from './backdrop-state';

export default function SceneBackdrop({ model, mobile, quiet }: { model: JourneyModel; mobile: boolean; quiet: boolean }) {
  const ref = useRef<Mesh>(null);
  const { viewport, camera, size } = useThree();
  const aspect = size.width / size.height;
  const width = mobile ? 768 : 1536, height = Math.round(width / aspect);
  const overscan = 1.12;
  const center = useMemo(() => new Vector3(0, 0, -2), []);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const brickWidth = mobile ? 128 : 256, brickHeight = brickWidth / 2;
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height);
    for (let row=0;row<Math.ceil(height/brickHeight);row++) for(let col=-1;col<=Math.ceil(width/brickWidth);col++) {
      const x=col*brickWidth+(row%2)*brickWidth/2, y=row*brickHeight;
      const gradient=ctx.createLinearGradient(x,y,x+brickWidth,y+brickHeight);
      gradient.addColorStop(0,'#111'); gradient.addColorStop(1,'#050505');
      ctx.fillStyle=gradient;ctx.fillRect(x+1,y+1,brickWidth-2,brickHeight-2);
    }
    // SYSTEM 9.3.1 coordinates describe the visible frame, within the overscan.
    const frameX = (x: number) => width * (.5 + (x - .5) / overscan);
    const frameY = (y: number) => height * (.5 + (y - .5) / overscan);
    // A sparse curved surface in the right light field, measured in CSS pixels.
    // It shares this texture's sampling, flow, fade and disposal with the bricks.
    const spacing = mobile ? 72 : 80;
    const weight = (x: number, y: number) => {
      const u = x / size.width, v = y / size.height;
      const distance = Math.hypot((u - 1.04) / .31, (v - .64) / .58);
      const field = 1 - MathUtils.smoothstep(distance, .18, 1);
      const edge = MathUtils.smoothstep(u, .74, .92);
      const top = MathUtils.smoothstep(v, .12, .22);
      const bottom = 1 - MathUtils.smoothstep(v, mobile ? .55 : .78, mobile ? .7 : .93);
      const title = (1 - MathUtils.smoothstep(u, .86, .94))
        * MathUtils.smoothstep(v, .2, .3) * (1 - MathUtils.smoothstep(v, .64, .74));
      // Two crossing strokes stay below the layer's .08 opacity ceiling.
      return .04 * field * edge * top * bottom * (1 - .75 * title);
    };
    const gridLine = (point: (t: number) => [number, number]) => {
      const start = point(0), end = point(1);
      const ink = ctx.createLinearGradient(...start, ...end);
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, [x, y] = point(t);
        ink.addColorStop(t, `rgba(237,237,237,${weight(x, y)})`);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ink; ctx.stroke();
    };
    ctx.save();
    ctx.translate(frameX(0), frameY(0));
    ctx.scale(width / (overscan * size.width), height / (overscan * size.height));
    ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let x = size.width * .76; x <= size.width * 1.12; x += spacing) {
      gridLine(t => {
        const v = .1 + .88 * t;
        return [x + size.width * .045 * Math.cos((v - .55) * Math.PI), size.height * v];
      });
    }
    for (let y = size.height * .1; y <= size.height * .98; y += spacing) {
      gridLine(t => {
        const u = .74 + .38 * t;
        return [size.width * u, y + size.height * .08 * ((u - 1.05) / .32) ** 2];
      });
    }
    ctx.restore();
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [width, height, mobile, size.width, size.height]);
  useEffect(() => () => texture.dispose(), [texture]);
  const material=useMemo(()=>new ShaderMaterial({depthWrite:false,toneMapped:false,
    uniforms:{original:{value:texture},resolution:{value:new Vector2()},weights:{value:new Vector2(1,0)},
      farOffset:{value:new Vector2()},gridOffset:{value:new Vector2()},lightCenter:{value:new Vector2()},strength:{value:[.52,.048,.048,36/255]},spacing:{value:104},mobile:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D original;uniform vec2 resolution;uniform vec2 weights;
      uniform vec2 farOffset;uniform vec2 gridOffset;uniform vec2 lightCenter;uniform vec4 strength;uniform float spacing;uniform float mobile;
      void main(){
        vec2 screen=(vUv-.5)*1.12+.5;screen.y=1.-screen.y;
        vec3 base=sRGBTransferOETF(texture2D(original,vUv)).rgb*weights.x;
        if(weights.y>0.){
          vec2 uv=vUv+vec2(farOffset.x,-farOffset.y)/1.12;
          vec3 far=sRGBTransferOETF(texture2D(original,uv)).rgb*strength.x;
          float controls=smoothstep(.04,.16,screen.y)*(1.-smoothstep(.82,.97,screen.y));
          float title=smoothstep(mix(.38,.43,mobile),mix(.50,.58,mobile),screen.y)*(1.-smoothstep(.88,.98,screen.y));
          title*=mix(1.-smoothstep(.38,.58,screen.x),1.,mobile);
          float safe=controls*(1.-.88*title);
          vec2 d=(screen-lightCenter)/vec2(.40,.58);float field=exp(-2.*dot(d,d));
          vec2 p=screen-gridOffset;
          vec2 curve=(p+vec2(.035*cos((p.y-.5)*3.14159265),.035*(p.x-.5)*(p.x-.5)))*resolution;
          vec2 dist=abs(fract(curve/spacing+.5)-.5)*spacing;
          float nearest=min(dist.x,dist.y),aa=max(fwidth(nearest),.5);
          float line=1.-smoothstep(.15,.15+.7*aa,nearest);
          vec3 space=far*mix(.36,1.,safe)+vec3(field*safe*(strength.y+strength.z*line));
          base+=min(space,vec3(strength.w))*weights.y;
        }
        // Keep the background limit in display values; output linear radiance
        // for the glass capture and Three's normal display conversion.
        gl_FragColor=sRGBTransferEOTF(vec4(base,1.));
        #include <colorspace_fragment>
      }`}),[texture]);
  useEffect(()=>()=>{material.dispose();delete document.body.dataset.homeBackdrop;},[material]);
  useFrame(() => {
    if (!ref.current) return;
    const m=model.motion,state=backdropState(m.rendered.index,m.rendered.intro,m.raw.outro,m.rendered.prepare,model.progress,mobile,quiet);
    ref.current.visible = state.intro+state.weight > .001;
    material.uniforms.resolution.value.set(size.width,size.height);
    material.uniforms.weights.value.set(state.intro,state.weight);
    material.uniforms.farOffset.value.fromArray(state.farOffset);material.uniforms.gridOffset.value.fromArray(state.gridOffset);
    material.uniforms.lightCenter.value.fromArray(state.light);material.uniforms.spacing.value=state.spacing;material.uniforms.mobile.value=mobile?1:0;
    const strength=material.uniforms.strength.value as number[];
    strength[0]=state.farBrightness;strength[1]=state.fieldPeak;strength[2]=state.gridPeak;strength[3]=state.ceiling;
    const view = viewport.getCurrentViewport(camera, center);
    ref.current.position.copy(center);
    ref.current.scale.set(view.width * overscan, view.height * overscan, 1);
    if(document.documentElement.dataset.motionDiagnostics==='true') {
      ref.current.updateMatrixWorld(true);
      const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>new Vector3(x,y,0).applyMatrix4(ref.current!.matrixWorld).project(camera).toArray());
      document.body.dataset.homeBackdrop=JSON.stringify({...state,visible:ref.current.visible,texture:texture.uuid,textureSize:[width,height],corners});
    }
  },-1);
  return <mesh ref={ref} position={[0,0,-2]}>
    <planeGeometry /><primitive object={material} attach="material" />
  </mesh>;
}
