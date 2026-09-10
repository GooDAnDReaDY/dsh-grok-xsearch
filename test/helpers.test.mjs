import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serializeBlob, parseBlob } from '../lib/blob.js'
import { buildAuthorizeUrl, parseCallbackInput } from '../lib/oauth.js'
import { escapeHtml, writeJson, writeHtml, readBody, isTrustedSettingsRequest, queryOf } from '../lib/http.js'
import { tokenBlobFromOAuth, formTokenRequest } from '../lib/wire.js'
import { createPkce } from '../lib/pkce.js'
import { emailFromToken } from '../lib/jwt.js'
import { Readable } from 'node:stream'

test('blob.js serializeBlob and parseBlob round-trip valid credentials', () => {
  const original = {
    accessToken: 'test-access-token-123',
    refreshToken: 'test-refresh-token-456',
    expiresAt: Date.now() + 3600000,
    label: 'Test Grok Account',
    email: 'user@example.com',
    accountId: 'acc-999',
    projectId: 'proj-888',
  }

  const serialized = serializeBlob(original)
  assert.equal(typeof serialized, 'string')

  const parsed = parseBlob(serialized)
  assert.deepEqual(parsed, original)
})

test('blob.js serializeBlob throws when both accessToken and refreshToken are missing', () => {
  assert.throws(() => {
    serializeBlob({})
  }, /oauth blob needs accessToken or refreshToken/)

  assert.throws(() => {
    serializeBlob(null)
  }, /oauth blob needs accessToken or refreshToken/)
})

test('blob.js parseBlob throws on invalid JSON or non-object', () => {
  assert.throws(() => {
    parseBlob('not-a-json')
  })

  assert.throws(() => {
    parseBlob(null)
  }, /invalid oauth blob/)
})

test('oauth.js buildAuthorizeUrl constructs valid OAuth authorization endpoint', () => {
  const urlStr = buildAuthorizeUrl({
    authUrl: 'https://auth.x.ai/oauth2/authorize',
    clientId: 'client-abc-123',
    redirectUri: 'http://127.0.0.1:56121/callback',
    challenge: 'test-challenge-hash',
    state: 'test-state-random',
    scope: 'openid profile offline_access',
    extra: { prompt: 'consent', empty_val: '' },
  })

  const parsed = new URL(urlStr)
  assert.equal(parsed.origin, 'https://auth.x.ai')
  assert.equal(parsed.pathname, '/oauth2/authorize')
  assert.equal(parsed.searchParams.get('response_type'), 'code')
  assert.equal(parsed.searchParams.get('client_id'), 'client-abc-123')
  assert.equal(parsed.searchParams.get('redirect_uri'), 'http://127.0.0.1:56121/callback')
  assert.equal(parsed.searchParams.get('code_challenge'), 'test-challenge-hash')
  assert.equal(parsed.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(parsed.searchParams.get('state'), 'test-state-random')
  assert.equal(parsed.searchParams.get('scope'), 'openid profile offline_access')
  assert.equal(parsed.searchParams.get('prompt'), 'consent')
  assert.equal(parsed.searchParams.has('empty_val'), false)
})

test('oauth.js parseCallbackInput handles various input formats', () => {
  // 1. Full redirect URL
  const res1 = parseCallbackInput('http://127.0.0.1:56121/callback?code=auth_code_123&state=state_456')
  assert.equal(res1.code, 'auth_code_123')
  assert.equal(res1.state, 'state_456')

  // 2. Fragment URL
  const res2 = parseCallbackInput('http://127.0.0.1:56121/callback#code=auth_code_fragment&state=state_fragment')
  assert.equal(res2.code, 'auth_code_fragment')
  assert.equal(res2.state, 'state_fragment')

  // 3. Raw code#state string
  const res3 = parseCallbackInput('raw_code_value#raw_state_value')
  assert.equal(res3.code, 'raw_code_value')
  assert.equal(res3.state, 'raw_state_value')

  // 4. Raw code string only
  const res4 = parseCallbackInput('only_code_value')
  assert.equal(res4.code, 'only_code_value')
  assert.equal(res4.state, '')

  // 5. Empty / null input
  const res5 = parseCallbackInput('')
  assert.equal(res5.code, '')
  assert.equal(res5.state, '')
})

test('http.js escapeHtml properly sanitizes sensitive HTML characters', () => {
  const unsafe = '<script>alert("xss" & \'evil\')</script>'
  const safe = escapeHtml(unsafe)
  assert.equal(safe, '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;evil&#39;)&lt;/script&gt;')
})

test('http.js writeJson and writeHtml send proper headers and payload', () => {
  let jsonStatus, jsonHeaders, jsonBody
  const fakeResJson = {
    writeHead(code, headers) {
      jsonStatus = code
      jsonHeaders = headers
    },
    end(content) {
      jsonBody = content
    },
  }

  writeJson(fakeResJson, 200, { ok: true, message: 'hello' })
  assert.equal(jsonStatus, 200)
  assert.equal(jsonHeaders['Content-Type'], 'application/json')
  assert.equal(jsonBody, JSON.stringify({ ok: true, message: 'hello' }))

  let htmlStatus, htmlHeaders, htmlBody
  const fakeResHtml = {
    writeHead(code, headers) {
      htmlStatus = code
      htmlHeaders = headers
    },
    end(content) {
      htmlBody = content
    },
  }

  writeHtml(fakeResHtml, 201, '<h1>Test</h1>')
  assert.equal(htmlStatus, 201)
  assert.equal(htmlHeaders['Content-Type'], 'text/html; charset=utf-8')
  assert.equal(htmlBody, '<h1>Test</h1>')
})

test('http.js readBody parses stream within limit and rejects oversized payload', async () => {
  const stream = Readable.from([Buffer.from('hello '), Buffer.from('world')])
  const body = await readBody(stream)
  assert.equal(body.toString('utf8'), 'hello world')

  const bigStream = Readable.from([Buffer.from('a'.repeat(200))])
  await assert.rejects(async () => {
    await readBody(bigStream, 100)
  }, /body too large/)
})

test('http.js isTrustedSettingsRequest checks sec-fetch-site', () => {
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'same-origin' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'same-site' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'none' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'cross-site' } }), false)
})

test('http.js queryOf safely parses URL search parameters', () => {
  const params1 = queryOf({ url: '/test/path?foo=bar&num=42' })
  assert.equal(params1.get('foo'), 'bar')
  assert.equal(params1.get('num'), '42')

  const params2 = queryOf({ url: null })
  assert.equal(params2 instanceof URLSearchParams, true)
})

test('wire.js tokenBlobFromOAuth extracts token fields with fallback and extra data', () => {
  const rawOAuth = {
    access_token: 'acc_token_val',
    refresh_token: 'ref_token_val',
    expires_in: 7200,
  }

  const blob = tokenBlobFromOAuth(rawOAuth, { label: 'My Grok', email: 'me@x.ai' })
  assert.equal(blob.accessToken, 'acc_token_val')
  assert.equal(blob.refreshToken, 'ref_token_val')
  assert.equal(blob.label, 'My Grok')
  assert.equal(blob.email, 'me@x.ai')
  assert.ok(blob.expiresAt > Date.now())
})

test('pkce.js createPkce generates valid verifier, challenge and state', async () => {
  const pkce = await createPkce()
  assert.equal(typeof pkce.verifier, 'string')
  assert.equal(typeof pkce.challenge, 'string')
  assert.equal(typeof pkce.state, 'string')
  assert.ok(pkce.verifier.length >= 43)
  assert.ok(pkce.challenge.length >= 43)
  assert.ok(pkce.state.length >= 16)
})

test('jwt.js emailFromToken extracts email or sub from JWT payload', () => {
  // Header: {"alg":"none"} -> eyJhbGciOiJub25lIn0
  // Payload: {"email":"test@xai.com","sub":"user_123"}
  const payloadJson = JSON.stringify({ email: 'test@xai.com', sub: 'user_123' })
  const payloadB64 = Buffer.from(payloadJson).toString('base64url')
  const fakeToken = `eyJhbGciOiJub25lIn0.${payloadB64}.`

  const extracted = emailFromToken(fakeToken)
  assert.equal(extracted, 'test@xai.com')

  // Malformed token returns empty string
  assert.equal(emailFromToken('not-a-jwt'), '')
  assert.equal(emailFromToken(''), '')
  assert.equal(emailFromToken(null), '')
})
