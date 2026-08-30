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

Real-time X (Twitter) search tool for DeepSeek Harness agents powered by an isolated SuperGrok OAuth session.

### Features

- **`x_search` Tool**: Equips agents with real-time keyword, author, and timestamp query filters.
- **Isolated Quota**: Uses an independent SuperGrok OAuth token without draining primary LLM credits.
- **Thread Parsing**: Extracts tweet posts, engagement metrics, and discussion replies.

### Install

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

---

<a name="-русский"></a>
<details open>
<summary><h2>🇷🇺 Русский (Полное руководство)</h2></summary>

Инструмент поиска в X (Twitter) в реальном времени для агентов DeepSeek Harness через изолированную сессию SuperGrok OAuth.

### Возможности

- **Инструмент `x_search`**: поиск по ключевым словам, авторам и временным диапазонам.
- **Изолированная квота**: отдельная сессия SuperGrok, не расходующая баланс основной модели.
- **Парсинг тредов**: извлечение текстов твитов, метрик вовлеченности и цепочек ответов.

### Установка

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

</details>

---

<a name="-中文"></a>
<details>
<summary><h2>🇨🇳 中文 (完整技术文档)</h2></summary>

基于 SuperGrok OAuth 的 X (Twitter) 实时搜索工具插件：为 DeepSeek Harness 智能体提供独立的 X 平台检索能力。

### 核心亮点

- **`x_search` 检索工具**：支持关键词、特定作者及时间区间的精准筛选。
- **独立配额隔离**：使用独立的 SuperGrok OAuth 凭证，不消耗主模型额度。
- **推文线程解析**：结构化提炼推文正文、互动数据与讨论分支。

### 安装方法

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

</details>
