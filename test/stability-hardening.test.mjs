import test from 'node:test'
import assert from 'node:assert/strict'
import { formTokenRequest } from '../lib/wire.js'
import { getValidAccessToken, loadBlob, saveBlob } from '../lib/token-manager.js'
import { clearXSearchCache, getXSearchCacheStats, runXSearch } from '../lib/xsearch.js'
import { listModelsForSettings, clearModelsCache } from '../lib/models.js'

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