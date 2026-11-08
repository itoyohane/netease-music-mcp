import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

test('real SDK handshake, 11 tools, harmless status and validation', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const state = await fs.mkdtemp(path.join(os.tmpdir(), 'netease-mcp-'));
  const client = new Client({name: 'verification', version: '1.0.0'});
  const transport = new StdioClientTransport({command: process.execPath,
    args: [path.join(root, 'src', 'server.mjs')], env: {...process.env, NETEASE_STATE_DIR: state}});
  try {
    await client.connect(transport);
    const {tools} = await client.listTools();
    assert.equal(tools.length, 11);
    assert.ok(tools.some(tool => tool.name === 'login_browser'));
    const result = await client.callTool({name: 'status', arguments: {}});
    assert.equal(JSON.parse(result.content[0].text).logged_in, false);
    const daily = await client.callTool({name: 'daily', arguments: {}});
    assert.equal(daily.isError, true);
    assert.match(daily.content[0].text, /登录/);
    const bad = await client.callTool({name: 'download', arguments: {id: -1, output_dir: 'x'}});
    assert.equal(bad.isError, true);
  } finally { await client.close(); await fs.rm(state, {recursive: true, force: true}); }
});
