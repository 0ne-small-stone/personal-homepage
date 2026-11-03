import test from 'node:test';
import assert from 'node:assert/strict';
import {isConfirmedEmptySnapshot,canShowEmptyInvitation}from '../src/components/wall/empty-invitation.mjs';
const empty={messages:[],discussion:{totalCommentCount:0},complete:true};
const applied={snapshot:empty,readState:'empty',messageCount:0,publicCount:0,previewCount:0,pending:false,refreshing:false,scene:'wall',pageActive:true};
test('only a complete applied zero-count snapshot or explicit not-found can invite',()=>{
  assert.equal(canShowEmptyInvitation(applied),true);
  assert.equal(canShowEmptyInvitation({...applied,snapshot:{...empty,discussion:null}}),true);
  for(const snapshot of [undefined,{...empty,complete:false},{...empty,localOnly:true},{...empty,messages:[{id:'filtered'}]},{...empty,discussion:undefined}])assert.equal(canShowEmptyInvitation({...applied,snapshot}),false);
});
test('normalized-away comments and unknown/non-numeric service counts never imply first post',()=>{
  for(const totalCommentCount of [1,4,-1,'0',null,undefined,NaN])assert.equal(isConfirmedEmptySnapshot({...empty,discussion:{totalCommentCount}}),false);
  assert.equal(isConfirmedEmptySnapshot({...empty,discussion:{}}),false);
});
test('visible examples, actual rows or count mismatches suppress the invitation',()=>{
  for(const counts of [{messageCount:1},{publicCount:1},{previewCount:12}])assert.equal(canShowEmptyInvitation({...applied,...counts}),false);
});
test('old empty cache is hidden during refresh, failure, pending and uncertain read states',()=>{
  for(const patch of [{refreshing:true},{pending:true},{readState:'loading'},{readState:'error'},{readState:'partial'},{readState:'unconfirmed'}])assert.equal(canShowEmptyInvitation({...applied,...patch}),false);
  assert.equal(canShowEmptyInvitation(applied),true,'a later fully applied successful empty read restores the static entry');
});
test('scene and page lifecycle gates suppress and restore without discarding the snapshot',()=>{
  for(const patch of [{scene:'breaking'},{scene:'stars'},{pageActive:false}])assert.equal(canShowEmptyInvitation({...applied,...patch}),false);
  assert.equal(canShowEmptyInvitation({...applied,pageActive:true,scene:'wall'}),true);
});
