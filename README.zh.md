# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>DeepSeek Harness X (Twitter) 实时搜索与 SuperGrok OAuth 插件</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-grok-xsearch"><img src="https://img.shields.io/npm/v/@goodandready/dsh-grok-xsearch.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/作者全部项目-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="作者全部项目"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ 插件概览

**`dsh-grok-xsearch`** 为 **DeepSeek Harness** 智能体提供 `x_search` 工具，使其能够实时检索 X (Twitter) 热门推文、突发事件、开发者讨论与特定作者时间线。

```mermaid
graph LR
    subgraph AgentAction [智能体决策流]
        Agent[🤖 需要实时 X 社交网络情报] --> ToolCall[调用工具: x_search]
    end

    subgraph SearchEngine [dsh-grok-xsearch 检索引擎]
        ToolCall --> Filter[参数校验: 作者过滤、日期范围与数量]
        Filter --> Auth{鉴权令牌解析}
        Auth -->|独立 PKCE 流程| OAuth[插件专属 OAuth 会话]
        Auth -->|进程内共享| Sub[dsh-subscriptions 网关]
    end

    subgraph UpstreamX [xAI 与 X 数据流]
        OAuth --> xAI[xAI Responses 搜索接口]
        Sub --> xAI
        xAI --> Raw[最新推文、互动指标与引用链]
    end

    subgraph Ingestion [上下文装配]
        Raw --> Clean[结构化 Markdown 提炼]
        Clean --> Agent
    end

    style AgentAction fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style SearchEngine fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style UpstreamX fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    style Ingestion fill:#181825,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4
```

---

## 📦 安装指南

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

---

## 📄 开源协议

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
