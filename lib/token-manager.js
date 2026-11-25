import * as grok from './grok-oauth.js'
import { parseBlob, serializeBlob } from './blob.js'

const SKEW_MS = 60 * 1000
const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export function credentialRef(ref) {
  const value = typeof ref === 'string' ? ref.trim() : typeof ref?.id === 'string' ? ref.id.trim() : ''
  if (!CREDENTIAL_REF_PATTERN.test(value)) {
    throw new TypeError(`credential ref "${String(ref)}" must match ${String(CREDENTIAL_REF_PATTERN)}`)
  }
  return value
}

function credentialsService(ctx) {
  return (typeof ctx?.get === 'function' ? ctx.get('credentials') : ctx?.credentials) || null
}

export async function loadBlob(ctx) {
  const creds = credentialsService(ctx)
  if (!creds || typeof creds.resolve !== 'function') return null
  const ref = credentialRef(grok.OAUTH_REF)
  let resolved
  try {
    resolved = await creds.resolve(ref)
  } catch (err) {
    if (typeof ctx?.logger?.warn === 'function') {
      ctx.logger.warn(`[dsh-grok-xsearch] loadBlob resolve failed: ${err?.message || err}`)
    }
    return null
  }
  const raw = typeof resolved === 'string' ? resolved : resolved?.value || ''
  if (!raw) return null
  try {
    return parseBlob(raw)
  } catch (err) {
    if (typeof ctx?.logger?.warn === 'function') {
      ctx.logger.warn(`[dsh-grok-xsearch] loadBlob parse failed: ${err?.message || err}`)
    }
    return null
  }
}

export async function saveBlob(ctx, blob) {
  const creds = credentialsService(ctx)
  if (!creds || typeof creds.set !== 'function') return
  const ref = credentialRef(grok.OAUTH_REF)
  await creds.set(ref, serializeBlob(blob))
}

export async function clearBlob(ctx) {
  const creds = credentialsService(ctx)
  if (!creds || typeof creds.unset !== 'function') return
  const ref = credentialRef(grok.OAUTH_REF)
  try {
    await creds.unset(ref)
  } catch (err) {
    if (typeof ctx?.logger?.warn === 'function') {
      ctx.logger.warn(`[dsh-grok-xsearch] clearBlob unset failed: ${err?.message || err}`)
    }
  }
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
