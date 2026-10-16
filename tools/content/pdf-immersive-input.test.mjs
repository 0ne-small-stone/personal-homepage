import test from 'node:test';
import {getEventListeners} from 'node:events';
import assert from 'node:assert/strict';
import {bindImmersivePdfInput} from '../../src/lib/immersivePdfInput.ts';

function fixture(){
 const target=new EventTarget(),controller=new AbortController(),runs=[];
 let active=true;
 bindImmersivePdfInput({defaultView:target},{signal:controller.signal,active:()=>active,run:shortcut=>runs.push(shortcut)});
 function send(type,{key='',code='',keyCode=0,...rest}={},field){
  const event=new Event(type,{cancelable:true});
  Object.assign(event,{key,code,keyCode,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,...rest});
  if(field)Object.defineProperty(event,'target',{value:{nodeType:1,closest:()=>field}});
  target.dispatchEvent(event);return event;
 }
 return {send,runs,controller,listeners:()=>getEventListeners(target,'keydown').length+getEventListeners(target,'keyup').length,setActive:value=>{active=value;}};
}
test('native keydown + keyup executes each 1–4/F command once',()=>{
 const f=fixture();
 for(const value of ['1','2','3','4','f']){
  const event={key:value,code:value==='f'?'KeyF':`Digit${value}`};
  assert.equal(f.send('keydown',event).defaultPrevented,true);f.send('keyup',event);
 }
 assert.deepEqual(f.runs,[1,2,3,4].map(columns=>({kind:'mode',columns})).concat({kind:'fit'}));
});
test('an IME obscured/missing keydown falls back to keyup, including legacy keyCode',()=>{
 const f=fixture();
 f.send('keydown',{key:'Process',keyCode:229,isComposing:true});
 f.send('keyup',{key:'Process',keyCode:70});
 f.send('keyup',{key:'Process',keyCode:50});
 assert.deepEqual(f.runs,[{kind:'fit'},{kind:'mode',columns:2}]);
});
test('physical IME keys and all cancellation digits remain supported',()=>{
 const f=fixture();
 for(const [key,code] of [['Process','KeyF'],['Process','Digit4'],['0','Digit0'],['9','Numpad9']]){
  f.send('keydown',{key,code,isComposing:true});f.send('keyup',{key,code});
 }
 assert.deepEqual(f.runs,[{kind:'fit'},{kind:'mode',columns:4},{kind:'free'},{kind:'free'}]);
});
test('visible fields keep typing; hidden toolbar focus cannot swallow reading keys',()=>{
 const f=fixture(),key={key:'3',code:'Digit3'};
 f.send('keydown',key,{getClientRects:()=>[{}]});f.send('keyup',key,{getClientRects:()=>[{}]});
 assert.equal(f.runs.length,0);
 f.send('keydown',key,{getClientRects:()=>[]});f.send('keyup',key,{getClientRects:()=>[]});
 assert.deepEqual(f.runs,[{kind:'mode',columns:3}]);
});
test('outside immersion/modifier commands and detached frames stay untouched',()=>{
 const f=fixture(),key={key:'f',code:'KeyF'};
 for(const modifier of ['ctrlKey','metaKey','altKey']){f.send('keydown',{...key,[modifier]:true});f.send('keyup',{...key,[modifier]:true});}
 f.setActive(false);f.send('keyup',key);f.setActive(true);
 f.send('keydown',{...key,ctrlKey:true});f.send('keyup',key);
 f.controller.abort();assert.equal(f.listeners(),0);f.send('keydown',key);f.send('keyup',key);
 assert.equal(f.runs.length,0);
});
