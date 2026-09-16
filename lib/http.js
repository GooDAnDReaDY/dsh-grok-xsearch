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
export function isTrustedSettingsRequest(request) {
  if (!request || !request.headers) return false
  const fetchSite = request.headers['sec-fetch-site']
  if (fetchSite === 'cross-site') return false

  const remoteAddr = request.socket?.remoteAddress || request.connection?.remoteAddress
  if (isLoopbackAddress(remoteAddr)) return true

  const host = request.headers['host']
  const origin = request.headers['origin']
  if (origin && host) {
    try {
      const originHost = new URL(origin).host
      if (originHost === host) return true
    } catch { /* invalid URL */ }
  }

  const referer = request.headers['referer']
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host
      if (refererHost === host) return true
    } catch { /* invalid URL */ }
  }

  if (fetchSite === 'same-origin' || fetchSite === 'same-site') {
    return true
  }

  return false
}

export function queryOf(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').searchParams
  } catch {
    return new URLSearchParams()
  }
}
