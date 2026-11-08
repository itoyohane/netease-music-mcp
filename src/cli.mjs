import {music} from './runtime.mjs';
const commands = new Set(['status', 'login_qr', 'login_check', 'login_browser', 'logout', 'daily', 'search', 'playlists', 'playlist', 'download', 'convert_ncm']);
try {
  const command = process.argv[2] || 'status';
  if (!commands.has(command)) throw new Error(`可用命令：${[...commands].join(', ')}`);
  const result = await music[command](JSON.parse(process.argv[3] || '{}'));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} catch (e) { process.stderr.write(e.message + '\n'); process.exitCode = 1; }
