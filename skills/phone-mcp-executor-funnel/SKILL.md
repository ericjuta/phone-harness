---
name: phone-mcp-executor-funnel
description: Expose local Pixel phone control (phone-harness/adb) as an MCP app in hosted Executor via Tailscale Funnel from the omalauncher Arch container; restart/recover steps
---

# Pixel phone MCP → Executor via Funnel (omalauncher Arch container)

Official phone-harness MCP (`phone-harness-mcp`, mcp.phone-harness.com) is cloud-phones only; it can't drive the local phone over adb. Use the custom wrapper.

Source of truth: repo `ericjuta/phone-harness`, cloned at `~/Projects/phone-harness` (`bin/phone-mcp`, `executor-app/`, `skills/`). After editing `~/.local/bin/phone-mcp`, copy it to the repo and push. Executor app source: `tools.executor.appManagement.source({path:{app}})`.

## Pieces
- `~/.local/bin/phone-mcp` (v0.2): Python Streamable-HTTP MCP on `127.0.0.1:8931/mcp`; bearer token in `~/.config/phone-mcp/token` (401 without); needs `python-pillow` (pacman) for screenshots. 27 tools. Reads (`readOnlyHint`): screen, ui_tree, screenshot, wait_for_text, notifications, sms, call_log, contacts, calendar, location, device_info, list_apps, content_query. Actions: open_app, open_url, intent, tap_text, tap_ui, tap, long_press, swipe, scroll, type_text, press, statusbar, shell, harness (raw phone-harness script).
- The adb shell user can read notifications (`dumpsys notification --noredact`), SMS, call log, contacts and calendar (`content query`) and location (`dumpsys location`) with no extra Android permissions. The clipboard is not readable.
- On the Fold, `screencap` defaults to the first panel (outer, black when unfolded) and prefixes a warning. Use `-d <id>` for the panel with `mState=ON` in `dumpsys display`, and cut the output at the PNG signature.
- Restarting: `pkill -f "python3 /root/.local/bin/phone-mcp"`. A looser `pkill -f .local/bin/phone-mcp` inside `sh -c` kills its own shell before the restart.
- `phone_open_app` resolves the package via `adb shell pm list packages` + `monkey -p PKG -c android.intent.category.LAUNCHER 1`. phone-harness `open_app()` FAILS under omalauncher (returns nexuslauncher, nothing opens).
- Second tailscaled, userspace, node `arch-phone` (your-tailnet): `tailscaled --tun=userspace-networking --statedir=/var/lib/tailscale-arch --socket=/run/ts-arch.sock --port=0`. Android Tailscale app owns tun0 and can't funnel.
- Funnel: `tailscale --socket=/run/ts-arch.sock funnel --bg 8931` → `https://arch-phone.your-tailnet.ts.net/mcp`. Off: `... funnel --https=443 off`.
- Executor app (org ericjuta): namespace `tools["pixel-10-pro-fold-phone"]`, APP_ID; `mcpRouter` + app-scope `secrets` provider with `request: bearer(token)`, `mcpHealth`; `READS` list in index.ts are "query" kinds with no approval; everything else is `always()`. Bearer-key servers can't use `apps.importCustom`; write the app. Tool list is cached (~5 min); after adding server tools, edit index.ts then in `execute`: `appManagement.source` → `appManagement.commit({path:{app}, body:{expected: revision.commit, files, message}})` → re-read source → `appManagement.deploy({path:{app}, body:{commit: revision.commit}})`.

## Recover after restart
1. `pgrep tailscaled` else start it as above (nohup, log /tmp/tailscaled.log). If `up` hangs at Starting with "HomeDERPChanged is slow" spam, kill and restart tailscaled.
2. `PATH=$HOME/.local/bin:$PATH nohup ~/.local/bin/phone-mcp >/tmp/phone-mcp.log 2>&1 &`
3. Re-run funnel command; check `funnel status`.
4. adb: `adb devices`; if empty, ask the user for the new Wireless debugging IP:port → `phone-harness android connect IP:PORT` (connect worked over the phone's Tailscale IP 100.x.y.z). Pairing needs explicit `phone-harness android pair IP:PORT CODE`; mDNS doesn't work in the container.
5. Test: `curl -X POST localhost:8931/mcp` → 401; Executor call `phone_screen`.

## Install gotchas
- `uv tool install` needs `UV_LINK_MODE=copy` (hardlinks blocked).
- pacman mirror DNS failure → `pacman -Syy` then retry.
- New tailnet auth key: Executor `tools.tailscale.keys.createKey` (needs user approval).
