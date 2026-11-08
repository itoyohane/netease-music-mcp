import {test} from 'node:test';
import assert from 'node:assert/strict';
import {musicSession} from '../src/browser-login.mjs';

test('browser login imports only music session fields from exact official domains', () => {
  assert.equal(musicSession([
    {name: 'MUSIC_U', domain: '.music.163.com', value: 'test-session'},
    {name: '__csrf', domain: 'music.163.com', value: 'test-csrf'},
    {name: 'OTHER', domain: '.163.com', value: 'unrelated'},
    {name: 'MUSIC_U', domain: 'evil163.com', value: 'bad'},
    {name: 'MUSIC_U', domain: '.music.163.com', value: 'bad; injected=yes'},
  ]), 'MUSIC_U=test-session; __csrf=test-csrf');
});
