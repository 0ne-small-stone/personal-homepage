const base = '/personal-homepage/api/music';
const $ = id => document.getElementById(id);
let timer;
const labels = { pending:'待审核',rejected:'未采用',syncing:'正在同步',synced:'已加入歌单',awaiting_auth:'已通过 · 等待授权',failed:'同步失败' };
async function request(path, body) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET',headers: body ? {'Content-Type':'application/json'} : {},body: body ? JSON.stringify(body) : undefined,cache:'no-store' });
  const data = await response.json();if (!response.ok) throw Error(data.error || '操作失败，请稍后重试。');return data;
}
function node(tag, text, className) { const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;return element; }
async function refresh() {
  const data = await request('/admin/state');
  $('account').textContent = data.account ? '已授权：' + data.account.nickname : '尚未授权';
  $('logout').hidden = !data.account;
  $('queue').replaceChildren();
  if (!data.records.length) $('queue').append(node('p','还没有收到推荐。'));
  data.records.forEach(record => {
    const article=node('article','', 'record');
    article.append(node('h3',record.song.title + ' · ' + record.song.artist),node('p','推荐人：' + record.nickname),node('p',record.reason),node('p',labels[record.status] + ' · ' + record.message));
    const song=node('a','查看网易云歌曲');song.href='https://music.163.com/#/song?id='+record.song.id;song.target='_blank';song.rel='noopener noreferrer';article.append(song);
    const actions=node('div','','actions');
    const action = (text, decision) => {
      const button=node('button',text);
      button.addEventListener('click', async () => {
        button.disabled=true;
        try { const result=await request('/admin/review',{id:record.id,decision});$('feedback').textContent=result.message;await refresh(); }
        catch(error){$('feedback').textContent=error.message;button.disabled=false;}
      });actions.append(button);
    };
    if(record.status==='pending'){action('通过并同步','approve');action('暂不采用','reject');}
    if(['failed','awaiting_auth'].includes(record.status))action('重试同步','retry');
    article.append(actions);$('queue').append(article);
  });
}
$('qr-start').addEventListener('click',async()=>{
  clearInterval(timer);$('qr-start').disabled=true;$('qr-status').textContent='正在获取二维码…';
  try {
    const data=await request('/admin/qr',{action:'create'});$('qr').src=data.image;$('qr').hidden=false;$('qr-status').textContent='请用网易云 App 扫码。';
    let checking=false;
    timer=setInterval(async()=>{
      if(checking||document.hidden)return;checking=true;
      try{const status=await request('/admin/qr-check',{action:'check'});$('qr-status').textContent=status.message;
        if([800,803].includes(status.code)){clearInterval(timer);$('qr').hidden=true;await refresh();}
      }catch(error){clearInterval(timer);$('qr-status').textContent=error.message;}
      finally{checking=false;}
    },3000);
  }catch(error){$('qr-status').textContent=error.message;}
  finally{$('qr-start').disabled=false;}
});
$('logout').addEventListener('click',async()=>{await request('/admin/logout',{action:'logout'});clearInterval(timer);$('qr').hidden=true;await refresh();});
$('refresh').addEventListener('click',()=>refresh().catch(error=>{$('feedback').textContent=error.message;}));
refresh().catch(error=>{$('feedback').textContent=error.message;});
setInterval(()=>{if(!document.hidden)refresh().catch(()=>{});},15000);
window.addEventListener('pagehide',()=>clearInterval(timer));
