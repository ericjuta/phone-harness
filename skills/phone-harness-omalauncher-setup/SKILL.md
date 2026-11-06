---
name: phone-harness-omalauncher-setup
description: "Install/setup phone-harness CLI (agent phone control via adb) in omalauncher Arch container; pairing, and exposing it as an MCP to Executor via Tailscale Funnel"
---

# phone-harness in omalauncher Arch container

## Install
- `pacman -Syy` first if mirror DNS fails; `pacman -S --needed android-tools uv`.
- `UV_LINK_MODE=copy uv tool install --python 3.12 phone-harness` (hardlinks blocked: "Operation not permitted"). PATH needs `~/.local/bin`.
- `phone-harness config set platform android`.

## Pair/connect (phone is the same device)
- mDNS discovery fails in container. User opens Developer options > Wireless debugging > Pair with code; ask for the IP:port shown in the pair dialog plus code.
- `phone-harness android pair 192.168.x.y:<pairport> <code>` (wlan IP; `.local` names don't resolve).
- Connect port = main Wireless debugging screen; Tailscale IP works: `phone-harness android connect 100.x.y.z:<port>`. Port changes when Wireless debugging restarts; no re-pair needed.
- Verify `phone-harness doctor android` (scrcpy FAIL is optional).

## Usage tips
- Maps transit: `adb shell am start -a android.intent.action.VIEW -d "'https://www.google.com/maps/dir/?api=1&destination=...&travelmode=transit'" -p com.google.android.apps.maps`, then `adb shell uiautomator dump /sdcard/u.xml; adb shell cat /sdcard/u.xml` and grep text/content-desc (phone-harness screen() may return stale tree).
- No PIL in eval Python; read UI tree instead of screenshots.

## Expose to Executor (hosted executor.sh) via Funnel
- Official phone-harness MCP (`phone-harness-mcp`) is cloud-only; local needs own wrapper: `~/.local/bin/phone-mcp` (stdlib HTTP JSON-RPC MCP on 127.0.0.1:8931/mcp, bearer token in `~/.config/phone-mcp/token`).
- Second tailscaled userspace: `tailscaled --tun=userspace-networking --statedir=/var/lib/tailscale-arch --socket=/run/ts-arch.sock --port=0`; `tailscale --socket=/run/ts-arch.sock up --authkey=... --hostname=arch-phone` (auth key via Executor `tools.tailscale.keys.createKey`, needs approval). If stuck at Starting ("HomeDERPChanged is slow"), restart tailscaled.
- `tailscale --socket=/run/ts-arch.sock funnel --bg 8931` → https://arch-phone.your-tailnet.ts.net. Tailnet policy already grants funnel to autogroup:member.
- `apps.importCustom` refuses bearer servers; deploy custom app (mcpRouter + secrets provider with `bearer(token)` request, `hosts`, mcpHealth, withApprovals always() except phone_screen), then `appAccounts.appConnect` and give user the URL. App: Pixel Phone APP_ID, org ORG_ID.
- Processes are nohup only; restart after container restart.
