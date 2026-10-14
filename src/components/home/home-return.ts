import { homeChapters } from './home-chapters';
const key='lssh.home.return';
interface ReturnState { chapterId: string; localProgress: number; scrollY: number; focusOrigin: string; reason?: string; }
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
    focusOrigin=state.focusOrigin;
    const section=document.getElementById(state.chapterId);const y=section?section.offsetTop+section.offsetHeight*state.localProgress:0;
    if(dynamic)document.dispatchEvent(new CustomEvent('lssh:home-restore',{detail:{y,focusOrigin:state.focusOrigin,reason:state.reason}}));
    else {scrollTo(0,y);delete body.dataset.homeRestoring;document.getElementById(state.focusOrigin)?.focus({preventScroll:true});}
  };
  const restore=(event?:PageTransitionEvent)=>{
    const type=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
    // Astro popstate stays in the original document, so navigation timing can
    // still say "navigate". A saved state on this history entry is authoritative.
    const returning=event?.persisted||type==='back_forward'||Boolean(history.state?.lsshHome);
    let state:ReturnState|undefined=history.state?.lsshHome;
    if(returning||type==='reload'){
      // A reload's history snapshot may precede pagehide's latest save. Prefer
      // that last actual position; browser back keeps its own entry snapshot.
      try{if(type==='reload')state=JSON.parse(sessionStorage.getItem(key)||'null')??state;
        else if(!state&&!location.hash)state=JSON.parse(sessionStorage.getItem(key)||'null')??undefined;
      }catch{/* Ignore unavailable state. */}
    }else state=undefined;
    if(!state&&location.hash){
      const section=chapters.find(chapter=>`#${chapter.id}`===location.hash);
      if(section)state={chapterId:section.id,localProgress:0,scrollY:0,focusOrigin:'',reason:'deep-link'};
    }
    if(!state)return;
    state={...state,reason:state.reason||(returning?'back-forward':'reload')};
    // Enhanced geometry and the motion controller must exist before calculating offsets.
    document.body.dataset.homeRestoring='true';
    pending=state;applyPending();
  };
  const observer=new MutationObserver(applyPending);observer.observe(document.body,{attributes:true,attributeFilter:['class','data-home-status','data-home-motion']});
  document.addEventListener('lssh:home-layout-ready',applyPending);
  document.addEventListener('click',click,true);window.addEventListener('pagehide',save);window.addEventListener('pageshow',restore);restore();
  return()=>{observer.disconnect();delete document.body.dataset.homeRestoring;document.removeEventListener('lssh:home-layout-ready',applyPending);document.removeEventListener('click',click,true);window.removeEventListener('pagehide',save);window.removeEventListener('pageshow',restore);};
}
