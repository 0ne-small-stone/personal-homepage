import './vendor/photoswipe/photoswipe.css';
import './single-viewer.css';
import {viewerPadding,fitFrame,rectQuad,quadVisible,quadMatrix,cssMatrix} from './viewer-geometry.js';
import {probe} from './performance-probe.js';
import {immersiveControls,naturalNavigation} from './viewer-immersion.js';

const ease='cubic-bezier(.22,1,.36,1)';
const arrowSVG='<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const viewport=()=>({x:document.documentElement.clientWidth,y:window.innerHeight});
let core;
const prepare=()=>core??=(import('./vendor/photoswipe/photoswipe.esm.js').then(module=>module.default));
const settle=animation=>animation.finished.catch(()=>{});

export function createSingleViewer({photos,getOrigin,beforeOpen,afterClose,onError,reduceMotion}){
  let session=null,disposed=false,keyboardInput=false;
  const onPointer=()=>{keyboardInput=false;};
  const onKey=event=>{keyboardInput=true;if(event.key==='Escape'&&session){event.preventDefault();event.stopPropagation();void close(session);}};
  window.addEventListener('keydown',onKey,true);
  window.addEventListener('pointerdown',onPointer,{capture:true,passive:true});
  function makePortal(s,photo,frame,source){
    const portal=document.createElement('div');portal.className='viewer-portal';portal.setAttribute('aria-hidden','true');
    const backdrop=document.createElement('div');backdrop.className='viewer-portal-backdrop';
    const ghost=document.createElement('img');ghost.className='viewer-portal-photo';ghost.alt='';ghost.src=source??photo.image;
    ghost.style.width=`${frame.width}px`;ghost.style.height=`${frame.height}px`;
    portal.append(backdrop,ghost);document.body.append(portal);
    s.portal=portal;s.ghost=ghost;s.backdrop=backdrop;return {ghost,backdrop};
  }
  function animate(s,element,keyframes,duration){
    const motion=element.animate(keyframes,{duration:reduceMotion()?0:duration,easing:ease,fill:'both'});
    s.animations.push(motion);return settle(motion);
  }
  function cleanupPortal(s){s.portal?.remove();s.portal=null;s.ghost=null;s.backdrop=null;}
  function restore(s){
    s.immersion?.stop();s.navigation?.stop();
    s.animations.forEach(animation=>animation.cancel());cleanupPortal(s);
    if(s.origin?.element)s.origin.element.style.visibility=s.oldVisibility;
    if(session===s)session=null;
    if(!disposed){probe.phase(s.phase);afterClose?.();s.focus?.focus?.({preventScroll:true});}
  }
  async function close(s){
    if(s.closing||session!==s)return;s.closing=true;
    s.immersion?.stop();s.navigation?.stop();
    const openingTransform=s.ghost?getComputedStyle(s.ghost).transform:null;
    const openingBackdrop=s.backdrop?getComputedStyle(s.backdrop).opacity:null;
    s.animations.forEach(animation=>animation.cancel());
    const samePhoto=s.pswp?.currIndex===s.index;
    const size=viewport(),sameViewport=size.x===s.viewport.x&&size.y===s.viewport.y;
    if(s.pswp)s.pswp.element.dataset.state='closing';
    if(samePhoto&&sameViewport&&quadVisible(s.origin?.quad,size)){
      const frame=s.frame;
      const currentRect=s.pswp?.currSlide?.content.element?.getBoundingClientRect();
      const start=openingTransform??cssMatrix(quadMatrix(rectQuad(currentRect??frame),frame.width,frame.height));
      if(!s.portal)makePortal(s,photos[s.index],frame,photos[s.index].full);
      if(s.pswp)s.pswp.element.style.opacity='0';
      await Promise.all([
        animate(s,s.ghost,[{transform:start,opacity:1},{transform:s.sourceMatrix,opacity:1}],280),
        animate(s,s.backdrop,[{opacity:openingBackdrop??1},{opacity:0}],280)
      ]);
    }else if(s.pswp){
      cleanupPortal(s);if(s.origin?.element)s.origin.element.style.visibility=s.oldVisibility;
      s.pswp.element.classList.remove('is-opening');
      await animate(s,s.pswp.element,[{opacity:1},{opacity:0}],280);
    }else{cleanupPortal(s);}
    if(session!==s)return;
    if(s.pswp)s.nativeClose();else restore(s);
  }
  function addUI(s,pswp){
    let rail,caption,zoomText;const buttons=[];
    pswp.on('uiRegister',()=>{
      pswp.ui.registerElement({name:'fit',ariaLabel:'完整显示原图',isButton:true,order:8,html:'完整显示',onClick:()=>{
        const slide=pswp.currSlide;if(slide)slide.zoomTo(slide.zoomLevels.initial,undefined,reduceMotion()?0:180);
      }});
      pswp.ui.registerElement({name:'photo-rail',appendTo:'root',onInit:element=>{
        rail=element;rail.classList.add('viewer-rail');rail.setAttribute('role','group');rail.setAttribute('aria-label','照片缩略导航');
        for(const [index,photo] of photos.entries()){
          const button=document.createElement('button');button.type='button';button.className='viewer-thumb';button.setAttribute('aria-label',`查看${photo.title}`);
          const image=document.createElement('img');image.src=photo.image;image.alt='';image.draggable=false;image.decoding='async';button.append(image);
          button.addEventListener('click',event=>{event.stopPropagation();pswp.goTo(index);});rail.append(button);buttons.push(button);
        }
        rail.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();rail.scrollLeft+=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;},{passive:false});
      }});
      pswp.ui.registerElement({name:'photo-caption',appendTo:'root',onInit:element=>{
        element.classList.add('viewer-caption');
        caption=document.createElement('div');caption.className='viewer-caption-title';caption.setAttribute('aria-live','polite');
        const hint=document.createElement('div');hint.className='viewer-caption-hint';hint.textContent='左右切图 · 滚轮或双击缩放';
        zoomText=document.createElement('output');zoomText.className='viewer-zoom';element.append(caption,hint,zoomText);
      }});
    });
    function update(){
      if(!rail||!caption)return;
      for(const [index,button] of buttons.entries())button.setAttribute('aria-current',index===pswp.currIndex?'true':'false');
      const active=buttons[pswp.currIndex];
      if(active)rail.scrollTo({left:active.offsetLeft-rail.clientWidth/2+active.offsetWidth/2,behavior:'auto'});
      caption.textContent=`${photos[pswp.currIndex].title}　${pswp.currIndex+1} / ${photos.length}`;
      pswp.element.dataset.index=String(pswp.currIndex);updateZoom();
    }
    function updateZoom(){
      const slide=pswp.currSlide;if(!slide||!zoomText)return;
      const scale=slide.currZoomLevel/slide.zoomLevels.initial;
      zoomText.textContent=`${Math.round(scale*100)}%`;
      pswp.element.dataset.zoom=scale.toFixed(3);
    }
    pswp.on('change',update);pswp.on('afterInit',update);pswp.on('zoomPanUpdate',updateZoom);
  }
  return {
    get isOpen(){return !!session;},
    prepare,
    async open(index,pool){
      if(session||disposed||index<0)return;
      const origin=getOrigin(index,pool),size=viewport(),frame=fitFrame(photos[index],size);
      const s={index,origin,viewport:size,frame,focus:origin?.element??document.activeElement,oldVisibility:origin?.element?.style.visibility??'',phase:document.querySelector('#experience').dataset.view,animations:[],closing:false};
      session=s;beforeOpen?.();probe.phase('viewer');
      const sourceQuad=quadVisible(origin?.quad,size)?origin.quad:rectQuad({x:frame.x+frame.width*.04,y:frame.y+frame.height*.04,width:frame.width*.92,height:frame.height*.92});
      s.sourceMatrix=cssMatrix(quadMatrix(sourceQuad,frame.width,frame.height));
      if(origin?.element)origin.element.style.visibility='hidden';
      const {ghost,backdrop}=makePortal(s,photos[index],frame);
      const movement=Promise.all([
        animate(s,ghost,[{transform:s.sourceMatrix,opacity:origin?.element?1:0},{transform:cssMatrix(quadMatrix(rectQuad(frame),frame.width,frame.height)),opacity:1}],360),
        animate(s,backdrop,[{opacity:0},{opacity:1}],360)
      ]);
      try{
        const PhotoSwipe=await prepare();if(session!==s||disposed)return;
        const pswp=new PhotoSwipe({dataSource:photos.map(photo=>({src:photo.full,msrc:photo.image,width:photo.width,height:photo.height,alt:photo.title})),index,
          mainClass:'single-viewer is-opening',bgOpacity:1,showHideAnimationType:'none',showAnimationDuration:0,hideAnimationDuration:0,
          zoomAnimationDuration:reduceMotion()?0:180,
          paddingFn:viewerPadding,initialZoomLevel:'fit',secondaryZoomLevel:levels=>levels.fit*2,maxZoomLevel:levels=>levels.fit*4,
          wheelToZoom:true,preload:[1,1],loop:true,spacing:.035,allowPanToNext:false,pinchToClose:false,closeOnVerticalDrag:false,
          imageClickAction:'zoom',doubleTapAction:'zoom',tapAction:()=>s.immersion?.toggleTouch(),bgClickAction:'close',counter:false,
          closeTitle:'关闭单图',zoomTitle:'放大或缩小',arrowPrevTitle:'上一张',arrowNextTitle:'下一张',arrowPrevSVG:arrowSVG,arrowNextSVG:arrowSVG,errorMsg:'照片未能载入，请切换下一张或重新打开。'});
        s.pswp=pswp;s.nativeClose=pswp.close.bind(pswp);pswp.close=()=>{void close(s);};
        addUI(s,pswp);pswp.on('destroy',()=>restore(s));
        probe.measure('viewer-init',()=>pswp.init());probe.flush(true);
        s.navigation=naturalNavigation(pswp,reduceMotion);
        pswp.element.setAttribute('aria-label','单图浏览');pswp.element.dataset.state='opening';pswp.element.dataset.scenePaused='true';pswp.element.dataset.reduced=String(reduceMotion());
        await movement;if(session!==s||s.closing||disposed)return;
        pswp.element.classList.remove('is-opening');pswp.element.style.opacity='1';pswp.element.dataset.state='open';cleanupPortal(s);s.animations.forEach(animation=>animation.cancel());s.animations=[];
        s.immersion=immersiveControls(pswp,{keyboardStart:keyboardInput});
      }catch(error){if(session===s){restore(s);onError?.(error);}}
    },
    close(){if(session)void close(session);},
    dispose(){
      disposed=true;window.removeEventListener('keydown',onKey,true);window.removeEventListener('pointerdown',onPointer,true);const s=session;if(!s)return;
      s.immersion?.stop();s.navigation?.stop();
      s.animations.forEach(animation=>animation.cancel());cleanupPortal(s);
      if(s.pswp){s.pswp.close=s.nativeClose;s.pswp.options.showHideAnimationType='none';s.pswp.destroy();}else restore(s);
    }
  };
}
