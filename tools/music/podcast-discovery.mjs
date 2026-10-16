// Fixed public categories verified with dj_catelist, not arbitrary upstream input.
const sources={knowledge:[11],humanities:[3080098],interviews:[11,3080098,8],all:[11,3080098,8]};
const excludedContent=/短剧|翻唱|弹唱|有声(?:书|剧|小说)|广播剧|原著全本|沉浸式演[播说]|小说全集/i;
const conversation=/访谈|采访|对谈|对话|圆桌|会客|聊天室/;

export function podcastMatches(row,category='all'){
  const id=Number(row.categoryId);const title=String(row.name||'');
  const summary=String(row.rcmdtext||'');const description=String(row.desc||'');
  if(!title||Number(row.programCount)===0||![11,3080098,8].includes(id))return false;
  if(excludedContent.test(title+' '+summary+' '+description)||/\b(?:OST|BGM)\b|伴奏/i.test(title))return false;
  const interview=conversation.test(title+' '+summary+' '+description)&&!/(?:段子|笑话|八卦)/.test(title+' '+summary);
  if(category==='knowledge')return id===11;
  if(category==='humanities')return id===3080098;
  if(category==='interviews')return interview;
  return id!==8||interview;
}

const unique=items=>items.filter((item,index,list)=>list.findIndex(other=>other.id===item.id)===index);
function interleave(groups){const rows=[];for(let index=0;index<Math.max(0,...groups.map(group=>group.length));index++)for(const group of groups)if(group[index])rows.push(group[index]);return unique(rows);}

export function createPodcastDiscovery({request,identity,asCard,now=Date.now}){
  const cache=new Map();let owner;
  async function collect(category){
    const types=sources[category];
    const requests=types.flatMap(type=>[
      {type,featured:true,method:'dj_recommend_type',args:{type}},
      {type,featured:false,method:'dj_radio_hot',args:{cateId:type,limit:100,offset:0}},
    ]);
    const results=await Promise.allSettled(requests.map(item=>request(item.method,item.args)));
    if(results.every(result=>result.status==='rejected'))throw Error('网易云播客推荐暂时不可用，请稍后重试。');
    const featured=types.map(()=>[]);const popular=types.map(()=>[]);
    results.forEach((result,index)=>{
      if(result.status!=='fulfilled')return;
      const group=requests[index].featured?featured:popular;
      for(const row of (result.value.djRadios||[]).slice(0,100)){
        if(!podcastMatches(row,category))continue;
        const slot=category==='all'?types.indexOf(Number(row.categoryId)):types.indexOf(requests[index].type);
        try{group[slot].push({...asCard(row),discoveryCategory:category==='interviews'?'访谈':Number(row.categoryId)===11?'知识':Number(row.categoryId)===3080098?'人文':'访谈'});}catch{}
      }
    });
    const recommendations=interleave(featured);const cards=recommendations.slice(0,12);
    const rest=unique([...recommendations.slice(12),...interleave(popular)]).filter(item=>!cards.some(card=>card.id===item.id));
    return{cards,popular:rest,warnings:results.some(result=>result.status==='rejected')?['部分分类推荐暂时不可用，可以重试。']:[]};
  }
  return async function discover(category='all',offset=0,refresh=false){
    if(typeof category!=='string'||!Object.hasOwn(sources,category))throw Error('播客分类无效。');
    if(refresh&&offset!==0)throw Error('请从第一页刷新播客推荐。');
    const currentOwner=identity();if(owner!==currentOwner){cache.clear();owner=currentOwner;}
    let entry=cache.get(category);
    if(!entry||entry.expiresAt<=now()||refresh&&!entry.pending){
      entry={expiresAt:now()+300000,pending:true,promise:collect(category)};cache.set(category,entry);
      entry.promise.then(result=>{entry.pending=false;if(result.warnings.length&&cache.get(category)===entry)cache.delete(category);},()=>{entry.pending=false;if(cache.get(category)===entry)cache.delete(category);});
    }
    const data=await entry.promise;
    return{cards:offset===0?data.cards:[],popular:data.popular.slice(offset,offset+24),more:offset+24<data.popular.length,warnings:data.warnings};
  };
}
