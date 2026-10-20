import {hash} from './wall-world.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const SPACE={near:80,far:3200,cell:560};
export const focalFor=d=>Math.max(480,d.viewHeight*.95);
export function projectStar(point,view,d){
  const depth=point.z-(view.z||0);if(depth<SPACE.near||depth>SPACE.far)return null;
  const scale=focalFor(d)/depth,cx=d.viewWidth/2-view.x,cy=d.viewHeight/2-view.y;
  return {x:d.viewWidth/2+(point.x-cx)*scale,y:d.viewHeight/2+(point.y-cy)*scale,depth,scale};
}
export function spaceWindow(view,d){
  const cx=d.viewWidth/2-view.x,cy=d.viewHeight/2-view.y,cz=view.z||0,f=focalFor(d),c=SPACE.cell;
  return {minX:Math.floor((cx-d.viewWidth/2*SPACE.far/f)/c)-1,maxX:Math.floor((cx+d.viewWidth/2*SPACE.far/f)/c)+1,
    minY:Math.floor((cy-d.viewHeight/2*SPACE.far/f)/c)-1,maxY:Math.floor((cy+d.viewHeight/2*SPACE.far/f)/c)+1,
    minZ:Math.floor((cz+SPACE.near)/c),maxZ:Math.floor((cz+SPACE.far)/c)};
}
// Eight jittered octants per cell: equal regional density without a visible grid.
export function starsInCell(x,y,z){
  const key=x+':'+y+':'+z;
  return Array.from({length:8},(_,n)=>{const seed=key+':'+n,random=axis=>hash(seed+axis)/4294967296;
    return {x:(x+((n&1)+.12+random('x')*.76)/2)*SPACE.cell,
      y:(y+(((n>>1)&1)+.12+random('y')*.76)/2)*SPACE.cell,
      z:(z+(((n>>2)&1)+.12+random('z')*.76)/2)*SPACE.cell,bright:random('b')};});
}
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function starVisibility(p,d,nearFade=180){
  if(!p)return 0;
  const edge=Math.min(p.x+64,d.viewWidth+64-p.x,p.y+64,d.viewHeight+64-p.y);
  return smooth((p.depth-SPACE.near)/nearFade)*smooth((SPACE.far-p.depth)/420)*smooth(edge/144);
}
// World cells are stable on revisiting. No idle clock; only camera/resize draws.
export function mountStars(canvas){
  const ctx=canvas.getContext('2d',{alpha:true}),cache=new Map();let width=0,height=0,ratio=0,frames=0;
  return {render(view,d){
    if(!ctx)return;
    const w=d.viewWidth,h=d.viewHeight,dpr=Math.min(devicePixelRatio||1,1.25,Math.sqrt(2200000/(w*h)));
    if(width!==w||height!==h||ratio!==dpr){width=w;height=h;ratio=dpr;canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
    ctx.clearRect(0,0,w,h);const bounds=spaceWindow(view,d),used=new Set();let drawn=0;
    for(let z=bounds.minZ;z<=bounds.maxZ;z++)for(let y=bounds.minY;y<=bounds.maxY;y++)for(let x=bounds.minX;x<=bounds.maxX;x++){
      const key=x+':'+y+':'+z;used.add(key);let points=cache.get(key);
      if(!points){points=starsInCell(x,y,z);cache.set(key,points);}
      for(const point of points){
        const p=projectStar(point,view,d),visibility=starVisibility(p,d);
        if(!p||visibility<.002||drawn>=1400)continue;
        const alpha=(.3+point.bright*.62)*visibility;
        const radius=(.5+point.bright)*clamp(p.scale,.32,3.5);ctx.fillStyle=`rgba(234,234,225,${alpha.toFixed(3)})`;
        if(radius<1)ctx.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);
        else{ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();}
        if(point.bright>.98&&p.depth<1100){ctx.fillStyle=`rgba(234,234,225,${alpha*.28})`;ctx.fillRect(p.x-radius*3,p.y-.35,radius*6,.7);ctx.fillRect(p.x-.35,p.y-radius*3,.7,radius*6);}
        drawn++;
      }
    }
    for(const key of cache.keys())if(!used.has(key))cache.delete(key);
    canvas.dataset.frames=String(++frames);canvas.dataset.points=String(drawn);canvas.dataset.cells=String(cache.size);canvas.dataset.depth=String(view.z||0);
  }};
}
