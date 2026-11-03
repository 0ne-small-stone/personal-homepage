// A normalized empty collection alone cannot establish the first public post:
// hidden/invalid comments may have been filtered by the existing reader.
export function isConfirmedEmptySnapshot(snapshot){
  if(snapshot?.complete!==true||snapshot.localOnly||!Array.isArray(snapshot.messages)||snapshot.messages.length!==0)return false;
  return snapshot.discussion===null||snapshot.discussion?.totalCommentCount===0;
}
export function canShowEmptyInvitation({snapshot,readState,messageCount,publicCount,previewCount,pending,refreshing,scene,pageActive}){
  return isConfirmedEmptySnapshot(snapshot)&&readState==='empty'&&messageCount===0&&publicCount===0&&previewCount===0&&!pending&&!refreshing&&scene==='wall'&&pageActive===true;
}
