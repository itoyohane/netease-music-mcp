# NetEase Cloud Music MCP

[简体中文](README.md) · English

Ask your coding assistant to find a particular recording, pull today's recommendations, or tell you which artists appear most in a playlist. This unofficial MCP server runs on your computer, so it can also save an authorized download or convert a local NCM file in the folder you choose.

## Install from chat

With Git and Node.js 22+ installed, paste this into Codex, Claude Code, Cursor, Gemini CLI or VS Code Copilot in agent mode:

> Follow https://github.com/itoyohane/netease-music-mcp/blob/main/INSTALL.md to install netease-music for my current assistant, preserve existing settings, and call its status tool to verify the connection.

For manual installation, run these commands and [register the server in your client](INSTALL.md).

```sh
git clone https://github.com/itoyohane/netease-music-mcp.git
cd netease-music-mcp
npm ci --ignore-scripts
npm run doctor
```

> [!TIP]
> A successful call to `status` from your assistant confirms the connection. If `logged_in` is false, try “Find Ten Years by Eason Chan and show me the album.” Search works before sign-in.

## Use your music account

Ask the assistant to show a login QR code. Scan it in the NetEase Cloud Music mobile app, confirm on your phone, then ask the assistant to check the result. On Windows you can also sign in through a separate Edge or Chrome window.

| Try asking | Tools |
| --- | --- |
| Show today's recommendations in order, with artist names. | `daily` |
| Read every page of my commute playlist. Which five artists appear most often? | `playlists`, `playlist` |
| Find the version of Ten Years on Black, White & Grey and download it to `D:\Music` | `search`, `download` |
| Convert `D:\Music\demo.ncm` → `D:\Music\Converted` | `convert_ncm` |

Downloads require permission for the selected track. For NCM conversion, install [ncmdump](https://github.com/taurusxin/ncmdump/releases) on PATH or set `NCMDUMP_PATH` to the executable. The output retains the original MP3 or FLAC encoding and the source file stays in place.

## Session storage and development

Login tools are `login_qr`, `login_check` and `login_browser`. The session and QR images live in `~/.netease-music-plugin`; set `NETEASE_STATE_DIR` to choose a different private directory. Windows encrypts the session using DPAPI. Other platforms use owner-only file permissions. Use `logout` to clear the saved session.

The stdio entry point is [src/server.mjs](src/server.mjs). Run `npm test` for offline tests, including MCP client discovery. See the [requirements and acceptance criteria (Chinese)](docs/requirements.md) for pagination, download checks and file handling.
