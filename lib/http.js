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
  const s = String(addr).toLowerCase().replace(/^\[|\]$/g, '')
  return s === '127.0.0.1' || s === '::1' || s === '::ffff:127.0.0.1' || s.startsWith('127.') || s === 'localhost'
}

function isLanIPv4(ip) {
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true
  if (ip.startsWith('169.254.')) return true
  return false
}

function isTrustedAddress(addr) {
  if (!addr || typeof addr !== 'string') return false
  const clean = addr.toLowerCase().replace(/^\[|\]$/g, '').trim()
  if (isLoopbackAddress(clean)) return true
  const ipv4 = clean.startsWith('::ffff:') ? clean.slice(7) : clean
  if (isLanIPv4(ipv4)) return true
  if (clean.startsWith('fe80:') || clean.startsWith('fc') || clean.startsWith('fd')) return true
  return false
}

function isTrustedHostOrHostname(hostStr) {
  if (!hostStr || typeof hostStr !== 'string') return false
  const clean = hostStr.trim()
  const hostname = clean.startsWith('[')
    ? (clean.match(/^\[([^\]]+)\]/)?.[1] || clean)
    : clean.split(':')[0]
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true
  if (isTrustedAddress(h)) return true
  return false
}

/**
 * Fail-closed origin check for settings and state-mutating routes (Issues #42, #83, #88).
 *
 * Rules:
 * 1. Explicit cross-site (sec-fetch-site: cross-site) is unconditionally rejected.
 * 2. An empty request (no headers, no trusted remote address) is rejected (Issue #88).
 * 3. If Host is present, it must be loopback, LAN, or local unless request originates from loopback.
 * 4. If Origin header is present, its host must match Host and belong to trusted address/LAN.
 * 5. If Referer is present (and Origin absent), its host must match Host and belong to trusted address/LAN
 *    (for web schemes http/https; internal app schemes like dsh-app:// are permitted on loopback).
 * 6. Local loopback callers (127.0.0.1, ::1) are allowed if Origin/Referer (if present) match.
 * 7. Non-loopback remote callers MUST provide proof of same-origin (matching Origin/Host on trusted host
 *    or sec-fetch-site === 'same-origin' / 'same-site' from trusted address).
 */
export function isTrustedSettingsRequest(request) {
  if (!request || !request.headers) return false

  const headers = request.headers
  const fetchSite = headers['sec-fetch-site']
  if (fetchSite === 'cross-site') return false

  const host = headers['host']
  const origin = headers['origin']
  const referer = headers['referer']
  const remoteAddr = request.socket?.remoteAddress || request.connection?.remoteAddress

  // Empty request with no headers and no trusted remote address MUST NOT be trusted (Issue #88)
  if (!host && !origin && !referer && !fetchSite && !isTrustedAddress(remoteAddr)) {
    return false
  }

  // If host is provided, enforce loopback / LAN allowlist unless request originates from loopback (Issue #88)
  if (host && !isTrustedHostOrHostname(host) && !isLoopbackAddress(remoteAddr)) {
    return false
  }

  if (origin !== undefined) {
    if (!origin || origin === 'null') return false
    try {
      const parsed = new URL(origin)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (!parsed.host || !host || parsed.host.toLowerCase() !== host.toLowerCase()) return false
        if (!isTrustedHostOrHostname(parsed.host) && !isLoopbackAddress(remoteAddr)) return false
      }
    } catch {
      return false
    }
  }

  let refererMatchedHost = false
  if (referer !== undefined && origin === undefined && host) {
    try {
      const parsed = new URL(referer)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (!parsed.host || !host || parsed.host.toLowerCase() !== host.toLowerCase()) return false
        if (!isTrustedHostOrHostname(parsed.host) && !isLoopbackAddress(remoteAddr)) return false
        refererMatchedHost = true
      }
    } catch {
      return false
    }
  }

  if (remoteAddr && typeof remoteAddr === 'string') {
    if (isLoopbackAddress(remoteAddr)) return true
    if (origin && host && isTrustedHostOrHostname(host)) return true
    if (refererMatchedHost && isTrustedHostOrHostname(host)) return true
    if (isTrustedAddress(remoteAddr) && (fetchSite === 'same-origin' || fetchSite === 'same-site')) return true
    return false
  }

  if (origin && host && isTrustedHostOrHostname(host)) return true
  if (refererMatchedHost && isTrustedHostOrHostname(host)) return true
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true

  return false
}

export function queryOf(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').searchParams
  } catch {
    return new URLSearchParams()
  }
}
