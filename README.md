# phone-harness (local Pixel → Executor)

Lets hosted Executor (executor.sh) control the Pixel 10 Pro Fold that this omalauncher Arch container runs on. It goes through adb and [phone-harness](https://github.com/phone-harness/phone-harness).

```mermaid
flowchart LR
  E["Executor app pixel-10-pro-fold-phone"] -->|"HTTPS + Bearer"| F["Tailscale Funnel arch-phone.your-tailnet.ts.net"]
  F --> M["phone-mcp 127.0.0.1:8931/mcp"]
  M --> A["adb / phone-harness"]
  A --> P["Pixel (Wireless debugging)"]
```

| Path | What |
|---|---|
| `bin/phone-mcp` | stdlib Python Streamable-HTTP MCP server, installed to `~/.local/bin/phone-mcp`. Bearer token is read from `~/.config/phone-mcp/token` (never committed). |
| `executor-app/` | Executor app source (mcpRouter + bearer secrets provider; every tool but `phone_screen` needs approval). |
| `skills/` | omp managed skills: setup, pairing, recovery. |

The official `phone-harness-mcp` drives cloud phones only, which is why this repo has its own wrapper. Setup and recovery steps are in `skills/phone-mcp-executor-funnel/SKILL.md`.
