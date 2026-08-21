import { createHash, randomBytes } from 'node:crypto'

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64url')
}

export async function createPkce() {
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  const state = b64url(randomBytes(16))
  return { verifier, challenge, state }
}
