import { buildAuthorizeUrl } from './oauth.js'
import { formTokenRequest, tokenBlobFromOAuth } from './wire.js'
import { emailFromToken } from './jwt.js'

const AUTH = 'https://auth.x.ai/oauth2/authorize'
const TOKEN = 'https://auth.x.ai/oauth2/token'
const SCOPE = 'openid profile email offline_access grok-cli:access api:access conversations:read conversations:write'
export const OAUTH_REF = 'GROK_XSEARCH_OAUTH_1'

export function vendorConfig(cfg = {}) {
  return {
    clientId: String(cfg.grokClientId || '').trim(),
    redirectUri: String(cfg.redirectUri || 'http://127.0.0.1:56121/callback').trim(),
    baseUrl: String(cfg.baseUrl || 'https://api.x.ai/v1').trim().replace(/\/$/, ''),
  }
}

export function authorizeUrl(cfg, pkce) {
  const d = vendorConfig(cfg)
  if (!d.clientId) throw new Error('grokClientId is required in plugin Settings')
  return buildAuthorizeUrl({ authUrl: AUTH, clientId: d.clientId, redirectUri: d.redirectUri, challenge: pkce.challenge, state: pkce.state, scope: SCOPE })
}

export async function exchangeCode(cfg, pkce, code, fetchImpl) {
  const d = vendorConfig(cfg)
  const json = await formTokenRequest(TOKEN, {
    grant_type: 'authorization_code', client_id: d.clientId, code, redirect_uri: d.redirectUri, code_verifier: pkce.verifier,
  }, fetchImpl)
  const blob = tokenBlobFromOAuth(json)
  return { ...blob, email: blob.email || emailFromToken(blob.accessToken), label: blob.label || 'Grok X Search' }
}

export async function refresh(cfg, blob, fetchImpl) {
  const d = vendorConfig(cfg)
  const json = await formTokenRequest(TOKEN, {
    grant_type: 'refresh_token', client_id: d.clientId, refresh_token: blob.refreshToken,
  }, fetchImpl)
  return tokenBlobFromOAuth(json, { label: blob.label, email: blob.email, refreshToken: blob.refreshToken })
}
