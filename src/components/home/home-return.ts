import { homeChapters } from './home-chapters';
const key='lssh.home.return';
interface ReturnState { chapterId: string; localProgress: number; scrollY: number; focusOrigin: string; }
export function installHomeReturn() {
  const chapters=[...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  let focusOrigin='';
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
  const restore=()=>{
    const type=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
    if(type!=='back_forward'&&type!=='reload')return;
    let state:ReturnState|undefined=history.state?.lsshHome;
    try{if(!state)state=JSON.parse(sessionStorage.getItem(key)||'null')??undefined;}catch{/* Ignore unavailable state. */}
    if(!state||location.hash)return;
    const section=document.getElementById(state.chapterId);const y=section?section.offsetTop+section.offsetHeight*state.localProgress:state.scrollY;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo(0,y);if(state?.focusOrigin)document.getElementById(state.focusOrigin)?.focus({preventScroll:true});}));
  };
  document.addEventListener('click',click);window.addEventListener('pagehide',save);window.addEventListener('pageshow',restore);restore();
  return()=>{document.removeEventListener('click',click);window.removeEventListener('pagehide',save);window.removeEventListener('pageshow',restore);};
}
