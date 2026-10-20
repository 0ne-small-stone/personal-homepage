import {scatterMessages,hash,cellKey} from './wall-world.mjs';

export const isPreviewHost=hostname=>['127.0.0.1','localhost','[::1]','::1'].includes(hostname);
const writing=[
  ['下班路上','今天什么也没完成，但晚霞很好看。'],
  ['散步的人','如果你也刚好路过，就在这里歇一会儿吧。'],
  ['慢半拍','原来墙的后面是星空。'],
  ['小满','留个脚印，明年再回来看看。'],
  ['六月','毕业以后，大家散在不同的城市。\n\n偶尔想起一起熬夜的那间教室，还是会笑。'],
  ['不加糖','刚结束一场很糟糕的面试。回家的路上买了冰淇淋，算是今天给自己的安慰。'],
  ['拾光','这里的星星不用抢，也不会熄灭。'],
  ['凌晨两点','给未来的自己：别再熬那么晚啦。'],
  ['白开水','看到这句话的时候，记得喝口水。'],
  ['终于出门','今天终于把拖了很久的事做完了！'],
  ['旧车票','想念一个人，但是今天先不打扰。'],
  ['等风来','晚安，下一次见。']
];
const responses={0:['另一个路人','下次也记得抬头看一眼。'],3:['守墙的人','那就明年见。'],8:['路过','喝到了，谢谢提醒 :)']};
export function previewMessages(){
  return writing.map(([author,body],i)=>{
    const id='preview-visitor-'+String(i+1).padStart(2,'0'),createdAt='2000-01-'+String(i+1).padStart(2,'0')+'T12:00:00.000Z';
    const replies=responses[i]?[{id:id+'-reply',author:responses[i][0],body:responses[i][1],date:'示例回复',preview:true,url:null}]:[];
    return {id,createdAt,date:'本地示例',author,body,excerpt:body.split('\n')[0],preview:true,url:null,replies,replyCount:replies.length};
  });
}
// Public data stays untouched. Examples get stable nearby slots only on loopback.
export function mergePreviewMessages(realMessages,previous,hostname){
  const real=scatterMessages(realMessages,previous);
  if(!isPreviewHost(hostname))return {...real,publicCount:real.messages.length,previewCount:0};
  const ids=new Set(realMessages.map(m=>m.id)),samples=previewMessages().filter(m=>!ids.has(m.id));
  const anchor=real.messages[0]||{row:0,column:0},slots={...real.slots},occupied=new Set(Object.values(slots).map(p=>cellKey(p.row,p.column)));
  for(const sample of samples){
    if(slots[sample.id])continue;
    for(let attempt=0;;attempt++){
      const radius=5+Math.floor(attempt/120),span=radius*2+1;
      const row=anchor.row+hash(sample.id+':row:'+attempt)%span-radius,column=anchor.column+hash(sample.id+':column:'+attempt)%span-radius;
      const key=cellKey(row,column);if(occupied.has(key))continue;
      slots[sample.id]={row,column};occupied.add(key);break;
    }
  }
  const placed=scatterMessages([...realMessages,...samples],slots);
  return {...placed,publicCount:real.messages.length,previewCount:samples.length};
}
