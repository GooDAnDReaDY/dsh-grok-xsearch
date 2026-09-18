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

<table align="center">
  <tr>
    <td align="center">
      ⭐ <strong>如果您喜欢这个插件，请在 GitHub 上为它点亮 Star</strong> — 这能让我知道插件对您有用，并鼓励我继续开发和维护它。
      <br><br>
      🐛 <strong>如果您发现 Bug 或希望增加功能</strong>，请使用任意语言在 GitHub 上提交 Issue — 我会评估您的建议，并在后续版本中实现有价值的改进。
    </td>
  </tr>
</table>

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
| `extract_tables` | `boolean` | 否 | 将帖子配图与信息图中的基准测试、财务数据或对比表格提取为 Markdown 格式 |

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

### 5. `x_thread_reader` — 长推文讨论串深度还原
* `tweet_url_or_id`: 推文链接 (`https://x.com/username/status/...`) 或推文 ID
* `include_replies`: 是否包含高互动优质社区回复与反驳 (默认: `true`)
* `max_depth`: 讨论串最大抓取深度 (默认: `10`, 最大: `25`)
* `extract_tables`: 将讨论串所附图表与基准数据提取为 Markdown 表格

### 6. `x_find_experts` — 领域权威专家与领袖发现
* `domain_or_topic`: 研究领域、技术栈或核心议题 (例如 `量子计算`, `LLM 推理`)
* `min_followers`: 可选的最低关注者门槛
* `language`: 语言代码 (例如 `en`, `zh`)
* `limit`: 返回数量 (默认: `5`, 最大: `15`)

---

## 🛡️ 弹性与性能特性

* **智能模型自动降级**: 在 `grok-4.6` 遇到 429 速率限制时，自动切换至 `grok-4.5` 保证任务顺利完成。
* **持久化磁盘与内存 TTL 缓存**: 5分钟内重复查询极速命中，支持磁盘持久化、429 负缓存保护与实时命中率监控。
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

- **版本 0.3.14 (移除设置重复入口与卡片独占)**:
  - **移除冗余 `settings.section` 回退**: 插件配置严格仅在 `Settings → 插件` 的折叠卡片 (`settings.plugin.item`) 中展示，彻底消除侧边栏根级重复项 (#51)。
  - **插槽故障诊断日志**: 当 `settings.plugin.item` 插槽不可用时，通过 `ctx.logger.warn` 记录告警信息，不再使用次级根区域静默顶替。

- **版本 0.3.13 (生命周期状态清理与导出精简)**:
  - **Cordis 生命周期清理器**: 将 `clearPendingStore`、`clearRefreshMutex` 和 `clearModelsCache` 连接至 `lib/index.js` 的插件 effect 清理回调，杜绝会话与重启间的状态残留 (#48)。
  - **退出登录全面清理**: `/dsh-grok-xsearch/logout` 路由确保同时清除凭据、未决 OAuth 请求、刷新互斥锁及模型列表缓存。
  - **缓存清理同步清除模型**: `/dsh-grok-xsearch/cache/clear` 同时清理查询缓存与模型列表缓存。
  - **导出关键字精简**: 移除仅在内部使用的模块函数的冗余 `export` 关键字。

- **版本 0.3.12 (一键更新模块、路由安全增强与客户端精简)**:
  - **一键更新模块 (`lib/updater.js`)**: 新增主机端 `/api/dsh-grok-xsearch/update` 路由与设置卡片更新区块，支持版本检查、预发布版本识别及标准安装。
  - **Fail-Closed 严格路由防护**: 为写操作路由补充基于 loopback 与 origin/referer 的校验，防御 DNS 重新绑定与 CSRF 攻击。
  - **客户端代码精简与解耦**: 将 `lib/client.js` 行数精简至 589 行（低于 600 行限制），保持 ModuleLoader 浏览器独立性与所有 10 项配置功能。
  - **工具安全注册**: 使用带日志记录的 `registerToolSafe` 替代静默异常捕获。
  - **语言包生命周期管理**: 客户端语言包注册使用 `ctx.effect` 与清理回调。
  - **补齐客户端注入声明**: 在 `package.json` 中配置 `dsh.client.inject`。

- **0.3.3 版本**: 增强了与混用 DeepSeek Harness alpha/rc 依赖版本的兼容性。四个工具现在始终导出根节点为 type: "object" 的 JSON Schema（包含 properties 和 required），即使旧版 dsh-tools 返回 legacy 属性映射格式。工具行为及 OAuth/API 契约保持不变。