# 📦 @goodandready/dsh-grok-xsearch

<div align="center">

<h3>Интеллектуальный комплекс поиска и анализа X (Twitter) на базе SuperGrok OAuth для DeepSeek Harness</h3>

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

## ⚡ Обзор возможностей

**`dsh-grok-xsearch`** предоставляет агентам **DeepSeek Harness** набор специализированных аналитических инструментов для работы с социальной сетью **X (Twitter)** в реальном времени.

Используя сессию авторизации SuperGrok OAuth через официальный xAI Responses API (`POST /responses`), плагин позволяет анализировать свежие новости, мнения разработчиков, экспертные треды, профили авторов, вирусные тренды и заметки фактчекинга Community Notes без дорогостоящих платных тарифов X API.

```mermaid
graph LR
    subgraph AgentAction [Работа DSH-агента]
        Agent[🤖 Агент: Нужен контекст X] --> Select{Выбор инструмента}
        Select --> T1[x_search: Глубокий поиск]
        Select --> T2[x_author_profile: Анализ автора]
        Select --> T3[x_trending_topics: Тренды X]
        Select --> T4[x_fact_check_notes: Фактчекинг]
    end

    subgraph SearchEngine [Движок исполнения dsh-grok-xsearch]
        T1 & T2 & T3 & T4 --> Cache{In-Memory TTL Кэш}
        Cache -->|Hit| DirectReturn[Кэш: Мгновенный ответ]
        Cache -->|Miss| Filter[Нормализатор фильтров и медиа]
        Filter --> Auth{SuperGrok PKCE OAuth}
    end

    subgraph UpstreamX [xAI Responses API]
        Auth --> xAI[xAI Responses Endpoint: tool x_search]
        xAI -->|Лимит 429| Fallback[Умный фолбэк: Grok 4.5]
        Fallback --> xAI
        xAI --> Raw[Посты, цитаты и аннотации]
    end

    subgraph ContextAssembly [Форматирование и дедупликация]
        Raw --> Dedup[Дедупликация ссылок и парсинг авторов]
        Dedup --> CacheSave[Сохранение в кэш: 5 мин TTL]
        CacheSave --> Output[Структурированный Markdown и цитаты]
        Output --> Agent
    end

    style AgentAction fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style SearchEngine fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style UpstreamX fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    style ContextAssembly fill:#181825,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4
```

---

## 🛠️ Справочник инструментов

Плагин регистрирует 4 специализированных инструмента в реестре `ctx.tools`:

### 1. `x_search` — Глубокий поиск постов и тредов

Универсальный поиск постов, медиа, обсуждений и метрик на естественном языке с расширенными фильтрами.

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `query` | `string` | **Да** | Поисковый запрос на естественном языке |
| `allowed_x_handles` | `string` | Нет | Включаемые имена авторов через запятую (`@handle`, до 10) |
| `excluded_x_handles` | `string` | Нет | Исключаемые имена авторов через запятую (до 10) |
| `from_date` | `string` | Нет | Начальная дата диапазона (`YYYY-MM-DD`) |
| `to_date` | `string` | Нет | Конечная дата диапазона (`YYYY-MM-DD`) |
| `only_original_posts` | `boolean` | Нет | Исключать репосты и повторы цитат |
| `has_media` | `boolean` | Нет | Искать только посты с фото, графиками или видео |
| `has_links` | `boolean` | Нет | Искать только посты со ссылками на статьи или репозитории |
| `only_threads` | `boolean` | Нет | Искать развернутые авторские треды |
| `lang` | `string` | Нет | Код языка (например, `ru`, `en`, `ja`) |
| `min_likes` | `number` | Нет | Минимальный порог лайков |
| `min_reposts` | `number` | Нет | Минимальный порог репостов/ретвитов |
| `enable_image_understanding` | `boolean` | Нет | Анализ и извлечение данных из графиков/скриншотов |
| `enable_video_understanding` | `boolean` | Нет | Анализ видеофрагментов и речи в постах |

---

### 2. `x_author_profile` — Анализ профиля и тезисов автора

Изучение активности, ключевых тезисов, сферы экспертизы и позиции конкретного автора.

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `handle` | `string` | **Да** | Имя пользователя в X (например, `@ylecun` или `sama`) |
| `focus_topic` | `string` | Нет | Конкретная тема или вопрос для анализа позиции автора |
| `from_date` | `string` | Нет | Начальная дата диапазона (`YYYY-MM-DD`) |
| `to_date` | `string` | Нет | Конечная дата диапазона (`YYYY-MM-DD`) |
| `only_original_posts` | `boolean` | Нет | Только оригинальные посты автора (по умолчанию `true`) |

---

### 3. `x_trending_topics` — Поиск горячих трендов в реальном времени

Выявление актуальных дискуссий, вирусных тем и инцидентов в заданном домене.

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `domain` | `string` | Нет | Домен темы (`tech`, `ai`, `crypto`, `science`, `world`, `general`, по умолчанию `tech`) |
| `region` | `string` | Нет | Регион или фокус (`Global`, `US`, `EU`, `Asia`) |
| `timeframe` | `string` | Нет | Временной период (`today`, `past_24h`, `past_week`, по умолчанию `today`) |
| `min_likes` | `number` | Нет | Порог лайков для фильтрации вирусного контента |

---

### 4. `x_fact_check_notes` — Проверка фактов и Community Notes

Поиск заметок сообщества (Community Notes), контекста, опровержений и комментариев экспертов к заявлениям.

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `claim` | `string` | **Да** | Утверждение или слух для проверки |
| `target_url` | `string` | Нет | Ссылка на конкретный твит или статью для проверки |
| `allowed_x_handles` | `string` | Нет | Аккаунты доверенных экспертов/исследователей |
| `enable_image_understanding` | `boolean` | Нет | Анализ изображений и графиков в опровергающих постах |

---

## 🛡️ Отказоустойчивость и производительность

* **Smart Model Fallback (429 Rate Limit)**: При временном исчерпании лимитов на флагманской `grok-4.6` движок автоматически перенаправляет запрос на `grok-4.5` или `grok-4-fast-reasoning`.
* **In-Memory TTL-кэширование**: Одинаковые запросы в течение 5 минут отдаются мгновенно из локального кэша.
* **Структурированные ссылки**: Все цитаты разбираются в объекты с именами авторов (`@handle`), ID постов и кликабельными URL.
* **Полная локализация UI**: Поддержка русского, английского и китайского языков через `ctx.locale.register`.

---

## ⚙️ Конфигурация (`settings.yaml` / Web UI)

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

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Включение/отключение всех инструментов набора |
| `grokClientId` | `string` | `""` | OAuth Client ID для входа в SuperGrok |
| `model` | `string` | `"grok-4.6"` | Модель Grok по умолчанию |
| `timeoutSeconds` | `number` | `180` | Таймаут выполнения запроса |
| `retries` | `number` | `2` | Количество попыток при сбоях 5xx |
| `autoFallbackModel` | `boolean` | `true` | Автоматический переход на Grok 4.5 при 429 |
| `enableCache` | `boolean` | `true` | Кэширование повторных запросов в памяти |
| `cacheTtlSeconds` | `number` | `300` | Время жизни кэша в секундах |

---

## 📦 Быстрая установка

```bash
dsh plugin --profile web add @goodandready/dsh-grok-xsearch
```

> [!IMPORTANT]
> Авторизуйте аккаунт SuperGrok во вкладке **Настройки → Плагины → Grok X Search & Intelligence Suite**.

---

## 🔌 HTTP API Маршруты

| Маршрут | Метод | Описание |
|---|---|---|
| `/dsh-grok-xsearch/config` | `GET, PUT` | Получение и обновление настроек |
| `/dsh-grok-xsearch/cache/clear` | `POST` | Ручная очистка кэша запросов |
| `/dsh-grok-xsearch/oauth/start` | `GET` | Старт сессии авторизации PKCE |
| `/dsh-grok-xsearch/oauth/callback` | `GET` | Обработчик редиректа браузера |
| `/dsh-grok-xsearch/oauth/complete` | `POST` | Завершение авторизации по вставленному URL |
| `/dsh-grok-xsearch/logout` | `POST` | Выход и удаление токенов |

---

## 📄 Лицензия

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
