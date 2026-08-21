import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { normalizePendingRow, savePending, resolvePending, deletePending } from '../lib/oauth-pending.js'

const dir = path.join(process.env.HOME || '/tmp', '.dsh', 'storages', 'dsh-grok-xsearch', 'oauth-pending')

test('resolvePending finds saved row by state and sole-session fallback', async () => {
  process.env.DSH_HOME = path.join(process.env.HOME || '/tmp', '.dsh')
  await rm(dir, { recursive: true, force: true })
  const pkce = { verifier: 'v', challenge: 'c', state: 'abc123' }
  await savePending(normalizePendingRow(pkce, 'http://127.0.0.1:56121/callback'))
  const byState = await resolvePending('abc123')
  assert.equal(byState.verifier, 'v')
  const fallback = await resolvePending('')
  assert.equal(fallback.state, 'abc123')
  await deletePending('abc123')
})
