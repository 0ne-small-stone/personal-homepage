import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHomeReload,homeReturnSnapshot} from '../src/components/home/home-return-policy.mjs';
const album={chapterId:'album'},projects={chapterId:'projects'};
test('session latest may override an entry only for the first actual home reload',()=>{
  assert(initialHomeReload({firstInstall:true,navigationType:'reload',initialUrl:'https://site.test/home/#album',currentUrl:'https://site.test/home/#album'}));
  assert(!initialHomeReload({firstInstall:false,navigationType:'reload',initialUrl:'https://site.test/home/#album',currentUrl:'https://site.test/home/#album'}));
  assert(!initialHomeReload({firstInstall:true,navigationType:'reload',initialUrl:'https://site.test/about/',currentUrl:'https://site.test/home/'}));
  assert.equal(homeReturnSnapshot({entry:album,saved:projects,initialReload:true,returning:false,hasHash:true}),projects);
  assert.equal(homeReturnSnapshot({entry:album,saved:projects,initialReload:false,returning:true,hasHash:true}),album);
});
test('deep link and same-document history never borrow an unrelated session snapshot',()=>{
  assert.equal(homeReturnSnapshot({saved:projects,initialReload:false,returning:false,hasHash:true}),undefined);
  assert.equal(homeReturnSnapshot({saved:projects,initialReload:false,returning:true,hasHash:true}),undefined);
  assert.equal(homeReturnSnapshot({saved:projects,initialReload:false,returning:true,hasHash:false}),projects);
});
