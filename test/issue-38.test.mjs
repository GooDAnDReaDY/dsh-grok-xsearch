import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createThreadReaderTool,
  createFindExpertsTool,
  createXSearchTool,
  normalizeToolParameters,
} from '../lib/x-tools.js'
import {
  buildXSearchPayload,
  runXSearch,
  clearXSearchCache,
  getXSearchCacheStats,
} from '../lib/xsearch.js'

test('x_thread_reader: tool schema has strict parameters and proper metadata', () => {
  const tool = createThreadReaderTool({
    getContext: () => ({}),
    getConfig: () => ({ timeoutSeconds: 180 }),
    runSearch: async () => ({}),
    getAccessToken: async () => 'test-token',
    defineTool: (def) => def,
  })

  assert.equal(tool.name, 'x_thread_reader')
  assert.equal(tool.parameters.type, 'object')
  assert.equal(tool.parameters.additionalProperties, false)
  assert.deepEqual(tool.parameters.required, ['tweet_url_or_id'])
  assert.ok(tool.parameters.properties.tweet_url_or_id)
  assert.ok(tool.parameters.properties.include_replies)
  assert.ok(tool.parameters.properties.max_depth)
  assert.ok(tool.parameters.properties.extract_tables)
})

test('x_thread_reader: correctly parses tweet URL and calls search with target context', async () => {
  let searchArgs = null
  const tool = createThreadReaderTool({
    getContext: () => ({}),
    getConfig: () => ({
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.5',
      timeoutSeconds: 120,
      retries: 2,
      autoFallbackModel: true,
      enableCache: true,
      cacheTtlSeconds: 300,
    }),
    runSearch: async (opts) => {
      searchArgs = opts
      return {
        success: true,
        answer: 'This is the reconstructed thread response.',
        citations: [{ url: 'https://x.com/ylecun/status/183123456789', title: 'Yann LeCun thread' }],
      }
    },
    getAccessToken: async () => 'mock-token',
    defineTool: (def) => def,
  })

  const result = await tool.execute({
    tweet_url_or_id: 'https://x.com/ylecun/status/183123456789',
    include_replies: true,
    max_depth: 8,
    extract_tables: true,
  })

  assert.equal(result.tweet_id, '183123456789')
  assert.equal(result.author, '@ylecun')
  assert.ok(searchArgs.query.includes('183123456789'))
  assert.ok(searchArgs.query.includes('ylecun'))
  assert.deepEqual(searchArgs.allowed_x_handles, ['ylecun'])
  assert.equal(searchArgs.only_threads, true)
  assert.equal(searchArgs.extract_tables, true)

  const rendered = tool.output.render({}, result)
  assert.ok(rendered[0].text.includes('Thread Target: 183123456789 (@ylecun)'))
  assert.ok(rendered[0].text.includes('Yann LeCun thread'))
})

test('x_thread_reader: correctly parses numeric tweet ID without URL', async () => {
  let searchArgs = null
  const tool = createThreadReaderTool({
    getContext: () => ({}),
    getConfig: () => ({ model: 'grok-4.5', timeoutSeconds: 60 }),
    runSearch: async (opts) => {
      searchArgs = opts
      return { success: true, answer: 'Thread text' }
    },
    getAccessToken: async () => 'mock-token',
    defineTool: (def) => def,
  })

  const result = await tool.execute({
    tweet_url_or_id: '998877665544332211',
  })

  assert.equal(result.tweet_id, '998877665544332211')
  assert.equal(result.author, undefined)
  assert.ok(searchArgs.query.includes('998877665544332211'))
})

test('x_thread_reader: throws when tweet_url_or_id is missing', async () => {
  const tool = createThreadReaderTool({
    getContext: () => ({}),
    getConfig: () => ({}),
    runSearch: async () => ({}),
    getAccessToken: async () => 'mock-token',
    defineTool: (def) => def,
  })

  await assert.rejects(
    async () => tool.execute({ tweet_url_or_id: '' }),
    /tweet_url_or_id is required/
  )
})

test('x_find_experts: tool schema has strict parameters and proper metadata', () => {
  const tool = createFindExpertsTool({
    getContext: () => ({}),
    getConfig: () => ({ timeoutSeconds: 180 }),
    runSearch: async () => ({}),
    getAccessToken: async () => 'test-token',
    defineTool: (def) => def,
  })

  assert.equal(tool.name, 'x_find_experts')
  assert.equal(tool.parameters.type, 'object')
  assert.equal(tool.parameters.additionalProperties, false)
  assert.deepEqual(tool.parameters.required, ['domain_or_topic'])
  assert.ok(tool.parameters.properties.domain_or_topic)
  assert.ok(tool.parameters.properties.min_followers)
  assert.ok(tool.parameters.properties.language)
  assert.ok(tool.parameters.properties.limit)
})

test('x_find_experts: executes with domain query and clamps limits', async () => {
  let searchArgs = null
  const tool = createFindExpertsTool({
    getContext: () => ({}),
    getConfig: () => ({
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.5',
      timeoutSeconds: 180,
    }),
    runSearch: async (opts) => {
      searchArgs = opts
      return {
        success: true,
        answer: '1. @karpathy - Leading AI researcher\n2. @sama - CEO of OpenAI',
        citations: [{ url: 'https://x.com/karpathy', title: 'Andrej Karpathy' }],
      }
    },
    getAccessToken: async () => 'mock-token',
    defineTool: (def) => def,
  })

  const result = await tool.execute({
    domain_or_topic: 'distributed LLM training',
    min_followers: 50000,
    language: 'en',
    limit: 20, // exceeds max 15, should clamp to 15
  })

  assert.equal(result.domain, 'distributed LLM training')
  assert.ok(searchArgs.query.includes('top 15 most authoritative researchers'))
  assert.ok(searchArgs.query.includes('distributed LLM training'))
  assert.ok(searchArgs.query.includes('50000 followers'))
  assert.equal(searchArgs.only_original_posts, true)

  const rendered = tool.output.render({}, result)
  assert.ok(rendered[0].text.includes('Experts in: distributed LLM training'))
  assert.ok(rendered[0].text.includes('Andrej Karpathy'))
})

test('x_find_experts: throws when domain_or_topic is missing', async () => {
  const tool = createFindExpertsTool({
    getContext: () => ({}),
    getConfig: () => ({}),
    runSearch: async () => ({}),
    getAccessToken: async () => 'mock-token',
    defineTool: (def) => def,
  })

  await assert.rejects(
    async () => tool.execute({ domain_or_topic: '' }),
    /domain_or_topic is required/
  )
})

test('buildXSearchPayload: includes extractTables directive and forces image understanding', () => {
  const payload = buildXSearchPayload({
    model: 'grok-4.5',
    query: 'NVIDIA quarterly earnings',
    extractTables: true,
  })

  assert.equal(payload.tools[0].enable_image_understanding, true)
  const userContent = payload.input[0].content
  assert.ok(userContent.includes('Markdown table format (| col1 | col2 |)'))
})

test('xsearch cache: tracks hits, misses, total requests and computes accurate hitRate', async () => {
  clearXSearchCache()
  const initialStats = getXSearchCacheStats()
  assert.equal(initialStats.hits, 0)
  assert.equal(initialStats.misses, 0)
  assert.equal(initialStats.hitRate, 0)

  let fetchCalls = 0
  const mockFetch = async () => {
    fetchCalls++
    return {
      ok: true,
      status: 200,
      json: async () => ({
        output: [{ type: 'message', content: [{ type: 'output_text', text: 'Cached result text' }] }],
        citations: [],
      }),
      text: async () => JSON.stringify({
        output: [{ type: 'message', content: [{ type: 'output_text', text: 'Cached result text' }] }],
        citations: [],
      }),
    }
  }

  // 1st request -> cache miss
  const res1 = await runXSearch({
    accessToken: 'mock-token',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.5',
    query: 'query for cache testing',
    fetchImpl: mockFetch,
    enable_cache: true,
    cache_ttl_ms: 10000,
  })
  assert.equal(res1.from_cache, false)
  assert.equal(fetchCalls, 1)

  const statsAfterMiss = getXSearchCacheStats()
  assert.equal(statsAfterMiss.hits, 0)
  assert.equal(statsAfterMiss.misses, 1)
  assert.equal(statsAfterMiss.hitRate, 0)

  // 2nd request -> cache hit
  const res2 = await runXSearch({
    accessToken: 'mock-token',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.5',
    query: 'query for cache testing',
    fetchImpl: mockFetch,
    enable_cache: true,
    cache_ttl_ms: 10000,
  })
  assert.equal(res2.from_cache, true)
  assert.equal(fetchCalls, 1) // no extra network call

  const statsAfterHit = getXSearchCacheStats()
  assert.equal(statsAfterHit.hits, 1)
  assert.equal(statsAfterHit.misses, 1)
  assert.equal(statsAfterHit.hitRate, 50) // 1 hit / 2 total = 50%

  // 3rd request -> second cache hit
  const res3 = await runXSearch({
    accessToken: 'mock-token',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.5',
    query: 'query for cache testing',
    fetchImpl: mockFetch,
    enable_cache: true,
    cache_ttl_ms: 10000,
  })
  assert.equal(res3.from_cache, true)

  const statsAfterHit2 = getXSearchCacheStats()
  assert.equal(statsAfterHit2.hits, 2)
  assert.equal(statsAfterHit2.misses, 1)
  assert.equal(statsAfterHit2.hitRate, 67) // 2 / 3 = 67%

  clearXSearchCache()
  const statsAfterClear = getXSearchCacheStats()
  assert.equal(statsAfterClear.size, 0)
  assert.equal(statsAfterClear.hits, 0)
  assert.equal(statsAfterClear.misses, 0)
})

test('locale standard: lib/client.js contains zero Cyrillic characters', () => {
  const clientJsPath = join(process.cwd(), 'lib/client.js')
  const content = readFileSync(clientJsPath, 'utf8')
  const cyrillicMatches = content.match(/[\u0400-\u04FF]/g)
  assert.equal(cyrillicMatches, null, 'lib/client.js must contain no Cyrillic characters')
})
