import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { createPkce } from './pkce.js'
import { parseCallbackInput } from './oauth.js'
import { deletePending, normalizePendingRow, resolvePending, savePending } from './oauth-pending.js'
import { parseBlob, serializeBlob } from './blob.js'
import { writeJson, writeHtml, readBody, isTrustedSettingsRequest, queryOf } from './http.js'
import * as grok from './grok-oauth.js'
import { runXSearch } from './xsearch.js'
import { DEFAULT_XSEARCH_MODEL, XSEARCH_MODELS, normalizeXSearchModel, listModelsForSettings } from './models.js'

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
})

const SKEW_MS = 60 * 1000
function splitHandles(value) {
  if (Array.isArray(value)) return value
  return String(value || '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
}



function publicConfig(cfg, models = XSEARCH_MODELS) {
  return {
    enabled: cfg.enabled,
    model: normalizeXSearchModel(cfg.model),
    models,
  }
}

async function loadBlob(ctx) {
  const raw = await ctx.credentials.resolve(credentialRef(grok.OAUTH_REF)).then((r) => r?.value || '').catch(() => '')
  if (!raw) return null
  return parseBlob(raw)
}

async function saveBlob(ctx, blob) {
  await ctx.credentials.set(credentialRef(grok.OAUTH_REF), serializeBlob(blob))
}

async function clearBlob(ctx) {
  await ctx.credentials.unset(credentialRef(grok.OAUTH_REF)).catch(() => {})
}

async function accessToken(ctx, cfg) {
  const blob = await loadBlob(ctx)
  if (!blob?.accessToken) return ''
  if (blob.expiresAt && blob.expiresAt > Date.now() + SKEW_MS) return blob.accessToken
  if (!blob.refreshToken) return blob.accessToken
  const next = await grok.refresh(cfg, blob, fetch)
  await saveBlob(ctx, next)
  return next.accessToken
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

  const sctx = ctx.get('settings')
  if (sctx?.settings?.register) {
    const scope = sctx.settings.register(NS, Config, { base: config })
    settingsApi = scope
    liveCfg = Config(scope.get() ?? config)
    ctx.effect(() => scope.onChange((next) => { liveCfg = Config(next ?? config) }), 'dsh-grok-xsearch: settings')
  }

  let disposeTool
  const syncTool = () => {
    if (disposeTool) {
      try { disposeTool() } catch { /* ignore */ }
      disposeTool = undefined
    }
    if (!live().enabled) return
    disposeTool = ctx.tools.register(defineTool({
      name: 'x_search',
      description: 'Search X (Twitter) posts and threads via xAI built-in x_search. Use for current discussion on X, not general web search.',
      parameters: {
        query: { type: 'string', required: true, description: 'Natural-language search query.' },
        allowed_x_handles: { type: 'string', description: 'Optional comma-separated @handles to include (max 10).' },
        excluded_x_handles: { type: 'string', description: 'Optional comma-separated @handles to exclude (max 10).' },
        from_date: { type: 'string', description: 'Optional start date YYYY-MM-DD.' },
        to_date: { type: 'string', description: 'Optional end date YYYY-MM-DD.' },
        enable_image_understanding: { type: 'boolean', description: 'Let xAI analyze images in posts.' },
        enable_video_understanding: { type: 'boolean', description: 'Let xAI analyze videos in posts.' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: true,
          properties: {
            success: { type: 'boolean' },
            answer: { type: 'string' },
            citations: { type: 'array' },
            degraded: { type: 'boolean' },
            degraded_reason: { type: 'string' },
            model: { type: 'string' },
          },
        },
        render(_args, value) {
          const lines = []
          if (value.degraded) lines.push(`(degraded: ${value.degraded_reason || 'no citations'})`)
          if (value.answer) lines.push(String(value.answer))
          if (Array.isArray(value.citations) && value.citations.length) {
            lines.push('Citations:')
            for (const c of value.citations.slice(0, 20)) {
              const title = c.title ? ` — ${c.title}` : ''
              lines.push(`- ${c.url || ''}${title}`)
            }
          }
          return [{ type: 'text', text: lines.join('\n') || JSON.stringify(value) }]
        },
      },
      isConcurrencySafe: () => true,
      timeoutMs: ((Number(live().timeoutSeconds) || 180) + 30) * 1000,
      async execute(args) {
        const cfg = live()
        const token = await accessToken(ctx, cfg)
        if (!token) throw new Error('Grok X Search is not connected. Open Settings and Connect a separate Grok account.')
        return runXSearch({
          accessToken: token,
          baseUrl: cfg.baseUrl,
          model: cfg.model,
          query: args.query,
          allowed_x_handles: splitHandles(args.allowed_x_handles),
          excluded_x_handles: splitHandles(args.excluded_x_handles),
          from_date: args.from_date,
          to_date: args.to_date,
          enable_image_understanding: args.enable_image_understanding,
          enable_video_understanding: args.enable_video_understanding,
          timeoutMs: ((Number(cfg.timeoutSeconds) || 180) + 30) * 1000,
          retries: cfg.retries,
        })
      },
    }))
  }

  ctx.effect(() => { syncTool(); return () => { if (disposeTool) try { disposeTool() } catch {} } }, 'dsh-grok-xsearch: tool')

  async function configResponse() {
    const cfg = live()
    let models = XSEARCH_MODELS
    try {
      const token = await accessToken(ctx, cfg)
      if (token) models = await listModelsForSettings({ accessToken: token, baseUrl: cfg.baseUrl, fetchImpl: fetch })
    } catch { /* static fallback */ }
    return { ok: true, config: publicConfig(cfg, models), account: await accountView(ctx) }
  }

  async function completeOAuth(code, state) {
    const row = await resolvePending(state)
    if (!row || !row.verifier) throw new Error('login session expired; start Connect again')
    const cfg = live()
    const blob = await grok.exchangeCode(cfg, row, code, fetch)
    await saveBlob(ctx, blob)
    await deletePending(row.state)
    syncTool()
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
      try { payload = JSON.parse((await readBody(req)).toString('utf8') || '{}') } catch { return writeJson(res, 400, { ok: false, error: { code: 'json', message: 'invalid json' } }) }
      if (payload && typeof payload.config === 'object') payload = payload.config
      try {
        const parsed = Config(payload)
        await settingsApi.replace(parsed)
        syncTool()
        writeJson(res, 200, await configResponse())
      } catch (e) {
        writeJson(res, 400, { ok: false, error: { code: 'save', message: String(e?.message || e) } })
      }
    },
  }), 'dsh-grok-xsearch: /config')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/oauth/start',
    handler: async (req, res) => {
      if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'GET only' } })
      const pkce = await createPkce()
      const cfg = live()
      await savePending(normalizePendingRow(pkce, cfg.redirectUri))
      const url = grok.authorizeUrl(cfg, pkce)
      writeJson(res, 200, { ok: true, url, state: pkce.state, redirectUri: cfg.redirectUri })
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
        writeHtml(res, 400, `<!doctype html><meta charset="utf-8"><p>${String(e?.message || e)}</p>`)
      }
    },
  }), 'dsh-grok-xsearch: /oauth/callback')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/dsh-grok-xsearch/oauth/complete',
    handler: async (req, res) => {
      if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: { code: 'method', message: 'POST only' } })
      if (!isTrustedSettingsRequest(req)) return writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'same-origin only' } })
      let payload
      try { payload = JSON.parse((await readBody(req)).toString('utf8') || '{}') } catch { return writeJson(res, 400, { ok: false, error: { code: 'json', message: 'invalid json' } }) }
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
      syncTool()
      writeJson(res, 200, { ok: true, account: await accountView(ctx) })
    },
  }), 'dsh-grok-xsearch: /logout')
}
