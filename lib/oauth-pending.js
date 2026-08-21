import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const PENDING_TTL_MS = 15 * 60 * 1000

function pendingDir() {
  const home = process.env.DSH_HOME || path.join(process.env.HOME || '/tmp', '.dsh')
  return path.join(home, 'storages', 'dsh-grok-xsearch', 'oauth-pending')
}

function pendingPath(state) {
  return path.join(pendingDir(), `${state}.json`)
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

export async function savePending(row) {
  await mkdir(pendingDir(), { recursive: true })
  await writeFile(pendingPath(row.state), JSON.stringify(row))
}

export async function deletePending(state) {
  try { await unlink(pendingPath(state)) } catch { /* ignore */ }
}

export async function loadPending(state) {
  try {
    const row = JSON.parse(await readFile(pendingPath(state), 'utf8'))
    if (!row || Date.now() - Number(row.createdAt || 0) > PENDING_TTL_MS) {
      await deletePending(state)
      return null
    }
    return row
  } catch {
    return null
  }
}

export async function listPending() {
  try {
    const dir = pendingDir()
    const names = await readdir(dir)
    const rows = []
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const state = name.slice(0, -5)
      const row = await loadPending(state)
      if (row) rows.push(row)
    }
    return rows
  } catch {
    return []
  }
}

export async function resolvePending(state) {
  const trimmed = String(state || '').trim()
  if (trimmed) {
    const row = await loadPending(trimmed)
    if (row) return row
  }
  const rows = await listPending()
  if (!rows.length) return null
  if (trimmed) return null
  if (rows.length === 1) return rows[0]
  rows.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  return rows[0]
}
