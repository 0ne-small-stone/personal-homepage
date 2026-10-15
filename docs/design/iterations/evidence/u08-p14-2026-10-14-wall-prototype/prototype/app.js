import {gsap} from 'gsap';
import {Draggable} from 'gsap/Draggable';
import {InertiaPlugin} from 'gsap/InertiaPlugin';
import {Flip} from 'gsap/Flip';
import {messages} from './messages.js';
gsap.registerPlugin(Draggable,InertiaPlugin,Flip);
const $ = selector=>document.querySelector(selector);
const stage=$('#wall-stage'),wall=$('#wall'),dialog=$('#message-dialog'),surface=$('#reading-surface'),content=$('#reading-content');
const listDialog=$('#list-dialog'),noticeDialog=$('#notice-dialog'),status=$('#status');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const forcedReduced=new URLSearchParams(location.search).get('motion')==='reduce';
const noMotion=()=>forcedReduced||motion.matches;
document.documentElement.dataset.reducedMotion=String(noMotion());
const lookup=new Map(messages.map(m=>[m.id,m])),bricks=new Map();
const events=new AbortController(),options={signal:events.signal};
let drag,dimensions,active=null,portal=null,animation=null,closing=false,ignoreUntil=0,resizeFrame=0,located=null;
let previousFocus=null,locationOwner=false,restoringFocus=false;
function announce(text){status.textContent=text;}
function size(){
  const css=getComputedStyle(stage),bw=parseFloat(css.getPropertyValue('--bw')),bh=parseFloat(css.getPropertyValue('--bh')),gap=4;
  return {bw,bh,gap,stepX:bw+gap,stepY:bh+gap,width:13*(bw+gap)+bw/2,height:13*(bh+gap),viewWidth:stage.clientWidth,viewHeight:stage.clientHeight};
}
function createWall(){
  const fragment=document.createDocumentFragment();
  for(let row=0;row<13;row++)for(let column=0;column<13;column++){
    const message=messages.find(m=>m.row===row&&m.column===column);
    const brick=document.createElement(message?'button':'div');
    brick.className='brick'+(message?' brick-message':'');
    brick.dataset.row=row;brick.dataset.column=column;
    if(message){
      brick.type='button';brick.dataset.message=message.id;
      brick.setAttribute('aria-label',message.author+'：'+message.excerpt+'，打开演示留言');
      const excerpt=document.createElement('span'),author=document.createElement('span');
      excerpt.className='brick-excerpt';excerpt.textContent=message.excerpt;
      author.className='brick-author';author.textContent=message.author;
      brick.append(excerpt,author);bricks.set(message.id,brick);
    }else brick.setAttribute('aria-hidden','true');
    fragment.append(brick);
  }
  wall.append(fragment);
  for(const message of messages){
    const button=document.createElement('button');button.type='button';button.dataset.listMessage=message.id;
    button.append(document.createTextNode(message.excerpt));
    const author=document.createElement('span');author.textContent=message.author+' · '+message.date;
    button.append(author);$('#message-list').append(button);
  }
}
function layout(){
  dimensions=size();wall.style.width=dimensions.width+'px';wall.style.height=dimensions.height+'px';
  for(const brick of wall.children){
    const row=Number(brick.dataset.row),column=Number(brick.dataset.column);
    brick.style.left=(column*dimensions.stepX+(row%2?dimensions.stepX/2:0))+'px';
    brick.style.top=(row*dimensions.stepY)+'px';
  }
}
function bounds(){return {minX:Math.min(0,stage.clientWidth-dimensions.width),maxX:0,minY:Math.min(0,stage.clientHeight-dimensions.height),maxY:0};}
function stopMotion(){drag?.tween?.kill();gsap.killTweensOf(wall);}
function clampPosition(x,y){const b=bounds();return {x:gsap.utils.clamp(b.minX,b.maxX,x),y:gsap.utils.clamp(b.minY,b.maxY,y)};}
function moveTo(x,y,animate=true){
  if(dialog.open||noticeDialog.open||listDialog.open)return;
  stopMotion();const p=clampPosition(x,y);
  gsap.to(wall,{...p,duration:noMotion()||!animate?0:.38,ease:'power3.out',onUpdate:()=>drag?.update(),onComplete:()=>drag?.update()});
}
function positionFor(message){
  return {x:stage.clientWidth/2-(message.column*dimensions.stepX+(message.row%2?dimensions.stepX/2:0)+dimensions.bw/2),
    y:stage.clientHeight/2-(message.row*dimensions.stepY+dimensions.bh/2)};
}
function locate(message,animate=true){
  const p=positionFor(message);moveTo(p.x,p.y,animate);
  located?.classList.remove('is-located');located=bricks.get(message.id);located.classList.add('is-located');
  announce('已定位'+message.author+'的演示留言');
}
function pan(direction){
  const dx=dimensions.stepX*.55,dy=dimensions.stepY*.55;
  const deltas={left:[dx,0],right:[-dx,0],up:[0,dy],down:[0,-dy]};
  const [x,y]=deltas[direction];moveTo(Number(gsap.getProperty(wall,'x'))+x,Number(gsap.getProperty(wall,'y'))+y);
}
function frozen(value){
  stopMotion();if(value)drag?.disable();else if(!listDialog.open&&!noticeDialog.open)drag?.enable();
  stage.dataset.frozen=String(value);
}
function rectStyle(element,rect){
  Object.assign(element.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
}
function makePortal(rect,message){
  portal=document.createElement('div');portal.className='brick-portal';portal.setAttribute('aria-hidden','true');
  if(message){const text=document.createElement('span');text.className='brick-excerpt';text.textContent=message.excerpt;portal.append(text);}
  rectStyle(portal,rect);dialog.append(portal);return portal;
}
function clearAnimation(){
  animation?.kill();animation=null;
  if(portal){Flip.killFlipsOf(portal);gsap.killTweensOf(portal);portal.remove();portal=null;}
  gsap.killTweensOf(surface);gsap.killTweensOf(content);
}
function writeMessage(message){
  $('#message-meta').textContent=message.author+' · '+message.date;
  $('#message-title').textContent=message.excerpt;
  $('#message-body').replaceChildren();
  const paragraphs=message.body.split('\n\n');
  if(paragraphs[0]===message.excerpt)paragraphs.shift();
  for(const text of paragraphs){const paragraph=document.createElement('p');paragraph.textContent=text;$('#message-body').append(paragraph);}
}
function openMessage(id,push=true){
  const message=lookup.get(id);if(!message||active||closing)return;
  stopMotion();active=message;previousFocus=document.activeElement;
  const brick=bricks.get(id),sourceRect=brick.getBoundingClientRect();
  writeMessage(message);gsap.set(surface,{opacity:0});gsap.set(content,{opacity:0});surface.scrollTop=0;
  content.scrollTop=0;dialog.showModal();frozen(true);brick.classList.add('is-selected');dialog.dataset.message=id;
  if(push){
    const x=Number(gsap.getProperty(wall,'x')),y=Number(gsap.getProperty(wall,'y'));
    history.pushState({...history.state,wallMessage:true,wallView:{
      centerX:(dimensions.viewWidth/2-x)/dimensions.stepX,centerY:(dimensions.viewHeight/2-y)/dimensions.stepY
    }},'', '#message/'+id);locationOwner=true;
  }
  else locationOwner=Boolean(history.state?.wallMessage);
  $('#message-close').focus({preventScroll:true});
  const finish=()=>{
    portal?.remove();portal=null;gsap.set(surface,{opacity:1});
    dialog.dataset.phase='revealing';
    gsap.to(content,{opacity:1,duration:noMotion()?0:.14,onComplete:()=>{
      dialog.dataset.phase='reading';announce('正在阅读'+message.author+'的演示留言');
    }});
  };
  if(noMotion()){finish();return;}
  const layer=makePortal(sourceRect,message);dialog.dataset.phase='opening';
  animation=gsap.timeline();
  animation.to(layer,{y:-6,scale:1.035,duration:.14,ease:'power2.out'});
  animation.call(()=>{
    const state=Flip.getState(layer);gsap.set(layer,{clearProps:'transform'});rectStyle(layer,surface.getBoundingClientRect());
    animation=Flip.from(state,{duration:.48,ease:'power3.inOut',scale:true,onComplete:finish});
    gsap.to(layer.children,{opacity:0,duration:.12});
  });
}
function finishClose(){
  clearAnimation();bricks.get(active?.id)?.classList.remove('is-selected');
  const brick=active?bricks.get(active.id):null;
  restoringFocus=true;dialog.close();delete dialog.dataset.message;dialog.dataset.phase='closed';active=null;closing=false;locationOwner=false;
  frozen(false);(brick||previousFocus||stage).focus({preventScroll:true});restoringFocus=false;
  const nextId=routeId();if(lookup.has(nextId))openRoute(nextId);else announce('已回到原来的墙面位置');
}
function closeMessage(){
  if(!active||closing)return;closing=true;dialog.dataset.phase='closing';
  const brick=bricks.get(active.id),target=brick.getBoundingClientRect();
  const current=portal?portal.getBoundingClientRect():surface.getBoundingClientRect();
  clearAnimation();
  if(noMotion()){finishClose();return;}
  const layer=makePortal(current);
  gsap.set(surface,{opacity:0});const state=Flip.getState(layer);rectStyle(layer,target);
  animation=Flip.from(state,{duration:.36,ease:'power3.inOut',scale:true,onComplete:finishClose});
}
function requestClose(){
  if(!active||closing)return;
  if(locationOwner&&location.hash==='#message/'+active.id)history.back();
  else{history.replaceState(history.state,'',location.pathname+location.search);closeMessage();}
}
function openUtility(target){
  stopMotion();target.showModal();drag.disable();stage.dataset.frozen='true';
}
function resetUtility(){
  if(!dialog.open){drag.enable();stage.dataset.frozen='false';}
}
function routeId(){return location.hash.startsWith('#message/')?location.hash.slice(9):null;}
function openRoute(id){
  const view=history.state?.wallView;
  if(Number.isFinite(view?.centerX)&&Number.isFinite(view?.centerY))
    moveTo(dimensions.viewWidth/2-view.centerX*dimensions.stepX,dimensions.viewHeight/2-view.centerY*dimensions.stepY,false);
  else locate(lookup.get(id),false);
  openMessage(id,false);
}
function setupDrag(){
  drag=Draggable.create(wall,{type:'x,y',trigger:stage,bounds:bounds(),minimumMovement:6,edgeResistance:1,dragResistance:.12,
    inertia:!noMotion(),throwResistance:1800,minDuration:.12,maxDuration:.55,dragClickables:true,allowEventDefault:true,cursor:'grab',activeCursor:'grabbing',
    onPress(){stopMotion();},onDragStart(){stage.classList.add('dragging');$('#hint-text').textContent='点一块砖，听见一段话';},
    onDragEnd(){stage.classList.remove('dragging');ignoreUntil=performance.now()+220;},
    onClick(event){const brick=event.target.closest?.('[data-message]');if(brick&&performance.now()>ignoreUntil)openMessage(brick.dataset.message);}
  })[0];
}
createWall();layout();setupDrag();locate(messages[0],false);located.classList.remove('is-located');located=null;
wall.addEventListener('click',event=>{
  const brick=event.target.closest('[data-message]');
  if(brick&&event.detail===0&&performance.now()>ignoreUntil)openMessage(brick.dataset.message);
},options);
stage.addEventListener('wheel',event=>{
  if(event.ctrlKey||event.metaKey||dialog.open||listDialog.open||noticeDialog.open)return;
  event.preventDefault();const unit=event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1;
  moveTo(Number(gsap.getProperty(wall,'x'))-event.deltaX*unit,Number(gsap.getProperty(wall,'y'))-event.deltaY*unit);
},{passive:false,signal:events.signal});
stage.addEventListener('keydown',event=>{
  const directions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
  if(directions[event.key]){event.preventDefault();pan(directions[event.key]);}
},options);
wall.addEventListener('focusin',event=>{
  const brick=event.target.closest('[data-message]');
  if(brick?.matches(':focus-visible')&&!dialog.open&&!closing&&!restoringFocus)locate(lookup.get(brick.dataset.message),false);
},options);
$('#latest-button').addEventListener('click',()=>locate(messages[0]),options);
$('#center-button').addEventListener('click',()=>locate(messages[0]),options);
$('#message-list-button').addEventListener('click',()=>openUtility(listDialog),options);
$('#leave-button').addEventListener('click',()=>openUtility(noticeDialog),options);
$('#reply-button').addEventListener('click',()=>openUtility(noticeDialog),options);
$('#move-button').addEventListener('click',event=>{
  const controls=$('#move-controls');controls.hidden=!controls.hidden;event.currentTarget.setAttribute('aria-expanded',String(!controls.hidden));
},options);
for(const button of document.querySelectorAll('[data-pan]'))button.addEventListener('click',()=>pan(button.dataset.pan),options);
for(const button of document.querySelectorAll('[data-close-dialog]'))button.addEventListener('click',()=>document.getElementById(button.dataset.closeDialog).close(),options);
$('#message-close').addEventListener('click',requestClose,options);
dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();},options);
dialog.addEventListener('click',event=>{if(event.target===dialog)requestClose();},options);
listDialog.addEventListener('click',event=>{
  const button=event.target.closest('[data-list-message]');if(!button)return;
  listDialog.close();locate(lookup.get(button.dataset.listMessage),false);openMessage(button.dataset.listMessage);
},options);
for(const target of [listDialog,noticeDialog])target.addEventListener('close',resetUtility,options);
window.addEventListener('popstate',()=>{
  const id=routeId();
  if(active&&id!==active.id)closeMessage();
  else if(active&&id===active.id&&closing){
    clearAnimation();closing=false;gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';frozen(true);
  }else if(!active&&lookup.has(id))openRoute(id);
},options);
window.addEventListener('resize',()=>{
  cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{
    stopMotion();
    const centerX=(dimensions.viewWidth/2-Number(gsap.getProperty(wall,'x')))/dimensions.stepX;
    const centerY=(dimensions.viewHeight/2-Number(gsap.getProperty(wall,'y')))/dimensions.stepY;
    layout();drag.applyBounds(bounds());
    const p=clampPosition(dimensions.viewWidth/2-centerX*dimensions.stepX,dimensions.viewHeight/2-centerY*dimensions.stepY);
    gsap.set(wall,p);drag.update();
    if(active){if(closing)finishClose();else{clearAnimation();gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';}}
  });
},options);
motion.addEventListener('change',()=>{
  document.documentElement.dataset.reducedMotion=String(noMotion());
  stopMotion();drag.vars.inertia=!noMotion();
  if(active){if(closing)finishClose();else{clearAnimation();gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';}}
},options);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMotion();},options);
window.addEventListener('pagehide',event=>{
  stopMotion();if(!event.persisted){clearAnimation();drag.kill();events.abort();cancelAnimationFrame(resizeFrame);}
},options);
stage.dataset.ready='true';
const directId=routeId();
if(lookup.has(directId))openRoute(directId);
