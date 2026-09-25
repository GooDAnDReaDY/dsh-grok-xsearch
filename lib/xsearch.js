import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync, unlinkSync, existsSync } from 'node:fs'
import { writeFile, rename, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
let PKG_VERSION = '0.3.19'
try {
  PKG_VERSION = require('../package.json').version || '0.3.19'
} catch {
  // fallback to hardcoded current version
}

const MAX_HANDLES = 10
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 200

const SEARCH_CACHE = new Map()
const profileSuffix = process.env.DSH_PROFILE ? `-${process.env.DSH_PROFILE}` : ''
const DISK_CACHE_PATH = process.env.DSH_CACHE_DIR
  ? join(process.env.DSH_CACHE_DIR, `dsh-grok-xsearch-cache${profileSuffix}.json`)
  : join(tmpdir(), `dsh-grok-xsearch-cache${profileSuffix}.json`)

let cacheHits = 0
let cacheMisses = 0
let totalRequests = 0

function loadDiskCache() {
  try {
    if (!existsSync(DISK_CACHE_PATH)) return
    const raw = JSON.parse(readFileSync(DISK_CACHE_PATH, 'utf8'))
    if (!raw || typeof raw !== 'object') return
    const now = Date.now()
    if (raw.stats && typeof raw.stats === 'object') {
      cacheHits = Number(raw.stats.hits) || 0
      cacheMisses = Number(raw.stats.misses) || 0
      totalRequests = Number(raw.stats.totalRequests) || 0
    }
    if (Array.isArray(raw.entries)) {
      for (const [k, v] of raw.entries) {
        if (v && v.expiresAt && v.expiresAt > now) {
          SEARCH_CACHE.set(k, v)
        }
      }
    }
  } catch {
    // in-memory fallback
  }
}

let saveTimer = null
let isWriting = false
let writeQueued = false

export async function flushDiskCache() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  await performSaveDiskCache()
}

function scheduleSaveDiskCache(delayMs = 500) {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    performSaveDiskCache().catch(() => {})
  }, delayMs)
  if (typeof saveTimer?.unref === 'function') {
    saveTimer.unref()
  }
}

async function performSaveDiskCache() {
  if (isWriting) {
    writeQueued = true
    return
  }
  isWriting = true
  try {
    pruneExpiredCacheEntries()
    const entries = Array.from(SEARCH_CACHE.entries())
    const payload = {
      stats: { hits: cacheHits, misses: cacheMisses, totalRequests },
      entries,
    }
    const tempPath = `${DISK_CACHE_PATH}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
    await writeFile(tempPath, JSON.stringify(payload), { encoding: 'utf8', mode: 0o600 })
    await rename(tempPath, DISK_CACHE_PATH)
    try {
      await chmod(DISK_CACHE_PATH, 0o600)
    } catch {
      // ignore chmod failures on filesystems without posix permission support
    }
  } catch {
    // ignore disk write errors
  } finally {
    isWriting = false
    if (writeQueued) {
      writeQueued = false
      scheduleSaveDiskCache(100)
    }
  }
}

function saveDiskCache() {
  scheduleSaveDiskCache(500)
}

loadDiskCache()

export function clearXSearchCache() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  SEARCH_CACHE.clear()
  cacheHits = 0
  cacheMisses = 0
  totalRequests = 0
  try {
    if (existsSync(DISK_CACHE_PATH)) unlinkSync(DISK_CACHE_PATH)
  } catch { /* ignore */ }
}

export function getXSearchCacheStats() {
  const total = cacheHits + cacheMisses
  const hitRate = total > 0 ? Math.round((cacheHits / total) * 100) : 0
  return {
    size: SEARCH_CACHE.size,
    maxEntries: MAX_CACHE_ENTRIES,
    hits: cacheHits,
    misses: cacheMisses,
    totalRequests,
    hitRate,
  }
}

function computeCacheKey(opts) {
  const accountFp = String(
    opts.account_fingerprint ||
    opts.accountFingerprint ||
    (opts.accessToken ? createHash('sha256').update(opts.accessToken).digest('hex').slice(0, 16) : '')
  )
  const norm = {
    account: accountFp,
    query: String(opts.query || '').trim(),
    model: String(opts.model || '').trim(),
    allowed: (opts.allowed_x_handles || []).slice().sort(),
    excluded: (opts.excluded_x_handles || []).slice().sort(),
    from_date: opts.from_date || '',
    to_date: opts.to_date || '',
    only_original_posts: Boolean(opts.only_original_posts),
    has_media: Boolean(opts.has_media),
    has_links: Boolean(opts.has_links),
    only_threads: Boolean(opts.only_threads),
    lang: opts.lang || '',
    min_likes: Number(opts.min_likes) || 0,
    min_reposts: Number(opts.min_reposts) || 0,
    enable_image: Boolean(opts.enable_image_understanding),
    enable_video: Boolean(opts.enable_video_understanding),
    extract_tables: Boolean(opts.extract_tables),
  }
  return createHash('sha256').update(JSON.stringify(norm)).digest('hex')
}

function getCachedResult(key) {
  totalRequests++
  const item = SEARCH_CACHE.get(key)
  if (!item) {
    cacheMisses++
    return null
  }
  if (Date.now() > item.expiresAt) {
    SEARCH_CACHE.delete(key)
    cacheMisses++
    saveDiskCache()
    return null
  }
  cacheHits++
  return {
    ...item.data,
    citations: Array.isArray(item.data?.citations) ? item.data.citations.map((c) => ({ ...c })) : [],
    from_cache: true,
  }
}

function pruneExpiredCacheEntries() {
  const now = Date.now()
  for (const [k, v] of SEARCH_CACHE.entries()) {
    if (now > v.expiresAt) {
      SEARCH_CACHE.delete(k)
    }
  }
}

function setCachedResult(key, data, ttlMs = DEFAULT_CACHE_TTL_MS) {
  pruneExpiredCacheEntries()
  if (SEARCH_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = SEARCH_CACHE.keys().next().value
    if (oldestKey) SEARCH_CACHE.delete(oldestKey)
  }
  SEARCH_CACHE.set(key, {
    expiresAt: Date.now() + (Number(ttlMs) || DEFAULT_CACHE_TTL_MS),
    data,
  })
  saveDiskCache()
}

export function normalizeHandles(handles, fieldName) {
  const seen = new Set()
  const out = []
  for (const handle of handles || []) {
    const normalized = String(handle || '').trim().replace(/^@/, '')
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      out.push(normalized)
    }
  }
  if (out.length > MAX_HANDLES) throw new Error(`${fieldName} supports at most ${MAX_HANDLES} handles`)
  return out
}

export function validateDateRange(fromDate, toDate) {
  const from = String(fromDate || '').trim()
  const to = String(toDate || '').trim()
  const parse = (value, field) => {
    if (!value) return null
    if (!ISO_DATE.test(value)) throw new Error(`${field} must be YYYY-MM-DD`)
    const d = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) throw new Error(`${field} must be YYYY-MM-DD`)
    return d
  }
  const parsedFrom = parse(from, 'from_date')
  const parsedTo = parse(to, 'to_date')
  if (parsedFrom && parsedTo && parsedFrom > parsedTo) throw new Error('from_date must be on or before to_date')
  const maxFutureMs = Date.now() + 36 * 60 * 60 * 1000
  if (parsedFrom && parsedFrom.getTime() > maxFutureMs) {
    throw new Error('from_date is in the future')
  }
  if (parsedTo && parsedTo.getTime() > maxFutureMs) {
    throw new Error('to_date is in the future')
  }
}

export function buildXSearchPayload({
  model,
  query,
  allowed = [],
  excluded = [],
  fromDate = '',
  toDate = '',
  enableImage = false,
  enableVideo = false,
  onlyOriginal = false,
  hasMedia = false,
  hasLinks = false,
  onlyThreads = false,
  lang = '',
  minLikes = 0,
  minReposts = 0,
  extractTables = false,
}) {
  const toolDef = { type: 'x_search' }
  if (allowed.length) toolDef.allowed_x_handles = allowed
  if (excluded.length) toolDef.excluded_x_handles = excluded
  if (fromDate) toolDef.from_date = fromDate
  if (toDate) toolDef.to_date = toDate
  if (enableImage) toolDef.enable_image_understanding = true
  if (enableVideo) toolDef.enable_video_understanding = true

  const constraints = []
  if (onlyOriginal) constraints.push('Focus exclusively on original author posts; omit retweets and pure quote echoes.')
  if (onlyThreads) constraints.push('Focus on extended multi-tweet discussion threads and detailed long-form posts.')
  if (hasMedia) constraints.push('Include only posts containing images, infographics, charts, code screenshots, or videos.')
  if (hasLinks) constraints.push('Include only posts containing external links, articles, papers, or repositories.')
  if (lang) constraints.push(`Prioritize posts in language: ${lang}.`)
  if (minLikes > 0) constraints.push(`Prioritize high-signal posts with at least ${minLikes} likes / favorites.`)
  if (minReposts > 0) constraints.push(`Prioritize posts with at least ${minReposts} reposts / retweets.`)
  if (extractTables) {
    toolDef.enable_image_understanding = true
    constraints.push('Format and output any numerical metrics, financial figures, benchmarks, or comparison tables from post charts, infographics, and media into structured Markdown table format (| col1 | col2 |).')
  }
  if (enableImage) constraints.push('Extract key data, code snippets, numbers, and diagrams from attached post images or infographics.')
  if (enableVideo) constraints.push('Summarize key statements, timestamps, and quotes from attached video clips or voice segments.')

  let userContent = String(query || '').trim()
  if (constraints.length > 0) {
    userContent += `\n\n[Search & Multimodal Directives]:\n${constraints.map((c) => `- ${c}`).join('\n')}`
  }

  return {
    model,
    input: [{ role: 'user', content: userContent }],
    tools: [toolDef],
    store: false,
  }
}

export function extractAnswer(payload) {
  const direct = String(payload?.output_text || '').trim()
  if (direct) return direct
  const parts = []
  for (const item of payload?.output || []) {
    if (item?.type !== 'message') continue
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' || content?.type === 'text') {
        const text = String(content?.text || '').trim()
        if (text) parts.push(text)
      }
    }
  }
  return parts.join('\n\n').trim()
}

export function normalizeCitation(raw) {
  let url = typeof raw === 'string' ? raw.trim() : String(raw?.url || '').trim()
  const title = typeof raw === 'string' ? '' : String(raw?.title || '').trim()
  let handle = ''
  let statusId = ''

  const match = /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]{1,15})\/status\/(\d+)/i.exec(url)
  if (match) {
    handle = match[1]
    statusId = match[2]
    url = `https://x.com/${handle}/status/${statusId}`
  }

  return {
    url,
    title,
    handle: handle ? `@${handle}` : '',
    status_id: statusId,
  }
}

function canonicalCitationKey(norm) {
  if (norm.handle && norm.status_id) {
    return `https://x.com/${norm.handle.replace(/^@/, '').toLowerCase()}/status/${norm.status_id}`
  }
  try {
    const u = new URL(norm.url)
    u.hash = ''
    for (const p of ['s', 't', 'ref_src', 'utm_source', 'utm_medium', 'utm_campaign']) {
      u.searchParams.delete(p)
    }
    return u.toString().replace(/\/$/, '')
  } catch {
    return norm.url
  }
}

export function extractCitations(payload) {
  const top = Array.isArray(payload?.citations) ? payload.citations : []
  const inline = []
  for (const item of payload?.output || []) {
    if (item?.type !== 'message') continue
    for (const content of item?.content || []) {
      for (const ann of content?.annotations || []) {
        if (ann?.type !== 'url_citation') continue
        inline.push({ url: ann.url || '', title: ann.title || '' })
      }
    }
  }

  const seen = new Set()
  const out = []
  for (const item of [...top, ...inline]) {
    const norm = normalizeCitation(item)
    if (!norm.url) continue
    const key = canonicalCitationKey(norm)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(norm)
  }
  return out
}

function mergeAbortSignals(signal, timeoutMs) {
  const effectiveMs = Number(timeoutMs) || 180000
  const timeout = AbortSignal.timeout(effectiveMs)
  if (!signal) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout])
  const controller = new AbortController()
  const abort = () => controller.abort(signal.reason || timeout.reason)
  if (signal.aborted || timeout.aborted) abort()
  else {
    signal.addEventListener('abort', abort, { once: true })
    timeout.addEventListener('abort', abort, { once: true })
  }
  return controller.signal
}

const FALLBACK_MODELS = ['grok-4.5', 'grok-4-fast-reasoning', 'grok-4.3']

export async function runXSearch(opts) {
  const {
    accessToken,
    baseUrl,
    model: requestedModel,
    query,
    allowed_x_handles,
    excluded_x_handles,
    from_date,
    to_date,
    enable_image_understanding,
    enable_video_understanding,
    extract_tables,
    only_original_posts,
    has_media,
    has_links,
    only_threads,
    lang,
    min_likes,
    min_reposts,
    timeoutMs,
    retries = 2,
    signal,
    fetchImpl = fetch,
    auto_fallback_model = true,
    enable_cache = true,
    cache_ttl_ms = DEFAULT_CACHE_TTL_MS,
    onUnauthorized,
  } = opts

  let currentToken = accessToken
  let unauthorizedRetried = false

  if (!String(query || '').trim()) throw new Error('query is required')

  const allowed = normalizeHandles(allowed_x_handles, 'allowed_x_handles')
  const excluded = normalizeHandles(excluded_x_handles, 'excluded_x_handles')
  if (allowed.length && excluded.length) {
    throw new Error('allowed_x_handles and excluded_x_handles cannot be used together')
  }
  validateDateRange(from_date, to_date)

  const cacheKey = computeCacheKey({
    account_fingerprint: opts.account_fingerprint || opts.accountFingerprint,
    accessToken: currentToken,
    query,
    model: requestedModel,
    allowed_x_handles: allowed,
    excluded_x_handles: excluded,
    from_date,
    to_date,
    only_original_posts,
    has_media,
    has_links,
    only_threads,
    lang,
    min_likes,
    min_reposts,
    enable_image_understanding,
    enable_video_understanding,
    extract_tables,
  })

  if (enable_cache) {
    const cached = getCachedResult(cacheKey)
    if (cached) return cached
  }

  const modelsToTry = [requestedModel]
  if (auto_fallback_model) {
    for (const fb of FALLBACK_MODELS) {
      if (fb !== requestedModel) modelsToTry.push(fb)
    }
  }

  const endpoint = `${String(baseUrl || 'https://api.x.ai/v1').replace(/\/$/, '')}/responses`
  let lastErr

  for (const currentModel of modelsToTry) {
    const isFallback = currentModel !== requestedModel
    const payload = buildXSearchPayload({
      model: currentModel,
      query,
      allowed,
      excluded,
      fromDate: String(from_date || '').trim(),
      toDate: String(to_date || '').trim(),
      enableImage: Boolean(enable_image_understanding),
      enableVideo: Boolean(enable_video_understanding),
      onlyOriginal: Boolean(only_original_posts),
      hasMedia: Boolean(has_media),
      hasLinks: Boolean(has_links),
      onlyThreads: Boolean(only_threads),
      lang: String(lang || '').trim(),
      minLikes: Number(min_likes) || 0,
      minReposts: Number(min_reposts) || 0,
    })

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${currentToken}`,
            'content-type': 'application/json',
            'user-agent': `dsh-grok-xsearch/${PKG_VERSION}`,
          },
          body: JSON.stringify(payload),
          signal: mergeAbortSignals(signal, timeoutMs),
        })

        const text = await res.text()
        let json
        try {
          json = JSON.parse(text)
        } catch {
          json = { error: text }
        }

        if (!res.ok) {
          if (res.status === 401 && !unauthorizedRetried && typeof onUnauthorized === 'function') {
            unauthorizedRetried = true
            try {
              const fresh = await onUnauthorized()
              if (fresh) {
                currentToken = fresh
                continue
              }
            } catch { /* ignore refresh error, throw original 401 */ }
          }

          const base =
            (json && typeof json.error === 'object' && json.error.message) ||
            (typeof json?.error === 'string' ? json.error : '') ||
            text ||
            `HTTP ${res.status}`

          if (res.status === 429 && auto_fallback_model && currentModel !== modelsToTry[modelsToTry.length - 1]) {
            lastErr = new Error(String(base))
            lastErr.status = 429
            break
          }

          const hint =
            res.status === 429
              ? ' Try Grok 4.5 or Grok 4 Fast Reasoning in Settings, or retry in a few minutes.'
              : ''
          const err = new Error(String(base) + hint)
          err.status = res.status
          throw err
        }

        const answer = extractAnswer(json)
        const citations = extractCitations(json)
        const filtered = Boolean(
          allowed.length ||
            excluded.length ||
            String(from_date || '').trim() ||
            String(to_date || '').trim() ||
            only_original_posts ||
            has_media ||
            has_links ||
            only_threads ||
            lang ||
            min_likes ||
            min_reposts
        )
        const degraded = filtered && citations.length === 0

        const result = {
          success: true,
          answer,
          citations,
          degraded,
          degraded_reason: degraded ? 'No citations returned for a filtered query' : '',
          model: currentModel,
          original_model: requestedModel,
          model_switched: isFallback,
          from_cache: false,
        }

        if (enable_cache) {
          setCachedResult(cacheKey, result, cache_ttl_ms)
        }

        return result
      } catch (e) {
        lastErr = e
        if (e?.status && e.status < 500 && e.status !== 429) throw e
        if (attempt >= retries && (!auto_fallback_model || e?.status !== 429)) throw e
        if (attempt < retries) {
          const delay = Math.min(250 * Math.pow(2, attempt), 1500)
          await new Promise((r) => setTimeout(r, delay))
        }
      }
    }
  }

  throw lastErr || new Error('x_search failed')
}
