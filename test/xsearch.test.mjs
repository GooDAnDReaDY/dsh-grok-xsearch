import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeHandles,
  validateDateRange,
  buildXSearchPayload,
  extractAnswer,
  extractCitations,
  runXSearch,
} from '../lib/xsearch.js'

test('normalizeHandles strips @ and enforces max', () => {
  assert.deepEqual(normalizeHandles(['@xai', 'grok'], 'allowed_x_handles'), ['xai', 'grok'])
  assert.throws(() => normalizeHandles(Array.from({ length: 11 }, (_, i) => `u${i}`), 'allowed_x_handles'))
})

test('validateDateRange rejects inverted and future from_date', () => {
  assert.throws(() => validateDateRange('2026-04-10', '2026-04-01'))
  assert.throws(() => validateDateRange('2099-01-01', ''))
})

test('buildXSearchPayload matches Hermes x_search request shape', () => {
  const body = buildXSearchPayload({
    model: 'grok-4.6',
    query: 'What are people saying about xAI on X?',
    allowed: ['xai', 'grok'],
    excluded: [],
    fromDate: '2026-04-01',
    toDate: '2026-04-10',
    enableImage: true,
    enableVideo: false,
  })
  assert.equal(body.model, 'grok-4.6')
  assert.equal(body.store, false)
  assert.equal(body.tools[0].type, 'x_search')
  assert.deepEqual(body.tools[0].allowed_x_handles, ['xai', 'grok'])
  assert.equal(body.tools[0].from_date, '2026-04-01')
  assert.equal(body.tools[0].enable_image_understanding, true)
})

test('extractAnswer and inline citations', () => {
  assert.equal(extractAnswer({ output_text: 'ok' }), 'ok')
  const cites = extractCitations({
    citations: [{ url: 'https://x.com/a/1', title: 'A' }],
    output: [{
      type: 'message',
      content: [{
        annotations: [{ type: 'url_citation', url: 'https://x.com/b/2', title: 'B' }],
      }],
    }],
  })
  assert.equal(cites.length, 2)
})

test('runXSearch posts to api.x.ai responses and flags degraded', async () => {
  let captured
  const fetchImpl = async (url, init) => {
    captured = { url, init, body: JSON.parse(init.body) }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        output_text: 'No indexed posts found.',
        citations: [],
        output: [],
      }),
    }
  }
  const result = await runXSearch({
    accessToken: 'tok',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.6',
    query: 'xAI launch reactions',
    allowed_x_handles: ['xai'],
    timeoutMs: 5000,
    retries: 0,
    fetchImpl,
  })
  assert.equal(captured.url, 'https://api.x.ai/v1/responses')
  assert.equal(captured.body.tools[0].type, 'x_search')
  assert.equal(result.degraded, true)
  assert.match(result.answer, /No indexed/)
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
