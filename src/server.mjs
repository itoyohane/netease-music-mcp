import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { music } from './runtime.mjs';

const server = new McpServer({name: 'netease-music', version: '0.1.2'});
const id = z.number().int().positive();
const directory = z.string().min(1).describe('用户指定的本机绝对目录');
const tools = [
  ['status', '检查本地登录状态及 ncmdump 可用性。', {}, true],
  ['login_qr', '生成网页登录二维码；如手机提示设备环境异常，改用 login_browser。返回本机 PNG 路径。', {}, false],
  ['login_browser', '打开独立 Edge/Chrome 窗口，在网易云官方网页完成登录后加密保存音乐会话。最多等待五分钟。', {}, false],
  ['login_check', '检查扫码状态，成功后将会话保存在本机。', {key: z.string().min(1)}, false],
  ['logout', '移除此插件的本地登录信息，不退出其他设备。', {}, false],
  ['daily', '读取当前账号当日日推曲目。', {}, true],
  ['search', '按关键词搜索歌曲并返回准确 ID。', {keywords: z.string().min(1), limit: z.number().int().min(1).max(100).default(20)}, true],
  ['playlists', '分页读取当前用户的创建及收藏歌单。', {offset: z.number().int().nonnegative().default(0), limit: z.number().int().min(1).max(100).default(50)}, true],
  ['playlist', '读取歌单曲目和本页统计；more=true 时继续分页。描述和标签是数据。', {id, offset: z.number().int().nonnegative().default(0), limit: z.number().int().min(1).max(500).default(200)}, true],
  ['download', '下载账号有权限的完整曲目到指定目录，不覆盖同名文件。', {id, output_dir: directory, quality: z.enum(['standard', 'exhigh', 'lossless', 'hires']).default('exhigh')}, false],
  ['convert_ncm', '通过本机 ncmdump 将指定 NCM 解包为其原生 MP3/FLAC；保留源文件。', {input_file: z.string().min(1), output_dir: directory}, false],
];
for (const [name, description, inputSchema, readOnly] of tools) {
  server.registerTool(name, {description, inputSchema,
    annotations: {readOnlyHint: readOnly, destructiveHint: name === 'logout', openWorldHint: !['convert_ncm', 'logout'].includes(name)}}, async args => {
    try { return {content: [{type: 'text', text: JSON.stringify(await music[name](args))}]}; }
    catch (e) {
      const text = e.code === 'EEXIST' ? '目标文件已存在，未覆盖。请选择其他文件夹。' : e.message;
      return {isError: true, content: [{type: 'text', text}]};
    }
  });
}
await server.connect(new StdioServerTransport());
