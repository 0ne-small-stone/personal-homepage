// Input owns a finite deadline. A stationary active pointer never renews it.
export const flowTailMs=2400,flowFadeMs=350;
export const flowRiseMs=120;
export class FlowActivity {
  enabled=false; branch='black'; sampleBranch='black'; revision=-1; initialization=-1;
  stamp=-Infinity; until=-Infinity; active=false; reason='initial';
  riseAt=-Infinity;riseFrom=1;
  amount(now){
    const t=Math.max(0,Math.min(1,(this.until-now)/flowFadeMs));
    const r=Math.max(0,Math.min(1,(now-this.riseAt)/flowRiseMs));
    return Math.min(t*t*(3-2*t),this.riseFrom+(1-this.riseFrom)*r*r*(3-2*r));
  }
  reset(pointer,initialization,branch,reason='blocked') {
    const clear=this.active;this.active=false;this.until=-Infinity;this.riseAt=-Infinity;this.riseFrom=1;
    this.revision=pointer.revision;this.initialization=initialization;this.stamp=pointer.movedAt;
    this.branch=branch;this.sampleBranch=branch==='wall'?'wall':'black';this.reason=reason;
    return {active:false,amount:0,inject:false,clear,branch:this.sampleBranch,reason};
  }
  update(now,pointer,initialization,enabled,branch) {
    const changed=enabled!==this.enabled;this.enabled=enabled;
    if(!enabled||!pointer.active||changed||this.revision!==pointer.revision||this.initialization!==initialization)
      return this.reset(pointer,initialization,branch,!enabled?'blocked':changed?'resume-aligned':'entry-aligned');
    if(branch!==this.branch){
      if(branch==='transition'&&this.active){this.until=Math.min(this.until,now+flowFadeMs);this.stamp=pointer.movedAt;}
      else return this.reset(pointer,initialization,branch,'branch-aligned');
      this.branch=branch;
    }
    if(branch!=='transition'&&pointer.movedAt>this.stamp){
      const previous=this.amount(now);
      if(this.active&&previous<1&&now>=this.riseAt+flowRiseMs){this.riseAt=now;this.riseFrom=previous;}
      this.stamp=pointer.movedAt;this.until=this.stamp+flowTailMs;this.sampleBranch=branch;
    }
    if(now>=this.until)return this.reset(pointer,initialization,branch,'settled');
    this.active=true;
    return {active:true,amount:this.amount(now),inject:branch!=='transition',clear:false,branch:this.sampleBranch,reason:'finite-input-tail'};
  }
}
