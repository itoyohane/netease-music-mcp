import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const state = await fs.mkdtemp(path.join(os.tmpdir(), 'netease-login-test-'));
process.env.NETEASE_STATE_DIR = state;
const {Music} = await import('../src/core.mjs');

const require = createRequire(import.meta.url);
const createQr = require('@neteasecloudmusicapienhanced/api/module/login_qr_create.js');

test('login uses upstream web QR with chainId (regression for upstream issue #1)', async t => {
  const m = new Music({
    login_qr_key: async () => ({body: {code: 200, data: {unikey: 'test-key'}}}),
    login_qr_create: createQr,
  }, {cookie: ''});
  const result = await m.login_qr();
  t.after(async () => {
    await fs.unlink(result.qr_image_path);
    await fs.rmdir(state);
  });
  const url = new URL(result.url);
  assert.equal(url.origin, 'https://music.163.com');
  assert.equal(url.searchParams.get('codekey'), 'test-key');
  assert.ok(url.searchParams.get('chainId'), 'missing upstream web login chainId');
});
