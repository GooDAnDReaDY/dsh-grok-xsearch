import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createXSearchTool,
  createAuthorProfileTool,
  createTrendingTopicsTool,
  createFactCheckNotesTool,
  normalizeToolParameters,
} from '../lib/x-tools.js'

const mockDefineTool = (toolDef) => ({ ...toolDef, __wrappedWithDefineTool: true })

test('normalizeToolParameters converts legacy property maps to JSON Schema with additionalProperties false', () => {
  const tool = normalizeToolParameters({
    name: 'demo',
    parameters: { query: { type: 'string', required: true, description: 'q' } },
  })
  assert.deepEqual(tool.parameters, {
    type: 'object',
    properties: { query: { type: 'string', description: 'q' } },
    required: ['query'],
    additionalProperties: false,
  })
})

test('all four companion tool factories throw TypeError when defineTool is omitted', () => {
  const baseOpts = {
    getContext: () => ({}),
    getConfig: () => ({}),
    runSearch: async () => ({}),
    getAccessToken: async () => 'tok',
  }

  assert.throws(
    () => createXSearchTool(baseOpts),
    /defineTool function is required to construct x_search tool schema/
  )
  assert.throws(
    () => createAuthorProfileTool(baseOpts),
    /defineTool function is required to construct x_author_profile tool schema/
  )
  assert.throws(
    () => createTrendingTopicsTool(baseOpts),
    /defineTool function is required to construct x_trending_topics tool schema/
  )
  assert.throws(
    () => createFactCheckNotesTool(baseOpts),
    /defineTool function is required to construct x_fact_check_notes tool schema/
  )
})

test('all four companion tool factories produce strict JSON Schema parameters (compat issue #16)', () => {
  const factories = [
    { name: 'x_search', fn: createXSearchTool, req: ['query'] },
    { name: 'x_author_profile', fn: createAuthorProfileTool, req: ['handle'] },
    { name: 'x_trending_topics', fn: createTrendingTopicsTool, req: [] },
    { name: 'x_fact_check_notes', fn: createFactCheckNotesTool, req: ['claim'] },
  ]
  for (const { name, fn, req } of factories) {
    const tool = fn({
      getContext: () => ({}),
      getConfig: () => ({}),
      runSearch: async () => ({}),
      getAccessToken: async () => 'tok',
      defineTool: mockDefineTool,
    })
    assert.equal(tool.name, name)
    assert.equal(typeof tool.parameters, 'object')
    assert.equal(tool.parameters.type, 'object')
    assert.equal(tool.parameters.additionalProperties, false)
    assert.ok(tool.parameters.properties && typeof tool.parameters.properties === 'object')
    assert.ok(Array.isArray(tool.parameters.required))
    assert.deepEqual(tool.parameters.required, req)
  }
})

test('createXSearchTool defines valid tool schema and executes', async () => {
  let capturedSearchOpts
  const tool = createXSearchTool({
    getContext: () => ({}),
    getConfig: () => ({
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.6',
      timeoutSeconds: 60,
      retries: 1,
      autoFallbackModel: true,
      enableCache: true,
      cacheTtlSeconds: 300,
    }),
    runSearch: async (opts) => {
      capturedSearchOpts = opts
      return {
        success: true,
        answer: 'Search results for query.',
        citations: [{ url: 'https://x.com/post/1', title: 'Tweet' }],
        degraded: false,
        model: 'grok-4.6',
      }
    },
    getAccessToken: async () => 'test-token',
    defineTool: mockDefineTool,
  })

  assert.equal(tool.name, 'x_search')
  assert.equal(tool.__wrappedWithDefineTool, true)
  assert.equal(tool.parameters.type, 'object')
  assert.equal(tool.parameters.additionalProperties, false)
  assert.ok(tool.parameters.properties.query)
  assert.deepEqual(tool.parameters.required, ['query'])

  const res = await tool.execute({ query: 'DeepSeek news' })
  assert.equal(res.success, true)
  assert.equal(capturedSearchOpts.query, 'DeepSeek news')
})

test('createAuthorProfileTool defines valid tool schema and executes', async () => {
  let capturedSearchOpts
  const tool = createAuthorProfileTool({
    getContext: () => ({}),
    getConfig: () => ({
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.6',
      timeoutSeconds: 60,
      retries: 1,
      autoFallbackModel: true,
      enableCache: true,
      cacheTtlSeconds: 300,
    }),
    runSearch: async (opts) => {
      capturedSearchOpts = opts
      return {
        success: true,
        answer: 'Author is active in World Models and JEPA research.',
        citations: [{ url: 'https://x.com/ylecun/status/12345', title: 'Post' }],
        degraded: false,
        model: 'grok-4.6',
      }
    },
    getAccessToken: async () => 'test-token',
    defineTool: mockDefineTool,
  })

  assert.equal(tool.name, 'x_author_profile')
  assert.equal(tool.__wrappedWithDefineTool, true)
  assert.equal(tool.parameters.type, 'object')
  assert.equal(tool.parameters.additionalProperties, false)
  assert.ok(tool.parameters.properties.handle)
  assert.deepEqual(tool.parameters.required, ['handle'])

  const res = await tool.execute({
    handle: '@ylecun',
    focus_topic: 'World Models and JEPA',
  })

  assert.equal(res.success, true)
  assert.equal(res.author, '@ylecun')
  assert.deepEqual(capturedSearchOpts.allowed_x_handles, ['ylecun'])
  assert.match(capturedSearchOpts.query, /World Models and JEPA/)

  const rendered = tool.output.render({}, res)
  assert.ok(rendered[0].text.includes('Author: @ylecun'))
  assert.ok(rendered[0].text.includes('World Models'))
})

test('createTrendingTopicsTool defines valid schema and executes', async () => {
  let capturedSearchOpts
  const tool = createTrendingTopicsTool({
    getContext: () => ({}),
    getConfig: () => ({
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.6',
      timeoutSeconds: 60,
      retries: 1,
      autoFallbackModel: true,
      enableCache: true,
      cacheTtlSeconds: 300,
    }),
    runSearch: async (opts) => {
      capturedSearchOpts = opts
      return {
        success: true,
        answer: 'Trending: new model release announcement discussions.',
        citations: [{ url: 'https://x.com/tech_news/status/98765', title: 'Trending News' }],
        degraded: false,
        model: 'grok-4.6',
      }
    },
    getAccessToken: async () => 'test-token',
    defineTool: mockDefineTool,
  })

  assert.equal(tool.name, 'x_trending_topics')
  assert.equal(tool.__wrappedWithDefineTool, true)
  assert.equal(tool.parameters.type, 'object')
  assert.equal(tool.parameters.additionalProperties, false)
  assert.deepEqual(tool.parameters.required, [])
  assert.ok(tool.parameters.properties.domain)
  const res = await tool.execute({
    domain: 'ai',
    region: 'Global',
    timeframe: 'today',
    min_likes: 50,
  })

  assert.equal(res.success, true)
  assert.equal(res.domain, 'ai')
  assert.equal(capturedSearchOpts.min_likes, 50)
  assert.match(capturedSearchOpts.query, /ai domain/)

  const rendered = tool.output.render({}, res)
  assert.ok(rendered[0].text.includes('Trending Domain: ai'))
})

test('createFactCheckNotesTool defines valid schema and executes', async () => {
  let capturedSearchOpts
  const tool = createFactCheckNotesTool({
    getContext: () => ({}),
    getConfig: () => ({
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.6',
      timeoutSeconds: 60,
      retries: 1,
      autoFallbackModel: true,
      enableCache: true,
      cacheTtlSeconds: 300,
    }),
    runSearch: async (opts) => {
      capturedSearchOpts = opts
      return {
        success: true,
        answer: 'Community Note verified: claim is misleading.',
        citations: [{ url: 'https://x.com/factcheck/status/55555', title: 'Correction' }],
        degraded: false,
        model: 'grok-4.6',
      }
    },
    getAccessToken: async () => 'test-token',
    defineTool: mockDefineTool,
  })

  assert.equal(tool.name, 'x_fact_check_notes')
  assert.equal(tool.__wrappedWithDefineTool, true)
  assert.equal(tool.parameters.type, 'object')
  assert.equal(tool.parameters.additionalProperties, false)
  assert.deepEqual(tool.parameters.required, ['claim'])
  assert.ok(tool.parameters.properties.claim)
  const res = await tool.execute({
    claim: 'New quantum computer broke RSA encryption today',
    target_url: 'https://x.com/viral_post/status/11111',
  })

  assert.equal(res.success, true)
  assert.equal(res.claim, 'New quantum computer broke RSA encryption today')
  assert.match(capturedSearchOpts.query, /Fact check the following claim/)
  assert.match(capturedSearchOpts.query, /11111/)

  const rendered = tool.output.render({}, res)
  assert.ok(rendered[0].text.includes('Claim Checked:'))
})
