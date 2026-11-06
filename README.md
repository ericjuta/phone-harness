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
| `bin/phone-mcp` | Python Streamable-HTTP MCP server (needs `python-pillow`), installed to `~/.local/bin/phone-mcp`. Bearer token is read from `~/.config/phone-mcp/token` (never committed). |
| `executor-app/` | Executor app source (mcpRouter + bearer secrets provider). Read tools run without approval; actions need approval. |
| `skills/` | omp managed skills: setup, pairing, recovery. |

## Tools

| Kind | Tools |
|---|---|
| Read (no approval) | `phone_screen`, `phone_ui_tree`, `phone_screenshot`, `phone_wait_for_text`, `phone_notifications`, `phone_sms`, `phone_call_log`, `phone_contacts`, `phone_calendar`, `phone_location`, `phone_device_info`, `phone_list_apps`, `phone_content_query` |
| Action (approval) | `phone_open_app`, `phone_open_url`, `phone_intent`, `phone_tap_text`, `phone_tap_ui`, `phone_tap`, `phone_long_press`, `phone_swipe`, `phone_scroll`, `phone_type_text`, `phone_press`, `phone_statusbar`, `phone_shell`, `phone_harness` |

The official `phone-harness-mcp` drives cloud phones only, which is why this repo has its own wrapper. Setup and recovery steps are in `skills/phone-mcp-executor-funnel/SKILL.md`.
