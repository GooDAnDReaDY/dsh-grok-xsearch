window.__ModuleLoader__.load({
  id: '@goodandready/dsh-grok-xsearch',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const CSS =
      '.gx-wrap{display:flex;flex-direction:column;gap:22px;padding:4px 0;max-width:760px}' +
      '.gx-block{display:flex;flex-direction:column;gap:10px}' +
      '.gx-h{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}' +
      '.gx-sub{font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.45}' +
      '.gx-card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}' +
      '.gx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
      '.gx-grow{flex:1;min-width:180px}' +
      '.gx-mini{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:6px;height:30px;padding:0 12px;cursor:pointer;font-size:13px}' +
      '.gx-mini:disabled{opacity:.45;cursor:not-allowed}' +
      '.gx-link{background:none;border:none;color:var(--dsw-alias-brand-primary);cursor:pointer;font-size:12px;padding:0;text-align:left}' +
      '.gx-badge{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);white-space:nowrap}' +
      '.gx-badge-on{color:var(--dsw-alias-state-success-primary);border-color:currentColor}' +
      '.gx-bad{font-size:12px;color:var(--dsw-alias-state-error-primary)}' +
      '.gx-paste input{width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px}' +
      '.gx-select{padding:8px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px;min-width:220px}'

    const cssId = 'dsh-grok-xsearch/settings.module.css'
    if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin-css="' + cssId + '"]')) {
      const tag = document.createElement('style')
      tag.textContent = CSS
      tag.setAttribute('data-plugin', 'dsh-grok-xsearch')
      tag.dataset.pluginCss = cssId
      document.head.appendChild(tag)
    }

    function displayName(account) {
      const label = String(account && account.label || '').trim()
      if (label && label !== 'Grok X Search') return label
      const email = String(account && account.email || '').trim()
      if (email && !/^[0-9a-f-]{20,}$/i.test(email)) return email
      return 'SuperGrok account'
    }

    function badgeFor(account) {
      return account && account.configured ? 'Connected' : 'Not connected'
    }

    function modelRows(models, current) {
      const rows = Array.isArray(models) && models.length ? models.slice() : []
      if (!rows.some((row) => row.id === current)) {
        rows.unshift({ id: current, name: current, hint: 'Current' })
      }
      return rows
    }

    function Section() {
      const [config, setConfig] = React.useState(null)
      const [account, setAccount] = React.useState({ configured: false })
      const [paste, setPaste] = React.useState('')
      const [err, setErr] = React.useState('')
      const [showPaste, setShowPaste] = React.useState(false)
      const [models, setModels] = React.useState([])
      const [model, setModel] = React.useState('grok-4.6')
      const [savingModel, setSavingModel] = React.useState(false)

      const applyPayload = (data) => {
        const cfg = (data && data.config) || {}
        setConfig(cfg)
        setAccount((data && data.account) || { configured: false })
        setModels(cfg.models || [])
        setModel(cfg.model || 'grok-4.6')
      }

      React.useEffect(() => {
        let alive = true
        fetch('/dsh-grok-xsearch/config', { cache: 'no-store' })
          .then((res) => res.json())
          .then((data) => { if (alive) applyPayload(data) })
          .catch((e) => { if (alive) setErr(String(e && e.message ? e.message : e)) })
        return () => { alive = false }
      }, [])

      if (!config) return React.createElement('div', { className: 'gx-wrap' }, 'Loading\u2026')

      const connected = !!(account && account.configured)
      const title = displayName(account)

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

      const saveModel = async (nextModel) => {
        setErr('')
        setSavingModel(true)
        try {
          const res = await fetch('/dsh-grok-xsearch/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: nextModel }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
          applyPayload(data)
        } finally {
          setSavingModel(false)
        }
      }

      return React.createElement('div', { className: 'gx-wrap' },
        React.createElement('div', { className: 'gx-block' },
          React.createElement('div', { className: 'gx-h' }, 'Grok X Search'),
          React.createElement('div', { className: 'gx-sub' },
            'Search X (Twitter) with your SuperGrok subscription. This login is separate from chat Grok in Subscriptions.'),
        ),
        React.createElement('div', { className: 'gx-card' },
          React.createElement('div', { className: 'gx-row' },
            React.createElement('div', { className: 'gx-grow' },
              React.createElement('div', { className: 'gx-h', style: { fontSize: '13px' } }, title),
              React.createElement('div', { className: 'gx-sub' }, connected ? 'Ready for the x_search tool in chat.' : 'Connect your SuperGrok account to enable x_search.'),
            ),
            React.createElement('span', { className: 'gx-badge' + (connected ? ' gx-badge-on' : '') }, badgeFor(account)),
            React.createElement('button', {
              type: 'button', className: 'gx-mini',
              onClick: () => connect().catch((e) => setErr(String(e.message || e))),
            }, connected ? 'Reconnect' : 'Connect'),
            React.createElement('button', {
              type: 'button', className: 'gx-mini', disabled: !connected,
              onClick: () => logout().catch((e) => setErr(String(e.message || e))),
            }, 'Disconnect'),
          ),
          React.createElement('div', { className: 'gx-row' },
            React.createElement('label', { className: 'gx-sub', style: { minWidth: '48px' } }, 'Model'),
            React.createElement('select', {
              className: 'gx-select gx-grow',
              value: model,
              disabled: savingModel,
              onChange: (e) => {
                const next = e.target.value
                setModel(next)
                saveModel(next).catch((error) => setErr(String(error.message || error)))
              },
            }, modelRows(models, model).map((row) =>
              React.createElement('option', { key: row.id, value: row.id }, row.name + (row.hint ? ' \u2014 ' + row.hint : '')),
            )),
            savingModel ? React.createElement('span', { className: 'gx-sub' }, 'Saving\u2026') : null,
          ),
          !showPaste
            ? React.createElement('button', {
              type: 'button', className: 'gx-link',
              onClick: () => setShowPaste(true),
            }, 'Browser did not return here? Paste the redirected URL')
            : React.createElement('div', { className: 'gx-paste' },
              React.createElement('div', { className: 'gx-sub', style: { marginBottom: '6px' } }, 'Paste the full URL from the browser address bar after sign-in.'),
              React.createElement('div', { className: 'gx-row' },
                React.createElement('input', {
                  className: 'gx-grow',
                  value: paste,
                  placeholder: 'https://\u2026?code=\u2026&state=\u2026',
                  onChange: (e) => setPaste(e.target.value),
                }),
                React.createElement('button', {
                  type: 'button', className: 'gx-mini',
                  onClick: () => complete().catch((e) => setErr(String(e.message || e))),
                }, 'Submit'),
                React.createElement('button', {
                  type: 'button', className: 'gx-link',
                  onClick: () => { setShowPaste(false); setPaste('') },
                }, 'Cancel'),
              ),
            ),
        ),
        err ? React.createElement('div', { className: 'gx-bad' }, err) : null,
      )
    }

    function apply(ctx) {
      ctx.slots.inject('settings.section', () => ctx.slots.register(
        {
          name: 'settings.section',
          id: '@goodandready/dsh-grok-xsearch',
          order: 29,
          label: () => 'Grok X Search',
        },
        Section,
      ))
    }

    module.exports = { apply, inject: ['slots'] }
    return module.exports
  },
})
