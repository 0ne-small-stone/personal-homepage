import {mkdir,writeFile,rename} from 'node:fs/promises';
import {fromHtml} from 'hast-util-from-html';
import {toText} from 'hast-util-to-text';
import {publicCommentURL,publicDiscussionURL,validPagesSnapshot} from '../../src/components/wall/guestbook-data.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const config={repo:'0ne-small-stone/personal-homepage',repoId:'R_kgDOU_QJZg',category:'Announcements',categoryId:'DIC_kwDOU_QJZs4DHPIp',term:'LSSH · The Wall'};
const maxBytes=8*1024*1024;
export async function exportGuestbook(fetcher=fetch){
  async function read(path,query){
    const response=await fetcher('https://giscus.app'+path+'?'+query,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
    const text=await response.text();if(Buffer.byteLength(text)>maxBytes)throw Error('Public guestbook response too large');
    const data=JSON.parse(text);
    if(response.status===404&&data.error==='Discussion not found')return null;
    if(!response.ok)throw Error('Public guestbook read failed: '+response.status);
    return data;
  }
  const categories=await read('/api/discussions/categories',new URLSearchParams({repo:config.repo}));
  if(categories?.repositoryId!==config.repoId||!categories.categories?.some(x=>x.id===config.categoryId&&x.name===config.category))throw Error('Public guestbook configuration mismatch');
  let after='',discussion=null,complete=false;const comments=new Map(),cursors=new Set();
  for(let page=0;page<20;page++){
    const query=new URLSearchParams({repo:config.repo,term:config.term,strict:'true',category:config.category,first:'100'});if(after)query.set('after',after);
    const data=await read('/api/discussions',query);
    if(data===null){if(page!==0)throw Error('Public guestbook disappeared during pagination');complete=true;break;}
    if(!data.discussion||!Array.isArray(data.discussion.comments)||typeof data.discussion.pageInfo?.hasNextPage!=='boolean')throw Error('Invalid public guestbook response');
    if(discussion&&(discussion.id!==data.discussion.id||discussion.url!==data.discussion.url))throw Error('Public guestbook changed during pagination');
    discussion=data.discussion;
    for(const comment of discussion.comments)if(comment?.id)comments.set(comment.id,comment);
    if(!discussion.pageInfo?.hasNextPage){complete=true;break;}
    const next=discussion.pageInfo.endCursor;if(typeof next!=='string'||!next.trim()||next.length>512||cursors.has(next))throw Error('Invalid public guestbook cursor');cursors.add(next);after=next;
  }
  if(!complete)throw Error('Public guestbook pagination incomplete');
  function clean(node){
    if(!node||node.deletedAt||node.isMinimized||!/^[A-Za-z0-9_-]{1,160}$/.test(node.id)||!publicCommentURL(node.url,config.repo)||!Number.isFinite(Date.parse(node.createdAt)))return null;
    const tree=fromHtml(String(node.bodyHTML||''),{fragment:true});
    function prune(parent){if(!parent.children)return;parent.children=parent.children.filter(child=>!['script','style','iframe','object','button'].includes(child.tagName));parent.children.forEach(prune);}prune(tree);
    return {id:node.id,url:node.url,createdAt:node.createdAt,author:{login:String(node.author?.login||'已注销用户')},bodyText:toText(tree).trim()};
  }
  if(discussion){
    if(!publicDiscussionURL(discussion.url,config.repo)||typeof discussion.id!=='string'||!/^[A-Za-z0-9_-]{1,160}$/.test(discussion.id))throw Error('Invalid public discussion URL or ID');
    if(Number.isInteger(discussion.totalCommentCount)&&discussion.totalCommentCount<comments.size)throw Error('Inconsistent public guestbook count');
    const cleaned=[...comments.values()].map(node=>{
      const comment=clean(node);if(!comment)return null;
      const replies=(Array.isArray(node.replies)?node.replies:[]).map(clean).filter(Boolean);
      const replyCount=Number.isInteger(node.replyCount)&&node.replyCount>=0?node.replyCount:null;
      if(replyCount===null||replyCount>replies.length)complete=false;
      return {...comment,replies,replyCount:replyCount??replies.length};
    }).filter(Boolean);
    discussion={id:discussion.id,url:discussion.url,locked:Boolean(discussion.locked),totalCommentCount:Number.isInteger(discussion.totalCommentCount)?discussion.totalCommentCount:null,totalReplyCount:Number.isInteger(discussion.totalReplyCount)?discussion.totalReplyCount:null,comments:cleaned,pageInfo:{hasNextPage:false,endCursor:null}};
  }
  const snapshot={version:1,repo:config.repo,term:config.term,complete,fetchedAt:new Date().toISOString(),categories:{repositoryId:categories.repositoryId,categories:categories.categories.map(({id,name})=>({id,name}))},discussion};
  if(Buffer.byteLength(JSON.stringify(snapshot))>maxBytes)throw Error('Public guestbook snapshot too large');
  return snapshot;
}
export async function writeGuestbookSnapshot(snapshot,target=new URL('../../public/data/guestbook.json',import.meta.url)){
  if(snapshot.complete!==true)throw Error('Public guestbook snapshot incomplete; keeping previous output');
  if(!validPagesSnapshot(snapshot))throw Error('Public guestbook snapshot invalid; keeping previous output');
  await mkdir(new URL('.',target),{recursive:true});
  const temporary=new URL('./guestbook.json.tmp',target);
  await writeFile(temporary,JSON.stringify(snapshot));await rename(temporary,target);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  const snapshot=await exportGuestbook();
  await writeGuestbookSnapshot(snapshot);
  console.log('Public guestbook snapshot: '+(snapshot.discussion?.comments.length||0)+' comments, '+(snapshot.complete?'complete':'partial')+', '+snapshot.fetchedAt);
}
