export const GISCUS_ORIGIN='https://giscus.app';
const READ_ORIGIN=typeof LSSH_TEST_GISCUS_ORIGIN==='undefined'?GISCUS_ORIGIN:LSSH_TEST_GISCUS_ORIGIN;
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(id);
export function publicCommentURL(value,repo){
  try{const url=new URL(value);return url.origin==='https://github.com'&&
    url.username===''&&url.password===''&&url.pathname.startsWith('/'+repo+'/discussions/')&&
    /^\/[^/]+\/[^/]+\/discussions\/\d+$/.test(url.pathname)&&/^#discussioncomment-\d+$/.test(url.hash)?url.href:null;
  }catch{return null;}
}
export function normalizeComments(comments,repo,toText){
  const clean=node=>{
    if(!node||node.deletedAt||node.isMinimized||!validId(node.id))return null;
    const url=publicCommentURL(node.url,repo);if(!url)return null;
    const createdAt=String(node.createdAt||'');if(!Number.isFinite(Date.parse(createdAt)))return null;
    const body=toText(String(node.bodyHTML||'')).trim();
    return {id:node.id,url,createdAt,date:new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai'}).format(new Date(createdAt)),
      author:String(node.author?.login||'已注销用户'),body:body||'这条留言包含图片或附件，可以打开原留言查看。',
      excerpt:body.split(/\n/).find(line=>line.trim())?.trim().slice(0,100)||'一份图片或附件留言'};
  };
  return comments.map(node=>{
    const message=clean(node);if(!message)return null;
    const replies=(Array.isArray(node.replies)?node.replies:[]).map(clean).filter(Boolean);
    return {...message,replies,replyCount:Math.max(replies.length,Number(node.replyCount)||0)};
  }).filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}
export class GuestbookError extends Error{constructor(code,message){super(message);this.code=code;}}
async function getJSON(path,fetcher,signal){
  let response;
  try{response=await fetcher(READ_ORIGIN+path,{credentials:'omit',signal});}
  catch(error){if(signal?.aborted)throw error;throw new GuestbookError('network','留言区暂时无法连接。');}
  let data;try{data=await response.json();}catch{throw new GuestbookError('invalid','留言区返回了无法读取的数据。');}
  if(!response.ok){
    if(response.status===404&&data.error==='Discussion not found')return null;
    const code=response.status===429?'rate-limit':response.status===403&&String(data.error).includes('not installed')?'not-installed':'unavailable';
    throw new GuestbookError(code,code==='rate-limit'?'留言区请求较多，请稍后重试。':'留言区暂时无法连接。');
  }
  return data;
}
export async function resolveGiscus(base,fetcher=fetch,signal){
  const data=await getJSON('/api/discussions/categories?'+new URLSearchParams({repo:base.repo}),fetcher,signal);
  if(data?.repositoryId!==base.repoId||!Array.isArray(data.categories))throw new GuestbookError('configuration','留言区配置尚未就绪。');
  const category=base.categoryId?data.categories.find(c=>c.id===base.categoryId):
    data.categories.find(c=>['Announcements','公告'].includes(c.name));
  if(!category||!validId(category.id)||!category.name)throw new GuestbookError('configuration','留言分类尚未配置。');
  return {...base,category:category.name,categoryId:category.id};
}
export async function readDiscussion(config,toText,fetcher=fetch,signal){
  const comments=new Map();let after='',discussion=null,complete=false;
  for(let page=0;page<20;page++){
    const query=new URLSearchParams({repo:config.repo,term:config.term,strict:'true',category:config.category,first:'100'});
    if(after)query.set('after',after);
    const data=await getJSON('/api/discussions?'+query,fetcher,signal);
    if(data===null)return {messages:[],discussion:null,complete:true,fetchedAt:new Date().toISOString()};
    if(!data?.discussion||!Array.isArray(data.discussion.comments))throw new GuestbookError('invalid','留言数据暂时无法读取。');
    discussion=data.discussion;
    for(const comment of discussion.comments)if(validId(comment?.id))comments.set(comment.id,comment);
    if(!discussion.pageInfo?.hasNextPage){complete=true;break;}
    const next=discussion.pageInfo.endCursor;if(!next||next===after)throw new GuestbookError('pagination','留言分页暂时无法读取。');
    after=next;
  }
  return {messages:normalizeComments([...comments.values()],config.repo,toText),discussion,complete,fetchedAt:new Date().toISOString()};
}
export function assignBrickSlots(messages,previous={}){
  const slots=Object.create(null),occupied=new Set();
  for(const [id,slot]of Object.entries(previous))if(validId(id)&&Number.isInteger(slot)&&slot>=0&&slot<100000&&!occupied.has(slot)){
    slots[id]=slot;occupied.add(slot);
  }
  const ordered=[...messages].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  for(const message of ordered)if(slots[message.id]===undefined){
    let hash=2166136261;for(const char of message.id)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
    let slot=hash%169;while(occupied.has(slot))slot++;
    slots[message.id]=slot;occupied.add(slot);
  }
  const placed=messages.map(message=>({...message,row:Math.floor(slots[message.id]/13)+3,column:slots[message.id]%13}));
  return {messages:placed,slots,rows:Math.max(13,...placed.map(m=>m.row+4))};
}
