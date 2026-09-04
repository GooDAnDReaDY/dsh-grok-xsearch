# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>基于 SuperGrok OAuth 的 DeepSeek Harness 实时 X (Twitter) 搜索与情报套件</h3>

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

## ⚡ 概述

**`dsh-grok-xsearch`** 为 **DeepSeek Harness** 智能体提供了一整套专门用于 X (Twitter) 实时分析与情报检索的工具套件。

通过经过验证的 SuperGrok OAuth 会话与 xAI Responses API (`POST /responses`)，智能体可以直接查询最新突破性新闻、开发者观点、讨论帖、作者时间线、趋势话题和社区附注 (Community Notes) 事实核查，无需支付高昂的单次 X API 费用。

---

## 🛠️ 工具集参考

### 1. `x_search` — 帖子与讨论深度搜索

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `query` | `string` | **是** | 自然语言搜索词或主题 |
| `allowed_x_handles` | `string` | 否 | 包含的用户名列表（逗号分隔，最多10个） |
| `excluded_x_handles` | `string` | 否 | 排除的用户名列表（最多10个） |
| `from_date` | `string` | 否 | 起始日期 (`YYYY-MM-DD`) |
| `to_date` | `string` | 否 | 结束日期 (`YYYY-MM-DD`) |
| `only_original_posts` | `boolean` | 否 | 仅限原创帖子（过滤转推与引用） |
| `has_media` | `boolean` | 否 | 过滤包含图片、图表或视频的帖子 |
| `has_links` | `boolean` | 否 | 过滤包含外部链接与文章的帖子 |
| `only_threads` | `boolean` | 否 | 过滤长篇深度讨论串 |
| `lang` | `string` | 否 | 语言代码 (例如 `en`, `zh`, `ru`) |
| `min_likes` | `number` | 否 | 最低点赞数阈值 |
| `min_reposts` | `number` | 否 | 最低转发数阈值 |
| `enable_image_understanding` | `boolean` | 否 | 允许 xAI 提取和分析图像/图表数据 |
| `enable_video_understanding` | `boolean` | 否 | 允许 xAI 分析视频片段与语音 |

### 2. `x_author_profile` — 作者观点与历史分析
* `handle`: 用户名 (`@username`)
* `focus_topic`: 关注的主题或立场
* `from_date` / `to_date`: 日期区间

### 3. `x_trending_topics` — 实时热门趋势挖掘
* `domain`: 领域分类 (`tech`, `ai`, `crypto`, `science`, `world`, `general`)
* `region`: 区域 (`Global`, `US`, `EU`, `Asia`)
* `timeframe`: 时间范围 (`today`, `past_24h`, `past_week`)

### 4. `x_fact_check_notes` — 社区附注与事实核查
* `claim`: 待核查的事实陈述或传闻
* `target_url`: 相关推文或文章链接
* `allowed_x_handles`: 权威核查机构或专家账号

---

## 🛡️ 弹性与性能特性

* **智能模型自动降级**: 在 `grok-4.6` 遇到 429 速率限制时，自动切换至 `grok-4.5` 保证任务顺利完成。
* **内存 TTL 缓存**: 5分钟内重复查询直接从缓存命中，节省 API 配额。
* **多语言本地化**: 完美支持英语、中文和俄语设置界面。

---

## 📦 快速安装

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

---

## 📄 许可证

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)

## 兼容性

0.3.3 版本增强了与混用 DeepSeek Harness alpha/rc 依赖版本的兼容性。四个工具现在始终导出根节点为 type: "object" 的 JSON Schema（包含 properties 和 required），即使旧版 dsh-tools 返回 legacy 属性映射格式。工具行为及 OAuth/API 契约保持不变。
