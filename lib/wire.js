export async function formTokenRequest(url, fields, fetchImpl = fetch, timeoutMs = 15000) {
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    signal,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { error: text } }
  if (!res.ok) {
    const err = new Error(json.error_description || json.error || text || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return json
}

export function tokenBlobFromOAuth(json, extra = {}) {
  return {
    accessToken: String(json.access_token || ''),
    refreshToken: String(json.refresh_token || extra.refreshToken || ''),
    expiresAt: Date.now() + Number(json.expires_in || 3600) * 1000,
    label: String(extra.label || ''),
    email: String(extra.email || ''),
  }
}