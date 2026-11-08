# 网易云音乐 MCP

简体中文 · [English](README.en.md)

**一句话安装**：把下面这句话发给正在使用的 Codex、Claude Code、Cursor、Gemini CLI 或 VS Code Copilot（Agent 模式）。

> 请按 https://github.com/itoyohane/netease-music-mcp/blob/main/INSTALL.md 为我在当前编程助手中安装网易云音乐 MCP，保留已有配置并验证 status 工具。

助手需要能访问网络、运行终端和修改客户端配置。安装后再按需登录。[各客户端安装说明](INSTALL.md)

让支持 MCP 的桌面助手在本机连接网易云音乐。你可以说「列出我今天的日推」「总结这个歌单里出现最多的五位歌手」，或「把这首歌下载到我指定的文件夹」。这是使用社区 API 的非官方项目。

## 快速开始

准备 Node.js 22 或更高版本和 Git。在终端运行：

```sh
git clone https://github.com/itoyohane/netease-music-mcp.git
cd netease-music-mcp
npm ci --ignore-scripts
npm run doctor
```

首次使用时，看到 `logged_in: false` 表示服务已能运行，下一步是连接客户端并登录。如果只想搜索歌曲，可以跳过登录。只有转换 NCM 才需要另外安装 [ncmdump](https://github.com/taurusxin/ncmdump/releases)。

## 连接到 Codex

在刚刚克隆的目录运行 `node -p "require('path').resolve('src/server.mjs')"` 获取入口的绝对路径。打开用户目录下的 `.codex/config.toml`，加入以下配置，把示例路径换成命令的输出：

```toml
[mcp_servers.netease-music]
command = 'node'
args = ['D:\projects\netease-music-mcp\src\server.mjs']
tool_timeout_sec = 360
```

保存并重启客户端。在新聊天里说「使用 netease-music 检查登录状态」，能看到登录状态和转换器状态即连接成功。若桌面客户端找不到 Node，将 `command` 改为 `node -p "process.execPath"` 输出的路径。其他支持 stdio 的 MCP 客户端也可以用同一个命令和入口参数启动服务。

## 第一次使用

1. **登录。** 说「显示网易云登录二维码」，用手机网易云音乐扫码并确认，再让助手检查扫码结果。如果手机提示设备环境异常，Windows 用户可说「用浏览器登录」，在独立的 Edge 或 Chrome 窗口完成网页登录。
2. **看日推。** 说「按原顺序列出今天的日推，附上歌手和歌曲链接」。服务按北京时间标注日期。
3. **总结歌单。** 说「找到我的通勤歌单，读取所有页，统计歌手出现次数和总时长」。多人合作曲会为每位参与歌手各计一次，出现次数指歌单内的曲目数。
4. **下载。** 例如「搜索陈奕迅的《十年》，把《黑白灰》专辑里的版本下载到 `D:\Music`」。账号需有该曲目的下载权限。服务返回实际保存路径，同名文件会保留。
5. **转换。** 将 ncmdump 可执行文件加入 PATH，或将环境变量 `NCMDUMP_PATH` 设为其绝对路径。说「把 `D:\Music\示例.ncm` 转换到 `D:\Music\Converted`」。输出取决于源音频编码，可能是 FLAC 或 MP3，原文件保留。

## 工具速查

| 工具 | 主要输入 | 用途 |
| --- | --- | --- |
| `status` | 无 | 检查当前会话和 ncmdump |
| `login_qr` / `login_check` | 无 / `key` | 获取二维码，查询扫码结果并保存会话 |
| `login_browser` / `logout` | 无 | Windows 独立浏览器登录 / 清除插件保存的会话 |
| `search` | `keywords`，可选 `limit` | 查找歌曲 ID、歌手和专辑 |
| `daily` | 无 | 获取当日日推曲目 |
| `playlists` | 可选 `offset`、`limit` | 分页列出创建和收藏的歌单 |
| `playlist` | 歌单 `id`，可选分页参数 | 获取曲目、歌单标签及本页统计 |
| `download` | 歌曲 `id`、`output_dir`、可选 `quality` | 保存账号可下载的曲目 |
| `convert_ncm` | `input_file`、`output_dir` | 将本地 NCM 解包到指定文件夹 |

输入文件和输出目录均使用绝对路径。当歌单返回 `more: true` 时，将 `next_offset` 传给下一次调用。只读取部分曲目时，应在总结中标出分析范围。

## 数据存在哪里

会话默认保存在当前用户目录的 `.netease-music-plugin`，可通过 `NETEASE_STATE_DIR` 指定私有目录。Windows 使用当前用户的 DPAPI 加密会话，其他平台以仅当前用户可读写的文件保存。二维码 PNG 也在这个目录。歌曲和转换结果写入调用时指定的目录。遇到登录过期时重新登录即可。

## 开发

| 路径 | 职责 |
| --- | --- |
| `src/server.mjs` | MCP stdio 入口、工具定义与参数验证 |
| `src/core.mjs` | 登录会话、歌单查询、下载和转换 |
| `src/browser-login.mjs` | Windows 浏览器登录 |
| `src/runtime.mjs`、`src/cli.mjs` | 社区 API 适配与本地命令入口 |
| `tests/` | 登录、文件写入及 MCP 客户端握手测试 |
| [docs/requirements.md](docs/requirements.md) | 功能需求、验收条件与依赖边界 |

运行 `npm test` 执行离线测试。`npm start` 启动 stdio 服务，等待 MCP 客户端输入。调试单个查询时可运行 `node src/cli.mjs status`。

本项目采用 [MIT 许可证](LICENSE)。网易云接口由 [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) 提供。
