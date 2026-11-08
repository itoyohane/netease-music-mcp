# Install from an agent chat

> Install https://github.com/itoyohane/netease-music-mcp for my current coding assistant using its INSTALL.md, preserve existing settings, and verify the status tool.

## Prepare the server

1. Identify the **current** MCP client. If ambiguous, ask which client to configure. Use a persistent per-user directory outside the project's source tree for the checkout. Reuse a matching existing checkout and preserve local edits.
2. Check Node.js 22+ and Git. Clone `https://github.com/itoyohane/netease-music-mcp.git`, then run `npm ci --ignore-scripts` in the checkout. On Windows use `npm.cmd` if PowerShell blocks npm.ps1.
3. In that directory run `node -p "process.execPath"` and `node -p "require('path').resolve('src/server.mjs')"`. In the examples below replace NODE and SERVER with those two absolute paths. Pass each as a single argument, including when it contains spaces.
4. Register only in the current client. Reuse a matching entry. If the name already points elsewhere, ask before replacing it. Merge settings while preserving other entries and comments.

| Client | Registration |
| --- | --- |
| [Codex](https://developers.openai.com/codex/mcp) | `codex mcp add netease-music -- "NODE" "SERVER"`. Desktop users can also add a STDIO server in MCP settings. |
| [Claude Code](https://code.claude.com/docs/en/mcp) | `claude mcp add --transport stdio --scope user netease-music -- "NODE" "SERVER"` |
| [Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) | `gemini mcp add --scope user netease-music "NODE" "SERVER"` |
| [Cursor](https://cursor.com/docs/mcp) | In the user's `~/.cursor/mcp.json`, merge the entry below under `mcpServers`. |
| [VS Code Copilot](https://code.visualstudio.com/docs/agents/reference/mcp-configuration) | Run **MCP: Open User Configuration**, then merge the entry below under `servers`. |

JSON entry (inside the indicated object, replace paths using a JSON serializer or escape Windows backslashes):

```json
"netease-music": {
  "type": "stdio",
  "command": "NODE",
  "args": ["SERVER"]
}
```

## Verify

Run `npm run doctor` in the checkout. Then reload the client's MCP servers or start a fresh chat and call the **netease-music status** tool through the client. A successful response includes `logged_in` and `ncmdump_available`; either can be false. If a client restart, workspace trust prompt or settings action needs the user, report that remaining step. A successful CLI doctor alone only verifies the local process. Installation needs no music credentials.
