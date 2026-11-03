// Observe only the native animation promise, not navigation/update failures.
export function nativeTransitionCancelled(error){
  return error?.name==='AbortError'||(error?.name==='InvalidStateError'&&/^(?:Transition was aborted because of invalid state\.\s*)?Viewport size changed\.?$/i.test(error?.message??''));
}
export function observeNativeReady(transition,{cancelled,unexpected}){
  if(!transition?.ready)return;
  void transition.ready.catch(error=>{
    if(nativeTransitionCancelled(error))cancelled(error);
    else unexpected(error);
  });
}
