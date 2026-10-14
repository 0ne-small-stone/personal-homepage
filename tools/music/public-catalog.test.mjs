import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {validatePublicMusicCatalog,choosePublicMusicCatalog} from './public-catalog.mjs';
import {checkPublicMusicCatalogFiles} from '../verification/music-catalog-check.mjs';
import {exportPublicMusicCatalog} from './export-public-catalog.mjs';
import {loadCloudCatalog} from './cloud-library.mjs';
const share='https://pan.koala-studio.org.cn/s/PublicFixture';
const base='https://pan.koala-studio.org.cn/public.php/dav/files/PublicFixture/';
const fixture=(id='public-song')=>({version:1,updatedAt:'2026-10-14T00:00:00Z',tracks:[{id,title:'公开测试曲目',artist:'歌手',album:'专辑',audioUrl:base+'tracks/song.flac',coverUrl:base+'covers/song.webp'}]});

test('public metadata normalization removes private fields without mutating its source',()=>{
  const raw=fixture();raw.cookie='dummy-private';raw.tracks[0].filePath='dummy-local-path';raw.tracks[0].account={token:'dummy-secret'};
  const before=structuredClone(raw);const parsed=validatePublicMusicCatalog(raw,share);
  assert.deepEqual(raw,before);assert.doesNotMatch(JSON.stringify(parsed),/dummy-private|dummy-secret|dummy-local-path|filePath|cookie|token/);assert.equal(parsed.tracks[0].audioUrl,raw.tracks[0].audioUrl);
});
test('the immutable automatic-sync tracks and covers are accepted within the same share',()=>{
  const raw=fixture();raw.tracks[0].audioUrl=base+'LSSH-AutoSync/tracks/song-123.flac';raw.tracks[0].coverUrl=base+'LSSH-AutoSync/covers/song-123.webp';assert.equal(validatePublicMusicCatalog(raw,share).tracks.length,1);
});
test('a valid remote catalog takes precedence over the committed snapshot',()=>{
  const result=choosePublicMusicCatalog({remote:fixture('remote'),snapshot:fixture('snapshot'),shareUrl:share});assert.equal(result.source,'remote');assert.equal(result.catalog.tracks[0].id,'remote');
});
test('a missing or canonical empty remote catalog uses the nonempty snapshot',()=>{
  for(const remote of [null,undefined,{version:1,updatedAt:null,tracks:[]}]){const result=choosePublicMusicCatalog({remote,snapshot:fixture('snapshot'),shareUrl:share});assert.equal(result.source,'snapshot');assert.equal(result.catalog.tracks[0].id,'snapshot');}
});
test('an empty or malformed snapshot fails closed instead of publishing an empty catalog',()=>{
  for(const snapshot of [{version:1,tracks:[]},null,{}])assert.throws(()=>choosePublicMusicCatalog({remote:null,snapshot,shareUrl:share}));
});
test('nonempty untrusted remote data is rejected rather than silently selected',()=>{
  const remote=fixture();remote.tracks[0].audioUrl='https://example.org/audio.flac';assert.throws(()=>choosePublicMusicCatalog({remote,snapshot:fixture(),shareUrl:share}));assert.throws(()=>choosePublicMusicCatalog({remote:{version:2,tracks:[]},snapshot:fixture(),shareUrl:share}));
});
test('local, external, other-share, credential and query-bearing audio addresses are rejected',()=>{
  const bad=[null,'/personal-homepage/music/local-audio/abc/','http://pan.koala-studio.org.cn/public.php/dav/files/PublicFixture/tracks/song.flac','https://example.org/audio.flac',base.replace('PublicFixture','OtherShare')+'tracks/song.flac',base+'covers/song.flac',base+'tracks/nested/song.flac',base+'tracks/song.flac?token=dummy',base+'tracks/song.flac#private',base.replace('https://','https://user:password@')+'tracks/song.flac',base+'tracks/%2Fsecret.flac'];
  for(const audioUrl of bad){const raw=fixture();raw.tracks[0].audioUrl=audioUrl;assert.throws(()=>validatePublicMusicCatalog(raw,share));}
});
test('an invalid cover is rejected before the shared parser can silently strip it',()=>{
  for(const coverUrl of ['file:///dummy.webp','https://example.org/cover.webp',base+'tracks/song.webp',base.replace('https://','https://user:password@')+'covers/song.webp']){const raw=fixture();raw.tracks[0].coverUrl=coverUrl;assert.throws(()=>validatePublicMusicCatalog(raw,share));}const raw=fixture();raw.tracks[0].coverUrl=null;assert.equal(validatePublicMusicCatalog(raw,share).tracks[0].coverUrl,null);
});
test('configuration and stable IDs are validated along with nonempty content',()=>{
  for(const invalid of ['https://example.org/s/PublicFixture',share+'?auth=dummy','http://pan.koala-studio.org.cn/s/PublicFixture',share.replace('https://','https://user:password@')])assert.throws(()=>validatePublicMusicCatalog(fixture(),invalid));const duplicate=fixture();duplicate.tracks.push({...duplicate.tracks[0]});assert.throws(()=>validatePublicMusicCatalog(duplicate,share));
});
test('the committed snapshot remains a real nonempty 18-track, 3-album public catalog',async()=>{
  const config=JSON.parse(await readFile(new URL('../../src/config/music-cloud.json',import.meta.url),'utf8'));
  const snapshot=JSON.parse(await readFile(new URL('../../src/data/music/cloud-catalog.json',import.meta.url),'utf8'));
  const parsed=validatePublicMusicCatalog(snapshot,config.shareUrl);assert.equal(parsed.tracks.length,18);assert.equal(new Set(parsed.tracks.map(t=>JSON.stringify([t.albumArtist,t.album]))).size,3);
});
test('the deployment guard rejects empty or private-field artifacts, not merely their normalized view',async()=>{
  const folder=await mkdtemp(join(tmpdir(),'lssh-public-catalog-'));try{
    const catalogPath=join(folder,'catalog.json'),configPath=join(folder,'config.json');await writeFile(configPath,JSON.stringify({version:1,shareUrl:share}));await writeFile(catalogPath,JSON.stringify(fixture()));assert.deepEqual(await checkPublicMusicCatalogFiles({catalogPath,configPath}),{tracks:1,albums:1});await writeFile(catalogPath,JSON.stringify({version:1,tracks:[]}));await assert.rejects(checkPublicMusicCatalogFiles({catalogPath,configPath}),/不能为空/);const privateFields=fixture();privateFields.tracks[0].filePath='dummy-private-path';await writeFile(catalogPath,JSON.stringify(privateFields));await assert.rejects(checkPublicMusicCatalogFiles({catalogPath,configPath}),/未允许发布/);
  }finally{await rm(folder,{recursive:true,force:true});}
});
test('export refuses private runtime sources before reading them',async()=>{
  await assert.rejects(exportPublicMusicCatalog({sourcePath:'.local-tools/music/netease-login.dpapi'}),/公开 JSON/);await assert.rejects(exportPublicMusicCatalog({sourcePath:'.local-tools/music/catalog.json'}),/公开 JSON/);
});
async function checkListingFailureRecovery(failListing,id) {
  const folder=await mkdtemp(join(tmpdir(),'lssh-public-listing-'));
  try {
    const configPath=join(folder,'public-config.json');
    await writeFile(configPath,JSON.stringify({version:1,shareUrl:share}));
    const calls=[];
    const request=async(url,options={})=>{
      const call={method:options.method||'GET',url:String(url)};calls.push(call);
      if(call.method==='PROPFIND')return failListing();
      assert.equal(call.url,base+'catalog.json','Fallback must read the configured public catalog.');
      const text=JSON.stringify(fixture(id));
      return new Response(text,{status:200,headers:{'Content-Type':'application/json','Content-Length':String(Buffer.byteLength(text))}});
    };
    const result=await loadCloudCatalog({request,configPath,useCache:false});
    assert.deepEqual(calls,[{method:'PROPFIND',url:base+'LSSH-AutoSync/catalogs/'},{method:'GET',url:base+'catalog.json'}]);
    assert.equal(result?.tracks.length,1,'The successful public GET must supply a nonempty catalog.');
    assert.equal(result.tracks[0].id,id,'Returned tracks must come from this GET, never an earlier cache.');
    assert.equal(result.tracks[0].audioUrl,base+'tracks/song.flac');
  } finally {await rm(folder,{recursive:true,force:true});}
}
test('a PROPFIND 503 still attempts public GET and returns its real tracks',async()=>{
  await checkListingFailureRecovery(()=>new Response('temporary listing failure',{status:503}),'listing-503-recovery');
});
test('a PROPFIND network exception still attempts public GET and returns its real tracks',async()=>{
  await checkListingFailureRecovery(()=>{throw new TypeError('offline listing fixture');},'listing-network-recovery');
});