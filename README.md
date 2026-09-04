# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>Real-Time X (Twitter) Intelligence & Search Tool Suite Powered by SuperGrok OAuth for DeepSeek Harness</h3>

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

**`dsh-grok-xsearch`** equips your **DeepSeek Harness** agents with real-time X (Twitter) intelligence and a suite of dedicated analytical tools. 

By leveraging authenticated SuperGrok OAuth sessions with the xAI Responses API (`POST /responses`), agents can query live breaking news, developer sentiment, community threads, author timelines, viral trends, and Community Notes fact-checking without expensive per-query X API tiers.

```mermaid
graph LR
    subgraph AgentAction [DSH Agent Reasoning]
        Agent[🤖 Agent: Live X Context Required] --> Select{Tool Selector}
        Select --> T1[x_search: Deep Search]
        Select --> T2[x_author_profile: Stance & Timeline]
        Select --> T3[x_trending_topics: Live Trends]
        Select --> T4[x_fact_check_notes: Community Notes]
    end

    subgraph SearchEngine [dsh-grok-xsearch Execution Engine]
        T1 & T2 & T3 & T4 --> Cache{In-Memory TTL Cache}
        Cache -->|Hit| DirectReturn[Cached Result: Instant]
        Cache -->|Miss| Filter[Filter & Multimodal Normalizer]
        Filter --> Auth{SuperGrok PKCE OAuth}
    end

    subgraph UpstreamX [xAI Responses API]
        Auth --> xAI[xAI Responses Endpoint: tool type x_search]
        xAI -->|Rate Limit 429| Fallback[Smart Fallback: Grok 4.5]
        Fallback --> xAI
        xAI --> Raw[Live Posts, Metrics & Annotations]
    end

    subgraph ContextAssembly [Rich Formatting & Deduplication]
        Raw --> Dedup[Citation Deduplication & Tweet Parsing]
        Dedup --> CacheSave[Save Cache: 5 min TTL]
        CacheSave --> Output[Structured Output & Clickable Citations]
        Output --> Agent
    end

    style AgentAction fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style SearchEngine fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style UpstreamX fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    style ContextAssembly fill:#181825,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4
```

---

## 🛠️ Complete Tool Suite Reference

The plugin registers four purpose-built tools in `ctx.tools`:

### 1. `x_search` — Deep Post & Thread Search

General-purpose natural language search across X posts, threads, media, and engagement metrics.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | **Yes** | Natural language search query or topic keywords |
| `allowed_x_handles` | `string` | No | Comma-separated `@handles` to include (up to 10) |
| `excluded_x_handles` | `string` | No | Comma-separated `@handles` to exclude (up to 10) |
| `from_date` | `string` | No | Start date filter (`YYYY-MM-DD`) |
| `to_date` | `string` | No | End date filter (`YYYY-MM-DD`) |
| `only_original_posts` | `boolean` | No | Omit retweets and quote echoes |
| `has_media` | `boolean` | No | Filter for posts containing images, infographics, or videos |
| `has_links` | `boolean` | No | Filter for posts containing external links, papers, or repositories |
| `only_threads` | `boolean` | No | Filter for extended multi-tweet discussion threads |
| `lang` | `string` | No | Language code filter (e.g. `en`, `ru`, `ja`) |
| `min_likes` | `number` | No | Minimum likes threshold for quality filtering |
| `min_reposts` | `number` | No | Minimum reposts/retweets threshold |
| `enable_image_understanding` | `boolean` | No | Let xAI inspect and extract data from images and charts |
| `enable_video_understanding` | `boolean` | No | Let xAI analyze video clips and speech |

---

### 2. `x_author_profile` — Author Timeline & Position Analysis

Inspects an expert or developer's recent discussions, technical stances, and shared insights on X.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `handle` | `string` | **Yes** | Author's username (e.g., `@ylecun` or `sama`) |
| `focus_topic` | `string` | No | Specific topic or thesis to analyze the author's stance on |
| `from_date` | `string` | No | Start date filter (`YYYY-MM-DD`) |
| `to_date` | `string` | No | End date filter (`YYYY-MM-DD`) |
| `only_original_posts` | `boolean` | No | Focus on original author posts (default `true`) |

---

### 3. `x_trending_topics` — Real-Time Trend Discovery

Uncovers emerging topics, breaking announcements, viral threads, and community discussions.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `domain` | `string` | No | Topic domain (`tech`, `ai`, `crypto`, `science`, `world`, `general`, default: `tech`) |
| `region` | `string` | No | Geographic or community focus (`Global`, `US`, `EU`, `Asia`) |
| `timeframe` | `string` | No | Period (`today`, `past_24h`, `past_week`, default: `today`) |
| `min_likes` | `number` | No | Minimum likes threshold for viral post detection |

---

### 4. `x_fact_check_notes` — Community Notes & Fact-Checking

Investigates claims, viral rumors, or news stories for Community Notes, expert rebuttals, and corrections on X.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `claim` | `string` | **Yes** | Statement or rumor to fact-check |
| `target_url` | `string` | No | Specific X post or article URL to verify |
| `allowed_x_handles` | `string` | No | Comma-separated researcher or institutional handles to check |
| `enable_image_understanding` | `boolean` | No | Inspect attached images or infographics in debunking posts |

---

## 🛡️ Resilience & Performance Features

* **Smart Model Fallback (429 Rate Limit)**: When `grok-4.6` encounters temporary upstream rate limits (HTTP 429), the execution engine automatically falls back to `grok-4.5` or `grok-4-fast-reasoning`, ensuring uninterrupted agent workflow.
* **In-Memory TTL Caching**: Identical queries within a 5-minute window are served instantly from the local cache, conserving xAI API quotas.
* **Citation Deduplication & Parsing**: Citations are parsed into structured references with author handles (`@handle`), status IDs, and clickable URLs.
* **Full Multi-Language UI**: Settings card supports English, Russian, and Chinese localization via `ctx.locale.register`.

---

## ⚙️ Configuration (`settings.yaml` / Web UI)

```yaml
dsh-grok-xsearch:
  enabled: true
  grokClientId: "<YOUR_GROK_OAUTH_CLIENT_ID>"
  model: "grok-4.6"
  timeoutSeconds: 180
  retries: 2
  autoFallbackModel: true
  enableCache: true
  cacheTtlSeconds: 300
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enables or disables all Grok X tools |
| `grokClientId` | `string` | `""` | OAuth Client ID for SuperGrok authentication |
| `model` | `string` | `"grok-4.6"` | Default Grok model for Responses queries |
| `timeoutSeconds` | `number` | `180` | Request timeout before cancellation |
| `retries` | `number` | `2` | Number of retry attempts on transient 5xx errors |
| `autoFallbackModel` | `boolean` | `true` | Automatically try Grok 4.5 upon HTTP 429 rate limit |
| `enableCache` | `boolean` | `true` | In-memory cache for recent search queries |
| `cacheTtlSeconds` | `number` | `300` | Cache retention time in seconds |

---

## Compatibility

Version 0.3.3 hardens compatibility with mixed DeepSeek Harness alpha/rc peer resolutions. All four registered tools now expose an object-root JSON Schema (parameters.type = "object" with properties and required) even when an older dsh-tools runtime returns the legacy property-map form. Tool behavior and OAuth/API contracts are unchanged.

## 📦 Quick Installation

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

> [!IMPORTANT]
> Authenticate your SuperGrok session in **Settings → Plugins → Grok X Search & Intelligence Suite**.

---

## 🔌 HTTP API Routes

| Route | Method | Description |
|---|---|---|
| `/dsh-grok-xsearch/config` | `GET, PUT` | Inspects or updates search configuration and model selection |
| `/dsh-grok-xsearch/cache/clear` | `POST` | Clears in-memory query cache |
| `/dsh-grok-xsearch/oauth/start` | `GET` | Initiates standalone SuperGrok OAuth PKCE flow |
| `/dsh-grok-xsearch/oauth/callback` | `GET` | Handles browser OAuth redirect callback |
| `/dsh-grok-xsearch/oauth/complete` | `POST` | Finalizes authentication from manual URL paste |
| `/dsh-grok-xsearch/logout` | `POST` | Clears stored session tokens |

---

## 📄 License

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
