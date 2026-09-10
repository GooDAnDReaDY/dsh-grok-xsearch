window.__ModuleLoader__.load({
  id: '@goodandready/dsh-grok-xsearch',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    let ChevronIcon = null
    try {
      const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
      ChevronIcon = primitives && primitives.IconChevronDownOutline14
    } catch (noPrimitives) {
      ChevronIcon = null
    }

    function FallbackChevron(props) {
      return React.createElement('svg', {
        className: props.className,
        width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': 'true',
      }, React.createElement('path', {
        d: 'M3.5 5.25 7 8.75l3.5-3.5',
        stroke: 'currentColor', strokeWidth: 1.5,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      }))
    }

    const Chevron = ChevronIcon || FallbackChevron

    const CSS =
      '.gx-wrap{display:flex;flex-direction:column;gap:22px;padding:4px 0;max-width:760px}' +
      '.gx-wrap-in{gap:12px;padding:12px 0}' +
      '.gx-block{display:flex;flex-direction:column;gap:10px}' +
      '.gx-h{font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}' +
      '.gx-sub{font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.45}' +
      '.gx-card{display:flex;flex-direction:column;gap:12px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3)}' +
      '.gx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
      '.gx-grow{flex:1;min-width:180px}' +
      '.gx-mini{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:6px;height:30px;padding:0 12px;cursor:pointer;font-size:13px}' +
      '.gx-mini:disabled{opacity:.45;cursor:not-allowed}' +
      '.gx-link{background:none;border:none;color:var(--dsw-alias-brand-primary);cursor:pointer;font-size:12px;padding:0;text-align:left}' +
      '.gx-badge{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);white-space:nowrap}' +
      '.gx-badge-on{color:var(--dsw-alias-state-success-primary);border-color:currentColor}' +
      '.gx-bad{font-size:12px;color:var(--dsw-alias-state-error-primary)}' +
      '.gx-paste input,.gx-input{width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px}' +
      '.gx-item{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none}' +
      '.gx-card-head{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;display:flex;align-items:center;gap:12px;padding:14px 16px}' +
      '.gx-card-head .gx-grow{display:flex;flex-direction:column;gap:2px}' +
      '.gx-chev{margin-left:auto;flex:none;color:var(--dsw-alias-label-tertiary);transition:transform .16s}' +
      '.gx-chev-open{transform:rotate(180deg)}' +
      '.gx-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}' +
      '.gx-select{padding:8px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px;min-width:220px}' +
      '.gx-chk{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary);cursor:pointer}'

    const NS = 'dsh-grok-xsearch'

    const LOCALES = {
      en: {
        title: 'Grok X Search & Intelligence Suite',
        subtitle: 'Real-time X (Twitter) search, author profiling, trends, and fact-checking powered by SuperGrok OAuth.',
        ready_msg: 'Ready for x_search, x_author_profile, x_trending_topics, and x_fact_check_notes tools in chat.',
        not_connected_msg: 'Connect your SuperGrok account to enable X intelligence tools.',
        connected: 'Connected',
        not_connected: 'Not connected',
        connect: 'Connect',
        reconnect: 'Reconnect',
        disconnect: 'Disconnect',
        model: 'Model',
        saving: 'Saving…',
        auto_fallback: 'Auto-fallback to Grok 4.5 on Rate Limits (429)',
        enable_cache: 'Enable in-memory query caching (5 min)',
        cache_stats: 'Cached queries',
        clear_cache: 'Clear cache',
        cache_cleared: 'Cache cleared',
        browser_no_return: 'Browser did not return here? Paste the redirected URL',
        paste_hint: 'Paste the full URL from the browser address bar after sign-in.',
        submit: 'Submit',
        cancel: 'Cancel',
        supergrok_account: 'SuperGrok account',
        grok_client_id: 'Grok Client ID',
        client_id_hint: 'OAuth Client ID from your SuperGrok / xAI developer portal.',
        loading: 'Loading…',
        enabled_plugin: 'Enable Grok X Search plugin',
        advanced_settings: 'Advanced Settings',
        timeout_seconds: 'Search Timeout (sec)',
        timeout_hint: 'Maximum request duration before aborting (default: 180s).',
        retries: 'Max Retries',
        retries_hint: 'Number of retries on transient network errors (default: 2).',
        cache_ttl_seconds: 'Cache TTL (sec)',
        cache_ttl_hint: 'Duration to retain cached query results (default: 300s).',
        base_url: 'API Base URL',
        base_url_hint: 'xAI API endpoint (default: https://api.x.ai/v1).',
        redirect_uri: 'OAuth Redirect URL',
        redirect_uri_hint: 'Local OAuth callback URL (default: http://127.0.0.1:56121/callback).',

      },
      ru: {
        title: 'Grok X Search & Intelligence Suite',
        subtitle: 'Поиск постов в X (Twitter) в реальном времени, анализ авторов, трендов и фактчекинг через SuperGrok OAuth.',
        ready_msg: 'Инструменты x_search, x_author_profile, x_trending_topics и x_fact_check_notes готовы к работе.',
        not_connected_msg: 'Подключите учетную запись SuperGrok для активации инструментов работы с X.',
        connected: 'Подключено',
        not_connected: 'Не подключено',
        connect: 'Подключить',
        reconnect: 'Переподключить',
        disconnect: 'Отключить',
        model: 'Модель',
        saving: 'Сохранение…',
        auto_fallback: 'Автопереключение на Grok 4.5 при лимитах (429)',
        enable_cache: 'Кэширование повторных запросов (5 мин)',
        cache_stats: 'Запросов в кэше',
        clear_cache: 'Очистить кэш',
        cache_cleared: 'Кэш очищен',
        browser_no_return: 'Браузер не вернулся обратно? Вставьте URL перенаправления',
        paste_hint: 'Вставьте полный URL из адресной строки браузера после входа.',
        submit: 'Отправить',
        cancel: 'Отмена',
        supergrok_account: 'Аккаунт SuperGrok',
        grok_client_id: 'ID клиента Grok',
        client_id_hint: 'OAuth Client ID из портала разработчиков SuperGrok / xAI.',
        loading: 'Загрузка…',
        enabled_plugin: 'Включить плагин Grok X Search',
        advanced_settings: 'Дополнительные настройки',
        timeout_seconds: 'Таймаут поиска (сек)',
        timeout_hint: 'Максимальное время ожидания ответа (по умолчанию: 180с).',
        retries: 'Число повторов',
        retries_hint: 'Количество повторных попыток при сетевых сбоях (по умолчанию: 2).',
        cache_ttl_seconds: 'Время жизни кэша (сек)',
        cache_ttl_hint: 'Срок хранения кэшированных запросов (по умолчанию: 300с).',
        base_url: 'Base URL API',
        base_url_hint: 'Адрес API xAI (по умолчанию: https://api.x.ai/v1).',
        redirect_uri: 'OAuth Redirect URL',
        redirect_uri_hint: 'Локальный URL перенаправления (по умолчанию: http://127.0.0.1:56121/callback).',

      },
      zh: {
        title: 'Grok X 搜索与情报套件',
        subtitle: '基于 SuperGrok OAuth 的 X (Twitter) 实时搜索、作者分析、趋势发现与事实核查工具。',
        ready_msg: 'x_search、x_author_profile、x_trending_topics 与 x_fact_check_notes 工具已就绪。',
        not_connected_msg: '请连接 SuperGrok 账户以启用 X 情报工具。',
        connected: '已连接',
        not_connected: '未连接',
        connect: '连接',
        reconnect: '重新连接',
        disconnect: '断开连接',
        model: '模型',
        saving: '正在保存…',
        auto_fallback: '遇到速率限制 (429) 时自动降级到 Grok 4.5',
        enable_cache: '启用内存查询缓存 (5分钟)',
        cache_stats: '缓存查询数',
        clear_cache: '清除缓存',
        cache_cleared: '缓存已清除',
        browser_no_return: '浏览器未自动返回？粘贴重定向 URL',
        paste_hint: '登录后请粘贴浏览器地址栏中的完整重定向 URL。',
        submit: '提交',
        cancel: '取消',
        supergrok_account: 'SuperGrok 账户',
        grok_client_id: 'Grok 客户端 ID',
        client_id_hint: 'SuperGrok / xAI 开发者门户中的 OAuth Client ID。',
        loading: '加载中…',
        enabled_plugin: '启用 Grok X Search 插件',
        advanced_settings: '高级设置',
        timeout_seconds: '搜索超时 (秒)',
        timeout_hint: '超时前的最长请求时间 (默认: 180s)。',
        retries: '重试次数',
        retries_hint: '网络临时错误时的重试次数 (默认: 2)。',
        cache_ttl_seconds: '缓存 TTL (秒)',
        cache_ttl_hint: '已缓存查询结果的保留时间 (默认: 300s)。',
        base_url: 'API Base URL',
        base_url_hint: 'xAI API 地址 (默认: https://api.x.ai/v1)。',
        redirect_uri: 'OAuth Redirect URL',
        redirect_uri_hint: '本地 OAuth 回调地址 (默认: http://127.0.0.1:56121/callback)。',

      },
    }

    let defaultTranslator = (key) => (LOCALES.en && LOCALES.en[key]) || key

    const cssId = 'dsh-grok-xsearch/settings.module.css'
    if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin-css="' + cssId + '"]')) {
      const tag = document.createElement('style')
      tag.textContent = CSS
      tag.setAttribute('data-plugin', 'dsh-grok-xsearch')
      tag.dataset.pluginCss = cssId
      document.head.appendChild(tag)
    }

    function displayName(account, t) {
      const label = String(account && account.label || '').trim()
      if (label && label !== 'Grok X Search') return label
      const email = String(account && account.email || '').trim()
      if (email && !/^[0-9a-f-]{20,}$/i.test(email)) return email
      return (t ? t('supergrok_account') : 'SuperGrok account')
    }

    function badgeFor(account, t) {
      const tr = t || defaultTranslator
      return account && account.configured ? tr('connected') : tr('not_connected')
    }

    function modelRows(models, current) {
      const rows = Array.isArray(models) && models.length ? models.slice() : []
      if (!rows.some((row) => row.id === current)) {
        rows.unshift({ id: current, name: current, hint: 'Current' })
      }
      return rows
    }

    function Section(props) {
      const t = props && typeof props.t === 'function' ? props.t : defaultTranslator
      const compact = Boolean(props && props.compact)
      const [config, setConfig] = React.useState(null)
      const [account, setAccount] = React.useState({ configured: false })
      const [paste, setPaste] = React.useState('')
      const [err, setErr] = React.useState('')
      const [showPaste, setShowPaste] = React.useState(false)
      const [models, setModels] = React.useState([])
      const [grokClientId, setGrokClientId] = React.useState('')
      const [model, setModel] = React.useState('grok-4.6')
      const [autoFallback, setAutoFallback] = React.useState(true)
      const [enableCache, setEnableCache] = React.useState(true)
      const [cacheStats, setCacheStats] = React.useState({ size: 0, maxEntries: 200 })
      const [clearingCache, setClearingCache] = React.useState(false)
      const [saving, setSaving] = React.useState(false)
      const [enabled, setEnabled] = React.useState(true)
      const [showAdvanced, setShowAdvanced] = React.useState(false)
      const [timeoutSeconds, setTimeoutSeconds] = React.useState(180)
      const [retries, setRetries] = React.useState(2)
      const [cacheTtlSeconds, setCacheTtlSeconds] = React.useState(300)
      const [baseUrl, setBaseUrl] = React.useState('https://api.x.ai/v1')
      const [redirectUri, setRedirectUri] = React.useState('http://127.0.0.1:56121/callback')

      const scopeRef = React.useRef(null)
      const settingsScopeService = props.ctx ? (typeof props.ctx.get === 'function' ? props.ctx.get('settingsScope') : props.ctx.settingsScope) : null
      if (!scopeRef.current && settingsScopeService) {
        try {
          scopeRef.current = settingsScopeService.bind({ namespace: NS })
        } catch (_) {
          scopeRef.current = null
        }
      }
      const scope = scopeRef.current

      const applyPayload = (data) => {
        const cfg = (data && data.config) || {}
        setConfig(cfg)
        setAccount((data && data.account) || { configured: false })
        setModels(cfg.models || [])
        setGrokClientId(cfg.grokClientId || '')
        setModel(cfg.model || 'grok-4.6')
        setAutoFallback(cfg.autoFallbackModel ?? true)
        setEnableCache(cfg.enableCache ?? true)
        setEnabled(cfg.enabled ?? true)
        setTimeoutSeconds(Number(cfg.timeoutSeconds) || 180)
        setRetries(Number.isInteger(cfg.retries) ? cfg.retries : 2)
        setCacheTtlSeconds(Number(cfg.cacheTtlSeconds) || 300)
        setBaseUrl(cfg.baseUrl || 'https://api.x.ai/v1')
        setRedirectUri(cfg.redirectUri || 'http://127.0.0.1:56121/callback')
        if (data && data.cache) setCacheStats(data.cache)
      }

      React.useEffect(() => {
        let alive = true
        fetch('/dsh-grok-xsearch/config', { cache: 'no-store' })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}))
            if (!alive) return
            if (res.ok && data && data.ok) applyPayload(data)
            else setErr(String((data?.error && data.error.message) || ('HTTP ' + res.status)))
          })
          .catch((e) => { if (alive) setErr(String(e && e.message ? e.message : e)) })
        return () => { alive = false }
      }, [])

      React.useEffect(() => {
        if (!scope) return undefined
        const syncSnapshot = () => {
          if (typeof scope.getSnapshot !== 'function') return
          const snap = scope.getSnapshot()
          if (!snap || snap.status === 'loading') return
          if (snap.status === 'ready' && snap.value) {
            const val = snap.value
            if (val.grokClientId !== undefined) setGrokClientId(val.grokClientId || '')
            if (val.model !== undefined) setModel(val.model || 'grok-4.6')
            if (val.autoFallbackModel !== undefined) setAutoFallback(val.autoFallbackModel ?? true)
            if (val.enableCache !== undefined) setEnableCache(val.enableCache ?? true)
            if (val.enabled !== undefined) setEnabled(val.enabled ?? true)
            if (val.timeoutSeconds !== undefined) setTimeoutSeconds(Number(val.timeoutSeconds) || 180)
            if (val.retries !== undefined) setRetries(Number.isInteger(val.retries) ? val.retries : 2)
            if (val.cacheTtlSeconds !== undefined) setCacheTtlSeconds(Number(val.cacheTtlSeconds) || 300)
            if (val.baseUrl !== undefined) setBaseUrl(val.baseUrl || 'https://api.x.ai/v1')
            if (val.redirectUri !== undefined) setRedirectUri(val.redirectUri || 'http://127.0.0.1:56121/callback')
          }
        }
        syncSnapshot()
        if (typeof scope.subscribe === 'function') {
          return scope.subscribe(syncSnapshot)
        }
        return undefined
      }, [scope])

      if (!config) return React.createElement('div', { className: 'gx-wrap' }, t('loading'))

      const connected = !!(account && account.configured)
      const title = displayName(account, t)

      const savePatch = async (patch) => {
        setErr('')
        setSaving(true)
        try {
          const res = await fetch('/dsh-grok-xsearch/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
          applyPayload(data)
        } finally {
          setSaving(false)
        }
      }

      const connect = async () => {
        setErr('')
        const res = await fetch('/dsh-grok-xsearch/oauth/start', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        if (data.url) window.open(data.url, '_blank', 'noopener')
      }

      const complete = async () => {
        setErr('')
        const res = await fetch('/dsh-grok-xsearch/oauth/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: paste }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        applyPayload(data)
        setPaste('')
        setShowPaste(false)
      }

      const logout = async () => {
        setErr('')
        const res = await fetch('/dsh-grok-xsearch/logout', { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        applyPayload(data)
      }

      const clearCache = async () => {
        setErr('')
        setClearingCache(true)
        try {
          const res = await fetch('/dsh-grok-xsearch/cache/clear', { method: 'POST' })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
          if (data && data.cache) setCacheStats(data.cache)
        } finally {
          setClearingCache(false)
        }
      }

      return React.createElement('div', { className: compact ? 'gx-wrap gx-wrap-in' : 'gx-wrap' },
        compact ? null : React.createElement('div', { className: 'gx-block' },
          React.createElement('div', { className: 'gx-h' }, t('title')),
          React.createElement('div', { className: 'gx-sub' }, t('subtitle')),
        ),
        React.createElement('div', { className: 'gx-card' },
          React.createElement('div', { className: 'gx-row', style: { justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--dsw-alias-border-l2)' } },
            React.createElement('label', { className: 'gx-chk', style: { fontWeight: 600 } },
              React.createElement('input', {
                type: 'checkbox',
                checked: enabled,
                disabled: saving,
                onChange: (e) => {
                  const next = e.target.checked
                  setEnabled(next)
                  savePatch({ enabled: next }).catch((error) => setErr(String(error.message || error)))
                },
              }),
              t('enabled_plugin'),
            ),
            React.createElement('span', { className: 'gx-badge' + (enabled ? ' gx-badge-on' : ' gx-badge-off') }, enabled ? 'ON' : 'OFF'),
          ),
          React.createElement('div', { className: 'gx-row' },
            React.createElement('div', { className: 'gx-grow' },
              React.createElement('div', { className: 'gx-h', style: { fontSize: '13px' } }, title),
              React.createElement('div', { className: 'gx-sub' }, connected ? t('ready_msg') : t('not_connected_msg')),
            ),
            React.createElement('span', { className: 'gx-badge' + (connected ? ' gx-badge-on' : '') }, badgeFor(account, t)),
            React.createElement('button', {
              type: 'button', className: 'gx-mini',
              onClick: () => connect().catch((e) => setErr(String(e.message || e))),
            }, connected ? t('reconnect') : t('connect')),
            React.createElement('button', {
              type: 'button', className: 'gx-mini', disabled: !connected,
              onClick: () => logout().catch((e) => setErr(String(e.message || e))),
            }, t('disconnect')),
          ),
          React.createElement('div', { className: 'gx-row' },
            React.createElement('div', { className: 'gx-grow', style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
              React.createElement('label', { className: 'gx-sub', style: { fontWeight: 500 } }, t('grok_client_id')),
              React.createElement('input', {
                className: 'gx-input',
                value: grokClientId,
                disabled: saving,
                placeholder: 'xai-...',
                onChange: (e) => setGrokClientId(e.target.value),
                onBlur: () => {
                  if (grokClientId !== (config.grokClientId || '')) {
                    savePatch({ grokClientId }).catch((error) => setErr(String(error.message || error)))
                  }
                },
              }),
              React.createElement('div', { className: 'gx-sub', style: { fontSize: '11px', opacity: 0.8 } }, t('client_id_hint')),
            ),
          ),
          React.createElement('div', { className: 'gx-row' },
            React.createElement('label', { className: 'gx-sub', style: { minWidth: '48px' } }, t('model')),
            React.createElement('select', {
              className: 'gx-select gx-grow',
              value: model,
              disabled: saving,
              onChange: (e) => {
                const next = e.target.value
                setModel(next)
                savePatch({ model: next }).catch((error) => setErr(String(error.message || error)))
              },
            }, modelRows(models, model).map((row) =>
              React.createElement('option', { key: row.id, value: row.id }, row.name + (row.hint ? ' — ' + row.hint : '')),
            )),
            saving ? React.createElement('span', { className: 'gx-sub' }, t('saving')) : null,
          ),
          React.createElement('div', { className: 'gx-row', style: { gap: '16px' } },
            React.createElement('label', { className: 'gx-chk' },
              React.createElement('input', {
                type: 'checkbox',
                checked: autoFallback,
                disabled: saving,
                onChange: (e) => {
                  const next = e.target.checked
                  setAutoFallback(next)
                  savePatch({ autoFallbackModel: next }).catch((error) => setErr(String(error.message || error)))
                },
              }),
              t('auto_fallback'),
            ),
            React.createElement('label', { className: 'gx-chk' },
              React.createElement('input', {
                type: 'checkbox',
                checked: enableCache,
                disabled: saving,
                onChange: (e) => {
                  const next = e.target.checked
                  setEnableCache(next)
                  savePatch({ enableCache: next }).catch((error) => setErr(String(error.message || error)))
                },
              }),
              t('enable_cache'),
            ),
          ),
          enableCache ? React.createElement('div', { className: 'gx-row', style: { alignItems: 'center', gap: '10px' } },
            React.createElement('span', { className: 'gx-sub' }, `${t('cache_stats')}: ${cacheStats.size} / ${cacheStats.maxEntries}`),
            React.createElement('button', {
              type: 'button',
              className: 'gx-mini',
              disabled: clearingCache || cacheStats.size === 0,
              onClick: () => clearCache().catch((error) => setErr(String(error.message || error))),
            }, clearingCache ? t('loading') : t('clear_cache')),
          ) : null,
          React.createElement('button', {
            type: 'button',
            className: 'gx-advanced-toggle',
            'aria-expanded': showAdvanced,
            onClick: () => setShowAdvanced((was) => !was),
          },
            React.createElement('span', null, t('advanced_settings')),
            React.createElement(Chevron, { className: 'gx-chev' + (showAdvanced ? ' gx-chev-open' : '') }),
          ),
          showAdvanced ? React.createElement('div', { className: 'gx-advanced-box' },
            React.createElement('div', { className: 'gx-grid-2' },
              React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                React.createElement('label', { className: 'gx-sub', style: { fontWeight: 500 } }, t('timeout_seconds')),
                React.createElement('input', {
                  className: 'gx-input-small',
                  type: 'number',
                  min: 1,
                  max: 900,
                  value: timeoutSeconds,
                  disabled: saving,
                  onChange: (e) => setTimeoutSeconds(Number(e.target.value) || 0),
                  onBlur: () => {
                    const val = Number(timeoutSeconds) || 180
                    if (val !== (config.timeoutSeconds || 180)) {
                      savePatch({ timeoutSeconds: val }).catch((error) => setErr(String(error.message || error)))
                    }
                  },
                }),
                React.createElement('div', { className: 'gx-sub', style: { fontSize: '11px', opacity: 0.8 } }, t('timeout_hint')),
              ),
              React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                React.createElement('label', { className: 'gx-sub', style: { fontWeight: 500 } }, t('retries')),
                React.createElement('input', {
                  className: 'gx-input-small',
                  type: 'number',
                  min: 0,
                  max: 10,
                  value: retries,
                  disabled: saving,
                  onChange: (e) => setRetries(Number(e.target.value) || 0),
                  onBlur: () => {
                    const val = Number(retries) ?? 2
                    if (val !== (config.retries ?? 2)) {
                      savePatch({ retries: val }).catch((error) => setErr(String(error.message || error)))
                    }
                  },
                }),
                React.createElement('div', { className: 'gx-sub', style: { fontSize: '11px', opacity: 0.8 } }, t('retries_hint')),
              ),
              React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                React.createElement('label', { className: 'gx-sub', style: { fontWeight: 500 } }, t('cache_ttl_seconds')),
                React.createElement('input', {
                  className: 'gx-input-small',
                  type: 'number',
                  min: 10,
                  max: 86400,
                  value: cacheTtlSeconds,
                  disabled: saving,
                  onChange: (e) => setCacheTtlSeconds(Number(e.target.value) || 0),
                  onBlur: () => {
                    const val = Number(cacheTtlSeconds) || 300
                    if (val !== (config.cacheTtlSeconds || 300)) {
                      savePatch({ cacheTtlSeconds: val }).catch((error) => setErr(String(error.message || error)))
                    }
                  },
                }),
                React.createElement('div', { className: 'gx-sub', style: { fontSize: '11px', opacity: 0.8 } }, t('cache_ttl_hint')),
              ),
            ),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
              React.createElement('label', { className: 'gx-sub', style: { fontWeight: 500 } }, t('base_url')),
              React.createElement('input', {
                className: 'gx-input-small',
                type: 'text',
                value: baseUrl,
                disabled: saving,
                placeholder: 'https://api.x.ai/v1',
                onChange: (e) => setBaseUrl(e.target.value),
                onBlur: () => {
                  const val = baseUrl.trim() || 'https://api.x.ai/v1'
                  if (val !== (config.baseUrl || 'https://api.x.ai/v1')) {
                    savePatch({ baseUrl: val }).catch((error) => setErr(String(error.message || error)))
                  }
                },
              }),
              React.createElement('div', { className: 'gx-sub', style: { fontSize: '11px', opacity: 0.8 } }, t('base_url_hint')),
            ),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
              React.createElement('label', { className: 'gx-sub', style: { fontWeight: 500 } }, t('redirect_uri')),
              React.createElement('input', {
                className: 'gx-input-small',
                type: 'text',
                value: redirectUri,
                disabled: saving,
                placeholder: 'http://127.0.0.1:56121/callback',
                onChange: (e) => setRedirectUri(e.target.value),
                onBlur: () => {
                  const val = redirectUri.trim() || 'http://127.0.0.1:56121/callback'
                  if (val !== (config.redirectUri || 'http://127.0.0.1:56121/callback')) {
                    savePatch({ redirectUri: val }).catch((error) => setErr(String(error.message || error)))
                  }
                },
              }),
              React.createElement('div', { className: 'gx-sub', style: { fontSize: '11px', opacity: 0.8 } }, t('redirect_uri_hint')),
            ),
          ) : null,
          !showPaste
            ? React.createElement('button', {
              type: 'button', className: 'gx-link',
              onClick: () => setShowPaste(true),
            }, t('browser_no_return'))
            : React.createElement('div', { className: 'gx-paste' },
              React.createElement('div', { className: 'gx-sub', style: { marginBottom: '6px' } }, t('paste_hint')),
              React.createElement('div', { className: 'gx-row' },
                React.createElement('input', {
                  className: 'gx-grow',
                  value: paste,
                  placeholder: 'https://…?code=…&state=…',
                  onChange: (e) => setPaste(e.target.value),
                }),
                React.createElement('button', {
                  type: 'button', className: 'gx-mini',
                  onClick: () => complete().catch((e) => setErr(String(e.message || e))),
                }, t('submit')),
                React.createElement('button', {
                  type: 'button', className: 'gx-link',
                  onClick: () => { setShowPaste(false); setPaste('') },
                }, t('cancel')),
              ),
            ),
        ),
        err ? React.createElement('div', { className: 'gx-bad' }, err) : null,
      )
    }

    function PluginCard(props) {
      const t = props && typeof props.t === 'function' ? props.t : defaultTranslator
      const ctx = props && props.ctx
      const [open, setOpen] = React.useState(false)
      return React.createElement('li', { className: 'gx-item' },
        React.createElement('button', {
          type: 'button',
          className: 'gx-card-head',
          'aria-expanded': open,
          onClick: () => setOpen((was) => !was),
        },
          React.createElement('div', { className: 'gx-grow' },
            React.createElement('div', { className: 'gx-h' }, t('title')),
            React.createElement('div', { className: 'gx-sub' }, t('subtitle')),
          ),
          React.createElement(Chevron, { className: 'gx-chev' + (open ? ' gx-chev-open' : '') }),
        ),
        open ? React.createElement('div', { className: 'gx-body' },
          React.createElement(Section, { compact: true, t, ctx }),
        ) : null,
      )
    }

    function apply(ctx) {
      if (ctx.locale && typeof ctx.locale.register === 'function') {
        try {
          ctx.locale.register(NS, LOCALES)
          defaultTranslator = ctx.locale.bind(NS)
        } catch { /* already registered */ }
      }

      let moved = false
      try {
        moved = !!ctx.slots.inject('settings.plugin.item', () => ctx.slots.register(
          {
            name: 'settings.plugin.item',
            key: NS,
            locale: NS,
            inject: () => ({ ctx }),
          },
          PluginCard,
        ))
      } catch {
        moved = false
      }
      if (moved) return

      ctx.slots.inject('settings.section', () => ctx.slots.register(
        {
          name: 'settings.section',
          id: '@goodandready/dsh-grok-xsearch',
          order: 29,
          locale: NS,
          label: () => defaultTranslator('title'),
          inject: () => ({ ctx }),
        },
        Section,
      ))
    }

    module.exports = { apply, inject: ['slots', 'locale', 'settingsScope'] }
    return module.exports
  },
})
