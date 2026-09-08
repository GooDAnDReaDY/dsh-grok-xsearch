export const PENDING_TTL_MS = 15 * 60 * 1000

const STATE_REGEX = /^[a-zA-Z0-9_-]{4,128}$/
const PENDING_STORE = new Map()

export function isValidState(state) {
  return typeof state === 'string' && STATE_REGEX.test(state.trim())
}

export function normalizePendingRow(pkce, redirectUri = '') {
  return {
    verifier: pkce.verifier,
    challenge: pkce.challenge,
    state: pkce.state,
    redirectUri: String(redirectUri || ''),
    createdAt: Date.now(),
  }
}

export function clearPendingStore() {
  PENDING_STORE.clear()
}

export async function savePending(row) {
  const state = String(row?.state || '').trim()
  if (!isValidState(state)) throw new Error('invalid oauth state')
  PENDING_STORE.set(state, {
    verifier: String(row.verifier || ''),
    challenge: String(row.challenge || ''),
    state,
    redirectUri: String(row.redirectUri || ''),
    createdAt: Number(row.createdAt) || Date.now(),
  })
}

export async function deletePending(state) {
  const trimmed = String(state || '').trim()
  if (!isValidState(trimmed)) return
  PENDING_STORE.delete(trimmed)
}

export async function loadPending(state) {
  const trimmed = String(state || '').trim()
  if (!isValidState(trimmed)) return null
  const row = PENDING_STORE.get(trimmed)
  if (!row) return null
  if (Date.now() - Number(row.createdAt || 0) > PENDING_TTL_MS) {
    PENDING_STORE.delete(trimmed)
    return null
  }
  return { ...row }
}

export async function listPending() {
  const now = Date.now()
  const rows = []
  for (const [state, row] of [...PENDING_STORE.entries()]) {
    if (now - Number(row.createdAt || 0) > PENDING_TTL_MS) {
      PENDING_STORE.delete(state)
    } else {
      rows.push({ ...row })
    }
  }
  return rows
}

export async function resolvePending(state) {
  const trimmed = String(state || '').trim()
  if (trimmed) {
    return await loadPending(trimmed)
  }
  const rows = await listPending()
  if (!rows.length) return null
  if (rows.length === 1) return rows[0]
  rows.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  return rows[0]
}
