export type LoadingPhase = 'waiting' | 'revealing' | 'ready' | 'fallback' | 'error';
export type LoadingResource = 'wordmark' | 'layout' | 'compiled' | 'frame';
export const loadingDuration = .9;

export function wantsIntroReveal(input: {seen:boolean;returning:boolean;hash:string;scrollY:number;quiet:boolean}) {
  return !input.seen && !input.returning && (!input.hash || input.hash==='#intro') && input.scrollY<=100 && !input.quiet;
}

/** Resource readiness and cancellation are independent of animation completion. */
export class HomeLoadingGate {
  phase: LoadingPhase = 'waiting';
  progress = 0;
  reason = '';
  private closed = false;
  private listeners = new Set<() => void>();
  readonly resources = new Set<LoadingResource>();
  reveal: boolean;
  constructor(reveal: boolean) { this.reveal=reveal;this.progress=reveal?0:1; }
  get active() { return this.reveal && (this.phase==='waiting'||this.phase==='revealing'); }
  subscribe(listener:()=>void) { this.listeners.add(listener);listener();return ()=>{this.listeners.delete(listener);}; }
  private publish() { this.listeners.forEach(listener=>listener()); }
  mark(resource:LoadingResource) {
    if(this.closed||this.phase!=='waiting')return;
    this.resources.add(resource);
    if(this.resources.size===4)this.phase=this.reveal?'revealing':'ready';
    this.publish();
  }
  advance(progress:number) { if(!this.closed&&this.phase==='revealing')this.progress=Math.max(0,Math.min(1,progress)); }
  finish() {
    if(this.closed||this.phase!=='revealing')return;
    this.phase='ready';this.progress=1;this.publish();
  }
  bypass(reason='preference') {
    if(this.closed||!['waiting','revealing'].includes(this.phase))return;
    this.reveal=false;this.progress=1;this.reason=reason;
    if(this.phase==='revealing'||this.resources.size===4)this.phase='ready';
    this.publish();
  }
  fallback(error=false,reason='ordinary-browsing') {
    if(this.closed||['fallback','error'].includes(this.phase))return;
    this.phase=error?'error':'fallback';this.progress=1;this.reason=reason;this.reveal=false;this.publish();
  }
  dispose() { this.closed=true;this.listeners.clear(); }
  snapshot() { return {phase:this.phase,active:this.active,requested:this.reveal,progress:this.progress,resources:[...this.resources],reason:this.reason,closed:this.closed}; }
}
