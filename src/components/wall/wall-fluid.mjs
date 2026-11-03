const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Small-grid adaptation of the project's pressure / projection / advection
// pipeline. Positions stay on the CPU so the painted quad and DOM hit area agree.
export class WallFlowField {
  constructor(width,height){
    this.width=Math.max(1,width);this.height=Math.max(1,height);
    const scale=40/Math.max(this.width,this.height);
    this.nx=Math.max(12,Math.round(this.width*scale));this.ny=Math.max(12,Math.round(this.height*scale));
    this.cx=this.width/(this.nx-1);this.cy=this.height/(this.ny-1);
    this.length=this.nx*this.ny;
    for(const name of ['u','v','tu','tv','p','tp','div','curl','x','y','tx','ty'])this[name]=new Float32Array(this.length);
    this.maxWarp=0;this.maxSpeed=0;this.steps=0;
  }
  clear(){
    for(const name of ['u','v','tu','tv','p','tp','div','curl','x','y','tx','ty'])this[name].fill(0);
    this.maxWarp=0;this.maxSpeed=0;
  }
  sample(a,gx,gy){
    gx=clamp(gx,0,this.nx-1.001);gy=clamp(gy,0,this.ny-1.001);
    const i=Math.floor(gx),j=Math.floor(gy),s=gx-i,t=gy-j,k=j*this.nx+i;
    return (a[k]*(1-s)+a[k+1]*s)*(1-t)+(a[k+this.nx]*(1-s)+a[k+this.nx+1]*s)*t;
  }
  offset(px,py){
    if(px<0||py<0||px>this.width||py>this.height)return [0,0];
    return [this.sample(this.x,px/this.cx,py/this.cy),this.sample(this.y,px/this.cx,py/this.cy)];
  }
  inject(px,py,dx,dy){
    const radius=Math.min(140,Math.max(90,this.width*.11)),r2=radius*radius;
    const fx=clamp(dx*1.6,-100,100),fy=clamp(dy*1.6,-100,100);
    const reach=radius*Math.sqrt(2.5),minX=Math.max(1,Math.floor((px-reach)/this.cx)),maxX=Math.min(this.nx-2,Math.ceil((px+reach)/this.cx));
    const minY=Math.max(1,Math.floor((py-reach)/this.cy)),maxY=Math.min(this.ny-2,Math.ceil((py+reach)/this.cy));
    for(let j=minY;j<=maxY;j++)for(let i=minX;i<=maxX;i++){
      const distance=(i*this.cx-px)**2+(j*this.cy-py)**2;
      if(distance>r2*2.5)continue;
      const k=j*this.nx+i,weight=Math.exp(-distance*3.4/r2);
      this.u[k]=clamp(this.u[k]+fx*weight,-130,130);this.v[k]=clamp(this.v[k]+fy*weight,-130,130);
    }
    this.maxSpeed=Math.max(this.maxSpeed,Math.hypot(fx,fy));
  }
  divergence(){
    let sum=0;
    for(let j=1;j<this.ny-1;j++)for(let i=1;i<this.nx-1;i++){
      const k=j*this.nx+i;
      const d=(this.u[k+1]-this.u[k-1])/(2*this.cx)+(this.v[k+this.nx]-this.v[k-this.nx])/(2*this.cy);
      this.div[k]=d;sum+=d*d;
    }
    return Math.sqrt(sum/this.length);
  }
  project(iterations=8){
    this.divergence();this.p.fill(0);this.tp.fill(0);
    const ax=1/(this.cx*this.cx),ay=1/(this.cy*this.cy),den=2*(ax+ay);
    for(let n=0;n<iterations;n++){
      for(let j=1;j<this.ny-1;j++)for(let i=1;i<this.nx-1;i++){
        const k=j*this.nx+i;
        this.tp[k]=((this.p[k-1]+this.p[k+1])*ax+(this.p[k-this.nx]+this.p[k+this.nx])*ay-this.div[k])/den;
      }
      [this.p,this.tp]=[this.tp,this.p];
    }
    for(let j=1;j<this.ny-1;j++)for(let i=1;i<this.nx-1;i++){
      const k=j*this.nx+i;
      this.u[k]-=(this.p[k+1]-this.p[k-1])/(2*this.cx);
      this.v[k]-=(this.p[k+this.nx]-this.p[k-this.nx])/(2*this.cy);
    }
  }
  step(seconds){
    const dt=clamp(seconds,1/240,1/25),damping=Math.exp(-6.5*dt),relax=Math.exp(-7.5*dt);
    for(let j=1;j<this.ny-1;j++)for(let i=1;i<this.nx-1;i++){
      const k=j*this.nx+i;
      this.curl[k]=(this.v[k+1]-this.v[k-1])/(2*this.cx)-(this.u[k+this.nx]-this.u[k-this.nx])/(2*this.cy);
    }
    // Curl confinement keeps a broad stroke from becoming a rigid translation.
    for(let j=2;j<this.ny-2;j++)for(let i=2;i<this.nx-2;i++){
      const k=j*this.nx+i;
      const gx=Math.abs(this.curl[k+1])-Math.abs(this.curl[k-1]);
      const gy=Math.abs(this.curl[k+this.nx])-Math.abs(this.curl[k-this.nx]);
      const norm=Math.hypot(gx,gy)+1e-5,force=this.curl[k]*1.6*dt;
      this.u[k]+=gy/norm*force;this.v[k]-=gx/norm*force;
    }
    this.project();this.maxWarp=0;this.maxSpeed=0;
    for(let j=1;j<this.ny-1;j++)for(let i=1;i<this.nx-1;i++){
      const k=j*this.nx+i,bx=i-this.u[k]*dt/this.cx,by=j-this.v[k]*dt/this.cy;
      const u=this.sample(this.u,bx,by)*damping,v=this.sample(this.v,bx,by)*damping;
      this.tu[k]=u;this.tv[k]=v;
      let x=(this.sample(this.x,bx,by)+u*dt*.75)*relax,y=(this.sample(this.y,bx,by)+v*dt*.75)*relax;
      const length=Math.hypot(x,y),limit=this.width<651?5:7;
      if(length>limit){x*=limit/length;y*=limit/length;}
      this.tx[k]=x;this.ty[k]=y;
      this.maxWarp=Math.max(this.maxWarp,Math.hypot(x,y));this.maxSpeed=Math.max(this.maxSpeed,Math.hypot(u,v));
    }
    [this.u,this.tu]=[this.tu,this.u];[this.v,this.tv]=[this.tv,this.v];
    [this.x,this.tx]=[this.tx,this.x];[this.y,this.ty]=[this.ty,this.y];this.steps++;
    return this.maxWarp>.045||this.maxSpeed>.18;
  }
}

// Map a rectangle onto a convex quad, including its text and native hit testing.
// The order is top-left, top-right, bottom-right, bottom-left.
export function quadMatrix(width,height,quad){
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=quad;
  const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,sx=x0-x1+x2-x3,sy=y0-y1+y2-y3;
  const den=dx1*dy2-dx2*dy1;
  if(!Number.isFinite(den)||Math.abs(den)<1e-6)return null;
  let sign=0;
  for(let i=0;i<4;i++){
    const a=quad[i],b=quad[(i+1)%4],c=quad[(i+2)%4];
    const cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
    if(cross<=0||sign&&Math.sign(cross)!==sign)return null;sign=Math.sign(cross);
  }
  const g=(sx*dy2-dx2*sy)/den,h=(dx1*sy-sx*dy1)/den;
  const matrix=[(x1-x0+g*x1)/width,(y1-y0+g*y1)/width,0,g/width,
    (x3-x0+h*x3)/height,(y3-y0+h*y3)/height,0,h/height,0,0,1,0,x0,y0,0,1];
  return matrix.every(Number.isFinite)?matrix:null;
}

export function mountWallFluid({stage,wall,button,reduced,position}){
  const events=new AbortController(),eventOptions={signal:events.signal};
  let field,tiles=[],raf=0,lastTime=0,accumulator=0,previous=null,frozen=false,userPaused=false,frames=0,peak=0,disposed=false,pending=null,injections=0,writes=0;
  const blocked=()=>disposed||frozen||userPaused||reduced()||document.hidden;
  function state(){
    stage.dataset.flowState=reduced()?'reduced':userPaused?'paused':document.hidden?'hidden':frozen?'frozen':raf?'active':'idle';
    button.disabled=reduced();button.setAttribute('aria-pressed',String(userPaused||reduced()));
    button.setAttribute('aria-label',reduced()?'已按减少动画设置停用墙面波动':userPaused?'恢复墙面波动':'暂停墙面波动');
    button.title=button.getAttribute('aria-label');
  }
  function stop(){cancelAnimationFrame(raf);raf=0;lastTime=0;accumulator=0;previous=null;pending=null;state();}
  function restore(){
    for(const tile of tiles){tile.node.style.removeProperty('transform');tile.node.style.removeProperty('--flow-light');tile.changed=false;tile.matrix='';}
    field?.clear();stage.dataset.flowWarp='0';stage.dataset.flowRendered='0';
  }
  function render(){
    const pan=position();let rendered=0;
    for(const tile of tiles){
      const x=tile.x+pan.x,y=tile.y+pan.y;
      if(x+tile.w<-50||x>field.width+50||y+tile.h<-50||y>field.height+50){
        if(tile.changed){tile.node.style.removeProperty('transform');tile.node.style.removeProperty('--flow-light');tile.changed=false;tile.matrix='';}continue;
      }
      const offsets=[[0,0],[tile.w,0],[tile.w,tile.h],[0,tile.h]].map(([a,b])=>field.offset(x+a,y+b));
      const amplitude=Math.max(...offsets.map(([x,y])=>Math.hypot(x,y)));
      if(amplitude<.065){if(tile.changed){tile.node.style.removeProperty('transform');tile.changed=false;tile.matrix='';writes++;}continue;}
      const quad=offsets.map(([a,b],i)=>[Math.round(a*50)/50+(i===1||i===2?tile.w:0),Math.round(b*50)/50+(i>1?tile.h:0)]);
      const matrix=quadMatrix(tile.w,tile.h,quad);
      if(matrix){
        const value='matrix3d('+matrix.map(n=>Math.abs(n)<1e-8?0:Number(n.toFixed(7))).join(',')+')';
        if(tile.matrix!==value){tile.node.style.transform=value;tile.matrix=value;writes++;}tile.changed=true;rendered++;
      }else if(tile.changed){tile.node.style.removeProperty('transform');tile.changed=false;tile.matrix='';writes++;}
    }
    stage.dataset.flowRendered=String(rendered);stage.dataset.flowWrites=String(writes);
  }
  function tick(time){
    raf=0;if(blocked()){state();return;}
    accumulator+=lastTime?Math.min((time-lastTime)/1000,.05):1/30;lastTime=time;
    if(accumulator<1/32){raf=requestAnimationFrame(tick);return;}
    if(pending){field.inject(pending.x,pending.y,pending.dx,pending.dy);pending=null;stage.dataset.flowInjections=String(++injections);}
    const active=field.step(accumulator);accumulator=0;frames++;peak=Math.max(peak,field.maxWarp);
    stage.dataset.flowFrames=String(frames);stage.dataset.flowPeak=peak.toFixed(3);stage.dataset.flowWarp=field.maxWarp.toFixed(3);
    if(active){render();raf=requestAnimationFrame(tick);}else{restore();lastTime=0;}
    state();
  }
  function wake(){if(!blocked()&&!raf){raf=requestAnimationFrame(tick);state();}}
  function refresh(dimensions){
    stop();restore();field=new WallFlowField(stage.clientWidth,stage.clientHeight);
    retile(dimensions);
    stage.dataset.flowCells=String(field.length);stage.dataset.flowFrames=String(frames);state();
  }
  function retile(dimensions){
    const previousTiles=new Map(tiles.map(tile=>[tile.node,tile]));
    tiles=Array.from(wall.children).map(node=>({node,x:Number.parseFloat(node.style.left)||0,y:Number.parseFloat(node.style.top)||0,w:dimensions.bw,h:dimensions.bh,changed:previousTiles.get(node)?.changed||false}));
    for(const tile of tiles){
      if(previousTiles.has(tile.node))continue;
      const row=Number(tile.node.dataset.row),column=Number(tile.node.dataset.column);
      // A restrained, non-periodic tonal rhythm belongs to the drawn blocks.
      const hash=Math.sin(row*127.1+column*311.7)*43758.5453;
      tile.node.style.setProperty('--brick-tone',((hash-Math.floor(hash))*.022-.011).toFixed(4));
    }
    if(field?.maxWarp>.001){if(userPaused||frozen)render();else wake();}
  }
  stage.addEventListener('pointermove',event=>{
    if(blocked()||!event.isPrimary||event.pointerType!=='mouse'&&!event.buttons){previous=null;return;}
    const point={x:event.clientX,y:event.clientY,id:event.pointerId};
    if(previous?.id===point.id){
      const dx=point.x-previous.x,dy=point.y-previous.y,distance=Math.hypot(dx,dy);
      if(distance>.3&&distance<220){
        pending={x:point.x,y:point.y,dx:clamp((pending?.dx||0)+dx,-48,48),dy:clamp((pending?.dy||0)+dy,-48,48)};
        wake();
      }
    }
    previous=point;
  },{...eventOptions,passive:true,capture:true});
  for(const name of ['pointerleave','pointercancel','pointerup'])stage.addEventListener(name,()=>{previous=null;},eventOptions);
  button.addEventListener('click',()=>{userPaused=!userPaused;stop();if(!blocked()&&(field.maxWarp>.045||field.maxSpeed>.18))wake();state();},eventOptions);
  document.addEventListener('visibilitychange',()=>{stop();restore();},eventOptions);
  window.addEventListener('blur',()=>{stop();restore();},eventOptions);
  return {
    refresh,retile,
    freeze(value){frozen=value;stop();if(!blocked()&&field&&(field.maxWarp>.045||field.maxSpeed>.18))wake();state();},
    preferences(){stop();restore();state();},
    suspend(){stop();restore();},
    dispose(){disposed=true;stop();restore();events.abort();tiles=[];}
  };
}
