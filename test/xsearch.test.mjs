import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHandles, validateDateRange, buildXSearchPayload, extractAnswer, extractCitations } from '../lib/xsearch.js'

test('normalizeHandles strips @ and enforces max', () => {
  assert.deepEqual(normalizeHandles(['@xai', 'grok'], 'allowed_x_handles'), ['xai', 'grok'])
  assert.throws(() => normalizeHandles(Array.from({ length: 11 }, (_, i) => `u${i}`), 'allowed_x_handles'))
})

test('validateDateRange rejects inverted and future from_date', () => {
  assert.throws(() => validateDateRange('2026-04-10', '2026-04-01'))
  assert.throws(() => validateDateRange('2099-01-01', ''))
})

test('buildXSearchPayload uses x_search tool type', () => {
  const body = buildXSearchPayload({ model: 'grok-4.20-reasoning', query: 'hello', allowed: ['xai'], excluded: [], fromDate: '', toDate: '', enableImage: false, enableVideo: false })
  assert.equal(body.tools[0].type, 'x_search')
  assert.equal(body.tools[0].allowed_x_handles[0], 'xai')
})

test('extractAnswer prefers output_text', () => {
  assert.equal(extractAnswer({ output_text: 'ok' }), 'ok')
})
