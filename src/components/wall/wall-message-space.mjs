import {hash} from './wall-world.mjs';
import {SPACE,focalFor,projectStar,starVisibility} from './wall-stars.mjs';
const random=seed=>hash(seed)/4294967296;
const outside=(p,d)=>!p||p.x< -64||p.x>d.viewWidth+64||p.y< -64||p.y>d.viewHeight+64;
function worldAt(x,y,depth,view,d){const scale=focalFor(d)/depth;return {x:d.viewWidth/2-view.x+(x-d.viewWidth/2)/scale,
  y:d.viewHeight/2-view.y+(y-d.viewHeight/2)/scale,z:(view.z||0)+depth};}
// One live location per real record. Recycle only after all its light is offscreen.
// New positions start invisible and fade with camera travel; resize/locate refills immediately.
export function createMessageSpace(){
  const locations=new Map(),generations=new Map(),births=new Map();let previous=null,previousSize=null,recycled=0;
  function candidate(id,index,count,view,d,entry,existing){
    const generation=generations.get(id)||0,seed=id+':'+generation+':'+Math.floor(view.z/SPACE.cell)+':'+Math.floor(view.x/SPACE.cell)+':'+Math.floor(view.y/SPACE.cell);
    let best=null,bestScore=-1;
    for(let attempt=0;attempt<24;attempt++){
      const r=axis=>random(seed+':'+attempt+axis);
      let x=(.08+.84*r('x'))*d.viewWidth,y=(.12+.76*r('y'))*d.viewHeight;
      let depth=650+(index+r('z')*.65)/Math.max(1,count)*2300;
      if(entry==='far')depth=SPACE.far-.01;
      // Backward travel replenishes across the view, revealed over travelled distance.
      // Spawning on the near plane would collapse every star toward the centre.
      else if(entry==='left')x=-63.99;
      else if(entry==='right')x=d.viewWidth+63.99;
      else if(entry==='top')y=-63.99;
      else if(entry==='bottom')y=d.viewHeight+63.99;
      // Best-candidate sampling keeps simultaneous newborn stars apart on screen.
      const score=existing.reduce((distance,p)=>Math.min(distance,Math.hypot((p.x-x)/d.viewWidth,(p.y-y)/d.viewHeight)),1);
      if(score>bestScore){bestScore=score;best=worldAt(x,y,depth,view,d);}
    }
    return best;
  }
  return {
    update(messages,view,d,pinned=null){
      const ids=new Set(messages.map(m=>m.id));for(const id of locations.keys())if(!ids.has(id)){locations.delete(id);generations.delete(id);births.delete(id);}
      const dx=previous?view.x-previous.x:0,dy=previous?view.y-previous.y:0,dz=previous?view.z-previous.z:0;
      const distance=Math.hypot(dx,dy,dz);
      for(const [id,travel]of births)births.set(id,Math.min(360,travel+distance));
      const resized=previousSize&&(previousSize.width!==d.viewWidth||previousSize.height!==d.viewHeight);
      const jump=resized||previous&&(Math.abs(dz)>SPACE.far||Math.abs(dx)>d.viewWidth*4||Math.abs(dy)>d.viewHeight*4);
      const existing=[];for(const [id,point]of locations){const p=projectStar(point,view,d);if(!outside(p,d))existing.push(p);}
      messages.forEach((message,index)=>{
        const old=locations.get(message.id),p=old&&projectStar(old,view,d);
        if(old&&(!outside(p,d)||message.id===pinned))return;
        let entry=null;
        if(old&&!jump){
          if(Math.abs(dz)>.01&&Math.abs(dz)>=Math.max(Math.abs(dx),Math.abs(dy)))entry=dz>0?'far':'near';
          else if(Math.abs(dx)>=Math.abs(dy)&&Math.abs(dx)>.01)entry=dx>0?'left':'right';
          else if(Math.abs(dy)>.01)entry=dy>0?'top':'bottom';
        }
        if(old){generations.set(message.id,(generations.get(message.id)||0)+1);recycled++;}
        const point=candidate(message.id,index,messages.length,view,d,entry,existing);locations.set(message.id,point);births.set(message.id,old&&!jump?0:360);
        existing.push(projectStar(point,view,d));
      });
      if(pinned)births.set(pinned,360);
      previous={...view};previousSize={width:d.viewWidth,height:d.viewHeight};
      return messages.map(message=>{const point=locations.get(message.id),p=projectStar(point,view,d);
        return {message,point,projection:p,opacity:starVisibility(p,d,320)*Math.min(1,(births.get(message.id)||0)/360)};});
    },
    location(id){return locations.get(id);},
    get recycled(){return recycled;},
    reset(){locations.clear();generations.clear();births.clear();previous=null;previousSize=null;recycled=0;}
  };
}
