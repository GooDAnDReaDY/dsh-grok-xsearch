# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>Real-Time X (Twitter) Search Tool Powered by SuperGrok OAuth for DeepSeek Harness</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-grok-xsearch"><img src="https://img.shields.io/npm/v/@goodandready/dsh-grok-xsearch.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/All_Author_Projects-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="All Author Projects"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ Overview

**`dsh-grok-xsearch`** equips your **DeepSeek Harness** agents with real-time X (Twitter) intelligence via a dedicated `x_search` tool. 

By leveraging authenticated SuperGrok OAuth sessions, agents can query live breaking news, developer sentiment, community threads, author timelines, and discussions across specific date ranges without expensive per-query X API tiers.

```mermaid
graph LR
    subgraph AgentAction [DSH Agent Reasoning]
        Agent[🤖 Agent: Needs live X context] --> ToolCall[Tool Call: x_search]
    end

    subgraph SearchEngine [dsh-grok-xsearch Query Engine]
        ToolCall --> Filter[Filter Normalizer: Handles, Dates & Limits]
        Filter --> Auth{Auth Token Resolution}
        Auth -->|Standalone PKCE| OAuth[Plugin OAuth Session]
        Auth -->|In-Process Link| Sub[dsh-subscriptions Gateway]
    end

    subgraph UpstreamX [xAI & X Data Stream]
        OAuth --> xAI[xAI Responses Search Endpoint]
        Sub --> xAI
        xAI --> Raw[Live Tweets, Metrics & Thread Quotes]
    end

    subgraph Ingestion [Context Assembly]
        Raw --> Clean[Structured Markdown & References]
        Clean --> Agent
    end

    style AgentAction fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style SearchEngine fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style UpstreamX fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    style Ingestion fill:#181825,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4
```

---

## 🔍 `x_search` Tool Reference

The plugin registers `x_search` directly in `ctx.tools`, allowing agents to query the real-time social web:

### Tool Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | **Yes** | Search keywords, topics, or hashtags |
| `authors` | `string[]` | No | Target specific accounts (up to 10 `@handle` usernames) |
| `exclude_authors` | `string[]` | No | Exclude specific accounts from results (up to 10 handles) |
| `from_date` | `string` | No | Start date filter (`YYYY-MM-DD`) |
| `to_date` | `string` | No | End date filter (`YYYY-MM-DD`) |
| `max_results` | `number` | No | Maximum number of posts to retrieve (default `10`) |

### Example Agent Queries
> "Search X for discussions about the latest PyTorch release by @PyTorch or @ylecun from 2026-08-01"
> "Find recent breaking reports on semiconductor announcements with query 'quantum chip' excluding @spam_bot"

---

## 🔑 Authentication Options

1. **Standalone SuperGrok OAuth Login**: Connect directly via the built-in PKCE login flow in **Settings → X Search**.
2. **Ecosystem Interoperability**: If [`dsh-subscriptions`](https://github.com/GooDAnDReaDY/dsh-subscriptions) is already authenticated with a Grok account, `dsh-grok-xsearch` automatically borrows the active session without requiring a separate login.

---

## 📦 Quick Installation

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

> [!IMPORTANT]
> Restart DSH Web UI after installation (`systemctl --user restart dsh-web`) and authenticate your SuperGrok session in Settings.

---

## 🔌 HTTP API Routes

| Route | Method | Description |
|---|---|---|
| `/dsh-grok-xsearch/config` | `GET, POST` | Inspects or modifies search parameters and default limits |
| `/dsh-grok-xsearch/oauth/start` | `POST` | Initiates standalone SuperGrok OAuth PKCE flow |
| `/dsh-grok-xsearch/oauth/callback` | `GET` | Handles OAuth redirect callback and securely persists tokens |
| `/dsh-grok-xsearch/oauth/complete` | `POST` | Finalizes authentication handshake |
| `/dsh-grok-xsearch/logout` | `POST` | Disconnects and clears local session tokens |

---

## 📄 License

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
