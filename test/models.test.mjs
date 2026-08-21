import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_XSEARCH_MODEL, XSEARCH_MODELS, listModelsForSettings, mergeModels, normalizeXSearchModel } from '../lib/models.js'

test('default model is grok-4.6', () => {
  assert.equal(DEFAULT_XSEARCH_MODEL, 'grok-4.6')
})

test('static catalog includes grok-4.5 and grok-4.3', () => {
  const ids = XSEARCH_MODELS.map((row) => row.id)
  assert.ok(ids.includes('grok-4.5'))
  assert.ok(ids.includes('grok-4.3'))
})

test('normalizeXSearchModel falls back to default', () => {
  assert.equal(normalizeXSearchModel(''), 'grok-4.6')
  assert.equal(normalizeXSearchModel('grok-4.5'), 'grok-4.5')
})

test('listModelsForSettings merges API models with static fallback', async () => {
  const models = await listModelsForSettings({
    accessToken: 'token',
    baseUrl: 'https://api.x.ai/v1',
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return { data: [{ id: 'grok-4.5', name: 'Grok 4.5' }, { id: 'grok-embed-v1' }] }
      },
    }),
  })
  assert.ok(models.some((row) => row.id === 'grok-4.5'))
  assert.ok(!models.some((row) => row.id === 'grok-embed-v1'))
  assert.ok(models.some((row) => row.id === 'grok-4.6'))
})

test('mergeModels keeps preferred order', () => {
  const rows = mergeModels([{ id: 'grok-4', name: 'Grok 4' }, { id: 'grok-4.6', name: 'Grok 4.6' }])
  assert.equal(rows[0].id, 'grok-4.6')
})
