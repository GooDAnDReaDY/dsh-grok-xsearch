import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeHandles,
  validateDateRange,
  buildXSearchPayload,
  extractAnswer,
  extractCitations,
  normalizeCitation,
  runXSearch,
  clearXSearchCache,
  getXSearchCacheStats,
} from '../lib/xsearch.js'

test('normalizeHandles strips @ and enforces max', () => {
  assert.deepEqual(normalizeHandles(['@xai', 'grok'], 'allowed_x_handles'), ['xai', 'grok'])
  assert.throws(() => normalizeHandles(Array.from({ length: 11 }, (_, i) => `u${i}`), 'allowed_x_handles'))
})

test('validateDateRange rejects inverted and future from_date', () => {
  assert.throws(() => validateDateRange('2026-04-10', '2026-04-01'))
  assert.throws(() => validateDateRange('2099-01-01', ''))
})

test('normalizeCitation extracts author handle and status ID', () => {
  const norm = normalizeCitation({ url: 'https://x.com/OpenAI/status/18923487293847', title: 'Tweet Title' })
  assert.equal(norm.handle, '@OpenAI')
  assert.equal(norm.status_id, '18923487293847')
  assert.equal(norm.title, 'Tweet Title')
})

test('buildXSearchPayload matches Hermes x_search request shape with extended filters', () => {
  const body = buildXSearchPayload({
    model: 'grok-4.6',
    query: 'What are people saying about xAI on X?',
    allowed: ['xai', 'grok'],
    excluded: [],
    fromDate: '2026-04-01',
    toDate: '2026-04-10',
    enableImage: true,
    enableVideo: true,
    onlyOriginal: true,
    hasMedia: true,
    hasLinks: true,
    onlyThreads: true,
    lang: 'en',
    minLikes: 50,
    minReposts: 10,
  })
  assert.equal(body.model, 'grok-4.6')
  assert.equal(body.store, false)
  assert.equal(body.tools[0].type, 'x_search')
  assert.deepEqual(body.tools[0].allowed_x_handles, ['xai', 'grok'])
  assert.equal(body.tools[0].from_date, '2026-04-01')
  assert.equal(body.tools[0].enable_image_understanding, true)
  assert.equal(body.tools[0].enable_video_understanding, true)
  assert.match(body.input[0].content, /Focus exclusively on original author posts/)
  assert.match(body.input[0].content, /50 likes/)
  assert.match(body.input[0].content, /language: en/)
})

test('extractAnswer and inline deduplicated citations', () => {
  assert.equal(extractAnswer({ output_text: 'ok' }), 'ok')
  const cites = extractCitations({
    citations: [{ url: 'https://x.com/a/status/1', title: 'A' }, { url: 'https://x.com/a/status/1', title: 'A duplicate' }],
    output: [{
      type: 'message',
      content: [{
        annotations: [{ type: 'url_citation', url: 'https://x.com/b/status/2', title: 'B' }],
      }],
    }],
  })
  assert.equal(cites.length, 2)
  assert.equal(cites[0].handle, '@a')
  assert.equal(cites[1].handle, '@b')
})

test('runXSearch caches results and returns from_cache', async () => {
  clearXSearchCache()
  let callCount = 0
  const fetchImpl = async () => {
    callCount++
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ output_text: 'Cached answer', citations: [] }),
    }
  }

  const res1 = await runXSearch({
    accessToken: 'tok',
    model: 'grok-4.6',
    query: 'same query',
    fetchImpl,
  })
  assert.equal(res1.from_cache, false)
  assert.equal(callCount, 1)

  const res2 = await runXSearch({
    accessToken: 'tok',
    model: 'grok-4.6',
    query: 'same query',
    fetchImpl,
  })
  assert.equal(res2.from_cache, true)
  assert.equal(callCount, 1)

  assert.equal(getXSearchCacheStats().size, 1)
  clearXSearchCache()
  assert.equal(getXSearchCacheStats().size, 0)
})

test('runXSearch automatically falls back to grok-4.5 on HTTP 429 rate limit', async () => {
  clearXSearchCache()
  const modelsTried = []
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body)
    modelsTried.push(body.model)
    if (body.model === 'grok-4.6') {
      return {
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded for grok-4.6' } }),
      }
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ output_text: 'Fallback succeeded', citations: [] }),
    }
  }

  const result = await runXSearch({
    accessToken: 'tok',
    model: 'grok-4.6',
    query: 'trending AI tools',
    auto_fallback_model: true,
    enable_cache: false,
    fetchImpl,
  })

  assert.equal(result.success, true)
  assert.equal(result.model, 'grok-4.5')
  assert.equal(result.original_model, 'grok-4.6')
  assert.equal(result.model_switched, true)
  assert.deepEqual(modelsTried, ['grok-4.6', 'grok-4.5'])
})

test('runXSearch rejects conflicting handle filters', async () => {
  await assert.rejects(() => runXSearch({
    accessToken: 'tok',
    model: 'grok-4.6',
    query: 'q',
    allowed_x_handles: ['xai'],
    excluded_x_handles: ['grok'],
    timeoutMs: 1000,
    retries: 0,
    fetchImpl: async () => ({ ok: true, text: async () => '{}' }),
  }), /cannot be used together/)
})

test('runXSearch auto-recovers on HTTP 401 with onUnauthorized hook', async () => {
  clearXSearchCache()
  let attempts = 0
  let hookCalled = 0
  const fetchImpl = async (url, init) => {
    attempts++
    const authHeader = init.headers?.authorization || init.headers?.Authorization
    if (authHeader === 'Bearer old-tok') {
      return {
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: 'Token expired' } }),
      }
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ output_text: 'Recovered answer', citations: [] }),
    }
  }

  const result = await runXSearch({
    accessToken: 'old-tok',
    model: 'grok-4.6',
    query: 'test query',
    enable_cache: false,
    fetchImpl,
    onUnauthorized: async () => {
      hookCalled++
      return 'new-tok'
    },
  })

  assert.equal(result.success, true)
  assert.equal(result.answer, 'Recovered answer')
  assert.equal(hookCalled, 1)
  assert.equal(attempts, 2)
})

test('extractCitations canonicalizes tracking params and deduplicates tweet URLs', () => {
  const cites = extractCitations({
    citations: [
      { url: 'https://twitter.com/elonmusk/status/123456?s=20&t=abcdef', title: 'Tweet 1' },
      { url: 'https://x.com/elonmusk/status/123456?ref_src=twsrc', title: 'Tweet 1 duplicate' },
      { url: 'https://x.com/elonmusk/status/789012', title: 'Tweet 2' },
    ],
  })
  assert.equal(cites.length, 2)
  assert.equal(cites[0].url, 'https://x.com/elonmusk/status/123456')
  assert.equal(cites[1].url, 'https://x.com/elonmusk/status/789012')
})

