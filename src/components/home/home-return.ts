import { homeChapters } from './home-chapters';
const key='lssh.home.return';
interface ReturnState { chapterId: string; localProgress: number; scrollY: number; focusOrigin: string; }
export function installHomeReturn() {
  const chapters=[...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  let focusOrigin='';
  let pending: ReturnState | undefined;
  const snapshot=(): ReturnState=>{
    let section=chapters[0];for(const candidate of chapters)if(scrollY>=candidate.offsetTop)section=candidate;
    return {chapterId:section?.id??homeChapters[0].id,localProgress:section?Math.max(0,(scrollY-section.offsetTop)/section.offsetHeight):0,scrollY,focusOrigin};
  };
  const save=()=>{const state=snapshot();try{sessionStorage.setItem(key,JSON.stringify(state));history.replaceState({...history.state,lsshHome:state},'');}catch{/* Navigation works without storage. */}};
  const click=(event: MouseEvent)=>{
    const target=(event.target as Element).closest<HTMLAnchorElement>('a[data-home-link]');
    if(!target||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const url=new URL(target.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;
    focusOrigin=target.id||'';save();
  };
  const applyPending=()=>{
    if(!pending)return;
    const body=document.body;
    const dynamic=body.dataset.homeMotion==='ready'&&body.classList.contains('home-enhanced');
    const native=body.classList.contains('home-static')||(body.classList.contains('home-quiet')&&body.classList.contains('home-enhanced'));
    if(!dynamic&&!native)return;
    const state=pending;pending=undefined;
    const section=document.getElementById(state.chapterId);const y=section?section.offsetTop+section.offsetHeight*state.localProgress:state.scrollY;
    if(dynamic)document.dispatchEvent(new CustomEvent('lssh:home-restore',{detail:{y,focusOrigin:state.focusOrigin}}));
    else {scrollTo(0,y);document.getElementById(state.focusOrigin)?.focus({preventScroll:true});}
  };
  const restore=(event?:PageTransitionEvent)=>{
    const type=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
    const returning=event?.persisted||type==='back_forward';
    if(!returning&&type!=='reload')return;
    let state:ReturnState|undefined=history.state?.lsshHome;
    try{if(!state)state=JSON.parse(sessionStorage.getItem(key)||'null')??undefined;}catch{/* Ignore unavailable state. */}
    if(!state||(location.hash&&!returning))return;
    // Enhanced geometry and the motion controller must exist before calculating offsets.
    pending=state;applyPending();
  };
  const observer=new MutationObserver(applyPending);observer.observe(document.body,{attributes:true,attributeFilter:['class','data-home-status','data-home-motion']});
  document.addEventListener('lssh:home-layout-ready',applyPending);
  document.addEventListener('click',click);window.addEventListener('pagehide',save);window.addEventListener('pageshow',restore);restore();
  return()=>{observer.disconnect();document.removeEventListener('lssh:home-layout-ready',applyPending);document.removeEventListener('click',click);window.removeEventListener('pagehide',save);window.removeEventListener('pageshow',restore);};
}
