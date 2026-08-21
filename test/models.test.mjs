import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_XSEARCH_MODEL, normalizeXSearchModel, modelOptions } from '../lib/models.js'

test('default model is grok-4.6', () => {
  assert.equal(DEFAULT_XSEARCH_MODEL, 'grok-4.6')
})

test('normalizeXSearchModel falls back to default', () => {
  assert.equal(normalizeXSearchModel(''), 'grok-4.6')
  assert.equal(normalizeXSearchModel('grok-4.6'), 'grok-4.6')
})

test('modelOptions keeps unknown custom model', () => {
  const rows = modelOptions('grok-custom')
  assert.equal(rows[0].id, 'grok-custom')
})
