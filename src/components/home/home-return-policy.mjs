export function initialHomeReload({firstInstall,navigationType,initialUrl,currentUrl}){
  if(!firstInstall||navigationType!=='reload'||!initialUrl)return false;
  return new URL(initialUrl).pathname===new URL(currentUrl).pathname;
}
export function homeReturnSnapshot({entry,saved,initialReload,returning,hasHash}){
  if(initialReload)return saved??entry;
  if(returning)return entry??(!hasHash?saved:undefined);
  return undefined;
}
