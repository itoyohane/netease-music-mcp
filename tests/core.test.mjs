import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Music, safeName, audioType, summarize} from '../src/core.mjs';

test('Windows names and real format detection reject error pages', () => {
  assert.equal(safeName('CON'), '_CON');
  assert.equal(safeName('../a:b?'), '.._a_b_');
  assert.equal(audioType(Buffer.from('fLaC1234')), 'flac');
  assert.equal(audioType(Buffer.from('ID31234')), 'mp3');
  assert.throws(() => audioType(Buffer.from('<html>Error')));
});
test('summary distinguishes incomplete coverage', () => {
  assert.deepEqual(summarize([{artists: ['A'], duration_ms: 120000}], 3), {
    analyzed: 1, total: 3, complete: false, duration_minutes: 2, top_artists: [{name: 'A', tracks: 1}],
  });
});
test('playlist fetches IDs beyond preview and reports missing tracks', async () => {
  const m = new Music({
    playlist_detail: async () => ({body: {code: 200, playlist: {name: 'P', trackCount: 4, trackIds: [{id: 1}, {id: 2}, {id: 3}]}}}),
    song_detail: async ({ids}) => ({body: {code: 200, songs: ids.split(',').map(id => ({id: +id, name: 'S', ar: [{name: 'A'}]}))}}),
  }, {cookie: 'test'});
  const p = await m.playlist({id: 9, offset: 1, limit: 1});
  assert.equal(p.songs[0].id, 2);
  assert.equal(p.more, true);
  assert.equal(p.next_offset, 2);
  assert.equal(p.inaccessible_count, 1);
  assert.equal(p.statistics.complete, false);
});
test('authentication and paid download failures do not create outputs', async () => {
  const m = new Music({song_download_url_v1: async () => ({body: {code: 200, data: {url: null}}})}, {cookie: 'test'});
  await assert.rejects(m.download({id: 1, output_dir: 'unused'}), /权限/);
  await assert.rejects(new Music({}, {cookie: ''}).daily(), /登录/);
});
test('download verifies bytes, does not overwrite, and removes partial files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'netease-test-'));
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(Buffer.from('fLaC-test-audio'));
  const m = new Music({
    song_download_url_v1: async () => ({body: {code: 200, data: {url: 'https://m1.music.126.net/audio', size: Buffer.byteLength('fLaC-test-audio')}}}),
    song_detail: async () => ({body: {code: 200, songs: [{name: 'test', ar: [{name: 'A'}]}]}}),
  }, {cookie: 'test'});
  try {
    const d = await m.download({id: 1, output_dir: dir});
    assert.equal(d.format, 'flac');
    await assert.rejects(m.download({id: 1, output_dir: dir}), {code: 'EEXIST'});
    assert.equal((await fs.readdir(dir)).length, 1);
    globalThis.fetch = async () => new Response('short');
    await assert.rejects(m.download({id: 2, output_dir: dir}), /不完整/);
    assert.equal((await fs.readdir(dir)).length, 1);
  } finally { globalThis.fetch = original; await fs.rm(dir, {recursive: true, force: true}); }
});
test('redirects cannot send download traffic to arbitrary hosts', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'netease-test-'));
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () => { count++; return new Response(null, {status: 302, headers: {location: 'https://example.org/evil'}}); };
  const m = new Music({
    song_download_url_v1: async () => ({body: {data: {url: 'https://m1.music.126.net/a'}}}),
    song_detail: async () => ({body: {songs: []}}),
  }, {cookie: 'test'});
  try { await assert.rejects(m.download({id: 1, output_dir: dir}), /CDN/); assert.equal(count, 1); }
  finally { globalThis.fetch = original; await fs.rm(dir, {recursive: true, force: true}); }
});
