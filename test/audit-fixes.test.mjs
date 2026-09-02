import test from 'node:test'
import assert from 'node:assert/strict'
import { tokenBlobFromOAuth } from '../lib/wire.js'
import { readBody } from '../lib/http.js'
import { parseCallbackInput } from '../lib/oauth.js'
import { isValidState } from '../lib/oauth-pending.js'
import { normalizeHandles, validateDateRange, normalizeCitation, runXSearch } from '../lib/xsearch.js'
import { listModelsForSettings } from '../lib/models.js'
import { Readable } from 'node:stream'

test('tokenBlobFromOAuth preserves refreshToken when server does not reissue it on refresh', () => {
  const jsonWithoutRefresh = { access_token: 'new-access-tok', expires_in: 3600 }
  const blob = tokenBlobFromOAuth(jsonWithoutRefresh, {
    label: 'Test',
    email: 'user@test.com',
    refreshToken: 'keep-existing-refresh-token',
  })
  assert.equal(blob.accessToken, 'new-access-tok')
  assert.equal(blob.refreshToken, 'keep-existing-refresh-token')
})

test('readBody enforces default maxBytes limit and rejects oversized payload', async () => {
  const bigChunk = Buffer.alloc(70 * 1024, 'a')
  const stream = Readable.from([bigChunk])
  await assert.rejects(() => readBody(stream, 64 * 1024), /body too large/)
})

test('parseCallbackInput preserves state when both query string and hash are present', () => {
  const url = 'http://localhost:3000/callback?code=abc1234&state=xyz987#section'
  const parsed = parseCallbackInput(url)
  assert.equal(parsed.code, 'abc1234')
  assert.equal(parsed.state, 'xyz987')
})

test('normalizeHandles deduplicates handles before checking MAX_HANDLES', () => {
  const handles = ['@sama', 'sama', '@sama', 'ylecun']
  const normalized = normalizeHandles(handles, 'allowed_x_handles')
  assert.deepEqual(normalized, ['sama', 'ylecun'])
})

test('normalizeCitation handles string URLs', () => {
  const norm = normalizeCitation('https://x.com/karpathy/status/1888888888')
  assert.equal(norm.url, 'https://x.com/karpathy/status/1888888888')
  assert.equal(norm.handle, '@karpathy')
  assert.equal(norm.status_id, '1888888888')
})

test('validateDateRange rejects distant future dates', () => {
  assert.throws(() => validateDateRange('2099-01-01', '2099-01-02'), /from_date is in the future/)
  assert.throws(() => validateDateRange('2026-01-01', '2099-01-02'), /to_date is in the future/)
})

test('isValidState accepts safe state strings and rejects path traversal', () => {
  assert.equal(isValidState('abc123_XYZ-789'), true)
  assert.equal(isValidState('../../../etc/passwd'), false)
  assert.equal(isValidState('test:invalid*file'), false)
  assert.equal(isValidState(''), false)
  assert.equal(isValidState('a'), false)
})

test('runXSearch rejects empty or whitespace query', async () => {
  await assert.rejects(() => runXSearch({
    accessToken: 'tok',
    model: 'grok-4.6',
    query: '   ',
  }), /query is required/)
})

test('listModelsForSettings respects timeout signal and does not hang', async () => {
  let signalReceived = null
  const models = await listModelsForSettings({
    accessToken: 'tok',
    baseUrl: 'https://api.x.ai/v1',
    fetchImpl: async (url, init) => {
      signalReceived = init?.signal
      return {
        ok: true,
        json: async () => ({ data: [{ id: 'grok-4.5', name: 'Grok 4.5' }] }),
      }
    },
  })
  assert.ok(signalReceived != null)
  assert.ok(models.some((m) => m.id === 'grok-4.5'))
})
