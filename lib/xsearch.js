const MAX_HANDLES = 10
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function normalizeHandles(handles, fieldName) {
  const out = []
  for (const handle of handles || []) {
    const normalized = String(handle || '').trim().replace(/^@/, '')
    if (normalized) out.push(normalized)
  }
  if (out.length > MAX_HANDLES) throw new Error(`${fieldName} supports at most ${MAX_HANDLES} handles`)
  return out
}

export function validateDateRange(fromDate, toDate) {
  const from = String(fromDate || '').trim()
  const to = String(toDate || '').trim()
  const parse = (value, field) => {
    if (!value) return null
    if (!ISO_DATE.test(value)) throw new Error(`${field} must be YYYY-MM-DD`)
    const d = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) throw new Error(`${field} must be YYYY-MM-DD`)
    return d
  }
  const parsedFrom = parse(from, 'from_date')
  const parsedTo = parse(to, 'to_date')
  if (parsedFrom && parsedTo && parsedFrom > parsedTo) throw new Error('from_date must be on or before to_date')
  if (parsedFrom) {
    const todayUtc = new Date()
    const today = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()))
    if (parsedFrom > today) throw new Error('from_date is in the future')
  }
}

export function buildXSearchPayload({ model, query, allowed, excluded, fromDate, toDate, enableImage, enableVideo }) {
  const toolDef = { type: 'x_search' }
  if (allowed.length) toolDef.allowed_x_handles = allowed
  if (excluded.length) toolDef.excluded_x_handles = excluded
  if (fromDate) toolDef.from_date = fromDate
  if (toDate) toolDef.to_date = toDate
  if (enableImage) toolDef.enable_image_understanding = true
  if (enableVideo) toolDef.enable_video_understanding = true
  return {
    model,
    input: [{ role: 'user', content: String(query || '').trim() }],
    tools: [toolDef],
    store: false,
  }
}

export function extractAnswer(payload) {
  const direct = String(payload?.output_text || '').trim()
  if (direct) return direct
  const parts = []
  for (const item of payload?.output || []) {
    if (item?.type !== 'message') continue
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' || content?.type === 'text') {
        const text = String(content?.text || '').trim()
        if (text) parts.push(text)
      }
    }
  }
  return parts.join('\n\n').trim()
}

export function extractCitations(payload) {
  const top = Array.isArray(payload?.citations) ? payload.citations : []
  const inline = []
  for (const item of payload?.output || []) {
    if (item?.type !== 'message') continue
    for (const content of item?.content || []) {
      for (const ann of content?.annotations || []) {
        if (ann?.type !== 'url_citation') continue
        inline.push({ url: ann.url || '', title: ann.title || '' })
      }
    }
  }
  return [...top, ...inline]
}

export async function runXSearch(opts) {
  const {
    accessToken, baseUrl, model, query,
    allowed_x_handles, excluded_x_handles,
    from_date, to_date,
    enable_image_understanding, enable_video_understanding,
    timeoutMs, retries, fetchImpl = fetch,
  } = opts
  const allowed = normalizeHandles(allowed_x_handles, 'allowed_x_handles')
  const excluded = normalizeHandles(excluded_x_handles, 'excluded_x_handles')
  if (allowed.length && excluded.length) throw new Error('allowed_x_handles and excluded_x_handles cannot be used together')
  validateDateRange(from_date, to_date)
  const payload = buildXSearchPayload({
    model, query, allowed, excluded,
    fromDate: String(from_date || '').trim(),
    toDate: String(to_date || '').trim(),
    enableImage: Boolean(enable_image_understanding),
    enableVideo: Boolean(enable_video_understanding),
  })
  const url = `${String(baseUrl || 'https://api.x.ai/v1').replace(/\/$/, '')}/responses`
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
          'user-agent': 'dsh-grok-xsearch/0.1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      })
      const text = await res.text()
      let json
      try { json = JSON.parse(text) } catch { json = { error: text } }
      if (!res.ok) {
        const base = (json && typeof json.error === 'object' && json.error.message)
          || (typeof json?.error === 'string' ? json.error : '')
          || text
          || `HTTP ${res.status}`
        const hint = res.status === 429
          ? ' Try Grok 4.5 or Grok 4 Fast Reasoning in Settings, or retry in a few minutes.'
          : ''
        const err = new Error(String(base) + hint)
        err.status = res.status
        throw err
      }
      const answer = extractAnswer(json)
      const citations = extractCitations(json)
      const filtered = Boolean(allowed.length || excluded.length || String(from_date || '').trim() || String(to_date || '').trim())
      const degraded = filtered && citations.length === 0
      return { success: true, answer, citations, degraded, degraded_reason: degraded ? 'No citations returned for a filtered query' : '', model }
    } catch (e) {
      lastErr = e
      if (e?.status && e.status < 500) throw e
      if (attempt >= retries) throw e
    }
  }
  throw lastErr || new Error('x_search failed')
}
