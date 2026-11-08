# 网易云音乐 MCP

简体中文 · [English](README.en.md)

在编程助手里找一首歌的指定版本、查看今天的日推，或统计一张歌单里出现最多的歌手。这个非官方 MCP 服务运行在本机，也能把账号有权下载的曲目保存到指定目录，或转换已有的 NCM 文件。

## 一句话安装

准备好 Git 和 Node.js 22 或更高版本，在 Codex、Claude Code、Cursor、Gemini CLI 或 VS Code Copilot 的 Agent 模式中发送：

> 请按 https://github.com/itoyohane/netease-music-mcp/blob/main/INSTALL.md 在当前助手中安装 netease-music，保留已有配置，并调用 status 工具验证连接。

手动安装可运行以下命令，再按[客户端配置指南](INSTALL.md)注册服务。

```sh
git clone https://github.com/itoyohane/netease-music-mcp.git
cd netease-music-mcp
npm ci --ignore-scripts
npm run doctor
```

> [!TIP]
> 在助手里调用 `status` 并收到结果，即表示客户端已连接。即使 `logged_in` 为 false，也可以先试一句「搜索陈奕迅的《十年》，列出歌名和专辑」。

## 使用你的音乐账号

让助手「显示网易云音乐登录二维码」，用手机网易云音乐 App 扫码确认，再让助手检查登录结果。Windows 用户也可以让助手打开独立的 Edge 或 Chrome 窗口登录。

| 可以这样问 | 对应工具 |
| --- | --- |
| 按原顺序列出今天的日推，附上歌手名。 | `daily` |
| 读完我的「通勤」歌单，哪五位歌手出现最多？ | `playlists`, `playlist` |
| 找到《黑白灰》专辑里的《十年》，下载到 `D:\Music` | `search`, `download` |
| 转换 `D:\Music\demo.ncm` → `D:\Music\Converted` | `convert_ncm` |

下载权限取决于账号和曲目。转换 NCM 时需将 [ncmdump](https://github.com/taurusxin/ncmdump/releases) 加入 PATH，或用 `NCMDUMP_PATH` 指向其可执行文件。输出沿用源音频的 MP3 或 FLAC 编码，原文件会保留。

下载接口报错、额度受限或未返回完整曲目地址时，`download` 默认按 [DownList](https://github.com/xxxkjing/DownList) 的思路尝试网易云桌面播放接口。回退沿用本机登录和请求音质，校验歌曲 ID、试听标记与原曲时长（允许 2 秒误差），随后检查文件大小、MD5 和实际格式。它不重置账号额度，也不保证每首歌可用。传入 `playback_fallback: false` 可关闭回退。返回的 `source` 为 `download` 或 `downlist_player`；回退结果附带 `primary_failure`，便于批量任务准确汇总失败。

## 会话存储与开发

登录工具为 `login_qr`、`login_check` 和 `login_browser`。会话和二维码默认保存在 `~/.netease-music-plugin`，可用 `NETEASE_STATE_DIR` 指定其他私有目录。Windows 使用 DPAPI 加密会话，其他平台通过文件权限限制为仅当前用户可读写。调用 `logout` 可清除已保存的会话。

stdio 服务入口是 [src/server.mjs](src/server.mjs)。运行 `npm test` 可执行离线测试，包括 MCP 客户端发现工具的检查。分页统计、下载校验和文件处理的约定见[需求与验收条件](docs/requirements.md)。
