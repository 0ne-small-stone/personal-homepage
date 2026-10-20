const installed = new WeakMap<HTMLElement, () => void>();
const ease = 'cubic-bezier(.16,1,.3,1)';
type Part = 'left'|'right'|'eyeLeft'|'eyeRight'|'drift'|'word'|'echoA'|'echoB'|'signal';

/** Motion only. The anchor default or owner's onBack callback owns navigation. */
export function installDivisionBellReturn(control: HTMLElement) {
  installed.get(control)?.();
  const doc = control.ownerDocument, view = doc.defaultView;
  if (!view) return () => {};
  const abort = new AbortController(), opts = { signal: abort.signal };
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const names: Part[] = ['left','right','eyeLeft','eyeRight','drift','word','echoA','echoB','signal'];
  const nodes = Object.fromEntries(names.map(name => [name, control.querySelector<SVGElement|HTMLElement>(`[data-db="${name}"]`)])) as Record<Part, SVGElement|HTMLElement>;
  if (names.some(name => !nodes[name])) return () => {};
  const motions = new Map<string, Animation>();
  let disposed = false, generation = 0, over = false, keyboard = false, touchedAt = 0;
  const disabled = () => control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true';
  const blocked = () => disposed || doc.hidden || reduced.matches || disabled() || control.dataset.returnPaused === 'true' ||
    doc.body.dataset.homePaused === 'true' || doc.body.dataset.motionPaused === 'true';
  const listen = (target: EventTarget, type: string, handler: EventListener) => target.addEventListener(type, handler, opts);
  const cancel = () => { ++generation; for (const animation of motions.values()) animation.cancel(); motions.clear(); delete control.dataset.playing; delete control.dataset.pressed; };
  const look = () => {
    control.dataset.static = String(blocked());
    control.dataset.engaged = String(!blocked() && (over || keyboard));
    const width = control.querySelector('svg')?.getBoundingClientRect().width || (control.hasAttribute('data-compact') ? 40 : 48);
    const scale = width / 160;
    control.style.setProperty('--db-face', `${Math.max(7, 3.5 / scale)}px`);
    control.style.setProperty('--db-eye', `${Math.max(3.4, 1.1 / scale)}px`);
  };
  const reset = () => { cancel(); over = false; keyboard = false; look(); };
  const animate = (name: string, node: SVGElement|HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions = {}) => {
    motions.get(name)?.cancel();
    if (blocked() || !control.isConnected || typeof node.animate !== 'function') return;
    const animation = node.animate(frames, { duration: 1080, easing: 'linear', iterations: 1, fill: 'forwards', ...options });
    motions.set(name, animation);
    return animation;
  };
  const transforms = () => Object.fromEntries((['left','right','eyeLeft','eyeRight','drift','word'] as Part[]).map(name => [name, view.getComputedStyle(nodes[name]).transform]));
  const start = () => {
    if (blocked() || !control.isConnected) { reset(); return; }
    const from = transforms(); cancel(); look(); const token = generation;
    control.dataset.playing = 'true';
    const style = view.getComputedStyle(control);
    const end = { left: `translateX(${style.getPropertyValue('--db-left').trim() || '0px'})`, right: `translateX(${style.getPropertyValue('--db-right').trim() || '0px'})`, eyeLeft: `translateX(${style.getPropertyValue('--db-eye-left').trim() || '0px'})`, eyeRight: `translateX(${style.getPropertyValue('--db-eye-right').trim() || '0px'})` };
    for (const side of ['left','right'] as const) animate(side, nodes[side], [
      {transform:from[side],easing:ease}, {transform:`translateX(${side==='left'?1.8:-1.8}px)`,offset:.2},
      {transform:`translateX(${side==='left'?1.8:-1.8}px)`,offset:.43,easing:'cubic-bezier(.4,0,.2,1)'},
      {transform:`translateX(${side==='left'?-3:0}px)`,offset:.67,easing:ease}, {transform:end[side]}
    ]);
    for (const eye of ['eyeLeft','eyeRight'] as const) animate(eye, nodes[eye], [
      {transform:from[eye],easing:ease}, {transform:`translateX(${eye==='eyeLeft'?3.8:-3.8}px)`,offset:.2,easing:ease},
      {transform:`translateX(${eye==='eyeLeft'?1.5:-4}px)`,offset:eye==='eyeRight'?.34:.45,easing:ease},
      {transform:'translateX(-4px)',offset:.58}, {transform:'translateX(-4px)',offset:.78,easing:ease}, {transform:end[eye]}
    ]);
    const drift = animate('drift', nodes.drift, [{transform:from.drift,easing:ease},{transform:'translateX(0px)',offset:.43,easing:'cubic-bezier(.4,0,.2,1)'},{transform:'translateX(-28px)',offset:.72},{transform:'translateX(-28px)',offset:.8,easing:ease},{transform:'translateX(0px)'}]);
    animate('word',nodes.word,[{transform:from.word,easing:ease},{transform:'translateX(0px)',offset:.44,easing:'cubic-bezier(.4,0,.2,1)'},{transform:'translateX(-8px)',offset:.73,easing:ease},{transform:'translateX(0px)'}]);
    animate('signal',nodes.signal,[{opacity:0,strokeDashoffset:'-28'},{opacity:0,strokeDashoffset:'-28',offset:.16},{opacity:.95,strokeDashoffset:'-20',offset:.26},{opacity:.85,strokeDashoffset:'0',offset:.43},{opacity:0,strokeDashoffset:'5',offset:.52},{opacity:0,strokeDashoffset:'5'}]);
    animate('echoA',nodes.echoA,[{opacity:0,transform:'translateX(0px)'},{opacity:0,transform:'translateX(0px)',offset:.43},{opacity:.22,transform:'translateX(-3px)',offset:.57},{opacity:.1,transform:'translateX(-15px)',offset:.75},{opacity:0,transform:'translateX(-21px)',offset:.88},{opacity:0,transform:'translateX(-21px)'}]);
    animate('echoB',nodes.echoB,[{opacity:0,transform:'translateX(0px)'},{opacity:0,transform:'translateX(0px)',offset:.53},{opacity:.1,transform:'translateX(-1px)',offset:.65},{opacity:0,transform:'translateX(-10px)',offset:.86},{opacity:0,transform:'translateX(-10px)'}]);
    if (drift) drift.onfinish = () => {
      if (disposed || token !== generation || !control.isConnected) return;
      const values = transforms(); cancel(); look();
      for (const [name, value] of Object.entries(values)) {
        const part = nodes[name as Part], target = view.getComputedStyle(part).transform;
        if (value !== target) animate(`settle-${name}`, part, [{transform:value},{transform:target}], {duration:180,easing:ease,fill:'none'});
      }
    };
    else cancel();
  };
  const enter = () => { if (Date.now()-touchedAt<800 || blocked()) return; over=true; look(); };
  listen(control,'pointerenter', event => { if ((event as PointerEvent).pointerType==='mouse') enter(); });
  listen(control,'mouseenter',enter);
  listen(control,'pointermove',event=>{if((event as PointerEvent).pointerType==='mouse'&&!over)enter();});
  listen(control,'pointerleave',()=>{over=false;delete control.dataset.pressed;look();});
  listen(control,'mouseleave',()=>{over=false;delete control.dataset.pressed;look();});
  listen(control,'focus',()=>{keyboard=control.matches(':focus-visible');look();});
  listen(control,'blur',()=>{keyboard=false;delete control.dataset.pressed;look();});
  listen(control,'pointerdown',event=>{const e=event as PointerEvent;if(e.pointerType==='touch'){touchedAt=Date.now();over=false;keyboard=false;cancel();look();}if(e.button===0&&!disabled())control.dataset.pressed='true';});
  listen(control,'pointerup',()=>delete control.dataset.pressed);
  listen(control,'pointercancel',reset);
  control.addEventListener('click',event=>{if(disabled()){event.preventDefault();event.stopImmediatePropagation();reset();}}, {...opts,capture:true});
  listen(control,'click',event=>{
    const e=event as MouseEvent;
    if(disabled()){e.preventDefault();e.stopImmediatePropagation();reset();return;}
    if(e.defaultPrevented||e.button>0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||control.getAttribute('target')==='_blank')return;
    start(); // Never call a route, history.back(), preventDefault(), or the owner's callback here.
  });
  listen(reduced,'change',reset);
  listen(doc,'visibilitychange',()=>{if(doc.hidden)reset();});
  listen(doc,'lssh:home-controls-state',reset);listen(doc,'lssh:return-motion-state',reset);
  listen(view,'blur',reset);listen(view,'resize',reset);listen(view,'pagehide',reset);listen(view,'pageshow',reset);
  const observer = new view.MutationObserver(() => {if(blocked())reset();else look();});
  observer.observe(control,{attributes:true,attributeFilter:['disabled','aria-disabled','data-return-paused']});
  const dispose = () => {if(disposed)return;disposed=true;cancel();observer.disconnect();abort.abort();if(installed.get(control)===dispose){installed.delete(control);delete control.dataset.engaged;delete control.dataset.static;}};
  installed.set(control,dispose); look(); return dispose;
}
