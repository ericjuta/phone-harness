---
name: phone-mcp-executor-funnel
description: Expose local Pixel phone control (phone-harness/adb) as an MCP app in hosted Executor via Tailscale Funnel from the omalauncher Arch container; restart/recover steps
---

# Pixel phone MCP → Executor via Funnel (omalauncher Arch container)

Official phone-harness MCP (`phone-harness-mcp`, mcp.phone-harness.com) is cloud-phones only; it can't drive the local phone over adb. Use the custom wrapper.

Source of truth: repo `ericjuta/phone-harness`, cloned at `~/Projects/phone-harness` (`bin/phone-mcp`, `executor-app/`, `skills/`). After editing `~/.local/bin/phone-mcp`, copy it to the repo and push. Executor app source: `tools.executor.appManagement.source({path:{app}})`.

## Pieces
- `~/.local/bin/phone-mcp`: stdlib Python Streamable-HTTP MCP on `127.0.0.1:8931/mcp`; bearer token in `~/.config/phone-mcp/token` (401 without). Tools: phone_screen, phone_open_app, phone_open_url, phone_tap_text, phone_tap, phone_type_text, phone_press, phone_swipe.
- `phone_open_app` resolves the package via `adb shell pm list packages` + `monkey -p PKG -c android.intent.category.LAUNCHER 1`. phone-harness `open_app()` FAILS under omalauncher (returns nexuslauncher, nothing opens).
- Second tailscaled, userspace, node `arch-phone` (your-tailnet): `tailscaled --tun=userspace-networking --statedir=/var/lib/tailscale-arch --socket=/run/ts-arch.sock --port=0`. Android Tailscale app owns tun0 and can't funnel.
- Funnel: `tailscale --socket=/run/ts-arch.sock funnel --bg 8931` → `https://arch-phone.your-tailnet.ts.net/mcp`. Off: `... funnel --https=443 off`.
- Executor app (org ericjuta): namespace `tools["pixel-10-pro-fold-phone"]`, APP_ID; `mcpRouter` + app-scope `secrets` provider with `request: bearer(token)`, `mcpHealth`; `withApprovals` always() except phone_screen. Bearer-key servers can't use `apps.importCustom`; write the app.

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
