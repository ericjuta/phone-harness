import { bearer, defineApp, defineProvider, object, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";

const url = "https://arch-phone.your-tailnet.ts.net/mcp";

// Read-only tools (readOnlyHint in bin/phone-mcp) run without approval; everything else asks.
const READS = [
  "phone_screen",
  "phone_ui_tree",
  "phone_screenshot",
  "phone_wait_for_text",
  "phone_notifications",
  "phone_sms",
  "phone_call_log",
  "phone_contacts",
  "phone_calendar",
  "phone_location",
  "phone_device_info",
  "phone_list_apps",
  "phone_content_query",
];

const phone = defineProvider({
  name: "Pixel phone MCP",
  hosts: ["arch-phone.your-tailnet.ts.net"],
  auth: {
    token: secrets({
      label: "Bearer token",
      fields: object({ token: string({ minLength: 1 }) }),
      request: ({ token }) => bearer(token),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: check.account.headers() }),
});

export default defineApp({ app: { accounts: { phone } } }, async ({ app, cache, signal }) => ({
  tools: withApprovals(
    await mcpRouter(
      { url, account: app.accounts.phone, headers: app.accounts.phone.headers(), cache, signal },
      Object.fromEntries(READS.map((name) => [name, "query" as const])),
    ),
    (_tool, name) => (READS.includes(name) ? undefined : always()),
  ),
}));
