export const DEFAULT_XSEARCH_MODEL = 'grok-4.6'

export const XSEARCH_MODELS = [
  { id: 'grok-4.6', name: 'Grok 4.6', hint: 'Newest; may be rate-limited' },
  { id: 'grok-4.5', name: 'Grok 4.5', hint: 'Recommended' },
  { id: 'grok-4.3', name: 'Grok 4.3' },
  { id: 'grok-4.20-reasoning', name: 'Grok 4.20 Reasoning' },
  { id: 'grok-4.20-multi-agent-0309', name: 'Grok 4.20 Multi-Agent' },
  { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning' },
  { id: 'grok-4', name: 'Grok 4' },
]

const MODEL_ORDER = new Map(XSEARCH_MODELS.map((row, index) => [row.id, index]))

function isChatModel(id) {
  return !/imagine|image-|video|embed/i.test(String(id || ''))
}

function displayName(id, fallback) {
  const known = XSEARCH_MODELS.find((row) => row.id === id)
  if (known) return known.name
  if (fallback) return fallback
  return String(id || '').replace(/^grok-/, 'Grok ').replace(/-/g, ' ')
}

export function normalizeXSearchModel(model) {
  const id = String(model || '').trim()
  if (!id) return DEFAULT_XSEARCH_MODEL
  return id
}

export function sortModels(rows) {
  return rows.slice().sort((a, b) => {
    const ai = MODEL_ORDER.has(a.id) ? MODEL_ORDER.get(a.id) : 999
    const bi = MODEL_ORDER.has(b.id) ? MODEL_ORDER.get(b.id) : 999
    if (ai !== bi) return ai - bi
    return String(a.id).localeCompare(String(b.id))
  })
}

export function mergeModels(rows, extra = []) {
  const map = new Map()
  for (const row of [...rows, ...extra]) {
    if (!row || !row.id) continue
    map.set(row.id, row)
  }
  return sortModels([...map.values()])
}

export function modelOptions(current) {
  const id = normalizeXSearchModel(current)
  if (XSEARCH_MODELS.some((row) => row.id === id)) return XSEARCH_MODELS
  return [{ id, name: displayName(id), hint: 'Current' }, ...XSEARCH_MODELS]
}

export async function listModelsForSettings({ accessToken, baseUrl, fetchImpl = fetch }) {
  if (!accessToken) return XSEARCH_MODELS
  try {
    const root = String(baseUrl || 'https://api.x.ai/v1').replace(/\/$/, '')
    const res = await fetchImpl(`${root}/models`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const rows = []
    for (const entry of json.data || []) {
      const id = entry && entry.id
      if (!id || !isChatModel(id)) continue
      const known = XSEARCH_MODELS.find((row) => row.id === id)
      rows.push(known || { id, name: displayName(id, entry.name) })
    }
    if (!rows.length) return XSEARCH_MODELS
    return mergeModels(rows, XSEARCH_MODELS)
  } catch {
    return XSEARCH_MODELS
  }
}
