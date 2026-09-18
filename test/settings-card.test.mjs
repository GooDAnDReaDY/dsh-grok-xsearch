import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'

/** Загрузить фабрику клиентской половины с подставным окружением. */
async function loadFactory() {
  const captured = {}
  globalThis.window = {
    __ModuleLoader__: { load: (registration) => { captured.registration = registration } },
  }
  globalThis.document = undefined
  await import('../lib/client.js?' + Math.random())
  delete globalThis.window
  delete globalThis.document
  return captured.registration
}

/** Минимальный React: apply() его не трогает, он нужен только фабрике. */
const fakeRequire = () => ({ createElement: () => null, useState: () => [false, () => {}], useRef: () => ({ current: null }), useEffect: () => {} })

/** Контекст, записывающий всё, что в нём регистрируют. */
function fakeCtx({ declared }) {
  const registered = []
  const effects = []
  return {
    registered,
    effects,
    slots: {
      inject(name, run) {
        if (declared.includes(name)) {
          run()
          return true
        }
        return false
      },
      register(options, component) {
        registered.push({ name: options.name, key: options.key, id: options.id, component })
        return () => {}
      },
    },
    effect(run, label) {
      effects.push(label)
      const off = run()
      return () => { if (typeof off === 'function') off() }
    },
  }
}

test('настройки регистрируются карточкой, а не разделом в боковом списке', async () => {
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  const ctx = fakeCtx({ declared: ['settings.plugin.item'] })
  exported.apply(ctx)

  const card = ctx.registered.find((r) => r.name === 'settings.plugin.item')
  assert.ok(card, 'карточка должна быть зарегистрирована')
  assert.equal(ctx.registered.some((r) => r.name === 'settings.section'), false,
    'строки в боковом списке быть не должно')
})

test('ключ карточки совпадает с пространством настроек', async () => {
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  const ctx = fakeCtx({ declared: ['settings.plugin.item'] })
  exported.apply(ctx)

  const card = ctx.registered.find((r) => r.name === 'settings.plugin.item')
  assert.equal(card.key, 'dsh-grok-xsearch')
})

test('в сборке без слота settings.plugin.item запасной раздел settings.section НЕ регистрируется и пишется warn (Issue #51)', async () => {
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  const warnLogs = []
  const baseCtx = fakeCtx({ declared: ['settings.section'] })
  const ctx = {
    ...baseCtx,
    logger: {
      warn: (msg) => warnLogs.push(msg),
    },
  }
  exported.apply(ctx)

  assert.equal(ctx.registered.some((r) => r.name === 'settings.section'), false,
    'раздел settings.section не должен регистрироваться (фолбэк убран)')
  assert.equal(ctx.registered.some((r) => r.name === 'plugins.row.config'), false,
    'посадка строки не должна регистрироваться, если слот не объявлен')
  assert.equal(ctx.registered.some((r) => r.name === 'settings.plugin.item'), false,
    'карточка не должна быть зарегистрирована, если слот не объявлен')
  assert.ok(warnLogs.some((msg) => msg.includes('plugins.row.config')),
    'неудача размещения посадки строки должна логироваться через ctx.logger.warn')
})

test('клиент экспортирует inject с settingsScope для привязки снимка настроек', async () => {
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  assert.ok(Array.isArray(exported.inject), 'inject должен быть массивом')
  assert.ok(exported.inject.includes('settingsScope'), 'inject обязан запрашивать settingsScope (Issue #24)')
  assert.ok(exported.inject.includes('slots'), 'inject обязан содержать slots')
})

test('все 10 полей схемы Config объявлены и обрабатываются в клиенте и сервере (Issue #33)', async () => {
  const expectedFields = [
    'enabled',
    'grokClientId',
    'redirectUri',
    'baseUrl',
    'model',
    'timeoutSeconds',
    'retries',
    'autoFallbackModel',
    'enableCache',
    'cacheTtlSeconds',
  ]
  assert.equal(expectedFields.length, 10, 'в схеме Config должно быть ровно 10 полей')

  // Проверяем объявление в lib/index.js
  const indexSrc = fs.readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
  for (const field of expectedFields) {
    assert.ok(
      indexSrc.includes(field + ':'),
      `поле схемы "${field}" обязано быть объявлено в lib/index.js Config`,
    )
  }

  // Проверяем, что в клиентском коде упоминаются все эти поля в состояниях и обработчиках
  const clientSrc = fs.readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  for (const field of expectedFields) {
    assert.ok(
      clientSrc.includes(field),
      `поле схемы "${field}" обязано присутствовать и обрабатываться в lib/client.js`,
    )
  }

  // Проверяем наличие безопасного чтения сервиса через typeof props.ctx.get === 'function'
  assert.ok(
    clientSrc.includes("typeof props.ctx.get === 'function' ? props.ctx.get('settingsScope')"),
    'разрешение settingsScope обязано безопасно проверять props.ctx.get',
  )
})
