const ID=/^[A-Za-z0-9_-]{1,160}$/;
export const cellKey=(row,column)=>row+':'+column;
export const parity=row=>((row%2)+2)%2;
export function hash(text){
  let value=2166136261;for(const char of text)value=Math.imul(value^char.charCodeAt(0),16777619);
  value=Math.imul(value^(value>>>16),0x85ebca6b);value=Math.imul(value^(value>>>13),0xc2b2ae35);
  return (value^(value>>>16))>>>0;
}
export function scatterMessages(messages,previous={}){
  const slots=Object.create(null),occupied=new Set();
  for(const [id,slot] of Object.entries(previous||{})){
    if(!ID.test(id)||!Number.isSafeInteger(slot?.row)||!Number.isSafeInteger(slot?.column)||Math.abs(slot.row)>1000000||Math.abs(slot.column)>1000000)continue;
    const key=cellKey(slot.row,slot.column);if(occupied.has(key))continue;
    slots[id]={row:slot.row,column:slot.column};occupied.add(key);
  }
  const ordered=[...messages].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  for(const message of ordered){
    if(!ID.test(message.id)||slots[message.id])continue;
    const radius=Math.max(5,Math.ceil(Math.sqrt((occupied.size+1)*7)/2));
    let attempt=0,row,column;
    do{
      const span=2*(radius+Math.floor(attempt/200))+1;
      column=hash(message.id+':x:'+attempt)%span-Math.floor(span/2);
      row=hash(message.id+':y:'+attempt)%span-Math.floor(span/2);attempt++;
    }while(occupied.has(cellKey(row,column)));
    slots[message.id]={row,column};occupied.add(cellKey(row,column));
  }
  return {slots,messages:messages.filter(message=>slots[message.id]).map(message=>({...message,...slots[message.id]}))};
}
export function visibleCells(view,dimensions,overscan=2){
  const {stepX,stepY,viewWidth,viewHeight}=dimensions;
  const anchorColumn=Math.floor(-view.x/stepX),anchorRow=Math.floor(-view.y/stepY);
  const cells=[];
  const minRow=anchorRow-overscan,maxRow=Math.floor((viewHeight-view.y)/stepY)+overscan;
  for(let row=minRow;row<=maxRow;row++){
    const offset=parity(row)*stepX/2;
    const minColumn=Math.floor((-view.x-offset)/stepX)-overscan,maxColumn=Math.floor((viewWidth-view.x-offset)/stepX)+overscan;
    for(let column=minColumn;column<=maxColumn;column++)cells.push({row,column,key:cellKey(row,column),x:(column-anchorColumn)*stepX+offset,y:(row-anchorRow)*stepY});
  }
  return {cells,anchorColumn,anchorRow,x:view.x+anchorColumn*stepX,y:view.y+anchorRow*stepY};
}
export function messagePosition(message,dimensions){
  return {x:dimensions.viewWidth/2-(message.column*dimensions.stepX+parity(message.row)*dimensions.stepX/2+dimensions.bw/2),
    y:dimensions.viewHeight/2-(message.row*dimensions.stepY+dimensions.bh/2)};
}

// Five closed, reasonably round mouse strokes. Mere accumulated heading changes
// do not qualify: each loop also needs area, closure and a consistent direction.
export class CircleGesture{
  constructor(){this.reset();}
  reset(){this.points=[];this.loops=0;this.direction=0;this.lastTime=0;this.center=null;return 0;}
  add(x,y,time){
    if(!Number.isFinite(x+y+time))return this.reset();
    if(this.lastTime&&time-this.lastTime>1800)this.reset();
    this.lastTime=time;const previous=this.points.at(-1);
    if(previous){const d=Math.hypot(x-previous.x,y-previous.y);if(d>220){this.reset();this.lastTime=time;}else if(d<3)return this.loops;}
    this.points.push({x,y});
    if(this.points.length>320)this.points=this.points.filter((_,i,all)=>i%2===0||i===all.length-1);
    for(let start=0;start<=this.points.length-6;start++){
      // Discard an approach stroke: a loop may start anywhere in the recent path.
      if(Math.hypot(x-this.points[start].x,y-this.points[start].y)>220)continue;
      const p=this.points.slice(start),minX=Math.min(...p.map(a=>a.x)),maxX=Math.max(...p.map(a=>a.x)),minY=Math.min(...p.map(a=>a.y)),maxY=Math.max(...p.map(a=>a.y));
      const w=maxX-minX,h=maxY-minY,r=(w+h)/4;
      if(w<40||h<40||w/h<.5||w/h>2.2||Math.hypot(x-p[0].x,y-p[0].y)>r*1.2)continue;
      const cx=(maxX+minX)/2,cy=(maxY+minY)/2;
      let area=0,length=0,angle=0,radiusError=0;const deltas=[];
      for(let i=0;i<p.length;i++){
        const a=p[i],b=p[(i+1)%p.length];area+=a.x*b.y-b.x*a.y;length+=Math.hypot(b.x-a.x,b.y-a.y);
        radiusError+=Math.abs(Math.hypot(a.x-cx,a.y-cy)-r)/r;
        if(i<p.length-1){let delta=Math.atan2(b.y-cy,b.x-cx)-Math.atan2(a.y-cy,a.x-cx);if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;angle+=delta;deltas.push(delta);}
      }
      if(Math.abs(angle)<6.05||4*Math.PI*Math.abs(area/2)/(length*length)<.6||radiusError/p.length>.35)continue;
      const direction=Math.sign(area);if(this.direction&&this.direction!==direction)this.loops=0;
      // Retain the arc beyond the completed turn. Dropping it on every loop
      // made five irregularly sampled circles count as only four.
      let total=0;this.points=[{x,y}];
      for(let i=0;i<deltas.length;i++){
        const delta=deltas[i]*Math.sign(angle),next=total+delta;
        if(next>=6.05){const ratio=(6.05-total)/delta,a=p[i],b=p[i+1];this.points=[{x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio},...p.slice(i+1)];break;}
        total=next;
      }
      this.center={x:cx,y:cy};this.direction=direction;this.loops++;return this.loops;
    }
    return this.loops;
  }
}

export class WallSecret{
  constructor(){this.reset();}
  reset(){this.opens=0;this.pending=false;this.reason='';}
  open(userInitiated=true){if(userInitiated&&!this.pending&&++this.opens>10){this.pending=true;this.reason='messages';}return this.pending;}
  circles(count){if(count>=5&&!this.pending){this.pending=true;this.reason='circles';}return this.pending;}
}
