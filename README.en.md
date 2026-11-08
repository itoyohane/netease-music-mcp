# NetEase Cloud Music MCP

[简体中文](README.md) · English

Connect a local coding assistant to NetEase Cloud Music. Search for a specific recording, list daily recommendations, analyze playlists, download tracks available to your account, or extract audio from local NCM files. This unofficial project uses the community [NetEase Cloud Music API](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced).

## Install with one prompt

Paste this into Codex, Claude Code, Cursor, Gemini CLI, or VS Code Copilot in agent mode:

> Install https://github.com/itoyohane/netease-music-mcp for my current coding assistant using its INSTALL.md, preserve existing settings, and verify the status tool.

The assistant needs network access, a terminal, and permission to configure the client. For manual setup, install Git and Node.js 22 or later:

```sh
git clone https://github.com/itoyohane/netease-music-mcp.git
cd netease-music-mcp
npm ci --ignore-scripts
npm run doctor
```

Register Node and the absolute path to `src/server.mjs` as a local stdio server using the [client-specific instructions](INSTALL.md).

## Try it

| Ask your assistant | Tools |
| --- | --- |
| “Search for Ten Years by Eason Chan and show the album for each match.” | `search` works before login. |
| “Show my login QR code and check it after I scan.” | `login_qr`, `login_check`, `status`. Scan and confirm in the mobile music app. Windows users can also use `login_browser` with Edge or Chrome. |
| “List today's recommendations in their original order.” | `daily` uses the signed-in account and labels the date in China Standard Time. |
| “Read every page of my commute playlist and summarize its most frequent artists.” | `playlists` lists owned and saved playlists. `playlist` returns tracks and per-page statistics. Follow `next_offset` while `more` is true. |
| “Download that recording to my Music folder.” | `download` needs a track ID and an absolute output directory. Availability depends on the account and track. Existing files are preserved. |
| “Convert this NCM file into my selected output directory.” | `convert_ncm` needs absolute input and output paths and [ncmdump](https://github.com/taurusxin/ncmdump/releases) on PATH or at `NCMDUMP_PATH`. It preserves the source and extracts its native MP3 or FLAC audio. |
| “Sign out of the music server.” | `logout` removes the saved local session. |

## Local data and development

Session data defaults to `~/.netease-music-plugin`. Set `NETEASE_STATE_DIR` to choose a private directory. Windows encrypts the session with the current user's DPAPI key. Other platforms restrict session file permissions to its owner. QR images also reside in the state directory.

The MCP entry point and implementation live in `src/`. Run `npm test` for offline tests, including a real stdio client handshake. Run `npm start` to launch the server or `node src/cli.mjs status` to inspect local status. See the [requirements and acceptance criteria (Chinese)](docs/requirements.md) and [MIT license](LICENSE).
