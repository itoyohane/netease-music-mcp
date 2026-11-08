import {createCipheriv, createHash, randomInt} from 'node:crypto';

// DownList uses the desktop player endpoint rather than the download endpoint.
// Independent implementation of that request; no external service receives cookies.
export async function playerUrl({id, level, cookie}) {
  const route = '/api/song/enhance/player/url/v1';
  const payload = JSON.stringify({ids: [id], level, encodeType: 'flac',
    header: JSON.stringify({os: 'pc', appver: '', osver: '', deviceId: 'pyncm!',
      requestId: String(randomInt(20000000, 30000000))})});
  const digest = createHash('md5').update(`nobody${route}use${payload}md5forencrypt`).digest('hex');
  const cipher = createCipheriv('aes-128-ecb', Buffer.from('e82ckenh8dichen8'), null);
  const params = Buffer.concat([cipher.update(`${route}-36cd479b6b5-${payload}-36cd479b6b5-${digest}`, 'utf8'), cipher.final()]).toString('hex');
  const response = await fetch('https://interface3.music.163.com/eapi/song/enhance/player/url/v1', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: {'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Mozilla/5.0 NeteaseMusicDesktop/2.10.2.200154',
      cookie: 'os=pc; appver=; osver=; deviceId=pyncm!; ' + (typeof cookie === 'string' ? cookie : Object.entries(cookie || {}).map(([k, v]) => `${k}=${v}`).join('; '))},
    body: new URLSearchParams({params}),
  });
  if (!response.ok) throw new Error('网易云播放接口请求失败。');
  return {status: response.status, body: await response.json()};
}
