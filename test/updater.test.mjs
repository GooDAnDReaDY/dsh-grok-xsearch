import test from 'node:test'
import assert from 'node:assert/strict'
import { isNewerVersion, parseSemver, isTrustedUpdateRequest, registerPluginUpdater } from '../lib/updater.js'

test('parseSemver parses standard and prerelease versions', () => {
  assert.deepEqual(parseSemver('0.3.11'), { core: [0, 3, 11], prerelease: [] })
  assert.deepEqual(parseSemver('v1.2.3-alpha.1'), { core: [1, 2, 3], prerelease: ['alpha', '1'] })
  assert.equal(parseSemver('invalid'), undefined)
})

test('isNewerVersion correctly compares versions and prereleases', () => {
  assert.equal(isNewerVersion('0.3.11', '0.3.12'), true)
  assert.equal(isNewerVersion('0.3.11', '0.3.11'), false)
  assert.equal(isNewerVersion('0.3.12', '0.3.11'), false)
  assert.equal(isNewerVersion('0.3.12-rc.1', '0.3.12-rc.2'), true)
  assert.equal(isNewerVersion('0.3.12-rc.1', '0.3.12'), true)
  assert.equal(isNewerVersion('0.3.12', '0.3.12-rc.1'), false)
  assert.equal(isNewerVersion('0.3.11', '0.4.0'), true)
})

test('isTrustedUpdateRequest validates x-dsh-plugin-update header and origin', () => {
  const reqNoHeader = {
    headers: { host: '127.0.0.1:3080', origin: 'http://127.0.0.1:3080' },
    socket: { remoteAddress: '127.0.0.1' },
  }
  assert.equal(isTrustedUpdateRequest(reqNoHeader), false)

  const reqValid = {
    headers: {
      'x-dsh-plugin-update': '1',
      host: '127.0.0.1:3080',
      origin: 'http://127.0.0.1:3080',
    },
    socket: { remoteAddress: '127.0.0.1' },
  }
  assert.equal(isTrustedUpdateRequest(reqValid), true)

  const reqForeignOrigin = {
    headers: {
      'x-dsh-plugin-update': '1',
      host: '127.0.0.1:3080',
      origin: 'http://malicious.evil.com',
    },
    socket: { remoteAddress: '127.0.0.1' },
  }
  assert.equal(isTrustedUpdateRequest(reqForeignOrigin), false)
})

test('registerPluginUpdater registers route and handles methods', async () => {
  let registeredRoute = null
  const mockCtx = {
    webServer: {
      register: (route) => {
        registeredRoute = route
        return () => { registeredRoute = null }
      },
    },
    logger: { warn: () => {} },
  }

  const dispose = registerPluginUpdater(mockCtx, {
    packageName: '@goodandready/dsh-grok-xsearch',
    endpoint: '/api/dsh-grok-xsearch/update',
    manifestUrl: new URL('../package.json', import.meta.url),
  })

  assert.ok(registeredRoute)
  assert.equal(registeredRoute.path, '/api/dsh-grok-xsearch/update')

  // Test GET status
  let statusCode = 0
  let headersSent = {}
  let bodySent = ''
  const mockRes = {
    writeHead: (code, headers) => {
      statusCode = code
      headersSent = headers
    },
    end: (chunk) => {
      bodySent = chunk || ''
    },
  }

  const mockGetReq = {
    method: 'GET',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }

  await registeredRoute.handler(mockGetReq, mockRes)
  assert.equal(statusCode, 200)
  const statusPayload = JSON.parse(bodySent)
  assert.equal(statusPayload.packageName, '@goodandready/dsh-grok-xsearch')
  assert.ok(statusPayload.currentVersion)

  // Test method not allowed
  const mockPutReq = {
    method: 'PUT',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }
  await registeredRoute.handler(mockPutReq, mockRes)
  assert.equal(statusCode, 405)

  // Test POST without trusted headers (403)
  const mockUntrustedPostReq = {
    method: 'POST',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }
  await registeredRoute.handler(mockUntrustedPostReq, mockRes)
  assert.equal(statusCode, 403)

  dispose()
  assert.equal(registeredRoute, null)
})
