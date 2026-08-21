# dsh-grok-xsearch

`x_search` tool for DeepSeek Harness: search X (Twitter) via xAI Responses API.

Uses a **separate** SuperGrok OAuth account (`GROK_XSEARCH_OAUTH_1`), independent from `@goodandready/dsh-subscriptions` chat Grok.

## Install

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

## Settings

1. Open **Settings → Grok X Search**.
2. Set `grokClientId` (vendor-public Grok CLI client id) and `redirectUri`.
3. Click **Connect** and finish OAuth (paste redirected URL if needed).
4. Enable the `x_search` tool in your agent toolset.

Credential blob name: `GROK_XSEARCH_OAUTH_1` — never returned by Settings GET.

## Tool

`x_search` posts to `https://api.x.ai/v1/responses` with built-in tool `{ type: 'x_search' }`.

Parameters: `query`, optional handle filters, date range, image/video understanding flags.

## Identity

| Place | Value |
|---|---|
| `package.json` `name` | `@goodandready/dsh-grok-xsearch` |
| `cordis.patch.yml` `name:` | `@goodandready/dsh-grok-xsearch` |
| `lib/client.js` loader `id` | `@goodandready/dsh-grok-xsearch` |

## License

MIT
