import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

export function musicSession(cookies) {
  const allowed = new Set(['MUSIC_U', '__csrf']);
  return cookies.filter(c => allowed.has(c.name) &&
    ['music.163.com', '.music.163.com', '163.com', '.163.com'].includes(c.domain) &&
    !/[;\r\n]/.test(c.value)).map(c => `${c.name}=${c.value}`).join('; ');
}

async function rpc(socket, method, params = {}) {
  const id = Math.floor(Math.random() * 1e9);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('浏览器响应超时。')), 5000);
    const finish = (error, result) => {
      clearTimeout(timer);
      socket.removeEventListener('message', onMessage);
      error ? reject(error) : resolve(result);
    };
    const onMessage = event => {
      const data = JSON.parse(event.data);
      if (data.id === id) finish(data.error ? new Error('浏览器读取登录状态失败。') : null, data.result);
    };
    socket.addEventListener('message', onMessage);
    socket.send(JSON.stringify({id, method, params}));
  });
}

export async function browserLogin({stateDir, timeoutMs = 300000}) {
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ];
  let browser;
  for (const candidate of candidates) {
    if (await fs.access(candidate).then(() => true, () => false)) { browser = candidate; break; }
  }
  if (!browser) throw new Error('未找到 Edge 或 Chrome。');
  await fs.mkdir(stateDir, {recursive: true, mode: 0o700});
  const profile = await fs.mkdtemp(path.join(stateDir, 'official-login-'));
  const child = spawn(browser, ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--new-window', 'https://music.163.com/#/login'], {stdio: 'ignore', windowsHide: false});
  let launchFailed = false;
  child.on('error', () => { launchFailed = true; });
  let socket;
  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (launchFailed) throw new Error('无法启动登录浏览器。');
      const port = await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')
        .then(v => Number(v.split('\n')[0]), () => 0);
      if (port && !socket) {
        const pages = await fetch(`http://127.0.0.1:${port}/json`, {signal: AbortSignal.timeout(3000)}).then(r => r.json());
        const page = pages.find(p => p.type === 'page' && p.url.startsWith('https://music.163.com/'));
        if (page) {
          const url = new URL(page.webSocketDebuggerUrl);
          if (url.hostname !== '127.0.0.1' || Number(url.port) !== port) throw new Error('非本机浏览器调试地址。');
          socket = new WebSocket(url);
          await new Promise((resolve, reject) => {
            socket.addEventListener('open', resolve, {once: true});
            socket.addEventListener('error', () => reject(new Error('浏览器连接失败。')), {once: true});
          });
        }
      }
      if (socket?.readyState === WebSocket.OPEN) {
        const {cookies} = await rpc(socket, 'Network.getCookies', {urls: ['https://music.163.com/']});
        if (cookies.some(c => c.name === 'MUSIC_U' && c.value)) return musicSession(cookies);
      }
      if (child.exitCode !== null) throw new Error('登录窗口已关闭，尚未取得登录状态。');
      await delay(2000);
    }
    throw new Error('官方网页登录等待超时，请重试。');
  } finally {
    if (socket?.readyState === WebSocket.OPEN) {
      await rpc(socket, 'Browser.close').catch(() => {});
      socket.close();
    }
    if (child.exitCode === null) child.kill();
    // Only remove the temporary profile created above, under the specified state directory.
    if (path.dirname(profile) === path.resolve(stateDir) && path.basename(profile).startsWith('official-login-')) {
      await delay(1000);
      await fs.rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 500}).catch(() => {});
    }
  }
}
