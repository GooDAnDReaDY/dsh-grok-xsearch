export function normalizeToolParameters(tool) {
  if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
    throw new TypeError('defineTool must return a tool object')
  }
  const parameters = tool.parameters
  if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)
    && parameters.type === 'object' && parameters.properties && typeof parameters.properties === 'object') {
    return {
      ...tool,
      parameters: {
        ...parameters,
        required: Array.isArray(parameters.required) ? parameters.required : [],
        additionalProperties: parameters.additionalProperties !== undefined ? parameters.additionalProperties : false,
      },
    }
  }
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
    throw new TypeError('tool parameters must be a property map or JSON Schema object')
  }
  const properties = {}
  const required = []
  for (const [name, property] of Object.entries(parameters)) {
    if (!property || typeof property !== 'object' || Array.isArray(property)) {
      throw new TypeError('tool parameter ' + name + ' must be a schema object')
    }
    const { required: isRequired, ...schema } = property
    properties[name] = schema
    if (isRequired === true) required.push(name)
  }
  return {
    ...tool,
    parameters: {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    },
  }
}

function splitHandles(value) {
  if (Array.isArray(value)) return value
  return String(value || '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
}

function renderCitations(citations) {
  if (!Array.isArray(citations) || !citations.length) return []
  const lines = ['Citations:']
  for (const c of citations.slice(0, 20)) {
    const handle = c.handle ? ` (${c.handle})` : ''
    const title = c.title ? ` — ${c.title}` : ''
    lines.push(`- ${c.url || ''}${handle}${title}`)
  }
  return lines
}

export function createXSearchTool({ getContext, getConfig, runSearch, getAccessToken, onUnauthorized, defineTool }) {
  if (typeof defineTool !== 'function') {
    throw new TypeError('defineTool function is required to construct x_search tool schema')
  }
  return normalizeToolParameters(defineTool({
    name: 'x_search',
    description: 'Search X (Twitter) posts, threads, metrics, and media via xAI built-in x_search with advanced filters.',
    parameters: {
      query: { type: 'string', required: true, description: 'Natural-language search query.' },
      allowed_x_handles: { type: 'string', description: 'Optional comma-separated @handles to include (max 10).' },
      excluded_x_handles: { type: 'string', description: 'Optional comma-separated @handles to exclude (max 10).' },
      from_date: { type: 'string', description: 'Optional start date YYYY-MM-DD.' },
      to_date: { type: 'string', description: 'Optional end date YYYY-MM-DD.' },
      only_original_posts: { type: 'boolean', description: 'Omit retweets and pure quote echoes.' },
      has_media: { type: 'boolean', description: 'Filter for posts containing images, infographics, code screenshots, or videos.' },
      has_links: { type: 'boolean', description: 'Filter for posts containing links to articles or repositories.' },
      only_threads: { type: 'boolean', description: 'Filter for extended multi-tweet discussion threads.' },
      lang: { type: 'string', description: 'Optional language filter code (e.g. en, ru, ja).' },
      min_likes: { type: 'number', description: 'Optional minimum likes threshold for quality filtering.' },
      min_reposts: { type: 'number', description: 'Optional minimum reposts threshold.' },
      enable_image_understanding: { type: 'boolean', description: 'Let xAI analyze and extract data from images and charts in posts.' },
      enable_video_understanding: { type: 'boolean', description: 'Let xAI analyze video clips and speech in posts.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          success: { type: 'boolean' },
          answer: { type: 'string' },
          citations: { type: 'array' },
          degraded: { type: 'boolean' },
          degraded_reason: { type: 'string' },
          model: { type: 'string' },
          model_switched: { type: 'boolean' },
          from_cache: { type: 'boolean' },
        },
      },
      render(_args, value) {
        const lines = []
        if (value.model_switched) lines.push(`(switched to model: ${value.model} due to rate limits)`)
        if (value.degraded) lines.push(`(degraded: ${value.degraded_reason || 'no citations'})`)
        if (value.answer) lines.push(String(value.answer))
        lines.push(...renderCitations(value.citations))
        return [{ type: 'text', text: lines.join('\n') || JSON.stringify(value) }]
      },
    },
    isConcurrencySafe: () => true,
    timeoutMs: ((Number(getConfig().timeoutSeconds) || 180) + 30) * 1000,
    async execute(args, exec) {
      const cfg = getConfig()
      const token = await getAccessToken(getContext(), cfg)
      if (!token) throw new Error('Grok X Search is not connected. Open Settings and Connect a separate Grok account.')
      return runSearch({
        accessToken: token,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        query: args.query,
        allowed_x_handles: splitHandles(args.allowed_x_handles),
        excluded_x_handles: splitHandles(args.excluded_x_handles),
        from_date: args.from_date,
        to_date: args.to_date,
        only_original_posts: args.only_original_posts,
        has_media: args.has_media,
        has_links: args.has_links,
        only_threads: args.only_threads,
        lang: args.lang,
        min_likes: args.min_likes,
        min_reposts: args.min_reposts,
        enable_image_understanding: args.enable_image_understanding,
        enable_video_understanding: args.enable_video_understanding,
        timeoutMs: ((Number(cfg.timeoutSeconds) || 180) + 30) * 1000,
        retries: cfg.retries,
        signal: exec?.signal,
        auto_fallback_model: cfg.autoFallbackModel,
        enable_cache: cfg.enableCache,
        cache_ttl_ms: (Number(cfg.cacheTtlSeconds) || 300) * 1000,
        onUnauthorized: onUnauthorized || (() => getAccessToken(getContext(), cfg, true)),
      })
    },
  }))
}

export function createAuthorProfileTool({ getContext, getConfig, runSearch, getAccessToken, onUnauthorized, defineTool }) {
  if (typeof defineTool !== 'function') {
    throw new TypeError('defineTool function is required to construct x_author_profile tool schema')
  }
  return normalizeToolParameters(defineTool({
    name: 'x_author_profile',
    description: "Inspect an author's presence, key expertise, recent discussion themes, and stances on X (Twitter).",
    parameters: {
      handle: { type: 'string', required: true, description: "Author's @handle on X (e.g. 'ylecun' or 'sama')." },
      focus_topic: { type: 'string', description: "Optional specific topic or thesis to analyze the author's stance on." },
      from_date: { type: 'string', description: 'Optional start date YYYY-MM-DD.' },
      to_date: { type: 'string', description: 'Optional end date YYYY-MM-DD.' },
      only_original_posts: { type: 'boolean', description: 'Focus on original posts and threads by the author (omit retweets).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          success: { type: 'boolean' },
          answer: { type: 'string' },
          citations: { type: 'array' },
          degraded: { type: 'boolean' },
          degraded_reason: { type: 'string' },
          model: { type: 'string' },
          author: { type: 'string' },
        },
      },
      render(_args, value) {
        const lines = []
        if (value.author) lines.push(`Author: ${value.author}`)
        if (value.degraded) lines.push(`(degraded: ${value.degraded_reason || 'no citations'})`)
        if (value.answer) lines.push(String(value.answer))
        lines.push(...renderCitations(value.citations))
        return [{ type: 'text', text: lines.join('\n') || JSON.stringify(value) }]
      },
    },
    isConcurrencySafe: () => true,
    timeoutMs: ((Number(getConfig().timeoutSeconds) || 180) + 30) * 1000,
    async execute(args, exec) {
      const cfg = getConfig()
      const token = await getAccessToken(getContext(), cfg)
      if (!token) throw new Error('Grok X Search is not connected. Open Settings and Connect a separate Grok account.')

      const rawHandle = String(args.handle || '').trim().replace(/^@/, '')
      if (!rawHandle) throw new Error('handle is required')

      const topicDirective = args.focus_topic
        ? `Focus specifically on their posts and positions regarding: ${args.focus_topic}.`
        : 'Summarize their recent discussion topics, technical/domain positions, and key shared links or threads.'

      const query = `Analyze the posts by @${rawHandle} on X. ${topicDirective}`

      const res = await runSearch({
        accessToken: token,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        query,
        allowed_x_handles: [rawHandle],
        from_date: args.from_date,
        to_date: args.to_date,
        only_original_posts: args.only_original_posts ?? true,
        only_threads: false,
        timeoutMs: ((Number(cfg.timeoutSeconds) || 180) + 30) * 1000,
        retries: cfg.retries,
        signal: exec?.signal,
        auto_fallback_model: cfg.autoFallbackModel,
        enable_cache: cfg.enableCache,
        cache_ttl_ms: (Number(cfg.cacheTtlSeconds) || 300) * 1000,
        onUnauthorized: onUnauthorized || (() => getAccessToken(getContext(), cfg, true)),
      })

      return {
        ...res,
        author: `@${rawHandle}`,
      }
    },
  }))
}

export function createTrendingTopicsTool({ getContext, getConfig, runSearch, getAccessToken, onUnauthorized, defineTool }) {
  if (typeof defineTool !== 'function') {
    throw new TypeError('defineTool function is required to construct x_trending_topics tool schema')
  }
  return normalizeToolParameters(defineTool({
    name: 'x_trending_topics',
    description: 'Discover real-time viral trends, breaking discussions, and emerging debates on X (Twitter) by topic/domain.',
    parameters: {
      domain: { type: 'string', description: "Topic domain (e.g. 'ai', 'crypto', 'politics', 'tech', 'finance'). Default: 'tech'." },
      region: { type: 'string', description: "Geographic focus (e.g. 'US', 'Europe', 'Global'). Default: 'Global'." },
      timeframe: { type: 'string', description: "Timeframe (e.g. 'today', 'past_24h', 'past_week'). Default: 'today'." },
      min_likes: { type: 'number', description: 'Optional minimum likes threshold for viral post detection.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          success: { type: 'boolean' },
          answer: { type: 'string' },
          citations: { type: 'array' },
          degraded: { type: 'boolean' },
          degraded_reason: { type: 'string' },
          model: { type: 'string' },
          domain: { type: 'string' },
        },
      },
      render(_args, value) {
        const lines = []
        if (value.domain) lines.push(`Trending Domain: ${value.domain}`)
        if (value.degraded) lines.push(`(degraded: ${value.degraded_reason || 'no citations'})`)
        if (value.answer) lines.push(String(value.answer))
        lines.push(...renderCitations(value.citations))
        return [{ type: 'text', text: lines.join('\n') || JSON.stringify(value) }]
      },
    },
    isConcurrencySafe: () => true,
    timeoutMs: ((Number(getConfig().timeoutSeconds) || 180) + 30) * 1000,
    async execute(args, exec) {
      const cfg = getConfig()
      const token = await getAccessToken(getContext(), cfg)
      if (!token) throw new Error('Grok X Search is not connected. Open Settings and Connect a separate Grok account.')

      const domain = String(args.domain || 'tech').trim()
      const region = String(args.region || 'Global').trim()
      const timeframe = String(args.timeframe || 'today').trim()

      const query = `What are the top real-time trending discussions, breaking announcements, and viral threads on X in the ${domain} domain (${region}, timeframe: ${timeframe})? Highlight key controversy, consensus, and prominent author posts.`

      const res = await runSearch({
        accessToken: token,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        query,
        min_likes: args.min_likes || 20,
        only_original_posts: true,
        timeoutMs: ((Number(cfg.timeoutSeconds) || 180) + 30) * 1000,
        retries: cfg.retries,
        signal: exec?.signal,
        auto_fallback_model: cfg.autoFallbackModel,
        enable_cache: cfg.enableCache,
        cache_ttl_ms: (Number(cfg.cacheTtlSeconds) || 300) * 1000,
        onUnauthorized: onUnauthorized || (() => getAccessToken(getContext(), cfg, true)),
      })

      return {
        ...res,
        domain,
      }
    },
  }))
}

export function createFactCheckNotesTool({ getContext, getConfig, runSearch, getAccessToken, onUnauthorized, defineTool }) {
  if (typeof defineTool !== 'function') {
    throw new TypeError('defineTool function is required to construct x_fact_check_notes tool schema')
  }
  return normalizeToolParameters(defineTool({
    name: 'x_fact_check_notes',
    description: 'Investigate claims, viral posts, or news stories on X (Twitter) for Community Notes, expert fact-checks, and corrections.',
    parameters: {
      claim: { type: 'string', required: true, description: 'The assertion, statement, or rumor to fact-check on X.' },
      target_url: { type: 'string', description: 'Optional specific X post or article URL to verify.' },
      allowed_x_handles: { type: 'string', description: 'Optional comma-separated @handles of researchers or institutions to check.' },
      enable_image_understanding: { type: 'boolean', description: 'Inspect attached images or infographics in fact-checking posts.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          success: { type: 'boolean' },
          answer: { type: 'string' },
          citations: { type: 'array' },
          degraded: { type: 'boolean' },
          degraded_reason: { type: 'string' },
          model: { type: 'string' },
          claim: { type: 'string' },
        },
      },
      render(_args, value) {
        const lines = []
        if (value.claim) lines.push(`Claim Checked: "${value.claim}"`)
        if (value.degraded) lines.push(`(degraded: ${value.degraded_reason || 'no citations'})`)
        if (value.answer) lines.push(String(value.answer))
        lines.push(...renderCitations(value.citations))
        return [{ type: 'text', text: lines.join('\n') || JSON.stringify(value) }]
      },
    },
    isConcurrencySafe: () => true,
    timeoutMs: ((Number(getConfig().timeoutSeconds) || 180) + 30) * 1000,
    async execute(args, exec) {
      const cfg = getConfig()
      const token = await getAccessToken(getContext(), cfg)
      if (!token) throw new Error('Grok X Search is not connected. Open Settings and Connect a separate Grok account.')

      const claim = String(args.claim || '').trim()
      if (!claim) throw new Error('claim is required')

      let query = `Fact check the following claim using posts, Community Notes, and verified expert rebuttals on X: "${claim}".`
      if (args.target_url) {
        query += ` Reference post: ${args.target_url}.`
      }
      query += ' State clearly whether there are Community Notes attached, whether the claim is verified, contested, or debunked, and cite authoritative posts.'

      const res = await runSearch({
        accessToken: token,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        query,
        allowed_x_handles: splitHandles(args.allowed_x_handles),
        enable_image_understanding: args.enable_image_understanding,
        timeoutMs: ((Number(cfg.timeoutSeconds) || 180) + 30) * 1000,
        retries: cfg.retries,
        signal: exec?.signal,
        auto_fallback_model: cfg.autoFallbackModel,
        enable_cache: cfg.enableCache,
        cache_ttl_ms: (Number(cfg.cacheTtlSeconds) || 300) * 1000,
        onUnauthorized: onUnauthorized || (() => getAccessToken(getContext(), cfg, true)),
      })

      return {
        ...res,
        claim,
      }
    },
  }))
}
