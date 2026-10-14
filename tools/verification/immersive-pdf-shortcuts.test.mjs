import test from 'node:test';
import assert from 'node:assert/strict';
import { immersivePdfShortcut } from '../../src/lib/immersivePdfShortcuts.ts';
const key = (input) => ({ key: '', code: '', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...input });

test('F works with IME Process or composing keys via its physical position', () => {
  for (const input of [{key:'Process',code:'KeyF',isComposing:true}, {key:'Unidentified',code:'KeyF'}, {key:'f'}, {key:'F',shiftKey:true}]) {
    assert.deepEqual(immersivePdfShortcut(key(input)), {kind:'fit'});
  }
  assert.equal(immersivePdfShortcut(key({key:'Process',code:'KeyG'})), undefined);
});
test('main row and numeric keypad retain modes 1 through 4 under an IME', () => {
  for (const columns of [1,2,3,4]) for (const code of [`Digit${columns}`,`Numpad${columns}`]) {
    assert.deepEqual(immersivePdfShortcut(key({key:'Process',code})), {kind:'mode',columns});
  }
});
test('every remaining digit releases the fixed layout, including zero', () => {
  for (const digit of [0,5,6,7,8,9]) for (const code of ['',`Digit${digit}`,`Numpad${digit}`]) {
    assert.deepEqual(immersivePdfShortcut(key({key:String(digit),code})), {kind:'free'});
  }
});
test('modified browser commands do not become fit or layout commands', () => {
  for (const modifier of ['ctrlKey','metaKey','altKey']) for (const code of ['KeyF','Digit0','Digit2','Numpad9']) {
    assert.equal(immersivePdfShortcut(key({key:'Process',code,[modifier]:true})),undefined);
  }
  assert.equal(immersivePdfShortcut(key({key:'!',code:'Digit1',shiftKey:true})),undefined);
});
test('other reading keys remain native PDF navigation', () => {
  for (const value of ['ArrowDown','PageUp','Escape','Tab']) assert.equal(immersivePdfShortcut(key({key:value,code:value})),undefined);
  for (const [value,code] of [['ArrowDown','Numpad2'],['Insert','Numpad0'],['PageDown','Numpad3']]) {
    assert.equal(immersivePdfShortcut(key({key:value,code})),undefined);
  }
});
