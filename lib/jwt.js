export function emailFromToken(accessToken) {
  try {
    const part = String(accessToken || '').split('.')[1]
    if (!part) return ''
    const json = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
    return String(json.email || json.sub || '')
  } catch { return '' }
}
