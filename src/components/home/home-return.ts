import { initialHomeReload, homeReturnSnapshot } from './home-return-policy.mjs';
import {captureChapterPosition,projectChapterPosition} from './home-layout-position.mjs';
const key='lssh.home.return';
let firstInstall=true;
interface ReturnState { chapterId: string; localProgress: number; scrollY: number; focusOrigin: string; reason?: string; }
export function installHomeReturn() {
  const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
  let reloadAvailable=initialHomeReload({firstInstall,navigationType:navigation?.type,initialUrl:navigation?.name,currentUrl:location.href});
  firstInstall=false;
  const chapters=[...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const chapterLinks = document.querySelector?.('.home-chapter-index')?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
  const updateNativeChapter = () => {
    if (!geometry?.length || measuredMode !== 'native') return;
    const { chapterId } = captureChapterPosition(geometry, scrollY + innerHeight * .25, '');
    chapterLinks?.forEach(link => {
      if (link.hash === `#${chapterId}`) {
        if (!link.hasAttribute('aria-current')) link.setAttribute('aria-current', 'location');
      } else if (link.hasAttribute('aria-current')) {
        link.removeAttribute('aria-current');
      }
    });
  };
  let focusOrigin='';
  let pending: ReturnState | undefined;
  let returningPosition: ReturnState | undefined;
  let pendingMode:string|undefined,measuredMode:string|undefined,ignoredY:number|undefined;
  let retained:ReturnState|undefined,alive=true,dimensions='';
  let layoutRevision=0,adoptNextLayout=false,awaitController=false;
  const inspect=['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('wallPerf')==='1';
  const trail:unknown[]=[];
  const trace=(kind:string,extra:unknown)=>{if(!inspect)return;trail.push({kind,y:scrollY,dimensions,retained,pending,extra});if(trail.length>24)trail.shift();document.body.dataset.homeLayoutTrace=JSON.stringify(trail);};
  const measure=()=>chapters.map(section=>({id:section.id,y:section.offsetTop,height:section.offsetHeight}));
  let geometry:ReturnType<typeof measure>|undefined;
  const viewport=()=>`${innerWidth}:${innerHeight}`;
  const layoutMode=()=>{
    const body=document.body;
    if(body.dataset.homeStatus==='waiting'&&!body.classList.contains('home-enhanced'))return 'native';
    if(body.classList.contains('home-static')||(body.classList.contains('home-quiet')&&body.classList.contains('home-enhanced')))return 'native';
    if(body.dataset.homeMotion==='ready'&&body.classList.contains('home-enhanced'))return 'dynamic';
  };
  // Scroll events only consult cached geometry: no layout reads per Lenis frame.
  const remember=()=>{
    if(pending||returningPosition||!geometry||measuredMode!==layoutMode()||dimensions!==viewport())return;
    if(ignoredY!==undefined&&Math.abs(scrollY-ignoredY)<.5)return;
    ignoredY=undefined;retained=captureChapterPosition(geometry,scrollY,focusOrigin);
    updateNativeChapter();
  };
  const snapshot=(): ReturnState=>{
    remember();
    const state=pending??returningPosition??retained??captureChapterPosition(geometry??measure(),scrollY,focusOrigin);
    return {chapterId:state.chapterId,localProgress:state.localProgress,scrollY,focusOrigin};
  };
  let departure:ReturnState|undefined;
  const save=(state:ReturnState)=>{trace('save',state);try{sessionStorage.setItem(key,JSON.stringify(state));history.replaceState({...history.state,lsshHome:state},'');}catch{/* Navigation works without storage. */}};
  const pageHide=()=>save(departure??snapshot());
  const click=(event: MouseEvent)=>{
    const target=(event.target as Element).closest<HTMLAnchorElement>('a[data-home-link]');
    if(!target||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const url=new URL(target.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;
    const work=target.closest<HTMLElement>('[data-work-item]');
    focusOrigin=target.id||work?.querySelector<HTMLAnchorElement>('.home-cta')?.id||'';
    departure=snapshot();
    // A chapter link can already be active while smooth scrolling the final
    // few pixels across its boundary. Return to the work that was opened.
    if(work&&departure.chapterId!==work.id)departure={...departure,chapterId:work.id,localProgress:0};
    save(departure);
  };
  const applyPending=()=>{
    if(!alive||awaitController)return;
    const body=document.body;
    const mode=layoutMode();if(!mode)return;
    const terminalNative=mode==='native'&&body.dataset.homeStatus!=='waiting';
    if(!pending&&returningPosition&&terminalNative)pending={...returningPosition};
    if(!pending){
      if(!geometry||adoptNextLayout){geometry=measure();measuredMode=mode;dimensions=viewport();retained=captureChapterPosition(geometry,scrollY,focusOrigin);adoptNextLayout=false;updateNativeChapter();return;}
      if(mode===measuredMode)return;
      pending={...snapshot(),focusOrigin:'',reason:'layout-migration'};pendingMode=mode;
    }
    if(pendingMode&&pendingMode!==mode)return;
    const state=pending;pending=undefined;
    if(mode==='dynamic'||terminalNative)returningPosition=undefined;
    pendingMode=undefined;geometry=measure();measuredMode=mode;dimensions=viewport();
    focusOrigin=state.focusOrigin;
    const y=projectChapterPosition(geometry,state);
    if(mode==='dynamic')document.dispatchEvent(new CustomEvent('lssh:home-restore',{detail:{y,focusOrigin:state.focusOrigin,reason:state.reason}}));
    else {scrollTo(0,y);delete body.dataset.homeRestoring;document.getElementById(state.focusOrigin)?.focus({preventScroll:true});}
    // Preserve unbounded spacer progress even if the native layout clamps y.
    // Replace it only after an actual movement in the new layout.
    retained={...state,scrollY};ignoredY=scrollY;
    updateNativeChapter();
    trace('apply',{mode,state,y,geometry});
  };
  const beforeLayout=(event:Event)=>{
    layoutRevision++;adoptNextLayout=false;
    const {mode,preserveFocus}=(event as CustomEvent<{mode:string;preserveFocus?:boolean}>).detail;
    const active=preserveFocus?document.activeElement?.closest<HTMLElement>('[data-chapter] [data-home-link][id]'):null;
    pending={...(returningPosition??snapshot()),focusOrigin:active?.id??returningPosition?.focusOrigin??'',reason:'layout-migration'};
    pendingMode=mode;
    awaitController=pendingMode==='dynamic';
    document.body.dataset.homeRestoring='true';
    trace('before-layout',{mode:pendingMode});
  };
  const resize=()=>{
    if(!retained)return;
    trace('resize',{viewport:viewport(),geometry});
    if(!pending){pending={...retained,focusOrigin:'',reason:'resize'};pendingMode=layoutMode()??measuredMode;}
    // Dynamic resize also announces layout-ready after Lenis/ScrollTrigger.
    // Native CSS geometry is ready after this synchronous resize dispatch.
    const revision=++layoutRevision;
    awaitController=pendingMode==='dynamic';
    // Microtasks may run between native resize listeners. Dynamic --journey-
    // height is only authoritative after the controller's layout-ready event.
    if(pendingMode==='native')queueMicrotask(()=>{if(alive&&revision===layoutRevision)applyPending();});
  };
  const userIntent=(event:Event)=>{
    if(!event.isTrusted)return;
    departure=undefined;
    if(!returningPosition&&!pending&&!document.body.hasAttribute('data-home-restoring'))return;
    const key=event instanceof KeyboardEvent?event.key:'';
    const chapter=event.type==='click'&&event.target instanceof Element&&event.target.closest('.home-chapter-index a,.home-scroll,.home-header-wall,.home-wall-bottom a[href="#intro"]');
    const drag = event.type === 'pointerup' && event instanceof PointerEvent && event.isPrimary && event.button === 0 &&
      document.querySelector?.('.home-chapter-index[data-home-wheel-dragging]');
    const nativeNavigation=returningPosition&&(key==='Tab'||(event.type==='pointerdown'&&event.target===document.documentElement));
    if(!chapter&&!drag&&!nativeNavigation&&!['wheel','touchstart'].includes(event.type)&&!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(key))return;
    layoutRevision++;pending=undefined;returningPosition=undefined;pendingMode=undefined;ignoredY=undefined;adoptNextLayout=true;awaitController=false;
    delete document.body.dataset.homeRestoring;document.dispatchEvent(new Event('lssh:home-restore-cancel'));
    trace('user-cancel',event.type);
  };
  const restore=(event?:PageTransitionEvent)=>{
    layoutRevision++;pending=undefined;returningPosition=undefined;departure=undefined;pendingMode=undefined;adoptNextLayout=false;awaitController=false;
    const type=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
    const initialReload=reloadAvailable;reloadAvailable=false;
    // Astro popstate stays in the original document, so navigation timing can
    // still say "navigate". A saved state on this history entry is authoritative.
    const returning=event?.persisted||type==='back_forward'||Boolean(history.state?.lsshHome);
    const entry:ReturnState|undefined=history.state?.lsshHome;
    let saved:ReturnState|undefined;
    if(initialReload||(returning&&!entry&&!location.hash)){
      // A reload's history snapshot may precede pagehide's latest save. Prefer
      // that last actual position; browser back keeps its own entry snapshot.
      try{saved=JSON.parse(sessionStorage.getItem(key)||'null')??undefined;}catch{/* Ignore unavailable state. */}
    }
    let state:ReturnState|undefined=homeReturnSnapshot({entry,saved,initialReload,returning,hasHash:Boolean(location.hash)});
    // Browsers and scroll-controller setup can temporarily reset native scroll
    // before enhanced geometry exists. Preserve the recorded destination until
    // the final layout accepts it, or a real navigation gesture intervenes.
    returningPosition=state;
    trace('restore-input',{entry,saved,state,initialReload,returning});
    if(!state&&location.hash){
      const section=chapters.find(chapter=>`#${chapter.id}`===location.hash);
      if(section)state={chapterId:section.id,localProgress:0,scrollY:0,focusOrigin:'',reason:'deep-link'};
    }
    if(!state)return;
    state={...state,reason:state.reason||(returning?'back-forward':'reload')};
    document.dispatchEvent(new CustomEvent('lssh:home-return-target',{detail:{chapterId:state.chapterId}}));
    // Enhanced geometry and the motion controller must exist before calculating offsets.
    document.body.dataset.homeRestoring='true';
    pending=state;applyPending();
  };
  const observer=new MutationObserver(applyPending);observer.observe(document.body,{attributes:true,attributeFilter:['class','data-home-status','data-home-motion']});
  const layoutReady=()=>{awaitController=false;applyPending();};
  document.addEventListener('lssh:home-layout-ready',layoutReady);
  document.addEventListener('lssh:home-layout-before',beforeLayout);
  window.addEventListener('scroll',remember,{passive:true});window.addEventListener('resize',resize);
  const inputController=new AbortController();
  for(const type of ['wheel','touchstart','keydown','click','pointerdown','pointerup'])document.addEventListener(type,userIntent,{capture:true,passive:true,signal:inputController.signal});
  document.addEventListener('click',click,true);window.addEventListener('pagehide',pageHide);window.addEventListener('pageshow',restore);restore();
  return()=>{alive=false;inputController.abort();observer.disconnect();delete document.body.dataset.homeRestoring;delete document.body.dataset.homeLayoutTrace;document.removeEventListener('lssh:home-layout-ready',layoutReady);document.removeEventListener('lssh:home-layout-before',beforeLayout);window.removeEventListener('scroll',remember);window.removeEventListener('resize',resize);document.removeEventListener('click',click,true);window.removeEventListener('pagehide',pageHide);window.removeEventListener('pageshow',restore);};
}
