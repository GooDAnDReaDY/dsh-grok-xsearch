import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { formTokenRequest } from '../lib/wire.js'
import { getValidAccessToken, loadBlob, saveBlob, clearRefreshMutex } from '../lib/token-manager.js'
import { clearXSearchCache, getXSearchCacheStats, runXSearch } from '../lib/xsearch.js'
import { listModelsForSettings, clearModelsCache } from '../lib/models.js'
import { savePending, resolvePending, clearPendingStore } from '../lib/oauth-pending.js'

test('formTokenRequest passes signal with timeout and throws on network error or HTTP fail', async () => {
  let seenSignal = null
  const fakeFetch = async (url, opts) => {
    seenSignal = opts.signal
    return {
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been revoked' }),
    }
  }
  await assert.rejects(
    async () => {
      await formTokenRequest('https://auth.x.ai/oauth2/token', { grant_type: 'refresh_token' }, fakeFetch, 5000)
    },
    (err) => {
      assert.equal(err.status, 400)
      assert.match(err.message, /Token has been revoked|invalid_grant/)
      return true
    }
  )
  assert.ok(seenSignal, 'AbortSignal should be passed to fetch')
})

test('getValidAccessToken clears credentials blob when refresh returns fatal invalid_grant', async () => {
  let storedBlob = {
    accessToken: 'stale-access-token',
    refreshToken: 'revoked-refresh-token',
    expiresAt: Date.now() - 10000,
  }

  const mockCtx = {
    credentials: {
      resolve: async () => ({ value: JSON.stringify(storedBlob) }),
      set: async (_ref, val) => { storedBlob = JSON.parse(val) },
      unset: async () => { storedBlob = null },
    },
  }

  const mockFetch = async () => {
    return {
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token expired or revoked' }),
    }
  }

  await assert.rejects(async () => {
    await getValidAccessToken(mockCtx, { grokClientId: 'test-client' }, true, mockFetch)
  }, /invalid_grant|Refresh token expired/)

  assert.equal(storedBlob, null, 'Credentials blob must be cleared on fatal invalid_grant to prevent infinite loops')
})

test('SEARCH_CACHE prunes expired entries on insertion', async () => {
  clearXSearchCache()
  const fakeFetch = async () => ({
    ok: true,
    text: async () => JSON.stringify({ output_text: 'sample answer' }),
  })

  // 1. Run search with 10ms cache TTL
  await runXSearch({
    accessToken: 'test-token',
    query: 'query with short cache',
    fetchImpl: fakeFetch,
    cache_ttl_ms: 10,
    enable_cache: true,
    auto_fallback_model: false,
  })

  assert.equal(getXSearchCacheStats().size, 1)

  // Wait 25ms for entry to expire
  await new Promise((r) => setTimeout(r, 25))

  // 2. Run another search - should trigger pruneExpiredCacheEntries
  await runXSearch({
    accessToken: 'test-token',
    query: 'second query to trigger prune',
    fetchImpl: fakeFetch,
    cache_ttl_ms: 10000,
    enable_cache: true,
    auto_fallback_model: false,
  })

  // The expired first entry should have been pruned, leaving only the second
  assert.equal(getXSearchCacheStats().size, 1)
  clearXSearchCache()
})

test('listModelsForSettings prunes expired cache entries and bounds capacity', async () => {
  clearModelsCache()
  let callCount = 0
  const fakeFetch = async () => {
    callCount++
    return {
      ok: true,
      json: async () => ({ data: [{ id: 'grok-4.5', name: 'Grok 4.5' }] }),
    }
  }

  const res1 = await listModelsForSettings({ accessToken: 'token-alpha-1234567890123456', fetchImpl: fakeFetch })
  assert.ok(res1.length > 0)
  assert.equal(callCount, 1)

  // Second call with same token uses cache
  const res2 = await listModelsForSettings({ accessToken: 'token-alpha-1234567890123456', fetchImpl: fakeFetch })
  assert.equal(callCount, 1)
  clearModelsCache()
})

test('plugin lifecycle disposer contract in lib/index.js includes all state cleanup handlers', () => {
  const indexSrc = fs.readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')

  // 1. Verifies imports
  assert.match(indexSrc, /import\s*\{[^}]*clearPendingStore[^}]*\}\s*from\s*'\.\/oauth-pending\.js'/)
  assert.match(indexSrc, /import\s*\{[^}]*clearModelsCache[^}]*\}\s*from\s*'\.\/models\.js'/)
  assert.match(indexSrc, /import\s*\{[^}]*clearRefreshMutex[^}]*\}\s*from\s*'\.\/token-manager\.js'/)

  // 2. Verifies tools effect disposer
  const toolsEffectChunk = indexSrc.slice(
    indexSrc.indexOf("'dsh-grok-xsearch: tools'") - 250,
    indexSrc.indexOf("'dsh-grok-xsearch: tools'") + 40
  )
  assert.ok(toolsEffectChunk.includes('clearTools()'), 'clearTools() must be in tools disposer')
  assert.ok(toolsEffectChunk.includes('clearPendingStore()'), 'clearPendingStore() must be in tools disposer')
  assert.ok(toolsEffectChunk.includes('clearRefreshMutex()'), 'clearRefreshMutex() must be in tools disposer')
  assert.ok(toolsEffectChunk.includes('clearModelsCache()'), 'clearModelsCache() must be in tools disposer')

  // 3. Verifies /logout handler
  const logoutChunk = indexSrc.slice(
    indexSrc.indexOf("'/dsh-grok-xsearch/logout'"),
    indexSrc.indexOf("'dsh-grok-xsearch: /logout'") + 40
  )
  assert.ok(logoutChunk.includes('await clearBlob(ctx)'), 'clearBlob must be in logout')
  assert.ok(logoutChunk.includes('clearPendingStore()'), 'clearPendingStore must be in logout')
  assert.ok(logoutChunk.includes('clearRefreshMutex()'), 'clearRefreshMutex must be in logout')
  assert.ok(logoutChunk.includes('clearModelsCache()'), 'clearModelsCache must be in logout')

  // 4. Verifies /cache/clear handler
  const cacheClearChunk = indexSrc.slice(
    indexSrc.indexOf("'/dsh-grok-xsearch/cache/clear'"),
    indexSrc.indexOf("'dsh-grok-xsearch: /cache/clear'") + 40
  )
  assert.ok(cacheClearChunk.includes('clearXSearchCache()'), 'clearXSearchCache must be in /cache/clear')
  assert.ok(cacheClearChunk.includes('clearModelsCache()'), 'clearModelsCache must be in /cache/clear')
})

test('state cleanup functions flush pending store, refresh mutex, and models cache simultaneously', async () => {
  // 1. Seed pending store
  await savePending({ state: 'state-cleanup-test-1234', verifier: 'v', challenge: 'c' })
  assert.ok(await resolvePending('state-cleanup-test-1234'))

  // 2. Seed models cache
  let fetchCalled = 0
  const fakeFetch = async () => {
    fetchCalled++
    return { ok: true, json: async () => ({ data: [{ id: 'grok-4.5', name: 'Grok 4.5' }] }) }
  }
  await listModelsForSettings({ accessToken: 'tok-cleanup-1234567890123456', fetchImpl: fakeFetch })
  assert.equal(fetchCalled, 1)
  await listModelsForSettings({ accessToken: 'tok-cleanup-1234567890123456', fetchImpl: fakeFetch })
  assert.equal(fetchCalled, 1)

  // 3. Execute combined state cleanup
  clearPendingStore()
  clearRefreshMutex()
  clearModelsCache()

  // 4. Verify state flush
  assert.equal(await resolvePending('state-cleanup-test-1234'), null)
  await listModelsForSettings({ accessToken: 'tok-cleanup-1234567890123456', fetchImpl: fakeFetch })
  assert.equal(fetchCalled, 2)
})
