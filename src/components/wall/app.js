import {gsap} from 'gsap';
import {decorateDivisionBellReturn,updateDivisionBellReturnLabel} from '../navigation/division-bell-dom.ts';
import {Draggable} from 'gsap/Draggable';
import {InertiaPlugin} from 'gsap/InertiaPlugin';
import {Flip} from 'gsap/Flip';
import {giscusConfig} from '../../config/giscus.ts';
import {resolveGiscus,readDiscussion} from './guestbook-data.mjs';
import {mountGiscus} from './giscus-client.js';
import {mountWallFluid} from './wall-fluid.mjs';
import {visibleCells,messagePosition,cellKey,WallSecret} from './wall-world.mjs';
import {mergePreviewMessages,isPreviewHost} from './wall-preview.mjs';
import {mountStars} from './wall-stars.mjs';
import {createMessageSpace} from './wall-message-space.mjs';
import {mountBreach} from './wall-breach.mjs';
import {mountCircleGesture} from './wall-gesture.mjs';
gsap.registerPlugin(Draggable,InertiaPlugin,Flip);
const $ = selector=>document.querySelector(selector);
const stage=$('#wall-stage'),wall=$('#wall'),dialog=$('#message-dialog'),surface=$('#reading-surface'),content=$('#reading-content');
const listDialog=$('#list-dialog'),noticeDialog=$('#notice-dialog'),status=$('#status');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const forcedReduced=new URLSearchParams(location.search).get('motion')==='reduce';
const noMotion=()=>forcedReduced||motion.matches;
document.documentElement.dataset.reducedMotion=String(noMotion());
let messages=[];
const view={x:0,y:0,z:0},localView={x:0,y:0},tiles=new Map(),messageCells=new Map();
const secret=new WallSecret(),stars=mountStars($('#star-field')),breach=mountBreach($('#break-field'),stage);
const messageSpace=createMessageSpace();let spacePinned=null;
let gesture;
const proxy=document.createElement('div');proxy.className='drag-proxy';proxy.setAttribute('aria-hidden','true');stage.append(proxy);
let scene='wall',previousProxy={x:0,y:0},sceneFrames=0,tileWindowKey='',starTargetZ=0,returnView=null,unlockOrigin=null;
const lookup=new Map(),bricks=new Map();
const events=new AbortController(),options={signal:events.signal};
let drag,dimensions,flow,active=null,portal=null,animation=null,closing=false,ignoreUntil=0,resizeFrame=0,located=null;
let previousFocus=null,locationOwner=false,restoringFocus=false,animationTimer=0;
let config=null,lastSnapshot=null,pendingSnapshot=null,loadPromise=null,requestController=null,giscusClient=null,giscusMounted=false;
const slotKey='lssh-wall-world-v2:'+giscusConfig.repo+':'+giscusConfig.term;
let brickSlots={};try{const saved=JSON.parse(localStorage.getItem(slotKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))brickSlots=saved;}catch{}
function toPlainText(html){
  const template=document.createElement('template');template.innerHTML=html;
  for(const node of template.content.querySelectorAll('script,style,iframe,object,button'))node.remove();
  for(const node of template.content.querySelectorAll('br'))node.replaceWith(document.createTextNode('\n'));
  for(const node of template.content.querySelectorAll('p,div,li,pre,blockquote,h1,h2,h3,h4,hr'))node.append(document.createTextNode('\n\n'));
  return template.content.textContent.replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function showWallState(kind,text=''){
  stage.dataset.dataState=kind;
  if(kind!=='error')delete stage.dataset.dataError;
  const empty=messages.length===0;
  $('#wall-state').hidden=!empty||kind==='loading';
  $('#wall-state-title').textContent=kind==='empty'?'把第一句话留在这里':'还没能读到墙上的话';
  $('#wall-state-description').textContent=kind==='empty'?'使用 GitHub 账号，让后来的人听见你的回声。':text||'稍后重试，也可以去 GitHub 讨论区看看。';
  $('#wall-state-action').textContent=kind==='empty'?'留下话语':'重新连接';
  const publicCount=messages.filter(message=>!message.preview).length,previewCount=messages.length-publicCount;
  const examples=previewCount?' · '+previewCount+'条示例':'';
  $('#wall-source-label').textContent=(kind==='loading'?'读取留言中':kind==='error'?'公开留言未更新':
    publicCount+'条公开留言'+(lastSnapshot?.complete===false?'（部分）':''))+examples;
  $('#list-empty').hidden=!empty;
  $('#list-empty').textContent=kind==='empty'?'还没有留言，可以留下第一句话。':'暂时未能读取留言，请关闭后重试，或打开 GitHub 讨论区。';
  const label=$('#wall-hint');label.title=lastSnapshot?'读取于 '+new Date(lastSnapshot.fetchedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):'';
}
function applySnapshot(snapshot){
  if(active||dialog.open||listDialog.open||noticeDialog.open||scene==='breaking'){pendingSnapshot=snapshot;$('#wall-source-label').textContent=lastSnapshot?'待更新':'留言区已连接';return;}
  const initial=lastSnapshot===null||lastSnapshot.localOnly,focused=document.activeElement?.dataset.message;
  const placed=mergePreviewMessages(snapshot.messages,brickSlots,location.hostname);brickSlots=placed.slots;messages=placed.messages;
  stage.dataset.publicMessages=String(placed.publicCount);stage.dataset.previewMessages=String(placed.previewCount);
  try{localStorage.setItem(slotKey,JSON.stringify(brickSlots));}catch{}
  stopMotion();lookup.clear();messageCells.clear();for(const message of messages){lookup.set(message.id,message);messageCells.set(cellKey(message.row,message.column),message);}
  located=null;wall.replaceChildren();tiles.clear();bricks.clear();tileWindowKey='';createList();renderScene();
  if(initial&&messages.length)locate(messages[0],false);
  lastSnapshot=snapshot;pendingSnapshot=null;
  if(focused){restoringFocus=true;(bricks.get(focused)||stage).focus({preventScroll:true});restoringFocus=false;}
  showWallState(snapshot.localOnly?'error':messages.length?'ready':'empty');
  if(initial&&lookup.has(routeId()))openRoute(routeId());
  else if(initial&&routeId())announce('这条留言已删除、隐藏或暂时无法读取，可以查看其他留言。');
}
function applyPending(){if(pendingSnapshot&&!active&&!dialog.open&&!listDialog.open&&!noticeDialog.open)applySnapshot(pendingSnapshot);}
function refreshWall(){
  if(loadPromise)return loadPromise;
  requestController=new AbortController();const timeout=setTimeout(()=>requestController?.abort(),15000);
  if(!lastSnapshot)showWallState('loading');$('#refresh-button').disabled=true;
  loadPromise=(async()=>{
    try{
      config=config||await resolveGiscus(giscusConfig,fetch,requestController.signal);
      const snapshot=await readDiscussion(config,toPlainText,fetch,requestController.signal);applySnapshot(snapshot);
      if(giscusMounted&&snapshot.discussion)$('#giscus-discussion-link').href=snapshot.discussion.url;
      if(noticeDialog.open)ensureComposer();
      return snapshot;
    }catch(error){
      if(!lastSnapshot&&isPreviewHost(location.hostname))applySnapshot({messages:[],discussion:null,complete:false,localOnly:true,fetchedAt:new Date().toISOString()});
      showWallState('error',error.name==='AbortError'?'连接留言区超时了，请稍后重试。':error.message);
      stage.dataset.dataError=error.code||'network';
      if(noticeDialog.open&&!giscusMounted){$('#giscus-status').textContent='留言区暂时无法连接，可以稍后重试或在 GitHub 继续。';$('#giscus-retry').hidden=false;}
      return null;
    }finally{clearTimeout(timeout);requestController=null;loadPromise=null;$('#refresh-button').disabled=false;}
  })();return loadPromise;
}
function ensureComposer(){
  if(!config){$('#giscus-status').textContent='正在连接留言区…';refreshWall();return;}
  if(giscusMounted)return;giscusMounted=true;$('#giscus-retry').hidden=true;
  giscusClient=mountGiscus($('#wall-comments'),config,{
    onStatus(state){
      $('#giscus-status').textContent=state==='connecting'?'正在连接留言区…':state==='ready'?'':
        '留言区暂时无法连接，可以重新连接或在 GitHub 继续。';
      $('#giscus-retry').hidden=!['error','timeout'].includes(state);$('#wall-comments').dataset.state=state;
    },
    onDiscussion(discussion){
      const snapshot=pendingSnapshot||lastSnapshot;
      if(discussion?.totalCommentCount!==snapshot?.discussion?.totalCommentCount||
        Date.now()-Date.parse(snapshot?.fetchedAt||0)>30000)refreshWall();
    }
  });
}
function openComposer(){openUtility(noticeDialog);noticeDialog.querySelector('.composer-content').scrollTop=0;ensureComposer();}
function announce(text){status.textContent=text;}
function size(){
  const css=getComputedStyle(stage),bw=parseFloat(css.getPropertyValue('--bw')),bh=parseFloat(css.getPropertyValue('--bh')),gap=4;
  return {bw,bh,gap,stepX:bw+gap,stepY:bh+gap,viewWidth:stage.clientWidth,viewHeight:stage.clientHeight};
}
function createList(){
  $('#message-list').replaceChildren();
  for(const message of messages){
    const button=document.createElement('button');button.type='button';button.dataset.listMessage=message.id;
    button.append(document.createTextNode(message.excerpt));
    const author=document.createElement('span');author.textContent=message.author+' · '+message.date;
    button.append(author);$('#message-list').append(button);
  }
}
function lightGlyph(){
  const light=document.createElement('span');light.className='star-light';light.setAttribute('aria-hidden','true');
  const aura=document.createElement('span');aura.className='star-aura';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 64');svg.classList.add('star-sigil');
  const rays=document.createElementNS(svg.namespaceURI,'path');rays.setAttribute('class','star-rays');
  rays.setAttribute('d','M32 15 C33.3 27.5 36.3 30.7 47 32 C36.3 33.3 33.3 36.6 32 49 C30.7 36.6 27.7 33.3 17 32 C27.7 30.7 30.7 27.5 32 15Z');
  const core=document.createElementNS(svg.namespaceURI,'circle');core.setAttribute('class','star-heart');core.setAttribute('cx','32');core.setAttribute('cy','32');core.setAttribute('r','1.7');
  svg.append(rays,core);light.append(aura,svg);return light;
}
function createTile(cell,message){
  const tile=document.createElement(message?'button':'div');
  tile.className=scene==='stars'?'message-star':'brick'+(message?' brick-message':'');
  tile.dataset.row=cell.row;tile.dataset.column=cell.column;
  if(message){
    tile.type='button';tile.dataset.message=message.id;
    tile.setAttribute('aria-label',message.author+'：'+message.excerpt+'，打开留言');
    const excerpt=document.createElement('span'),author=document.createElement('span');
    excerpt.className='brick-excerpt';excerpt.textContent=message.excerpt;
    author.className='brick-author';author.textContent=message.author;if(scene==='stars')tile.append(lightGlyph());tile.append(excerpt,author);bricks.set(message.id,tile);
  }else tile.setAttribute('aria-hidden','true');
  return tile;
}
function renderStarScene(){
  gsap.set(wall,{x:0,y:0});const wanted=new Set();
  const entries=messageSpace.update(messages,view,dimensions,spacePinned||document.activeElement?.dataset.message);
  stage.dataset.starRecycles=String(messageSpace.recycled);
  for(const {message,projection:p,opacity} of entries){
    if(!p||p.x<-100||p.x>dimensions.viewWidth+100||p.y<-100||p.y>dimensions.viewHeight+100)continue;
    const key=message.id;wanted.add(key);let tile=tiles.get(key);
    if(!tile){tile=createTile({row:message.row,column:message.column},message);tiles.set(key,tile);wall.append(tile);}
    tile.style.left=(p.x-32)+'px';tile.style.top=(p.y-32)+'px';
    tile.style.setProperty('--star-scale',String(Math.max(.78,Math.min(1.3,p.scale))));
    tile.style.setProperty('--star-opacity',String(opacity));
    tile.tabIndex=opacity<.06?-1:0;tile.style.pointerEvents=opacity<.06?'none':'';
    tile.classList.toggle('is-located',message.id===located);
  }
  for(const [key,tile] of tiles)if(!wanted.has(key)){if(tile===document.activeElement)stage.focus({preventScroll:true});bricks.delete(tile.dataset.message);tile.remove();tiles.delete(key);}
  stars.render(view,dimensions);stage.dataset.anchor='space';
}
function renderScene(){
  if(scene==='breaking')return;
  if(scene==='stars')renderStarScene();
  else{
    const window=visibleCells(view,dimensions);Object.assign(localView,{x:window.x,y:window.y});gsap.set(wall,{x:localView.x,y:localView.y});
    const key=window.anchorRow+':'+window.anchorColumn+':'+window.cells[0].key+':'+window.cells.at(-1).key+':'+window.cells.length;
    if(key!==tileWindowKey){
      tileWindowKey=key;const wanted=new Set();
      for(const cell of window.cells){
        const message=messageCells.get(cell.key);wanted.add(cell.key);let tile=tiles.get(cell.key);
        if(!tile){tile=createTile(cell,message);tiles.set(cell.key,tile);wall.append(tile);}
        tile.style.left=cell.x+'px';tile.style.top=cell.y+'px';
      }
      for(const [key,tile] of tiles)if(!wanted.has(key)){
        if(tile===document.activeElement){restoringFocus=true;stage.focus({preventScroll:true});restoringFocus=false;}
        if(tile.dataset.message)bricks.delete(tile.dataset.message);tile.remove();tiles.delete(key);
      }
      flow?.retile(dimensions);
    }
    stage.dataset.anchor=window.anchorRow+':'+window.anchorColumn;
  }
  stage.dataset.worldX=String(view.x);stage.dataset.worldY=String(view.y);stage.dataset.worldZ=String(view.z||0);
  stage.dataset.tiles=String(tiles.size);stage.dataset.sceneFrames=String(++sceneFrames);
}
function layout(){dimensions=size();tileWindowKey='';wall.style.width=dimensions.viewWidth+'px';wall.style.height=dimensions.viewHeight+'px';renderScene();if(scene==='wall')flow?.refresh(dimensions);}
function stopMotion(){drag?.tween?.kill();gsap.killTweensOf(view);starTargetZ=view.z;spacePinned=null;}
function moveTo(x,y,animate=true,z=view.z,pinned=null){
  if(dialog.open||noticeDialog.open||listDialog.open||!Number.isFinite(x+y+z))return;
  if(scene==='breaking')finishBreak();stopMotion();starTargetZ=z;spacePinned=pinned;
  if(!animate||noMotion()){Object.assign(view,{x,y,z});renderScene();spacePinned=null;return;}
  gsap.to(view,{x,y,z,duration:scene==='stars'?.48:.38,ease:'power3.out',onUpdate:renderScene,onComplete:()=>{spacePinned=null;}});
}
function positionFor(message){if(scene==='stars'){const p=messageSpace.location(message.id);return {x:dimensions.viewWidth/2-p.x,y:dimensions.viewHeight/2-p.y,z:p.z-1000};}return {...messagePosition(message,dimensions),z:0};}
function locate(message,animate=true){
  if(!message)return;if(scene==='breaking')finishBreak();located=message.id;
  const p=positionFor(message);moveTo(p.x,p.y,animate,p.z,message.id);announce('已定位'+message.author+'的留言');
}
function pan(direction){
  if(scene==='breaking')return;
  const deltas={left:[dimensions.stepX*.55,0],right:[-dimensions.stepX*.55,0],up:[0,dimensions.stepY*.55],down:[0,-dimensions.stepY*.55]};
  const [x,y]=deltas[direction];moveTo(view.x+x,view.y+y);
}
function frozen(value){
  stopMotion();gesture?.reset();if(value)drag?.disable();else if(!listDialog.open&&!noticeDialog.open&&scene!=='breaking')drag?.enable();
  stage.dataset.frozen=String(value);flow?.freeze(value||scene!=='wall');
}
function sceneUI(){
  document.body.dataset.scene=scene;stage.dataset.scene=scene;
  $('#return-wall').dataset.returnPaused=String(noMotion()||scene==='wall');
  document.dispatchEvent(new Event('lssh:return-motion-state'));
  $('#star-field').hidden=scene==='wall';$('#flow-toggle').hidden=scene!=='wall';$('#return-wall').hidden=scene==='wall';
  stage.setAttribute('aria-label',scene==='wall'?'无限留言砖墙，可拖动探索，也可用方向键移动':'无限留言星空，可拖动探索，也可用方向键移动');
  $('#hint-text').textContent=scene==='wall'?'拖动探索 · 悬停显字':'拖动漫游 · 滚轮前后穿行';
  $('#list-title').textContent=scene==='wall'?'墙上的话':'星空里的话';
  $('#message-close').setAttribute('aria-label',scene==='wall'?'关闭留言，回到原砖':'关闭留言，回到原星');
}
function maybeBreak(){
  if(!secret.pending||scene!=='wall'||active||dialog.open||listDialog.open||noticeDialog.open||document.hidden)return;
  stopMotion();returnView={x:view.x,y:view.y,z:0};flow?.suspend();flow?.freeze(true);gesture?.reset();drag?.disable();
  const origin={x:Math.max(30,Math.min(dimensions.viewWidth-30,unlockOrigin?.x??dimensions.viewWidth/2)),y:Math.max(30,Math.min(dimensions.viewHeight-30,unlockOrigin?.y??dimensions.viewHeight/2))};
  scene='breaking';sceneUI();stars.render(view,dimensions);stage.dataset.unlockReason=secret.reason;
  announce('墙后还有一片星空。可以继续探索，或返回砖墙。');
  if(noMotion()){finishBreak();return;}
  const faces=Array.from(wall.children).map(tile=>{const r=tile.getBoundingClientRect(),color=getComputedStyle(tile).backgroundColor.match(/[\d.]+/g)?.slice(0,3).map(Number);return {x:r.x,y:r.y,width:r.width,height:r.height,color};});
  wall.hidden=true;breach.start(faces,origin,dimensions,finishBreak,({travel=0})=>{view.z=travel*480;stage.dataset.worldZ=String(view.z);stars.render(view,dimensions);});
}
function finishBreak(){
  if(scene!=='breaking')return;breach.cancel();wall.hidden=false;scene='stars';wall.replaceChildren();tiles.clear();bricks.clear();tileWindowKey='';sceneUI();renderScene();frozen(false);applyPending();
}
function returnWall(){
  if(scene==='wall')return;breach.cancel();wall.hidden=false;stopMotion();scene='wall';messageSpace.reset();if(returnView)Object.assign(view,returnView);view.z=0;starTargetZ=0;returnView=null;unlockOrigin=null;secret.reset();gesture?.reset();stage.dataset.messageOpens='0';stage.dataset.circleLoops='0';delete stage.dataset.unlockReason;
  wall.replaceChildren();tiles.clear();bricks.clear();tileWindowKey='';sceneUI();renderScene();flow?.refresh(dimensions);frozen(false);
  stage.focus({preventScroll:true});announce('已回到破墙前的位置。');applyPending();
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
  clearTimeout(animationTimer);animationTimer=0;
  const previousAnimation=animation,previousPortal=portal;animation=null;portal=null;
  previousAnimation?.kill();
  if(previousPortal){Flip.killFlipsOf(previousPortal,false);gsap.killTweensOf(previousPortal);previousPortal.remove();}
  gsap.killTweensOf(surface);gsap.killTweensOf(content);
}
function writeMessage(message){
  $('#message-meta').textContent=message.author+' · '+message.date;
  $('#message-title').textContent=message.excerpt.length<=40?message.excerpt:'来自 '+message.author+' 的话';
  $('#message-body').replaceChildren();
  const paragraphs=message.body.split('\n\n');
  if(paragraphs[0]===$('#message-title').textContent)paragraphs.shift();
  for(const text of paragraphs){const paragraph=document.createElement('p');paragraph.textContent=text;$('#message-body').append(paragraph);}
  const replyLink=$('#reply-link');replyLink.hidden=Boolean(message.preview);
  if(message.preview)replyLink.removeAttribute('href');else replyLink.href=message.url;
  $('#message-reply-count').textContent=message.preview?(message.replyCount?message.replyCount+'条示例回复':'示例留言 · 仅本地展示'):message.replyCount+'条回复';
  $('#reply-list').replaceChildren();$('#message-replies').hidden=message.replies.length===0;
  for(const reply of message.replies){
    const article=document.createElement('article'),meta=document.createElement('p'),body=document.createElement('p');
    meta.className='reply-meta';meta.textContent=reply.author+' · '+reply.date;body.textContent=reply.body;
    article.append(meta,body);$('#reply-list').append(article);
  }
}
function openMessage(id,push=true,userInitiated=true){
  const message=lookup.get(id);if(!message||active||closing)return;
  if(scene==='breaking')finishBreak();
  if(!bricks.has(id))locate(message,false);
  stopMotion();active=message;previousFocus=document.activeElement;
  secret.open(userInitiated&&scene==='wall');stage.dataset.messageOpens=String(secret.opens);
  if(secret.pending&&scene==='wall'){const r=bricks.get(id).getBoundingClientRect();unlockOrigin={x:r.x+r.width/2,y:r.y+r.height/2};}
  const brick=bricks.get(id),sourceRect=brick.getBoundingClientRect();
  writeMessage(message);gsap.set(surface,{opacity:0});gsap.set(content,{opacity:0});surface.scrollTop=0;
  content.scrollTop=0;dialog.showModal();frozen(true);brick.classList.add('is-selected');dialog.dataset.message=id;
  if(push){
    const {x,y}=view;
    history.pushState({...history.state,wallMessage:true,wallView:{
      centerX:(dimensions.viewWidth/2-x)/dimensions.stepX,centerY:(dimensions.viewHeight/2-y)/dimensions.stepY,centerZ:view.z
    }},'', '#message/'+encodeURIComponent(id));locationOwner=true;
  }
  else locationOwner=Boolean(history.state?.wallMessage);
  $('#message-close').focus({preventScroll:true});
  const finish=()=>{
    if(closing||active?.id!==id)return;
    portal?.remove();portal=null;gsap.set(surface,{opacity:1});
    dialog.dataset.phase='revealing';
    gsap.to(content,{opacity:1,duration:noMotion()?0:.14,onComplete:()=>{
      clearTimeout(animationTimer);animationTimer=0;
      dialog.dataset.phase='reading';announce('正在阅读'+message.author+'的留言');
    }});
  };
  if(noMotion()){finish();return;}
  const layer=makePortal(sourceRect,message);dialog.dataset.phase='opening';
  // A throttled preview/background renderer must not leave a blank reading card.
  animationTimer=setTimeout(()=>{
    if(active?.id===id&&!closing){clearAnimation();gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';announce('正在阅读'+message.author+'的留言');}
  },1200);
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
  const nextId=routeId();if(lookup.has(nextId))openRoute(nextId);else{announce(scene==='stars'?'已回到原来的星空位置':'已回到原来的墙面位置');applyPending();maybeBreak();}
}
function closeMessage(){
  if(!active||closing)return;closing=true;dialog.dataset.phase='closing';
  const brick=bricks.get(active.id);if(!brick){finishClose();return;}const target=brick.getBoundingClientRect();
  const current=portal?portal.getBoundingClientRect():surface.getBoundingClientRect();
  clearAnimation();
  if(noMotion()){finishClose();return;}
  const layer=makePortal(current);
  gsap.set(surface,{opacity:0});const state=Flip.getState(layer);rectStyle(layer,target);
  animation=Flip.from(state,{duration:.36,ease:'power3.inOut',scale:true,onComplete:finishClose});
  animationTimer=setTimeout(()=>{if(closing)finishClose();},700);
}
function requestClose(){
  if(!active||closing)return;
  if(locationOwner&&routeId()===active.id)history.back();
  else{history.replaceState(history.state,'',location.pathname+location.search);closeMessage();}
}
function openUtility(target){
  if(scene==='breaking')finishBreak();stopMotion();target.showModal();drag.disable();stage.dataset.frozen='true';
  flow?.freeze(true);gesture?.reset();
}
function resetUtility(){
  if(!dialog.open)frozen(false);
  applyPending();maybeBreak();
}
function routeId(){try{return location.hash.startsWith('#message/')?decodeURIComponent(location.hash.slice(9)):null;}catch{return null;}}
function openRoute(id){
  const savedView=history.state?.wallView;
  if(Number.isFinite(savedView?.centerX)&&Number.isFinite(savedView?.centerY))
    moveTo(dimensions.viewWidth/2-savedView.centerX*dimensions.stepX,dimensions.viewHeight/2-savedView.centerY*dimensions.stepY,false,scene==='stars'&&Number.isFinite(savedView.centerZ)?savedView.centerZ:0);
  else locate(lookup.get(id),false);
  openMessage(id,false,false);
}
function setupDrag(){
  function dragged(){view.x+=this.x-previousProxy.x;view.y+=this.y-previousProxy.y;previousProxy={x:this.x,y:this.y};renderScene();}
  drag=Draggable.create(proxy,{type:'x,y',trigger:stage,minimumMovement:6,dragResistance:.12,
    inertia:!noMotion(),throwResistance:1800,minDuration:.12,maxDuration:.55,dragClickables:true,allowEventDefault:true,cursor:'grab',activeCursor:'grabbing',
    onPressInit(){stopMotion();gsap.set(proxy,{x:0,y:0});this.update();previousProxy={x:0,y:0};},
    onDragStart(){stage.classList.add('dragging');},onDrag:dragged,onThrowUpdate:dragged,
    onDragEnd(){stage.classList.remove('dragging');ignoreUntil=performance.now()+220;},
    onClick(event){const brick=event.target.closest?.('[data-message]');if(brick&&performance.now()>ignoreUntil)openMessage(brick.dataset.message);}
  })[0];
}
dimensions=size();sceneUI();layout();setupDrag();
flow=mountWallFluid({stage,wall,button:$('#flow-toggle'),reduced:noMotion,position:()=>localView});flow.refresh(dimensions);
gesture=mountCircleGesture({stage,progress:$('#circle-progress'),
  blocked:()=>scene!=='wall'||dialog.open||listDialog.open||noticeDialog.open||document.hidden,
  onUnlock(count,origin){unlockOrigin=origin;if(secret.circles(count))maybeBreak();}
});
const disposeReturn=decorateDivisionBellReturn($('#return-wall'),{label:'返回砖墙',compact:true});
const compactReturnLabel=matchMedia('(max-width:420px)');
function syncReturnLabel(){updateDivisionBellReturnLabel($('#return-wall'),compactReturnLabel.matches?'返回':'返回砖墙','返回砖墙');}
syncReturnLabel();compactReturnLabel.addEventListener('change',syncReturnLabel,options);
$('#return-wall').addEventListener('click',returnWall,options);
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&scene==='breaking')returnWall();},options);

wall.addEventListener('click',event=>{
  const brick=event.target.closest('[data-message]');
  if(brick&&event.detail===0&&performance.now()>ignoreUntil)openMessage(brick.dataset.message);
},options);
stage.addEventListener('wheel',event=>{
  if(event.ctrlKey||event.metaKey||dialog.open||listDialog.open||noticeDialog.open)return;
  event.preventDefault();if(scene==='breaking')return;
  const unit=event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1;
  if(scene==='stars'){
    const next=starTargetZ-Math.max(-300,Math.min(300,event.deltaY*unit))*1.15;
    moveTo(view.x-event.deltaX*unit,view.y,true,next);
  }else moveTo(view.x-event.deltaX*unit,view.y-event.deltaY*unit);
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
$('#leave-button').addEventListener('click',openComposer,options);
$('#wall-state-action').addEventListener('click',()=>{if(stage.dataset.dataState==='empty')openComposer();else refreshWall();},options);
$('#refresh-button').addEventListener('click',()=>refreshWall(),options);
$('#giscus-retry').addEventListener('click',()=>{
  if(giscusMounted)giscusClient?.retry();
  else{config=null;refreshWall();}
},options);
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
for(const target of [listDialog,noticeDialog])target.addEventListener('close',()=>{resetUtility();if(target===noticeDialog)refreshWall();},options);
window.addEventListener('popstate',()=>{
  const id=routeId();
  if(active&&id!==active.id)closeMessage();
  else if(active&&id===active.id&&closing){
    clearAnimation();closing=false;gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';frozen(true);
  }else if(!active&&lookup.has(id))openRoute(id);
},options);
window.addEventListener('resize',()=>{
  cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{
    if(scene==='breaking')finishBreak();stopMotion();
    const centerX=(dimensions.viewWidth/2-view.x)/dimensions.stepX,centerY=(dimensions.viewHeight/2-view.y)/dimensions.stepY;
    dimensions=size();view.x=dimensions.viewWidth/2-centerX*dimensions.stepX;view.y=dimensions.viewHeight/2-centerY*dimensions.stepY;
    layout();
    if(active){if(closing)finishClose();else{clearAnimation();gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';}}
  });
},options);

motion.addEventListener('change',()=>{
  document.documentElement.dataset.reducedMotion=String(noMotion());
  $('#return-wall').dataset.returnPaused=String(noMotion()||scene==='wall');
  document.dispatchEvent(new Event('lssh:return-motion-state'));
  if(scene==='breaking')finishBreak();flow?.preferences();
  stopMotion();drag.vars.inertia=!noMotion();
  if(active){if(closing)finishClose();else{clearAnimation();gsap.set([surface,content],{opacity:1});dialog.dataset.phase='reading';}}
},options);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(scene==='breaking')finishBreak();stopMotion();gesture?.reset();}else maybeBreak();},options);
window.addEventListener('blur',()=>gesture?.reset(),options);
window.addEventListener('pagehide',event=>{
  if(scene==='breaking')finishBreak();stopMotion();flow?.suspend();if(!event.persisted){disposeReturn();flow?.dispose();gesture?.dispose();breach.cancel();requestController?.abort();giscusClient?.dispose();clearAnimation();drag.kill();events.abort();cancelAnimationFrame(resizeFrame);}
},options);
stage.dataset.ready='true';
refreshWall();
if(new URLSearchParams(location.search).has('giscus')||location.hash==='#wall-comments')openComposer();
