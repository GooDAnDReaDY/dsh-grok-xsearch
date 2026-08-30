# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>Инструмент поиска в X (Twitter) в реальном времени через SuperGrok OAuth</h3>

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

## ⚡ Обзор

**`dsh-grok-xsearch`** даёт агенту инструмент `x_search` для поиска в X (Twitter) в реальном времени через xAI Responses API с изолированным OAuth-токеном SuperGrok.

```mermaid
graph LR
    Agent[🤖 Агент DSH / Tool Call] -->|x_search запрос, автор, дата| Plugin[Движок dsh-grok-xsearch]
    Plugin -->|SuperGrok OAuth 1| xAI[xAI Responses API / Индекс X]
    xAI -->|Твиты и треды обсуждений| Agent
```

---

## 📦 Быстрая установка

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

---

## 📄 Лицензия

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
