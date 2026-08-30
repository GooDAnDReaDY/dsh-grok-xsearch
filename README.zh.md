# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>DeepSeek Harness X (Twitter) 实时搜索与 SuperGrok OAuth 插件</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-grok-xsearch"><img src="https://img.shields.io/npm/v/@goodandready/dsh-grok-xsearch.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GooDAnDReaDY/dsh-grok-xsearch.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ 插件概览

**`dsh-grok-xsearch`** 为智能体提供 `x_search` 工具，基于独立的 SuperGrok OAuth 凭据实时检索 X (Twitter) 热门讨论与推文线程。

```mermaid
graph LR
    Agent[🤖 DSH 智能体 / 工具调用] -->|x_search 关键词与筛选| Plugin[dsh-grok-xsearch 核心]
    Plugin -->|SuperGrok OAuth 1| xAI[xAI Responses API / X 索引库]
    xAI -->|结构化推文与讨论数据| Agent
```

---

## 📦 安装指南

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

---

## 📄 开源协议

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
