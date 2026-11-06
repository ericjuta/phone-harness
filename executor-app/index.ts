import { bearer, defineApp, defineProvider, object, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";

const url = "https://arch-phone.your-tailnet.ts.net/mcp";

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
      { phone_screen: "query" },
    ),
    (_tool, name) => (name === "phone_screen" ? undefined : always()),
  ),
}));
