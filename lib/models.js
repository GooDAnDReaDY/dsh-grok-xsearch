export const DEFAULT_XSEARCH_MODEL = 'grok-4.6'

export const XSEARCH_MODELS = [
  { id: 'grok-4.6', name: 'Grok 4.6', hint: 'Recommended' },
  { id: 'grok-4.20-reasoning', name: 'Grok 4.20 Reasoning' },
  { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning' },
  { id: 'grok-4', name: 'Grok 4' },
]

export function normalizeXSearchModel(model) {
  const id = String(model || '').trim()
  if (!id) return DEFAULT_XSEARCH_MODEL
  if (XSEARCH_MODELS.some((row) => row.id === id)) return id
  return id
}

export function modelOptions(current) {
  const id = normalizeXSearchModel(current)
  const known = new Set(XSEARCH_MODELS.map((row) => row.id))
  if (known.has(id)) return XSEARCH_MODELS
  return [{ id, name: id, hint: 'Custom' }, ...XSEARCH_MODELS]
}
