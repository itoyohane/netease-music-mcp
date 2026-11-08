import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash, createDecipheriv} from 'node:crypto';
import {Music} from '../src/core.mjs';
import {playerUrl} from '../src/player-url.mjs';

const bytes = Buffer.from('fLaC-complete-audio');
const complete = {id: 1, code: 200, url: 'https://m1.music.126.net/song', time: 180000,
  size: bytes.length, md5: createHash('md5').update(bytes).digest('hex')};
const response = data => ({body: {code: 200, data}});
const api = data => ({
  song_download_url_v1: async () => response({id: 1, code: -103, url: null}),
  downlist_player_url: async () => response([data]),
  song_detail: async () => ({body: {songs: [{id: 1, name: 'Song', ar: [{name: 'Artist'}], dt: 180000}]}}),
});

test('download rejection or API error falls back, validates file and preserves existing output', async () => {
  const original = globalThis.fetch;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'music-fallback-'));
  globalThis.fetch = async () => new Response(bytes);
  try {
    const m = new Music(api(complete), {cookie: 'test'});
    const result = await m.download({id: 1, output_dir: dir});
    assert.equal(result.source, 'downlist_player');
    assert.match(result.primary_failure, /-103/);
    assert.deepEqual(await fs.readFile(result.path), bytes);
    await assert.rejects(m.download({id: 1, output_dir: dir}), {code: 'EEXIST'});
    assert.equal((await fs.readdir(dir)).length, 1);
    const second = new Music({...api(complete), song_download_url_v1: async () => {throw Error('network');}}, {cookie: 'test'});
    await assert.rejects(second.download({id: 1, output_dir: dir}), {code: 'EEXIST'});
    const normal = new Music({...api(complete), song_download_url_v1: async () => response(complete),
      downlist_player_url: async () => {assert.fail('successful download must not invoke fallback');}}, {cookie: 'test'});
    await assert.rejects(normal.download({id: 1, output_dir: dir}), {code: 'EEXIST'});
  } finally {globalThis.fetch = original; await fs.rm(dir, {recursive: true, force: true});}
});

test('fallback rejects trials, wrong tracks and uncertain durations before writing', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {assert.fail('rejected metadata must not fetch audio');};
  try {
    for (const data of [null, {...complete, freeTrialInfo: {}},
      {...complete, freeTrialPrivilege: {resConsumable: true}}, {...complete, id: 2},
      {...complete, time: 30000}, {...complete, time: undefined}, {...complete, code: -103}]) {
      const m = new Music(api(data), {cookie: 'test'});
      await assert.rejects(m.download({id: 1, output_dir: 'unused'}));
    }
    const m = new Music({...api(complete), downlist_player_url: async () => {assert.fail('disabled fallback');}}, {cookie: 'test'});
    await assert.rejects(m.download({id: 1, output_dir: 'unused', playback_fallback: false}), /未启用/);
  } finally {globalThis.fetch = original;}
});

test('fallback retains CDN and integrity checks and removes incomplete files', async () => {
  const original = globalThis.fetch;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'music-fallback-'));
  try {
    globalThis.fetch = async () => new Response('short');
    await assert.rejects(new Music(api(complete), {cookie: 'test'}).download({id: 1, output_dir: dir}), /不完整/);
    assert.deepEqual(await fs.readdir(dir), []);
    globalThis.fetch = async () => {assert.fail('foreign CDN');};
    await assert.rejects(new Music(api({...complete, url: 'https://example.com/song'}), {cookie: 'test'}).download({id: 1, output_dir: dir}), /CDN/);
    assert.deepEqual(await fs.readdir(dir), []);
  } finally {globalThis.fetch = original; await fs.rm(dir, {recursive: true, force: true});}
});

test('player adapter sends authenticated encrypted request only to NetEase', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://interface3.music.163.com/eapi/song/enhance/player/url/v1');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.cookie, 'os=pc; appver=; osver=; deviceId=pyncm!; MUSIC_U=test');
    const cipher = createDecipheriv('aes-128-ecb', Buffer.from('e82ckenh8dichen8'), null);
    const plain = Buffer.concat([cipher.update(Buffer.from(options.body.get('params'), 'hex')), cipher.final()]).toString();
    const [route, json, digest] = plain.split('-36cd479b6b5-');
    assert.equal(route, '/api/song/enhance/player/url/v1');
    assert.equal(digest, createHash('md5').update(`nobody${route}use${json}md5forencrypt`).digest('hex'));
    assert.equal(JSON.parse(json).ids[0], 1);
    assert.equal(JSON.parse(json).level, 'lossless');
    return Response.json({code: 200, data: [complete]});
  };
  try {assert.equal((await playerUrl({id: 1, level: 'lossless', cookie: 'MUSIC_U=test'})).body.code, 200);}
  finally {globalThis.fetch = original;}
});
