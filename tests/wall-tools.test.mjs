import test from 'node:test';
import assert from 'node:assert/strict';
import {mountWallTools}from '../src/components/wall/wall-tools.mjs';

function setup(isBlocked=()=>false){
  const doc=Object.assign(new EventTarget(),{activeElement:null});
  class Element extends EventTarget{
    constructor(parent=null){super();this.parent=parent;this.ownerDocument=doc;this.hidden=false;this.attributes={};}
    contains(element){for(let node=element;node;node=node.parent)if(node===this)return true;return false;}
    setAttribute(key,value){this.attributes[key]=value;}
    focus(){doc.activeElement=this;}
  }
  const root=new Element(),trigger=new Element(root),panel=new Element(root),action=new Element(panel),outside=new Element();
  const controller=new AbortController(),tools=mountWallTools({root,trigger,panel,signal:controller.signal,isBlocked});
  const fire=(target,type,element=target,key)=>{const event=new Event(type,{cancelable:true});Object.defineProperty(event,'target',{value:element});if(key)Object.defineProperty(event,'key',{value:key});target.dispatchEvent(event);return event;};
  return {doc,root,trigger,panel,action,outside,controller,tools,fire,open(){trigger.focus();fire(trigger,'click');}};
}
test('Escape in the disclosure closes it and returns focus to its visible trigger',()=>{
  const t=setup();assert.equal(t.panel.hidden,true);t.open();t.action.focus();
  const event=t.fire(t.root,'keydown',t.action,'Escape');
  assert.equal(event.defaultPrevented,true);assert.equal(t.panel.hidden,true);assert.equal(t.trigger.attributes['aria-expanded'],'false');assert.equal(t.doc.activeElement,t.trigger);
});
test('outside pointer and focus dismiss without stealing the new target focus',()=>{
  for(const type of ['pointerdown','focusin']){const t=setup();t.open();t.outside.focus();t.fire(t.doc,type,t.outside);assert.equal(t.panel.hidden,true);assert.equal(t.doc.activeElement,t.outside);t.controller.abort();}
});
test('moving between panel controls keeps it open; boundary close returns hidden focus safely',()=>{
  const t=setup();t.open();t.action.focus();t.fire(t.doc,'focusin',t.action);assert.equal(t.panel.hidden,false);
  t.tools.close();assert.equal(t.panel.hidden,true);assert.equal(t.doc.activeElement,t.trigger);
  t.tools.close({restoreFocus:false});assert.equal(t.doc.activeElement,t.trigger);
});
test('page abort closes the panel and removes every listener before a later mount',()=>{
  const t=setup();t.open();t.controller.abort();assert.equal(t.panel.hidden,true);
  t.fire(t.trigger,'click');assert.equal(t.panel.hidden,true);
  const fresh=new AbortController();mountWallTools({root:t.root,trigger:t.trigger,panel:t.panel,signal:fresh.signal});
  t.fire(t.trigger,'click');assert.equal(t.panel.hidden,false,'one fresh handler, not a doubled toggle');
  fresh.abort();assert.equal(t.panel.hidden,true);
});
test('Tab leaving the document closes the group without moving focus back',()=>{
  const t=setup();t.open();t.action.focus();
  const inside=new Event('focusout');Object.defineProperty(inside,'relatedTarget',{value:t.trigger});t.root.dispatchEvent(inside);assert.equal(t.panel.hidden,false);
  t.doc.activeElement=null;t.root.dispatchEvent(new Event('focusout'));assert.equal(t.panel.hidden,true);assert.equal(t.doc.activeElement,null);
});
test('a blocked scene cannot reopen the disclosure and normal interaction resumes later',()=>{
  let blocked=true;const t=setup(()=>blocked);t.open();assert.equal(t.panel.hidden,true);
  blocked=false;t.fire(t.trigger,'click');assert.equal(t.panel.hidden,false);
  t.tools.close();blocked=true;t.fire(t.trigger,'click');assert.equal(t.panel.hidden,true);
});
