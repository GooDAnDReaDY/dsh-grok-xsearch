window.__ModuleLoader__.load({
  id: '@goodandready/dsh-grok-xsearch',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const CSS = '.gx-wrap{display:flex;flex-direction:column;gap:16px;max-width:720px;padding:4px 0}' +
      '.gx-h{font-size:14px;font-weight:600}.gx-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}' +
      '.gx-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.gx-field{display:flex;flex-direction:column;gap:4px;font-size:12px}' +
      '.gx-field input,.gx-field select{padding:6px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}' +
      '.gx-btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;border-radius:6px;padding:6px 10px;cursor:pointer;color:var(--dsw-alias-label-primary)}' +
      '.gx-save{background:var(--dsw-alias-brand-primary);color:#fff;border:none}.gx-ok{color:var(--dsw-alias-state-success-primary);font-size:12px}.gx-bad{color:var(--dsw-alias-state-error-primary);font-size:12px}'

    if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin="dsh-grok-xsearch"]')) {
      const tag = document.createElement('style')
      tag.textContent = CSS
      tag.setAttribute('data-plugin', 'dsh-grok-xsearch')
      document.head.appendChild(tag)
    }

    function Section() {
      const [draft, setDraft] = React.useState(null)
      const [account, setAccount] = React.useState({ configured: false })
      const [paste, setPaste] = React.useState('')
      const [err, setErr] = React.useState('')
      const [saved, setSaved] = React.useState(false)

      const apply = (data) => {
        setDraft(JSON.parse(JSON.stringify((data && data.config) || {})))
        setAccount((data && data.account) || { configured: false })
      }

      React.useEffect(() => {
        fetch('/dsh-grok-xsearch/config', { cache: 'no-store' }).then((r) => r.json()).then(apply).catch((e) => setErr(String(e.message || e)))
      }, [])

      if (!draft) return React.createElement('div', { className: 'gx-wrap' }, 'Loading…')

      const save = async () => {
        setErr('')
        const res = await fetch('/dsh-grok-xsearch/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        apply(data); setSaved(true); setTimeout(() => setSaved(false), 2000)
      }

      const connect = async () => {
        const res = await fetch('/dsh-grok-xsearch/oauth/start', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        if (data.url) window.open(data.url, '_blank', 'noopener')
      }

      const complete = async () => {
        const res = await fetch('/dsh-grok-xsearch/oauth/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: paste }) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        setAccount(data.account || account); setPaste('')
      }

      const logout = async () => {
        const res = await fetch('/dsh-grok-xsearch/logout', { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status))
        setAccount(data.account || { configured: false })
      }

      const setField = (key, value) => setDraft((d) => Object.assign({}, d, { [key]: value }))

      return React.createElement('div', { className: 'gx-wrap' },
        React.createElement('div', { className: 'gx-h' }, 'Grok X Search'),
        React.createElement('div', { className: 'gx-sub' }, 'Separate SuperGrok OAuth account for the x_search tool. Independent from dsh-subscriptions chat Grok.'),
        React.createElement('label', { className: 'gx-field' }, 'Grok OAuth client id',
          React.createElement('input', { value: draft.grokClientId || '', onChange: (e) => setField('grokClientId', e.target.value), placeholder: '<GROK_CLIENT_ID>' })),
        React.createElement('label', { className: 'gx-field' }, 'Redirect URI',
          React.createElement('input', { value: draft.redirectUri || '', onChange: (e) => setField('redirectUri', e.target.value), placeholder: 'http://127.0.0.1:56121/callback' })),
        React.createElement('label', { className: 'gx-field' }, 'x_search model',
          React.createElement('input', { value: draft.model || '', onChange: (e) => setField('model', e.target.value), placeholder: 'grok-4.20-reasoning' })),
        React.createElement('div', { className: 'gx-row' },
          React.createElement('button', { className: 'gx-btn', type: 'button', onClick: () => connect().catch((e) => setErr(String(e.message || e))) }, account.configured ? 'Reconnect' : 'Connect'),
          account.configured && React.createElement('button', { className: 'gx-btn', type: 'button', onClick: () => logout().catch((e) => setErr(String(e.message || e))) }, 'Disconnect'),
          React.createElement('button', { className: 'gx-btn gx-save', type: 'button', onClick: () => save().catch((e) => setErr(String(e.message || e))) }, 'Save settings')),
        account.configured && React.createElement('div', { className: 'gx-sub' }, 'Connected', account.email ? ` (${account.email})` : ''),
        React.createElement('label', { className: 'gx-field' }, 'Paste redirected URL (if browser cannot return here)',
          React.createElement('input', { value: paste, onChange: (e) => setPaste(e.target.value), placeholder: 'https://…?code=…&state=…' })),
        React.createElement('button', { className: 'gx-btn', type: 'button', onClick: () => complete().catch((e) => setErr(String(e.message || e))) }, 'Submit code'),
        saved && React.createElement('div', { className: 'gx-ok' }, 'Saved'),
        err && React.createElement('div', { className: 'gx-bad' }, err),
      )
    }

    function apply(ctx) {
      ctx.slots.inject('settings.section', () => ctx.slots.register(
        { name: 'settings.section', id: 'dsh-grok-xsearch', order: 29, label: () => 'Grok X Search' },
        Section,
      ))
    }

    module.exports = { apply, inject: ['slots'] }
    return module.exports
  },
})
