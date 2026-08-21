export function buildAuthorizeUrl({
  authUrl,
  clientId,
  redirectUri,
  challenge,
  state,
  extra,
  scope,
}) {
  const url = new URL(authUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  if (scope) url.searchParams.set('scope', scope)
  if (extra && typeof extra === 'object') {
    for (const [key, value] of Object.entries(extra)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export function parseCallbackInput(text) {
  const raw = String(text || '').trim()
  if (!raw) return { code: '', state: '' }
  if (!raw.includes('://') && !raw.includes('?')) {
    const parts = raw.split('#')
    return { code: parts[0], state: parts[1] || '' }
  }
  try {
    const hashed = raw.replace('#', '?')
    const url = new URL(hashed)
    const code = url.searchParams.get('code') || ''
    const state = url.searchParams.get('state') || ''
    return { code, state }
  } catch {
    const match = /(?:^|[?&#])code=([^&#\s]+)/.exec(raw)
    return { code: match ? decodeURIComponent(match[1]) : raw, state: '' }
  }
}

export function requestOrigin(req) {
  const xfProto = header(req, 'x-forwarded-proto')
  const xfHost = header(req, 'x-forwarded-host')
  const host = xfHost || header(req, 'host') || 'localhost'
  let proto = xfProto || 'http'
  if (header(req, 'origin')) {
    try { return new URL(header(req, 'origin')).origin } catch { /* fall through */ }
  }
  if (header(req, 'referer')) {
    try { return new URL(header(req, 'referer')).origin } catch { /* fall through */ }
  }
  return `${proto}://${host}`
}

function header(req, name) {
  const value = req && req.headers && req.headers[name]
  if (Array.isArray(value)) return value[0] || ''
  return value ? String(value) : ''
}

export function webCallbackUri(origin) {
  return `${String(origin || '').replace(/\/$/, '')}/dsh-subscriptions/oauth/callback`
}
