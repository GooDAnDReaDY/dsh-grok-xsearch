export function writeJson(res, code, body) {
  try {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(body))
  } catch { /* socket closed */ }
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function writeHtml(res, code, html) {
  try {
    res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(html)
  } catch { /* socket closed */ }
}

export function readBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    const limit = Number(maxBytes) || (64 * 1024)
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function isLoopbackAddress(addr) {
  if (!addr) return false
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1' || addr.startsWith('127.')
}

/**
 * Fail-closed origin check for state-mutating requests (Issue #42).
 * Allows:
 * - Requests from local loopback address (unless explicit cross-site).
 * - Requests with matching Host vs Origin / Referer.
 * - Browser requests where sec-fetch-site is same-origin or same-site.
 * Rejects:
 * - Explicit cross-site (sec-fetch-site: cross-site).
 * - External requests missing sec-fetch-site without loopback or matching origin.
 */
/**
 * Fail-closed origin check for settings and state-mutating routes (Issue #42).
 *
 * Rules:
 * 1. Explicit cross-site (sec-fetch-site: cross-site) is unconditionally rejected.
 * 2. If Origin header is present, it must be valid and its host must match Host.
 * 3. If Referer is present (and Origin absent), its host must match Host.
 * 4. Local loopback callers (127.0.0.1, ::1) are allowed if Origin/Referer (if present) match.
 * 5. Non-loopback remote callers MUST provide proof of same-origin (matching Origin/Host
 *    or sec-fetch-site === 'same-origin' / 'same-site').
 */
export function isTrustedSettingsRequest(request) {
  if (!request || !request.headers) return false

  const headers = request.headers
  const fetchSite = headers['sec-fetch-site']
  if (fetchSite === 'cross-site') return false

  const host = headers['host']
  const origin = headers['origin']
  if (origin !== undefined) {
    if (!origin || origin === 'null') return false
    try {
      const parsed = new URL(origin)
      if (!parsed.host || !host || parsed.host !== host) return false
    } catch {
      return false
    }
  }

  const referer = headers['referer']
  if (referer !== undefined && origin === undefined && host) {
    try {
      const parsed = new URL(referer)
      if (!parsed.host || parsed.host !== host) return false
    } catch {
      return false
    }
  }

  const remoteAddr = request.socket?.remoteAddress || request.connection?.remoteAddress
  if (remoteAddr && typeof remoteAddr === 'string') {
    if (isLoopbackAddress(remoteAddr)) return true
    if (origin && host) return true
    if (referer && host) return true
    if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true
    return false
  }

  if (origin && host) return true
  if (referer && host) return true
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true
  if (!origin && !fetchSite && !host) return true

  return false
}

export function queryOf(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').searchParams
  } catch {
    return new URLSearchParams()
  }
}
