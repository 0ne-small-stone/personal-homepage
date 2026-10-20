// The upstream SDK can print response cookies. Only our fixed startup/failure text is emitted.
console.log=console.info=console.warn=console.error=()=>{};
try{
  const [{Pool},{createOnlineMusic},{createPostgresSessions},{createPlaybackAccount},{createNetEaseCore}]=await Promise.all([
    import('pg'),import('./gateway.mjs'),import('./session-store.mjs'),import('../../tools/music/playback-account.mjs'),import('../../tools/music/netease-core.mjs')
  ]);
  const origin=process.env.MUSIC_PUBLIC_ORIGIN||process.env.RENDER_EXTERNAL_URL;
  if(!origin||!process.env.DATABASE_URL||!process.env.MUSIC_SESSION_KEY)throw Error();
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:10000,idleTimeoutMillis:30000});
  pool.on('error',()=>{});
  const sessions=createPostgresSessions({pool,key:process.env.MUSIC_SESSION_KEY});await sessions.ready();await sessions.prune();
  const pruning=setInterval(()=>void sessions.prune().catch(()=>{}),300000);pruning.unref();
  const server=createOnlineMusic({origin,sessions,accountFactory:store=>createPlaybackAccount({store}),coreFactory:account=>createNetEaseCore({account}),trustProxy:process.env.RENDER==='true'});
  server.on('error',()=>{clearInterval(pruning);process.stderr.write('Music service could not start its listener.\n');void sessions.close().then(()=>pool.end()).finally(()=>process.exit(1));});
  server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>process.stdout.write('Echoes music service ready.\n'));
  let closing=false;
  const stop=()=>{if(closing)return;closing=true;clearInterval(pruning);server.close(()=>{void sessions.close().then(()=>pool.end()).finally(()=>process.exit(0));});setTimeout(()=>process.exit(1),15000).unref();};
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
}catch{process.stderr.write('Music service configuration or startup failed. Check configured secrets and database availability.\n');process.exit(1);}
