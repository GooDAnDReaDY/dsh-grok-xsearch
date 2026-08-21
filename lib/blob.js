function asString(value) {
  return value == null ? '' : String(value)
}

export function serializeBlob(obj) {
  const accessToken = asString(obj && obj.accessToken)
  const refreshToken = asString(obj && obj.refreshToken)
  if (!accessToken && !refreshToken) {
    throw new Error('oauth blob needs accessToken or refreshToken')
  }
  return JSON.stringify({
    accessToken,
    refreshToken,
    expiresAt: Number(obj && obj.expiresAt) || 0,
    label: asString(obj && obj.label),
    email: asString(obj && obj.email),
    accountId: asString(obj && obj.accountId),
    projectId: asString(obj && obj.projectId),
  })
}

export function parseBlob(text) {
  const obj = typeof text === 'string' ? JSON.parse(text) : text
  if (!obj || typeof obj !== 'object') throw new Error('invalid oauth blob')
  return {
    accessToken: asString(obj.accessToken),
    refreshToken: asString(obj.refreshToken),
    expiresAt: Number(obj.expiresAt) || 0,
    label: asString(obj.label),
    email: asString(obj.email),
    accountId: asString(obj.accountId),
    projectId: asString(obj.projectId),
  }
}

export function publicAccountView(blob, extra) {
  const label = (blob && (blob.label || blob.email)) || ''
  return {
    label,
    email: (blob && blob.email) || '',
    ...(extra || {}),
  }
}
