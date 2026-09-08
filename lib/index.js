import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { createPkce } from './pkce.js'
import { parseCallbackInput } from './oauth.js'
import { deletePending, normalizePendingRow, resolvePending, savePending } from './oauth-pending.js'
import { parseBlob, serializeBlob } from './blob.js'
import { writeJson, writeHtml, readBody, isTrustedSettingsRequest, queryOf, escapeHtml } from './http.js'
import * as grok from './grok-oauth.js'
import { runXSearch, clearXSearchCache, getXSearchCacheStats } from './xsearch.js'
import { createXSearchTool, createAuthorProfileTool, createTrendingTopicsTool, createFactCheckNotesTool, normalizeToolParameters } from './x-tools.js'
import { DEFAULT_XSEARCH_MODEL, XSEARCH_MODELS, normalizeXSearchModel, listModelsForSettings } from './models.js'
import { loadBlob, getValidAccessToken } from './token-manager.js'

export const name = '@goodandready/dsh-grok-xsearch'
const NS = 'dsh-grok-xsearch'
export const inject = ['tools', 'credentials', 'webServer', 'settings']

export const Config = z.object({
  enabled: z.boolean().default(true),
  grokClientId: z.string().default(''),
  redirectUri: z.string().default('http://127.0.0.1:56121/callback'),
  baseUrl: z.string().default('https://api.x.ai/v1'),
  model: z.string().default(DEFAULT_XSEARCH_MODEL),
  timeoutSeconds: z.number().default(180),
  retries: z.number().default(2),
  autoFallbackModel: z.boolean().default(true),
  enableCache: z.boolean().default(true),
  cacheTtlSeconds: z.number().default(300),
})

const SKEW_MS = 60 * 1000

function publicConfig(cfg, models = XSEARCH_MODELS) {
  return {
    enabled: cfg.enabled,
    grokClientId: cfg.grokClientId || '',
    redirectUri: cfg.redirectUri || 'http://127.0.0.1:56121/callback',
    model: normalizeXSearchModel(cfg.model),
    models,
    autoFallbackModel: cfg.autoFallbackModel ?? true,
    enableCache: cfg.enableCache ?? true,
    cacheTtlSeconds: Number(cfg.cacheTtlSeconds) || 300,
  }
}

export async function accessToken(ctx, cfg, forceRefresh = false) {
  return getValidAccessToken(ctx, cfg, forceRefresh, fetch)
}

async function accountView(ctx) {
  const blob = await loadBlob(ctx)
  if (!blob) return { configured: false, ref: grok.OAUTH_REF }
  const email = String(blob.email || '').trim()
  return {
    configured: true,
    ref: grok.OAUTH_REF,
    label: blob.label || 'Grok X Search',
    email,
  }
}

export function apply(ctx, config) {
  let liveCfg = Config(structuredClone(config || {}))
  let settingsApi
  const live = () => liveCfg

  ctx.inject(['settings'], (sctx) => {
    if (typeof sctx.settings?.register === 'function') {
      const scope = sctx.settings.register(NS, Config, { base: config })
      settingsApi = scope
      liveCfg = Config(scope.get() ?? config)
      sctx.effect(() => scope.watch((next) => { liveCfg = Config(next ?? config) }), 'dsh-grok-xsearch: settings')
    }
  })

  let disposers = []
  const clearTools = () => {
    for (const d of disposers) {
      try { d() } catch { /* ignore */ }
    }
    disposers = []
  }

  const syncTools = () => {
    clearTools()
    if (!live().enabled) return
    const compatibleDefineTool = (definition) => normalizeToolParameters(defineTool(definition))
    const getAccessToken = (c, cfg) => accessToken(c, cfg, false)
    const onUnauthorized = () => accessToken(ctx, live(), true)

    // 1. Core x_search tool
    try { disposers.push(ctx.tools.register(createXSearchTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))) } catch (_) {}

    // 2. Specialized companion tools
    try { disposers.push(ctx.tools.register(createAuthorProfileTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))) } catch (_) {}

    try { disposers.push(ctx.tools.register(createTrendingTopicsTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))) } catch (_) {}

    try { disposers.push(ctx.tools.register(createFactCheckNotesTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))) } catch (_) {}
  }

  ctx.effect(() => { syncTools(); return () => clearTools() }, 'dsh-grok-xsearch: tools')

  async function configResponse() {
    const cfg = live()
    let models = XSEARCH_MODELS
    try {
      const token = await accessToken(ctx, cfg)
      if (token) models = await listModelsForSettings({ accessToken: token, baseUrl: cfg.baseUrl, fetchImpl: fetch })
    } catch { /* static fallback */ }
    return {
      ok: true,
      config: publicConfig(cfg, models),
      account: await accountView(ctx),
      cache: getXSearchCacheStats(),
    }
  }

  async function completeOAuth(code, state) {
    const row = await resolvePending(state)
    if (!row || !row.verifier) throw new Error('login session expired; start Connect again')
    const cfg = live()
    const blob = await grok.exchangeCode(cfg, row, code, fetch)
    await saveBlob(ctx, blob)
    await deletePending(row.state)
    syncTools()
    return { ref: grok.OAUTH_REF, email: blob.email || '' }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/config',
    handler: async (req, res) => {
      if (req.method === 'GET') return writeJson(res, 200, await configResponse())
      if (req.method !== 'PUT') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'GET or PUT' } })
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin only' } })
      if (!settingsApi) return writeJson(res, 503, { ok: false, error: { code: 'settings', message: 'settings not ready' } })
      let payload
      try { payload = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8') || '{}') } catch { return writeJson(res, 400, { ok: false, error: { code: 'json', message: 'invalid json' } }) }
      if (payload && typeof payload.config === 'object') payload = payload.config
      try {
        const merged = { ...live(), ...(payload || {}) }
        const parsed = Config(merged)
        await settingsApi.replace(parsed)
        syncTools()
        writeJson(res, 200, await configResponse())
      } catch (e) {
        writeJson(res, 400, { ok: false, error: { code: 'save', message: String(e?.message || e) } })
      }
    },
  }), 'dsh-grok-xsearch: /config')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/cache/clear',
    handler: async (req, res) => {
      if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'POST only' } })
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin only' } })
      clearXSearchCache()
      writeJson(res, 200, { ok: true, cache: getXSearchCacheStats() })
    },
  }), 'dsh-grok-xsearch: /cache/clear')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/oauth/start',
    handler: async (req, res) => {
      if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'GET only' } })
      try {
        const pkce = await createPkce()
        const cfg = live()
        await savePending(normalizePendingRow(pkce, cfg.redirectUri))
        const url = grok.authorizeUrl(cfg, pkce)
        writeJson(res, 200, { ok: true, url, state: pkce.state, redirectUri: cfg.redirectUri })
      } catch (e) {
        writeJson(res, 400, { ok: false, error: { code: 'oauth', message: String(e?.message || e) } })
      }
    },
  }), 'dsh-grok-xsearch: /oauth/start')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/oauth/callback',
    handler: async (req, res) => {
      if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'GET only' } })
      const q = queryOf(req)
      const code = q.get('code') || ''
      const state = q.get('state') || ''
      if (!code || !state) return writeHtml(res, 400, '<!doctype html><meta charset="utf-8"><p>Missing code. Paste the redirected URL in Settings.</p>')
      try {
        await completeOAuth(code, state)
        writeHtml(res, 200, '<!doctype html><meta charset="utf-8"><p>Signed in. Close this tab and return to Settings.</p>')
      } catch (e) {
        writeHtml(res, 400, `<!doctype html><meta charset="utf-8"><p>${escapeHtml(e?.message || e)}</p>`)
      }
    },
  }), 'dsh-grok-xsearch: /oauth/callback')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/oauth/complete',
    handler: async (req, res) => {
      if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'POST only' } })
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin only' } })
      let payload
      try { payload = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8') || '{}') } catch { return writeJson(res, 400, { ok: false, error: { code: 'json', message: 'invalid json' } }) }
      const parsed = parseCallbackInput(payload.url || payload.code || '')
      const code = parsed.code
      const state = parsed.state || payload.state || ''
      if (!code) return writeJson(res, 400, { ok: false, error: { code: 'code', message: 'paste redirected URL or code' } })
      try {
        const result = await completeOAuth(code, state)
        writeJson(res, 200, { ok: true, ...result, account: await accountView(ctx) })
      } catch (e) {
        writeJson(res, 400, { ok: false, error: { code: 'oauth', message: String(e?.message || e) } })
      }
    },
  }), 'dsh-grok-xsearch: /oauth/complete')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/logout',
    handler: async (req, res) => {
      if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'POST only' } })
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin only' } })
      await clearBlob(ctx)
      syncTools()
      writeJson(res, 200, { ok: true, account: await accountView(ctx) })
    },
  }), 'dsh-grok-xsearch: /logout')
}
