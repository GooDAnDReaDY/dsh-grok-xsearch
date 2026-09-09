import * as grok from './grok-oauth.js'
import { parseBlob, serializeBlob } from './blob.js'

const SKEW_MS = 60 * 1000

export function credentialRef(ref) {
  return typeof ref === 'string' ? { type: 'oauth', id: ref } : ref
}

export async function loadBlob(ctx) {
  const ref = typeof ctx?.credentials?.resolve === 'function' ? credentialRef(grok.OAUTH_REF) : grok.OAUTH_REF
  const raw = await ctx.credentials.resolve(ref).then((r) => r?.value || '').catch(() => '')
  if (!raw) return null
  try {
    return parseBlob(raw)
  } catch {
    return null
  }
}

export async function saveBlob(ctx, blob) {
  const ref = typeof ctx?.credentials?.set === 'function' ? credentialRef(grok.OAUTH_REF) : grok.OAUTH_REF
  await ctx.credentials.set(ref, serializeBlob(blob))
}

export async function clearBlob(ctx) {
  const ref = typeof ctx?.credentials?.unset === 'function' ? credentialRef(grok.OAUTH_REF) : grok.OAUTH_REF
  await ctx.credentials.unset(ref).catch(() => {})
}

let refreshInFlight = null

export function clearRefreshMutex() {
  refreshInFlight = null
}

function isFatalGrantError(err) {
  const msg = String(err?.message || '').toLowerCase()
  const status = Number(err?.status) || 0
  return status === 400 || status === 401 || msg.includes('invalid_grant') || msg.includes('revoked')
}

export async function getValidAccessToken(ctx, cfg, forceRefresh = false, fetchImpl = fetch) {
  const blob = await loadBlob(ctx)
  if (!blob?.accessToken) return ''
  if (!forceRefresh && blob.expiresAt && blob.expiresAt > Date.now() + SKEW_MS) {
    return blob.accessToken
  }
  if (!blob.refreshToken) return blob.accessToken

  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      const next = await grok.refresh(cfg, blob, fetchImpl)
      await saveBlob(ctx, next)
      return next.accessToken
    } catch (err) {
      if (isFatalGrantError(err)) {
        await clearBlob(ctx)
      }
      throw err
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}