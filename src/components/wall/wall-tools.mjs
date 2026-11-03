// A non-modal disclosure: native buttons and normal Tab order, no menu mode.
// All listeners belong to the page's existing AbortController.
export function mountWallTools({root,trigger,panel,signal,isBlocked=()=>false}){
  const doc=root.ownerDocument,options={signal};
  const focusTrigger=()=>trigger.focus({preventScroll:true});
  const close=({restoreFocus=panel.contains(doc.activeElement)}={})=>{
    panel.hidden=true;trigger.setAttribute('aria-expanded','false');
    if(restoreFocus)focusTrigger();
  };
  close({restoreFocus:false});
  trigger.addEventListener('click',()=>{
    if(trigger.disabled||isBlocked())return;
    if(panel.hidden){panel.hidden=false;trigger.setAttribute('aria-expanded','true');}
    else close();
  },options);
  root.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||panel.hidden)return;
    event.preventDefault();event.stopPropagation();close({restoreFocus:true});
  },options);
  const outside=event=>{
    if(!panel.hidden&&!root.contains(event.target))close({restoreFocus:false});
  };
  doc.addEventListener('pointerdown',outside,{...options,capture:true});
  doc.addEventListener('focusin',outside,options);
  root.addEventListener('focusout',event=>{
    if(!panel.hidden&&!root.contains(event.relatedTarget))close({restoreFocus:false});
  },options);
  signal?.addEventListener('abort',()=>close({restoreFocus:false}),{once:true});
  return {close,focusTrigger};
}
