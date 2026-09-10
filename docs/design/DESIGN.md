# DESIGN.md — @goodandready/dsh-grok-xsearch

## Product / Purpose
- **Назначение**: Предоставление DeepSeek Harness агентам и пользователям инструментов глубокого поиска в реальном времени по постам, обсуждениям, трендам и авторам в X (Twitter) через проверенную OAuth-сессию SuperGrok и Responses API (`POST /responses`), без необходимости приобретения enterprise-тарифов X API.
- **Аудитория**: Пользователи DeepSeek Harness, исследователи, разработчики, аналитики и агенты, запрашивающие актуальные сведения из X.
- **Статус**: Production (начиная с v0.3.8, стабильный цикл v0.3.9).

## User Surfaces
- **Web/UI**: Отсутствует отдельное полноэкранное веб-приложение; интерфейс встроен в Web UI DSH.
- **DSH UI / settings / slots**:
  - Карточка настроек плагина `settings.plugin.item` с ключом `dsh-grok-xsearch` и локалью `dsh-grok-xsearch`.
  - Fallback-раздел `settings.section` (id `@goodandready/dsh-grok-xsearch`, order 29) для старых сборок DSH ядра без вкладки «Настройки плагинов».
  - Поля карточки: статус подключения (badge + Connect/Reconnect/Disconnect), ввод Grok Client ID, выбор модели (Grok 4.6, 4.5, 4.3, 4.20 и др. с автоподгрузкой каталога), тумблер автопереключения на Grok 4.5 при 429 rate limit, тумблер кэширования ответов (5 мин), статус кэша с кнопкой ручной очистки, ручной ввод redirected URL при сбое callback.
- **Agent Tools (Инструменты агента)**:
  - `x_search`: Основной глубокий поиск постов, тредов, авторов и медиа с гибкими фильтрами (`allowed_x_handles`, `excluded_x_handles`, `from_date`, `to_date`, `only_original_posts`, `only_threads`, `has_media`, `has_links`, `lang`, `min_likes`, `min_reposts`, `enable_image_understanding`, `enable_video_understanding`).
  - `x_author_profile`: Анализ профиля, экспертизы и позиции автора на X.
  - `x_trending_topics`: Мониторинг виральных тем и обсуждений по доменам и регионам.
  - `x_fact_check_notes`: Проверка фактов и Community Notes по утверждению или URL.
- **HTTP / Internal API**:
  - `GET /dsh-grok-xsearch/config`: Получение конфигурации, статуса аккаунта, каталога моделей и статистики кэша.
  - `PUT /dsh-grok-xsearch/config`: Атомарное обновление настроек через `settingsScope` с проверкой `isTrustedSettingsRequest`.
  - `POST /dsh-grok-xsearch/cache/clear`: Очистка in-memory кэша поисковых ответов.
  - `GET /dsh-grok-xsearch/oauth/start`: Генерация PKCE challenge и формирование ссылки авторизации xAI.
  - `GET /dsh-grok-xsearch/oauth/callback`: OAuth callback от xAI (с обработкой `code`/`state` и ошибок `error`/`error_description`).
  - `POST /dsh-grok-xsearch/oauth/complete`: Завершение авторизации по вставленному пользователем URL.
  - `POST /dsh-grok-xsearch/logout`: Отключение аккаунта и сброс токенов.
- **CLI**: Стандартный DSH CLI (`dsh plugin --profile web ...`).
- **Документация**: `README.md` (English), `README.ru.md` (Русский), `README.zh.md` (中文).

## Visual Direction
- **Атмосфера**: Нативный, сдержанный и органичный UI DeepSeek Harness. Чистый утилитарный дизайн без избыточных декораций.
- **Утверждённые референсы**: Карточки «Консоль», «Поиск в вебе» из ядра DSH, плагины экосистемы `@vlln/dsh-navbar`, `@goodandready/dsh-cost-meter`.
- **Не копировать**: Сторонние фреймворки, громоздкие модальные окна, несогласованные градиенты и нестандартные шрифты.

## Foundations
- **Цвета и роли**: Использование исключительно CSS-переменных дизайн-системы ядра:
  - Текст: `--dsw-alias-label-primary`, `--dsw-alias-label-secondary`, `--dsw-alias-label-tertiary`.
  - Фон: `--dsw-alias-bg-layer-2`, `--dsw-alias-bg-layer-3`.
  - Границы: `--dsw-alias-border-l1`, `--dsw-alias-border-l2`.
  - Акценты и состояния: `--dsw-alias-brand-primary`, `--dsw-alias-state-success-primary`, `--dsw-alias-state-error-primary`.
- **Типографика**: Системный стек шрифтов DSH Web UI (13px базовый, 15px заголовок карточки, 11px бейджи и хинты).
- **Сетка и отступы**: Максимальная ширина карточки 760px, вертикальные промежутки 10–12px, внутренние отступы 12–16px, скругления 12px (карточка) и 6px (инпуты, кнопки).
- **Accessibility**: Семантические теги (`button`, `input`, `select`, `label`), доступные атрибуты `aria-expanded`, контрастные индикаторы фокуса и понятные сообщения об ошибках.

## Components And States
- **Карточка настроек (`PluginCard`)**:
  - Свёрнутое состояние: заголовок, краткое описание, индикатор-шеврон.
  - Развёрнутое состояние: статус подключения (badge зеленый/серый), кнопки подключения/отключения, ввод Client ID, выбор модели, флаги оптимизации, мониторинг кэша.
- **Состояния авторизации**:
  - `Not connected`: Кнопка «Connect», поясняющий текст о необходимости подключения.
  - `Connected`: Отображение email или имени учетной записи, бейдж «Connected», кнопки «Reconnect» и «Disconnect».
  - `Connecting / Manual Paste`: Поле ввода URL перенаправления, кнопки «Submit» и «Cancel».
- **Индикаторы выполнения**:
  - `Saving…`: Отображение статуса сохранения при изменении селекта или чекбоксов.
  - Ошибки (`gx-bad`): Вывод понятного текста ошибки под блоком настроек.

## User Flows
1. **Подключение учетной записи**:
   - Пользователь вводит свой `grokClientId` (сохраняется при `onBlur`).
   - Нажимает «Connect» -> открывается вкладка авторизации на `auth.x.ai`.
   - При успешном возврате на callback сокет закрывается с сообщением «Signed in. Close this tab and return to Settings».
   - При ошибке / отказе (`?error=...`) страница сообщает понятную причину с призывом повторить попытку.
   - Если браузер заблокировал redirect, пользователь нажимает «Browser did not return here?», вставляет URL и нажимает «Submit».
2. **Выполнение поиска агентом**:
   - Агент вызывает инструмент `x_search` (или специализированный саб-инструмент).
   - Токен валидируется. Если срок подходит к концу — single-flight mutex прозрачно обновляет токен.
   - При ошибке 401 срабатывает `onUnauthorized` hook: токен принудительно обновляется и запрос повторяется один раз.
   - При фатальном отзыве токена (`invalid_grant`) blob очищается, чтобы остановить бесконечный цикл ошибок.
   - При ошибке 429 (rate limit) плагин автоматически пробует fallback-модель (`grok-4.5`, `grok-4-fast-reasoning`).
   - Повторные идентичные запросы в течение 5 минут возвращаются мгновенно из in-memory кэша.

## Do / Don't
- **Do**:
  - Регистрировать карточку настроек через `settings.plugin.item` с fallback на `settings.section`.
  - Валидировать любые входные данные инструментов на уровне строгой JSON Schema.
  - Поддерживать три языка локализации UI: en, ru, zh.
  - Очищать чувствительные параметры трекинга из ссылок Twitter/X в цитатах.
- **Don't**:
  - Не создавать свой самостоятельный пункт в боковом меню DSH без согласования.
  - Не оставлять сетевые запросы авторизации без таймаутов.
  - Не использовать `force`-команды в git/npm/dsh.
  - Не сохранять битые токены после явного отказа `invalid_grant`.

## Locked Design Decisions
- **2026-08-21**: Архитектура плагина проектируется как публичный npm-пакет `@goodandready/dsh-grok-xsearch`.
- **2026-09-02**: Инструменты агента разделены на 1 ядро (`x_search`) и 3 специализированных инструмента (`x_author_profile`, `x_trending_topics`, `x_fact_check_notes`) для снижения нагрузки на контекст промпта.
- **2026-09-03**: JSON Schema с `type: "object"` и `additionalProperties: false` зафиксирована как обязательный контракт совместимости для DSH tools.
- **2026-09-08**: Реализован single-flight mutex для refresh-токена, 401 auto-recovery, каноникализация ссылок X (x.com/handle/status/id) и in-memory кэш ответов.
- **2026-09-09**: Таймаут 15с для авторизационных запросов, сброс blob при `invalid_grant`, обработка `error` в OAuth callback, оптимизированная чистка кэша и кнопка сброса кэша в UI.
- **2026-09-10**: Подтверждена бескомпромиссная регистрация настроек через карточку `settings.plugin.item` (слот `settings.section` оставлен исключительно как fallback). Все 10 полей схемы Config (включая enabled, timeoutSeconds, retries, cacheTtlSeconds, baseUrl, redirectUri) доступны в карточке (базовые параметры + сворачиваемый блок «Дополнительно»).
