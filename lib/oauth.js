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
    const sanitized = !raw.includes('?') && raw.includes('#') ? raw.replace('#', '?') : raw
    const url = new URL(sanitized)
    const code = url.searchParams.get('code') || ''
    const state = url.searchParams.get('state') || ''
    return { code, state }
  } catch {
    const match = /(?:^|[?&#])code=([^&#\s]+)/.exec(raw)
    return { code: match ? decodeURIComponent(match[1]) : raw, state: '' }
  }
}
