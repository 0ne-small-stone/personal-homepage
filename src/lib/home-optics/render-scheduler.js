// Keep expensive GPU work tied to real scene changes; no idle animation loop.
export class RenderScheduler {
  constructor(draw, needsMore, { requestFrame, cancelFrame, isHidden }) {
    this.draw=draw;this.needsMore=needsMore;this.requestFrame=requestFrame;this.cancelFrame=cancelFrame;this.isHidden=isHidden;this.pending=null;this.disposed=false;
  }
  request(){if(this.disposed||this.isHidden()||this.pending!==null)return;this.pending=this.requestFrame(time=>{
    this.pending=null;if(this.disposed||this.isHidden())return;this.draw(time);if(this.needsMore())this.request();});}
  visibilityChanged(){if(this.isHidden()){if(this.pending!==null)this.cancelFrame(this.pending);this.pending=null;}else if(this.needsMore())this.request();}
  dispose(){this.disposed=true;if(this.pending!==null)this.cancelFrame(this.pending);this.pending=null;}
}
