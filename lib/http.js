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

export function isLoopbackAddress(addr) {
  if (!addr) return false
  const s = String(addr).toLowerCase().replace(/^\[|\]$/g, '')
  return s === '127.0.0.1' || s === '::1' || s === '::ffff:127.0.0.1' || s.startsWith('127.') || s === 'localhost'
}

export function isLanIPv4(ip) {
  if (!ip || typeof ip !== 'string') return false
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true
  if (ip.startsWith('169.254.')) return true
  return false
}

export function isTrustedAddress(addr) {
  if (!addr || typeof addr !== 'string') return false
  const clean = addr.toLowerCase().replace(/^\[|\]$/g, '').trim()
  if (isLoopbackAddress(clean)) return true
  const ipv4 = clean.startsWith('::ffff:') ? clean.slice(7) : clean
  if (isLanIPv4(ipv4)) return true
  if (clean.startsWith('fe80:') || clean.startsWith('fc') || clean.startsWith('fd')) return true
  return false
}

export function isTrustedHostOrHostname(hostStr) {
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

export function isAllowedBaseUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false
  try {
    const parsed = new URL(urlStr)
    const protocol = parsed.protocol.toLowerCase()
    const hostname = parsed.hostname.toLowerCase()

    // 1. Official xAI API endpoint (https)
    if (protocol === 'https:' && (hostname === 'api.x.ai' || hostname.endsWith('.api.x.ai'))) {
      return true
    }

    // 2. Local loopback / mock server for tests or local reverse proxies
    if ((protocol === 'http:' || protocol === 'https:') && isLoopbackAddress(hostname)) {
      return true
    }

    return false
  } catch {
    return false
  }
}

export function getConnection(ctx) {
  try {
    const fromCtx = ctx?.reflect?.get
      ? (ctx.reflect.get('connection') || ctx?.connection)
      : (ctx?.get ? (ctx.get('connection') || ctx?.connection) : Reflect.get(ctx || {}, 'connection'))
    if (fromCtx) return fromCtx
    if (ctx?.root) {
      return getConnection(ctx.root)
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Returns null if admitted, or { status, code, message } rejection descriptor (Issues #42, #83, #88, #90).
 */
export function getSettingsAuthRejection(request, ctx = null) {
  if (!request || !request.headers) {
    return { status: 403, code: 'forbidden', message: 'missing request or headers' }
  }

  // 1. DSH core connection authentication gate (#90)
  const conn = getConnection(ctx) || request?.connectionService || request?.connection
  if (conn && typeof conn.requestRejection === 'function') {
    let rejection
    try {
      rejection = conn.requestRejection(request)
    } catch {
      return { status: 403, code: 'forbidden', message: 'connection rejection error' }
    }
    if (rejection !== undefined && rejection !== null && rejection !== false) {
      const status = typeof rejection === 'number'
        ? rejection
        : (typeof rejection?.status === 'number' ? rejection.status : 401)
      const message = typeof rejection?.message === 'string'
        ? rejection.message
        : (status === 401 ? 'unauthorized session' : 'forbidden')
      return { status, code: status === 401 ? 'unauthorized' : 'forbidden', message }
    }
  }

  const headers = request.headers
  const fetchSite = headers['sec-fetch-site']
  if (fetchSite === 'cross-site') {
    return { status: 403, code: 'forbidden', message: 'cross-site rejected' }
  }

  const host = headers['host']
  const origin = headers['origin']
  const referer = headers['referer']
  const remoteAddr = request.socket?.remoteAddress || request.connection?.remoteAddress

  // Unknown remote address is fail-closed (Issue #90)
  if (!remoteAddr || typeof remoteAddr !== 'string') {
    return { status: 403, code: 'forbidden', message: 'unknown remote address' }
  }

  const isLoopback = isLoopbackAddress(remoteAddr)

  // Non-loopback callers (including LAN) MUST be authenticated via connection service (Issue #90)
  if (!isLoopback) {
    if (!conn || typeof conn.requestRejection !== 'function') {
      return { status: 401, code: 'unauthorized', message: 'unauthenticated remote request' }
    }
  }

  // If host is provided, enforce loopback / LAN allowlist unless request originates from loopback
  if (host && !isTrustedHostOrHostname(host) && !isLoopback) {
    return { status: 403, code: 'forbidden', message: 'untrusted host header' }
  }

  if (origin !== undefined) {
    if (!origin || origin === 'null') {
      return { status: 403, code: 'forbidden', message: 'invalid origin' }
    }
    try {
      const parsed = new URL(origin)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (!parsed.host || !host || parsed.host.toLowerCase() !== host.toLowerCase()) {
          return { status: 403, code: 'forbidden', message: 'origin host mismatch' }
        }
        if (!isTrustedHostOrHostname(parsed.host) && !isLoopback) {
          return { status: 403, code: 'forbidden', message: 'untrusted origin host' }
        }
      }
    } catch {
      return { status: 403, code: 'forbidden', message: 'malformed origin' }
    }
  }

  let refererMatchedHost = false
  if (referer !== undefined && origin === undefined && host) {
    try {
      const parsed = new URL(referer)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (!parsed.host || !host || parsed.host.toLowerCase() !== host.toLowerCase()) {
          return { status: 403, code: 'forbidden', message: 'referer host mismatch' }
        }
        if (!isTrustedHostOrHostname(parsed.host) && !isLoopback) {
          return { status: 403, code: 'forbidden', message: 'untrusted referer host' }
        }
        refererMatchedHost = true
      } else if (!isLoopback) {
        return { status: 403, code: 'forbidden', message: 'custom scheme only allowed on loopback' }
      }
    } catch {
      return { status: 403, code: 'forbidden', message: 'malformed referer' }
    }
  }

  if (isLoopback) return null

  // Remote authenticated requests
  if (origin && host && isTrustedHostOrHostname(host)) return null
  if (refererMatchedHost && isTrustedHostOrHostname(host)) return null
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') return null

  return { status: 403, code: 'forbidden', message: 'untrusted remote origin' }
}

export function isTrustedSettingsRequest(request, ctx = null) {
  const conn = getConnection(ctx) || request?.connectionService || request?.connection
  if (ctx || (conn && typeof conn.requestRejection === 'function')) {
    return getSettingsAuthRejection(request, ctx) === null
  }

  // Pure headers/address check when no connection context is provided (Issue #42, #83, #88)
  if (!request || !request.headers) return false
  const headers = request.headers
  const fetchSite = headers['sec-fetch-site']
  if (fetchSite === 'cross-site') return false

  const host = headers['host']
  const origin = headers['origin']
  const referer = headers['referer']
  const remoteAddr = request.socket?.remoteAddress || request.connection?.remoteAddress

  if (!host && !origin && !referer && !fetchSite && !isTrustedAddress(remoteAddr)) {
    return false
  }

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