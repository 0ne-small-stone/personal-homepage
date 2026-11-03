// Local to the optional flow; never changes the shared camera/glass lerpers.
export const flowInputConfig=Object.freeze({maxStep:1/30,responseSeconds:.012,direct:.75,maxSpeed:2,gain:60,radius:.022,radiusSpeed:.008,idleSeconds:.05});
export const flowStepSeconds=dt=>Number.isFinite(dt)?Math.max(0,Math.min(flowInputConfig.maxStep,dt)):0;
const clamp=(v,limit)=>Math.max(-limit,Math.min(limit,v));
export class FlowInput {
  x=0;y=0;stamp=-Infinity;vx=0;vy=0;stationarySeconds=0;
  align(pointer){this.x=pointer.x;this.y=pointer.y;this.stamp=pointer.movedAt;this.vx=this.vy=0;this.stationarySeconds=0;}
  sample(pointer,dt,{inject=true,fresh=false}={}){
    const seconds=flowStepSeconds(dt),elapsedFrame=Number.isFinite(dt)?Math.max(0,dt):0,c=flowInputConfig;
    const moved=pointer.active&&pointer.movedAt>this.stamp;
    const elapsed=(pointer.movedAt-this.stamp)/1000;
    // A new burst owns its first segment. Long active frames use the latest
    // maxStep of movement, never an accumulated catch-up impulse.
    // Several actual stationary solves establish a new input burst. A single
    // delayed frame has no such evidence and still discards its backlog below.
    const reentered=moved&&this.stationarySeconds>c.idleSeconds;
    const interval=fresh||reentered||!Number.isFinite(elapsed)||elapsed<=0?elapsedFrame:elapsed;
    const duration=Math.min(c.maxStep,interval);
    const dx=moved?pointer.x-this.x:0,dy=moved?pointer.y-this.y:0;
    const speedX=moved&&interval>0&&inject?clamp(dx/interval,c.maxSpeed):0;
    const speedY=moved&&interval>0&&inject?clamp(dy/interval,c.maxSpeed):0;
    // An event interval can span several render frames. Deliver its bounded
    // displacement once, not once per frame and not just its last frame fraction.
    const rateX=seconds>0?speedX*duration/seconds:0,rateY=seconds>0?speedY*duration/seconds:0;
    // Reverse only the tiny CPU input buffer, never the existing GPU field.
    // A small deliberate reverse move must not be injected in the old direction.
    if(moved&&rateX*this.vx<0)this.vx=0;
    if(moved&&rateY*this.vy<0)this.vy=0;
    // One analytic exponential, evaluated before the solve. Integrating its
    // average over the same dt avoids frame-rate-dependent input accumulation.
    const decay=Math.exp(-seconds/c.responseSeconds),weight=c.responseSeconds*(1-decay);
    const integrate=(rate,previous)=>rate*seconds+(previous-rate)*weight;
    const ix=inject?c.gain*(c.direct*rateX*seconds+(1-c.direct)*integrate(rateX,this.vx)):0;
    const iy=inject?c.gain*(c.direct*rateY*seconds+(1-c.direct)*integrate(rateY,this.vy)):0;
    this.vx=inject?rateX+(this.vx-rateX)*decay:0;
    this.vy=inject?rateY+(this.vy-rateY)*decay:0;
    const fraction=interval>0?Math.min(1,c.maxStep/interval):0;
    const from=[pointer.x-dx*fraction,pointer.y-dy*fraction];
    this.x=pointer.x;this.y=pointer.y;if(moved)this.stamp=pointer.movedAt;
    this.stationarySeconds=moved?0:this.stationarySeconds+seconds;
    return {position:[pointer.x,pointer.y],from,source:[ix,iy],velocity:[rateX,rateY],
      residual:[dx,dy],buffer:[this.vx,this.vy],seconds,
      radius:c.radius+c.radiusSpeed*Math.min(1,Math.hypot(speedX,speedY)/c.maxSpeed)};
  }
}
