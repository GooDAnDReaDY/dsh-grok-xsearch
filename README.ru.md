# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>Инструмент поиска в X (Twitter) в реальном времени через SuperGrok OAuth для DeepSeek Harness</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-grok-xsearch"><img src="https://img.shields.io/npm/v/@goodandready/dsh-grok-xsearch.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/Все_проекты_автора-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="Все проекты автора"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ Обзор

**`dsh-grok-xsearch`** даёт агентам **DeepSeek Harness** возможность искать актуальную информацию в X (Twitter) в реальном времени через инструмент `x_search`.

Используя авторизованную сессию SuperGrok OAuth, агенты могут находить свежие новости, обсуждения разработчиков, треды сообществ и посты конкретных авторов за указанный диапазон дат без дорогостоящих тарифов X API.

```mermaid
graph LR
    subgraph AgentAction [Рассуждения агента DSH]
        Agent[🤖 Агенту нужен контекст из X] --> ToolCall[Вызов инструмента: x_search]
    end

    subgraph SearchEngine [Движок запросов dsh-grok-xsearch]
        ToolCall --> Filter[Нормализация: авторы, даты и лимиты]
        Filter --> Auth{Получение токена авторизации}
        Auth -->|Автономный PKCE| OAuth[Сессия OAuth плагина]
        Auth -->|Сервис Cordis| Sub[Шлюз dsh-subscriptions]
    end

    subgraph UpstreamX [Поток данных xAI & X]
        OAuth --> xAI[Поисковый эндпоинт xAI Responses]
        Sub --> xAI
        xAI --> Raw[Свежие твиты, метрики и цитаты тредов]
    end

    subgraph Ingestion [Внедрение в контекст]
        Raw --> Clean[Структурированный Markdown и ссылки]
        Clean --> Agent
    end

    style AgentAction fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style SearchEngine fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style UpstreamX fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    style Ingestion fill:#181825,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4
```

---

## 🔍 Справочник параметров инструмента `x_search`

Плагин регистрирует `x_search` в `ctx.tools`, позволяя агентам запрашивать актуальные данные:

### Параметры инструмента

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `query` | `string` | **Да** | Поисковый запрос, ключевые слова, тема или хэштеги |
| `authors` | `string[]` | Нет | Поиск по конкретным авторам (до 10 аккаунтов `@handle`) |
| `exclude_authors` | `string[]` | Нет | Исключение конкретных аккаунтов из выдачи (до 10 авторов) |
| `from_date` | `string` | Нет | Начальная дата фильтра (`ГГГГ-ММ-ДД`) |
| `to_date` | `string` | Нет | Конечная дата фильтра (`ГГГГ-ММ-ДД`) |
| `max_results` | `number` | Нет | Максимальное количество постов (по умолчанию `10`) |

---

## 🔑 Варианты авторизации

1. **Автономная авторизация SuperGrok OAuth**: прямой вход по протоколу PKCE в меню **Настройки → X Search**.
2. **Интеграция с экосистемой**: если в [`dsh-subscriptions`](https://github.com/GooDAnDReaDY/dsh-subscriptions) уже подключен аккаунт Grok, плагин автоматически подхватит его без повторной авторизации.

---

## 📦 Быстрая установка

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

---

## 🔌 Маршруты HTTP API

| Маршрут | Метод | Описание |
|---|---|---|
| `/dsh-grok-xsearch/config` | `GET, POST` | Просмотр и изменение параметров поиска и лимитов |
| `/dsh-grok-xsearch/oauth/start` | `POST` | Запуск OAuth PKCE авторизации SuperGrok |
| `/dsh-grok-xsearch/oauth/callback` | `GET` | Обработка OAuth redirect и сохранение токена |
| `/dsh-grok-xsearch/oauth/complete` | `POST` | Завершение авторизации |
| `/dsh-grok-xsearch/logout` | `POST` | Отключение и сброс сессионных токенов |

---

## 📄 Лицензия

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
