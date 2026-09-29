import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { createPkce } from './pkce.js'
import { parseCallbackInput } from './oauth.js'
import { deletePending, normalizePendingRow, resolvePending, savePending, clearPendingStore } from './oauth-pending.js'
import { parseBlob, serializeBlob } from './blob.js'
import { writeJson, writeHtml, readBody, isTrustedSettingsRequest, queryOf, escapeHtml } from './http.js'
import * as grok from './grok-oauth.js'
import { runXSearch, clearXSearchCache, getXSearchCacheStats } from './xsearch.js'
import { createXSearchTool, createAuthorProfileTool, createTrendingTopicsTool, createFactCheckNotesTool, createThreadReaderTool, createFindExpertsTool, normalizeToolParameters } from './x-tools.js'
import { DEFAULT_XSEARCH_MODEL, XSEARCH_MODELS, normalizeXSearchModel, listModelsForSettings, clearModelsCache } from './models.js'
import { loadBlob, getValidAccessToken, clearRefreshMutex } from './token-manager.js'
import { registerPluginUpdater } from './updater.js'

export const name = '@goodandready/dsh-grok-xsearch'
const NS = 'dsh-grok-xsearch'
export const inject = ['tools', 'credentials', 'webServer']

if (typeof z.prototype?.volatile !== 'function') {
  z.prototype.volatile = function volatile() {
    if (this.meta && this.meta.volatile) throw new TypeError('volatile schema is already wrapped')
    return typeof this.extra === 'function' ? this.extra('volatile', true) : this
  }
}

export const Config = z.object({
  enabled: z.boolean().default(true).volatile(),
  grokClientId: z.string().default('').volatile(),
  redirectUri: z.string().default('http://127.0.0.1:56121/callback').volatile(),
  baseUrl: z.string().default('https://api.x.ai/v1').volatile(),
  model: z.string().default(DEFAULT_XSEARCH_MODEL).volatile(),
  timeoutSeconds: z.number().default(180).volatile(),
  retries: z.number().default(2).volatile(),
  autoFallbackModel: z.boolean().default(true).volatile(),
  enableCache: z.boolean().default(true).volatile(),
  cacheTtlSeconds: z.number().default(300).volatile(),
})

// DSH serves a namespace's settings form from the volatile fields of its profile
// entry schema, and a volatile field holds a Volatile box rather than its value.
// Unwrap before any caller reads one, and read lazily: the Loader mutates the
// boxes in place and re-announces them with loader/volatile-update.
export function plainConfig(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(plainConfig)
  if (typeof value.get === 'function') return plainConfig(value.get())
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainConfig(v)]))
}

const SKEW_MS = 60 * 1000

function publicConfig(cfg, models = XSEARCH_MODELS) {
  return {
    enabled: cfg.enabled,
    grokClientId: cfg.grokClientId || '',
    redirectUri: cfg.redirectUri || 'http://127.0.0.1:56121/callback',
    baseUrl: cfg.baseUrl || 'https://api.x.ai/v1',
    model: normalizeXSearchModel(cfg.model),
    models,
    timeoutSeconds: Number(cfg.timeoutSeconds) || 180,
    retries: Number.isInteger(cfg.retries) ? cfg.retries : 2,
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
  // DSH hands the plugin the entry config, whose .volatile() fields hold Volatile
  // boxes; plainConfig() unwraps them. Read lazily: the Loader mutates the boxes in
  // place and re-announces them with loader/volatile-update, so a lazy read is what
  // keeps the tools in step with a setting the user just saved. settings.register
  // exists in neither 0.1.7-rc.2 nor 0.2.0, so the branch it guarded never ran and
  // syncTools() was never called again after boot.
  let settingsSvc = null
  const live = () => plainConfig(Config(plainConfig(config || {})))

  // The document holds plain values, not Volatile boxes.
  function plainVolatile(value) {
    if (value === null || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map(plainVolatile)
    if (typeof value.get === 'function') return plainVolatile(value.get())
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainVolatile(v)]))
  }

  ctx.inject(['settings'], (sctx) => {
    settingsSvc = sctx?.settings || (typeof sctx?.get === 'function' ? sctx.get('settings') : null) || null
  })

  if (typeof ctx.on === 'function') {
    try {
      ctx.on('loader/volatile-update', () => {
        try { syncTools() } catch (err) { /* a bad config must not kill the plugin */ }
      })
    } catch (err) {
      if (typeof ctx.logger?.warn === 'function') {
        ctx.logger.warn('[dsh-grok-xsearch] volatile-update subscription failed: ' + (err?.message || err))
      }
    }
  }

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

    const registerToolSafe = (name, factory) => {
      try {
        const tool = factory()
        if (tool) {
          disposers.push(ctx.tools.register(tool))
        }
      } catch (err) {
        ctx.logger?.warn?.(`[dsh-grok-xsearch] Failed to register tool ${name}: ${err?.message || err}`)
      }
    }

    // 1. Core x_search tool
    registerToolSafe('x_search', () => createXSearchTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))

    // 2. Specialized companion tools
    registerToolSafe('x_author_profile', () => createAuthorProfileTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))

    registerToolSafe('x_trending_topics', () => createTrendingTopicsTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))

    registerToolSafe('x_fact_check_notes', () => createFactCheckNotesTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))

    registerToolSafe('x_thread_reader', () => createThreadReaderTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))

    registerToolSafe('x_find_experts', () => createFindExpertsTool({
      getContext: () => ctx,
      getConfig: live,
      runSearch: runXSearch,
      getAccessToken,
      onUnauthorized,
      defineTool: compatibleDefineTool,
    }))
  }

  ctx.effect(() => {
    syncTools()
    return () => {
      clearTools()
      clearPendingStore()
      clearRefreshMutex()
      clearModelsCache()
      clearXSearchCache()
    }
  }, 'dsh-grok-xsearch: tools')

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
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin or loopback only' } })
      if (req.method === 'GET') return writeJson(res, 200, await configResponse())
      if (req.method !== 'PUT') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'GET or PUT' } })
      let payload
      try { payload = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8') || '{}') } catch { return writeJson(res, 400, { ok: false, error: { code: 'json', message: 'invalid json' } }) }
      if (payload && typeof payload.config === 'object') payload = payload.config
      try {
        const merged = { ...live(), ...(payload || {}) }
        const parsed = Config(merged)
        // Persist through the settings service. Both releases expose
        // update/replace against the profile document, and describe() carries the
        // namespace revision that fences the write. settingsApi used to come from
        // settings.register, which exists in neither release, so this branch always
        // took the `else` and the save was lost on restart.
        const revision = (() => {
          try {
            return settingsSvc?.describe?.()?.find?.((row) => row?.ns === NS)?.revision
          } catch { return undefined }
        })()
        const payloadPlain = plainConfig(parsed)
        if (typeof settingsSvc?.update === 'function') await settingsSvc.update(NS, payloadPlain, revision)
        else if (typeof settingsSvc?.replace === 'function') await settingsSvc.replace(NS, payloadPlain, revision)
        else throw new Error('settings service cannot persist configuration')
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
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin or loopback only' } })
      clearXSearchCache()
      clearModelsCache()
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
      const errParam = q.get('error') || ''
      const errDesc = q.get('error_description') || ''
      if (errParam) {
        const detail = errDesc ? `: ${errDesc}` : ''
        return writeHtml(res, 400, `<!doctype html><meta charset="utf-8"><p>Sign-in failed (${escapeHtml(errParam)}${escapeHtml(detail)}). Please return to Settings and try again.</p>`)
      }
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
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin or loopback only' } })
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
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin or loopback only' } })
      await clearBlob(ctx)
      clearPendingStore()
      clearRefreshMutex()
      clearModelsCache()
      clearXSearchCache()
      syncTools()
      writeJson(res, 200, { ok: true, account: await accountView(ctx) })
    },
  }), 'dsh-grok-xsearch: /logout')

  ctx.effect(() => {
    const dispose = registerPluginUpdater(ctx, {
      packageName: '@goodandready/dsh-grok-xsearch',
      endpoint: '/api/dsh-grok-xsearch/update',
      manifestUrl: new URL('../package.json', import.meta.url),
    })
    return () => {
      try {
        if (typeof dispose === 'function') dispose()
      } catch (err) {
        ctx.logger?.warn?.('[dsh-grok-xsearch] Error disposing updater:', err)
      }
    }
  }, 'dsh-grok-xsearch: updater route')
}
