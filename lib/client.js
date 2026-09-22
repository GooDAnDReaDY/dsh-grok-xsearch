window.__ModuleLoader__.load({
  id: '@goodandready/dsh-grok-xsearch',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-grok-xsearch'
    // Plugins page row seat (DSH 0.1.6-alpha.2): key = '<package name>#<row id>'.
    const PKG = '@goodandready/dsh-grok-xsearch'
    const ROW_ID = 'dsh-grok-xsearch'
    const ROW_CONFIG_KEY = PKG + '#' + ROW_ID
    const CSS_ID = 'gx-settings-styles'
    const CSS_MARKER = '/* dsh-plugin-style: dsh-grok-xsearch */'

    let ChevronIcon = null
    try {
      const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
      ChevronIcon = primitives && primitives.IconChevronDownOutline14
    } catch (noPrimitives) {
      void noPrimitives
      ChevronIcon = null
    }

    function FallbackChevron(props) {
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
        strokeLinecap: 'round', strokeLinejoin: 'round', className: props?.className,
      }, h('polyline', { points: '6 9 12 15 18 9' }))
    }
    const Chevron = ChevronIcon || FallbackChevron

    const CSS = `${CSS_MARKER}
.gx-wrap{display:flex;flex-direction:column;gap:14px;font-family:inherit;color:var(--dsw-alias-label-primary)}.gx-wrap-compact{gap:10px}
.gx-header{display:flex;flex-direction:column;gap:4px;padding-bottom:12px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.gx-header-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600}.gx-header-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}
.gx-section-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px}
.gx-section-title{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600}
.gx-section-desc{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.4}
.gx-row{display:flex;align-items:center;gap:10px}.gx-grow{flex:1}.gx-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gx-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
.gx-badge-ok{background:var(--dsw-alias-success-bg,rgba(34,197,94,0.12));color:var(--dsw-alias-success,rgb(34,197,94))}
.gx-badge-warn{background:var(--dsw-alias-warning-bg,rgba(234,179,8,0.12));color:var(--dsw-alias-warning,rgb(234,179,8))}
.gx-badge-neutral{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.gx-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);padding:6px 14px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
.gx-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-3);border-color:var(--dsw-alias-border-l3)}.gx-btn:disabled{opacity:0.5;cursor:not-allowed}
.gx-btn-primary{background:var(--dsw-alias-brand,rgb(59,130,246));color:#fff;border-color:var(--dsw-alias-brand,rgb(59,130,246))}.gx-btn-primary:hover:not(:disabled){filter:brightness(1.08)}
.gx-btn-danger{color:var(--dsw-alias-danger,rgb(239,68,68));border-color:var(--dsw-alias-danger-bg,rgba(239,68,68,0.3))}.gx-btn-danger:hover:not(:disabled){background:var(--dsw-alias-danger-bg,rgba(239,68,68,0.1))}
.gx-input,.gx-select{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);padding:7px 10px;border-radius:6px;font-size:13px;outline:none}
.gx-input:focus,.gx-select:focus{border-color:var(--dsw-alias-brand,rgb(59,130,246))}.gx-input:disabled,.gx-select:disabled{opacity:0.6}
.gx-chk{display:inline-flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;user-select:none}
.gx-chk input[type="checkbox"]{cursor:pointer;width:15px;height:15px;accent-color:var(--dsw-alias-brand,rgb(59,130,246))}
.gx-link{appearance:none;background:none;border:none;color:var(--dsw-alias-brand,rgb(59,130,246));font-size:12px;cursor:pointer;padding:0;text-decoration:underline}
.gx-link:hover{filter:brightness(1.15)}
.gx-alert-bad{background:var(--dsw-alias-danger-bg,rgba(239,68,68,0.1));border:1px solid var(--dsw-alias-danger,rgb(239,68,68));color:var(--dsw-alias-danger,rgb(239,68,68));padding:8px 12px;border-radius:6px;font-size:12px}
.gx-alert-ok{background:var(--dsw-alias-success-bg,rgba(34,197,94,0.12));border:1px solid var(--dsw-alias-success,rgb(34,197,94));color:var(--dsw-alias-success,rgb(34,197,94));padding:8px 12px;border-radius:6px;font-size:12px}
.gx-bar-container{display:flex;flex-direction:column;gap:6px;background:var(--dsw-alias-bg-layer-2);padding:10px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2)}
.gx-bar-head{display:flex;justify-content:space-between;font-size:12px}.gx-bar-track{width:100%;height:6px;background:var(--dsw-alias-bg-layer-3);border-radius:3px;overflow:hidden}
.gx-bar-fill{height:100%;background:var(--dsw-alias-brand,rgb(59,130,246));border-radius:3px;transition:width 0.3s ease}
.gx-bar-meta{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-secondary)}
.gx-card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;overflow:hidden;margin-bottom:16px}
.gx-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;cursor:pointer;user-select:none}.gx-card-head:hover{background:var(--dsw-alias-bg-layer-2)}
.gx-card-left{display:flex;align-items:center;gap:12px;min-width:0}.gx-card-icon{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:18px}
.gx-card-meta{display:flex;flex-direction:column;min-width:0}.gx-card-title-row{display:flex;align-items:center;gap:8px}
.gx-card-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gx-card-desc{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.gx-card-right{display:flex;align-items:center;gap:10px}
.gx-chev{transition:transform 0.2s ease;color:var(--dsw-alias-label-secondary);width:16px;height:16px}.gx-chev-open{transform:rotate(180deg)}
.gx-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:12px 0 16px}
.gx-collapse-btn{appearance:none;background:none;border:none;padding:4px 0;cursor:pointer;display:flex;align-items:center;justify-content:space-between;width:100%;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500}
.gx-collapse-btn:hover{color:var(--dsw-alias-label-primary)}`

    function ensureCss() {
      if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return
      const style = document.createElement('style')
      style.id = CSS_ID; style.dataset.dshPlugin = NS; style.textContent = CSS
      document.head.appendChild(style)
    }

    function createErrorBoundary() {
      if (!React || typeof React.Component !== 'function') return function NoopBoundary(props) { return props?.children || null }
      return class ErrorBoundary extends React.Component {
        constructor(props) { super(props); this.state = { hasError: false, error: null } }
        static getDerivedStateFromError(error) { return { hasError: true, error } }
        componentDidCatch(error, errorInfo) { console.error('[dsh-grok-xsearch] UI Error:', error, errorInfo) }
        render() {
          if (this.state.hasError) {
            return h('div', { className: 'gx-alert-bad', style: { margin: '12px 0', padding: '14px', borderRadius: '8px' } },
              h('div', { style: { fontWeight: 600, marginBottom: '6px' } }, '⚠️ Grok X Search UI Error:'),
              h('div', { style: { fontSize: '12px', wordBreak: 'break-all' } }, String(this.state.error?.message || this.state.error)),
              h('button', { type: 'button', className: 'gx-btn', style: { marginTop: '10px', fontSize: '12px', padding: '4px 10px' }, onClick: () => this.setState({ hasError: false, error: null }) }, 'Retry')
            )
          }
          return this.props?.children || null
        }
      }
    }
    const ErrorBoundary = createErrorBoundary()

    const LOCALES = {
      en: {
        title: 'Grok X Search & Intelligence Suite', subtitle: 'Real-time X (Twitter) search, author profiling, trends, and fact-checking powered by SuperGrok OAuth.',
        ready_msg: 'Ready for x_search, x_author_profile, x_trending_topics, x_fact_check_notes, x_thread_reader, and x_find_experts tools in chat.',
        not_connected_msg: 'Connect your SuperGrok account to enable X intelligence tools.',
        connected: 'Connected', not_connected: 'Not connected', connect: 'Connect', reconnect: 'Reconnect', disconnect: 'Disconnect',
        model: 'Model', saving: 'Saving…', auto_fallback: 'Auto-fallback to Grok 4.5 on Rate Limits (429)',
        enable_cache: 'Enable in-memory query caching (5 min)', cache_stats: 'Cached queries',
        cache_hits: 'Hits', cache_misses: 'Misses', cache_hit_rate: 'Hit rate', clear_cache: 'Clear cache', cache_cleared: 'Cache cleared',
        browser_no_return: 'Browser did not return here? Paste the redirected URL', paste_hint: 'Paste the full URL from the browser address bar after sign-in.',
        submit: 'Submit', cancel: 'Cancel', supergrok_account: 'SuperGrok account', grok_client_id: 'Grok Client ID',
        client_id_hint: 'OAuth Client ID from your SuperGrok / xAI developer portal.', loading: 'Loading…',
        enabled_plugin: 'Enable Grok X Search plugin', advanced_settings: 'Advanced Settings',
        timeout_seconds: 'Search Timeout (sec)', timeout_hint: 'Maximum request duration before aborting (default: 180s).',
        retries: 'Max Retries', retries_hint: 'Number of retries on transient network errors (default: 2).',
        cache_ttl_seconds: 'Cache TTL (sec)', cache_ttl_hint: 'Duration to retain cached query results (default: 300s).',
        base_url: 'API Base URL', base_url_hint: 'xAI API endpoint (default: https://api.x.ai/v1).',
        redirect_uri: 'OAuth Redirect URL', redirect_uri_hint: 'Local OAuth callback URL (default: http://127.0.0.1:56121/callback).',
        sec_auth_title: '🔑 Authentication & SuperGrok Access', sec_auth_desc: 'OAuth connection token is safely managed via DSH Credentials service and auto-refreshed.',
        sec_model_title: '🧠 Model & Fallback Configuration', sec_model_desc: 'Select xAI model for query synthesis and enable automatic resilient rate-limit fallback.',
        sec_cache_title: '⚡ Search Performance & Response Cache', sec_cache_desc: 'In-memory LRU query cache prevents redundant API calls and accelerates repeated searches.',
        updater_title: 'Plugin Updates', updater_check: 'Check updates', updater_checking: 'Checking…',
        updater_current: 'Current version', updater_latest: 'Latest version', updater_up_to_date: 'Up to date',
        updater_update_now: 'Update to v{version}', updater_updating: 'Updating…',
        updater_success: 'Plugin updated successfully! Please restart DSH service.', updater_failed: 'Update check failed: ',
      },
      zh: {
        title: 'Grok X 搜索与情报套件', subtitle: '基于 SuperGrok OAuth 的 X (Twitter) 实时搜索、作者分析、趋势发现与事实核查工具。',
        ready_msg: 'x_search、x_author_profile、x_trending_topics、x_fact_check_notes、x_thread_reader 与 x_find_experts 工具已就绪。',
        not_connected_msg: '请连接 SuperGrok 账户以启用 X 情报工具。',
        connected: '已连接', not_connected: '未连接', connect: '连接', reconnect: '重新连接', disconnect: '断开连接',
        model: '模型', saving: '正在保存…', auto_fallback: '遇到速率限制 (429) 时自动降级到 Grok 4.5',
        enable_cache: '启用内存查询缓存 (5分钟)', cache_stats: '缓存查询数',
        cache_hits: '命中数', cache_misses: '未命中数', cache_hit_rate: '命中率', clear_cache: '清除缓存', cache_cleared: '缓存已清除',
        browser_no_return: '浏览器未自动返回？粘贴重定向 URL', paste_hint: '登录后请粘贴浏览器地址栏中的完整重定向 URL。',
        submit: '提交', cancel: '取消', supergrok_account: 'SuperGrok 账户', grok_client_id: 'Grok 客户端 ID',
        client_id_hint: 'SuperGrok / xAI 开发者门户中的 OAuth Client ID。', loading: '加载中…',
        enabled_plugin: '启用 Grok X Search 插件', advanced_settings: '高级设置',
        timeout_seconds: '搜索超时 (秒)', timeout_hint: '超时前的最长请求时间 (默认: 180s)。',
        retries: '重试次数', retries_hint: '网络临时错误时的重试次数 (默认: 2)。',
        cache_ttl_seconds: '缓存 TTL (秒)', cache_ttl_hint: '已缓存查询结果的保留时间 (默认: 300s)。',
        base_url: 'API Base URL', base_url_hint: 'xAI API 地址 (默认: https://api.x.ai/v1)。',
        redirect_uri: 'OAuth Redirect URL', redirect_uri_hint: '本地 OAuth 回调地址 (默认: http://127.0.0.1:56121/callback)。',
        sec_auth_title: '🔑 授权与 SuperGrok 访问', sec_auth_desc: 'OAuth 凭证由 DSH Credentials 服务安全管理并自动刷新。',
        sec_model_title: '🧠 模型与故障转移配置', sec_model_desc: '选择用于综合回答的 xAI 模型并启用速率限制自动降级。',
        sec_cache_title: '⚡ 搜索性能与响应缓存', sec_cache_desc: '内存 LRU 查询缓存可消除重复的 API 调用并提升重复搜索速度。',
        updater_title: '插件更新', updater_check: '检查更新', updater_checking: '正在检查…',
        updater_current: '当前版本', updater_latest: '最新版本', updater_up_to_date: '已是最新',
        updater_update_now: '一键更新至 v{version}', updater_updating: '正在更新…',
        updater_success: '插件更新成功！请重启 DSH 服务以生效。', updater_failed: '更新检查失败：',
      },
    }
    let defaultTranslator = (key) => (LOCALES.en && LOCALES.en[key]) || key

    function displayName(account, t) {
      const label = String(account && account.label || '').trim()
      if (label && label !== 'Grok X Search') return label
      const email = String(account && account.email || '').trim()
      if (email && !/^[0-9a-f-]{20,}$/i.test(email)) return email
      return t ? t('supergrok_account') : 'SuperGrok account'
    }

    function badgeFor(account, t) {
      const tr = t || defaultTranslator
      const configured = Boolean(account && account.configured)
      return { text: configured ? tr('connected') : tr('not_connected'), cls: configured ? 'gx-badge-ok' : 'gx-badge-warn' }
    }

    function modelRows(models, current) {
      const list = Array.isArray(models) ? models.slice() : []
      if (current && !list.some((m) => m && m.id === current)) list.unshift({ id: current, name: current, hint: '' })
      return list
    }

    function renderField(label, hint, inputEl) {
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
        h('label', { style: { fontSize: '12px', fontWeight: 500, color: 'var(--dsw-alias-label-secondary)' } }, label),
        inputEl,
        hint ? h('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)', opacity: 0.8 } }, hint) : null
      )
    }

    function UpdaterBlock(props) {
      const t = props.t || defaultTranslator
      const [status, setStatus] = React.useState(null)
      const [loading, setLoading] = React.useState(false)
      const [updating, setUpdating] = React.useState(false)
      const [msg, setMsg] = React.useState(null)
      const checkUpdate = React.useCallback(async () => {
        setLoading(true); setMsg(null)
        try {
          const res = await fetch('/api/dsh-grok-xsearch/update')
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'HTTP ' + res.status)
          setStatus(data)
        } catch (err) {
          setMsg({ ok: false, text: (t('updater_failed') || 'Update check failed: ') + (err?.message || String(err)) })
        } finally { setLoading(false) }
      }, [t])
      const onUpdateNow = async () => {
        setUpdating(true); setMsg(null)
        try {
          const res = await fetch('/api/dsh-grok-xsearch/update', {
            method: 'POST', headers: { 'x-dsh-plugin-update': '1', 'content-type': 'application/json' },
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'HTTP ' + res.status)
          setStatus(data)
          setMsg({ ok: true, text: t('updater_success') || 'Plugin updated successfully! Please restart DSH service.' })
        } catch (err) {
          setMsg({ ok: false, text: err?.message || String(err) })
        } finally { setUpdating(false) }
      }
      React.useEffect(() => { checkUpdate() }, [checkUpdate])
      const currentVer = status?.currentVersion || '0.3.11'
      const latestVer = status?.latestVersion
      const updateAvailable = Boolean(status?.updateAvailable && latestVer && latestVer !== currentVer)
      return h('div', { className: 'gx-section-card', style: { gap: '10px' } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '🔄 ' + t('updater_title')),
            h('span', { className: 'gx-badge ' + (updateAvailable ? 'gx-badge-warn' : 'gx-badge-ok') },
              updateAvailable ? 'v' + latestVer + ' available' : 'v' + currentVer + ' (' + t('updater_up_to_date') + ')'
            )
          ),
          h('div', { style: { display: 'flex', gap: '8px' } },
            updateAvailable ? h('button', {
              type: 'button', className: 'gx-btn gx-btn-primary', style: { padding: '4px 10px', fontSize: '12px' },
              onClick: onUpdateNow, disabled: updating || loading,
            }, updating ? t('updater_updating') : (t('updater_update_now') || 'Update now').replace('{version}', latestVer)) : null,
            h('button', {
              type: 'button', className: 'gx-btn', style: { padding: '4px 10px', fontSize: '12px' },
              onClick: checkUpdate, disabled: loading || updating,
            }, loading ? t('updater_checking') : t('updater_check'))
          )
        ),
        msg ? h('div', { className: msg.ok ? 'gx-alert-ok' : 'gx-alert-bad' }, msg.text) : null
      )
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
      React.useEffect(() => { ensureCss() }, [])
      const scopeRef = React.useRef(null)
      const settingsScopeService = props.ctx ? (typeof props.ctx.get === 'function' ? props.ctx.get('configForms') : props.ctx.configForms) : null
      if (!scopeRef.current && settingsScopeService) {
        try { scopeRef.current = settingsScopeService.get(NS) } catch (_) { scopeRef.current = null }
      }
      const scope = scopeRef.current
      const applyPayload = (data) => {
        const cfg = (data && data.config) || {}
        setConfig(cfg); setAccount((data && data.account) || { configured: false }); setModels(cfg.models || [])
        setGrokClientId(cfg.grokClientId || ''); setModel(cfg.model || 'grok-4.6')
        setAutoFallback(cfg.autoFallbackModel ?? true); setEnableCache(cfg.enableCache ?? true)
        setEnabled(cfg.enabled ?? true); setTimeoutSeconds(Number(cfg.timeoutSeconds) || 180)
        setRetries(Number.isInteger(cfg.retries) ? cfg.retries : 2); setCacheTtlSeconds(Number(cfg.cacheTtlSeconds) || 300)
        setBaseUrl(cfg.baseUrl || 'https://api.x.ai/v1'); setRedirectUri(cfg.redirectUri || 'http://127.0.0.1:56121/callback')
        if (data && data.cache) setCacheStats(data.cache)
      }
      React.useEffect(() => {
        let alive = true
        fetch('/dsh-grok-xsearch/config', { cache: 'no-store' })
          .then((r) => r.json()).then((d) => { if (alive) applyPayload(d) })
          .catch((e) => { if (alive) setErr(String(e.message || e)) })
        return () => { alive = false }
      }, [])
      React.useEffect(() => {
        if (!scope) return undefined
        const syncSnapshot = () => {
          try {
            const snap = typeof scope.getSnapshot === 'function' ? scope.getSnapshot() : null
            const vals = snap?.values
            if (vals) {
              if (vals.enabled !== undefined) setEnabled(vals.enabled)
              if (vals.model !== undefined) setModel(vals.model)
              if (vals.autoFallbackModel !== undefined) setAutoFallback(vals.autoFallbackModel)
              if (vals.grokClientId !== undefined) setGrokClientId(vals.grokClientId)
              if (vals.enableCache !== undefined) setEnableCache(vals.enableCache)
              if (vals.timeoutSeconds !== undefined) setTimeoutSeconds(Number(vals.timeoutSeconds) || 180)
              if (vals.retries !== undefined) setRetries(Number.isInteger(vals.retries) ? vals.retries : 2)
              if (vals.cacheTtlSeconds !== undefined) setCacheTtlSeconds(Number(vals.cacheTtlSeconds) || 300)
              if (vals.baseUrl !== undefined) setBaseUrl(vals.baseUrl)
              if (vals.redirectUri !== undefined) setRedirectUri(vals.redirectUri)
            }
          } catch (err) { void err }
        }
        syncSnapshot()
        return typeof scope.subscribe === 'function' ? scope.subscribe(syncSnapshot) : undefined
      }, [scope])
      if (!config) return h('div', { className: 'gx-wrap' }, t('loading'))
      const connected = Boolean(account && account.configured)
      const title = displayName(account, t)
      const savePatch = async (patch) => {
        setErr(''); setSaving(true)
        try {
          const res = await fetch('/dsh-grok-xsearch/config', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
          applyPayload(data)
        } finally { setSaving(false) }
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
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: paste }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        applyPayload(data); setPaste(''); setShowPaste(false)
      }
      const logout = async () => {
        setErr('')
        const res = await fetch('/dsh-grok-xsearch/logout', { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        applyPayload(data)
      }
      const clearCache = async () => {
        setErr(''); setClearingCache(true)
        try {
          const res = await fetch('/dsh-grok-xsearch/cache/clear', { method: 'POST' })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
          if (data && data.cache) setCacheStats(data.cache)
        } finally { setClearingCache(false) }
      }
      const cachePct = Math.min(100, Math.round((cacheStats.size / (cacheStats.maxEntries || 200)) * 100))
      const numInput = (val, setVal, min, max, labelKey, hintKey, patchKey, def) => renderField(t(labelKey), t(hintKey), h('input', {
        className: 'gx-input', type: 'number', min, max, value: val, disabled: saving,
        onChange: (e) => setVal(Number(e.target.value) || 0),
        onBlur: () => {
          const n = Number(val) || def
          if (n !== (config[patchKey] ?? def)) savePatch({ [patchKey]: n }).catch((err) => setErr(String(err.message || err)))
        },
      }))
      const strInput = (val, setVal, labelKey, hintKey, patchKey, ph) => renderField(t(labelKey), t(hintKey), h('input', {
        className: 'gx-input', value: val, disabled: saving, placeholder: ph,
        onChange: (e) => setVal(e.target.value),
        onBlur: () => {
          if (val !== (config[patchKey] || '')) savePatch({ [patchKey]: val }).catch((err) => setErr(String(err.message || err)))
        },
      }))
      return h('div', { className: compact ? 'gx-wrap gx-wrap-compact' : 'gx-wrap' },
        compact ? null : h('div', { className: 'gx-header' },
          h('div', { className: 'gx-header-title' },
            h('span', null, '🔍'), h('span', null, t('title')),
            h('span', { className: 'gx-badge ' + (enabled ? 'gx-badge-ok' : 'gx-badge-neutral') }, enabled ? 'PLUGIN ACTIVE' : 'DISABLED'),
          ),
          h('div', { className: 'gx-header-sub' }, t('subtitle')),
        ),
        h('div', { className: 'gx-section-card' },
          h('div', { className: 'gx-section-title' },
            h('span', null, t('sec_auth_title')),
            h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
              h('span', { className: 'gx-badge ' + (connected ? 'gx-badge-ok' : 'gx-badge-warn') }, connected ? '● ' + t('connected') : '○ ' + t('not_connected')),
              saving ? h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, t('saving')) : null
            )
          ),
          h('div', { className: 'gx-section-desc' }, t('sec_auth_desc')),
          h('div', { className: 'gx-row', style: { justifyContent: 'space-between', padding: '10px 14px', background: 'var(--dsw-alias-bg-layer-2)', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l2)' } },
            h('div', { className: 'gx-grow' },
              h('div', { style: { fontSize: '13px', fontWeight: 600 } }, title),
              h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginTop: '2px' } }, connected ? t('ready_msg') : t('not_connected_msg')),
            ),
            h('div', { style: { display: 'flex', gap: '8px' } },
              h('button', {
                type: 'button', className: 'gx-btn ' + (connected ? '' : 'gx-btn-primary'),
                onClick: () => connect().catch((e) => setErr(String(e.message || e))),
              }, connected ? t('reconnect') : t('connect')),
              connected ? h('button', {
                type: 'button', className: 'gx-btn gx-btn-danger',
                onClick: () => logout().catch((e) => setErr(String(e.message || e))),
              }, t('disconnect')) : null,
            )
          ),
          strInput(grokClientId, setGrokClientId, 'grok_client_id', 'client_id_hint', 'grokClientId', 'xai-...'),
          !showPaste
            ? h('button', { type: 'button', className: 'gx-link', onClick: () => setShowPaste(true) }, t('browser_no_return'))
            : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: 'var(--dsw-alias-bg-layer-2)', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l2)' } },
              h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, t('paste_hint')),
              h('div', { className: 'gx-row' },
                h('input', { className: 'gx-input gx-grow', value: paste, placeholder: 'https://…?code=…&state=…', onChange: (e) => setPaste(e.target.value) }),
                h('button', { type: 'button', className: 'gx-btn gx-btn-primary', onClick: () => complete().catch((e) => setErr(String(e.message || e))) }, t('submit')),
                h('button', { type: 'button', className: 'gx-link', onClick: () => { setShowPaste(false); setPaste('') } }, t('cancel')),
              )
            )
        ),
        h('div', { className: 'gx-section-card' },
          h('div', { className: 'gx-section-title' },
            h('span', null, t('sec_model_title')),
            h('label', { className: 'gx-chk', style: { fontWeight: 500 } },
              h('input', {
                type: 'checkbox', checked: enabled, disabled: saving,
                onChange: (e) => { const next = e.target.checked; setEnabled(next); savePatch({ enabled: next }).catch((err) => setErr(String(err.message || err))) },
              }),
              t('enabled_plugin')
            )
          ),
          h('div', { className: 'gx-section-desc' }, t('sec_model_desc')),
          h('div', { className: 'gx-row' },
            h('label', { style: { fontSize: '13px', fontWeight: 500, minWidth: '60px', color: 'var(--dsw-alias-label-secondary)' } }, t('model')),
            h('select', {
              className: 'gx-select gx-grow', value: model, disabled: saving,
              onChange: (e) => { const next = e.target.value; setModel(next); savePatch({ model: next }).catch((err) => setErr(String(err.message || err))) },
            }, modelRows(models, model).map((row) => h('option', { key: row.id, value: row.id }, row.name + (row.hint ? ' — ' + row.hint : ''))))
          ),
          h('label', { className: 'gx-chk' },
            h('input', {
              type: 'checkbox', checked: autoFallback, disabled: saving,
              onChange: (e) => { const next = e.target.checked; setAutoFallback(next); savePatch({ autoFallbackModel: next }).catch((err) => setErr(String(err.message || err))) },
            }),
            t('auto_fallback')
          )
        ),
        h('div', { className: 'gx-section-card' },
          h('div', { className: 'gx-section-title' },
            h('span', null, t('sec_cache_title')),
            h('label', { className: 'gx-chk', style: { fontWeight: 500 } },
              h('input', {
                type: 'checkbox', checked: enableCache, disabled: saving,
                onChange: (e) => { const next = e.target.checked; setEnableCache(next); savePatch({ enableCache: next }).catch((err) => setErr(String(err.message || err))) },
              }),
              t('enable_cache')
            )
          ),
          h('div', { className: 'gx-section-desc' }, t('sec_cache_desc')),
          enableCache ? h('div', { className: 'gx-bar-container' },
            h('div', { className: 'gx-bar-head' }, h('span', null, t('cache_stats')), h('span', { style: { fontWeight: 600 } }, `${cacheStats.size} / ${cacheStats.maxEntries} (${cachePct}%)`)),
            h('div', { className: 'gx-bar-track' }, h('div', { className: 'gx-bar-fill', style: { width: `${cachePct}%` } })),
            h('div', { className: 'gx-bar-meta' },
              h('span', null, `TTL: ${cacheTtlSeconds}s | ${t('cache_hits')}: ${cacheStats.hits || 0} | ${t('cache_misses')}: ${cacheStats.misses || 0} | ${t('cache_hit_rate')}: ${cacheStats.hitRate || 0}%`),
              h('button', {
                type: 'button', className: 'gx-btn', style: { padding: '2px 8px', fontSize: '11px' },
                disabled: clearingCache || cacheStats.size === 0,
                onClick: () => clearCache().catch((err) => setErr(String(err.message || err))),
              }, clearingCache ? t('loading') : t('clear_cache'))
            )
          ) : null
        ),
        h(UpdaterBlock, { t }),
        h('div', { className: 'gx-section-card' },
          h('button', {
            type: 'button', className: 'gx-collapse-btn', 'aria-expanded': showAdvanced,
            onClick: () => setShowAdvanced((was) => !was),
          },
            h('span', { style: { fontWeight: 600, fontSize: '14px', color: 'var(--dsw-alias-label-primary)' } }, '⚙️ ' + t('advanced_settings')),
            h(Chevron, { className: 'gx-chev' + (showAdvanced ? ' gx-chev-open' : '') })
          ),
          showAdvanced ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' } },
            h('div', { className: 'gx-grid-2' },
              numInput(timeoutSeconds, setTimeoutSeconds, 1, 900, 'timeout_seconds', 'timeout_hint', 'timeoutSeconds', 180),
              numInput(retries, setRetries, 0, 10, 'retries', 'retries_hint', 'retries', 2),
              numInput(cacheTtlSeconds, setCacheTtlSeconds, 10, 86400, 'cache_ttl_seconds', 'cache_ttl_hint', 'cacheTtlSeconds', 300),
              strInput(baseUrl, setBaseUrl, 'base_url', 'base_url_hint', 'baseUrl', 'https://api.x.ai/v1'),
            ),
            strInput(redirectUri, setRedirectUri, 'redirect_uri', 'redirect_uri_hint', 'redirectUri', 'http://127.0.0.1:56121/callback'),
          ) : null
        ),
        err ? h('div', { className: 'gx-alert-bad' }, err) : null
      )
    }

    function PluginCard(props) {
      const page = !!(props && props.view === 'page')
      const [open, setOpen] = React.useState(!!page)
      const t = props && typeof props.t === 'function' ? props.t : defaultTranslator
      const account = props && props.account || { configured: false }
      const badge = badgeFor(account, t)
      React.useEffect(() => { ensureCss() }, [])
      // Row seat (plugins.row.config): the host page draws title/icon/crumb and the
      // padding, so the summary is a one-liner and the page drops our card chrome.
      if (props && props.view === 'summary') {
        return h('div', { className: 'gx-card-desc' }, t('subtitle'))
      }
      return h(page ? 'div' : 'div', { className: page ? 'gx-page' : 'gx-card' },
        h('div', {
          className: 'gx-card-head', style: page ? { display: 'none' } : undefined, onClick: () => setOpen((prev) => !prev), role: 'button', tabIndex: 0,
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((prev) => !prev) } },
        },
          h('div', { className: 'gx-card-left' },
            h('div', { className: 'gx-card-icon' }, '🔍'),
            h('div', { className: 'gx-card-meta' },
              h('div', { className: 'gx-card-title-row' },
                h('span', { className: 'gx-card-title' }, t('title')),
                h('span', { className: 'gx-badge ' + badge.cls }, badge.text),
              ),
              h('div', { className: 'gx-card-desc' }, t('subtitle')),
            )
          ),
          h('div', { className: 'gx-card-right' },
            h(Chevron, { className: 'gx-chev' + (open ? ' gx-chev-open' : '') })
          )
        ),
        (page || open) ? h('div', { className: 'gx-body' },
          h(ErrorBoundary, null, h(Section, { compact: true, t, ctx: props?.ctx }))
        ) : null
      )
    }

    function apply(ctx) {
      if (ctx.effect && ctx.locale && typeof ctx.locale.register === 'function') {
        ctx.effect(() => {
          try {
            const dispose = ctx.locale.register(NS, LOCALES)
            defaultTranslator = ctx.locale.bind(NS)
            return () => {
              try { if (typeof dispose === 'function') dispose() } catch (err) { console.warn('[dsh-grok-xsearch] Error disposing locale:', err) }
            }
          } catch (err) {
            console.warn('[dsh-grok-xsearch] Failed to register locale ' + NS + ':', err)
          }
        }, 'dsh-grok-xsearch: client locale')
      } else if (ctx.locale && typeof ctx.locale.register === 'function') {
        try {
          ctx.locale.register(NS, LOCALES)
          defaultTranslator = ctx.locale.bind(NS)
        } catch (err) {
          console.warn('[dsh-grok-xsearch] Failed to register locale ' + NS + ':', err)
        }
      }

      // #51: plugin.item only — no settings.section fallback
      if (!ctx.slots || typeof ctx.slots.inject !== 'function') {
        const warnMsg = '[dsh-grok-xsearch] slots service unavailable; settings.plugin.item card cannot be registered'
        if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(warnMsg)
        else console.warn(warnMsg)
        return
      }

      try {
        // Row seat first (the seat the current core renders after #51), legacy
        // settings.plugin.item kept after it for older cores.
        const injected = ctx.slots.inject('plugins.row.config', () => ctx.slots.register(
          {
            name: 'plugins.row.config',
            key: ROW_CONFIG_KEY,
            locale: NS,
            inject: () => ({ ctx }),
          },
          (props) => h(ErrorBoundary, null, h(PluginCard, { ...props, ctx: (props && props.ctx) || ctx }))
        ))
        if (!injected) {
          const warnMsg = '[dsh-grok-xsearch] slots.inject returned false for plugins.row.config; row seat not available'
          if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(warnMsg)
          else console.warn(warnMsg)
        }
        // #55: the seat the current core (0.1.6-alpha.2) actually renders on the
        // plugin's own page. 'summary' is its one-line state, 'page' the detail
        // form. The label is a static string on purpose — reading ctx.t here
        // throws and takes the whole client batch down.
        ctx.slots.inject('plugins.item', () => ctx.slots.register(
          {
            name: 'plugins.item',
            id: ROW_ID,
            order: 60,
            label: () => 'Grok X Search & Intelligence Suite',
            locale: NS,
            inject: () => ({ ctx }),
          },
          (props) => h(ErrorBoundary, null, h(PluginCard, { ...props, ctx: (props && props.ctx) || ctx }))
        ))
        ctx.slots.inject('settings.plugin.item', () => ctx.slots.register(
          {
            name: 'settings.plugin.item',
            key: NS,
            locale: NS,
            inject: () => ({ ctx }),
          },
          (props) => h(ErrorBoundary, null, h(PluginCard, { ...props, ctx: (props && props.ctx) || ctx }))
        ))
      } catch (err) {
        const warnMsg = '[dsh-grok-xsearch] Failed to register the settings seats: ' + (err?.message || err)
        if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(warnMsg)
        else console.warn(warnMsg)
      }
    }

    module.exports = { apply, inject: ['slots', 'locale', 'configForms'] }
    return module.exports
  },
})
