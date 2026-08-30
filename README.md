# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

[![npm version](https://img.shields.io/npm/v/@goodandready/dsh-grok-xsearch.svg?style=flat-square)](https://www.npmjs.com/package/@goodandready/dsh-grok-xsearch)
[![license](https://img.shields.io/github/license/GooDAnDReaDY/dsh-grok-xsearch.svg?style=flat-square)](LICENSE)
[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-6366f1.svg?style=flat-square)](https://github.com/topics/dsh-plugin)

**[ 🇬🇧 English ](#-english) • [ 🇷🇺 Русский ](#-русский) • [ 🇨🇳 中文 ](#-中文)**

</div>

---

<a name="-english"></a>
## 🇬🇧 English

# dsh-grok-xsearch

`x_search` tool for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): search X (Twitter) via the xAI Responses API.

Uses a **separate** SuperGrok OAuth account (`GROK_XSEARCH_OAUTH_1`), independent from `@goodandready/dsh-subscriptions` chat Grok.

## Install

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

## Settings

1. Open **Settings → Grok X Search**.
2. Click **Connect** and finish SuperGrok OAuth (paste the redirected URL if the browser does not return to Harness).
3. Pick a model from the dropdown (**Grok 4.5** recommended; Grok 4.6 may be rate-limited).
4. In chat, ask the agent to use the `x_search` tool for X/Twitter queries.

### Host configuration (optional)

OAuth client id and redirect URI are normally set in the profile patch on the host, not in the UI:

```yaml
- id: dsh-grok-xsearch
  config:
    grokClientId: '<GROK_CLIENT_ID>'
    redirectUri: 'http://127.0.0.1:56121/callback'
    model: 'grok-4.5'
```

Credential ref: `GROK_XSEARCH_OAUTH_1` (never returned by Settings GET).

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

---

<a name="-русский"></a>
<details open>
<summary><h2>🇷🇺 Русский (Полное руководство)</h2></summary>

Инструмент `x_search` для [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): поиск в X (Twitter) в реальном времени через xAI Responses API.

Использует **отдельный** OAuth-аккаунт SuperGrok (`GROK_XSEARCH_OAUTH_1`), независимый от чата подписок.

## Установка

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

## Лицензия

MIT

</details>

---

<a name="-中文"></a>
<details>
<summary><h2>🇨🇳 中文 (完整技术文档)</h2></summary>

DeepSeek Harness 专属 `x_search` 工具插件：通过 xAI Responses API 实时检索 X (Twitter) 内容。

采用**独立的** SuperGrok OAuth 账号鉴权 (`GROK_XSEARCH_OAUTH_1`)，与订阅聊天配额完全隔离。

## 安装指南

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

## 开源协议

MIT

</details>
