// Куда плагин кладёт свои настройки.
//
// Проверяем не текст исходника, а то, что клиентская половина реально
// регистрирует: ключ карточки обязан совпадать с пространством настроек, иначе
// вкладка «Плагины» её не найдёт — молча, без ошибки.
import assert from 'node:assert/strict'
import { test } from 'node:test'

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
  // Расхождение здесь не даёт ни ошибки, ни следа в журнале: вкладка просто
  // ничего не находит. Поэтому проверяем точное значение, а не «что-то есть».
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  const ctx = fakeCtx({ declared: ['settings.plugin.item'] })
  exported.apply(ctx)

  const card = ctx.registered.find((r) => r.name === 'settings.plugin.item')
  assert.equal(card.key, 'dsh-grok-xsearch')
})

test('в сборке без вкладки «Плагины» сразу срабатывает запасной раздел без ожидания таймера', async () => {
  // Слот объявляет настроечный пакет ядра. Нет пакета — нет слота, и запасной
  // раздел регистрируется сразу, без 3-секундного таймера (Issue #26).
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  const ctx = fakeCtx({ declared: ['settings.section'] })
  exported.apply(ctx)

  const section = ctx.registered.find((r) => r.name === 'settings.section')
  assert.ok(section, 'должен сразу появиться запасной раздел')
  assert.equal(section.id, '@goodandready/dsh-grok-xsearch')
  assert.equal(ctx.registered.some((r) => r.name === 'settings.plugin.item'), false)
})

test('клиент экспортирует inject с settingsScope для привязки снимка настроек', async () => {
  const registration = await loadFactory()
  const exported = registration.factory(fakeRequire)
  assert.ok(Array.isArray(exported.inject), 'inject должен быть массивом')
  assert.ok(exported.inject.includes('settingsScope'), 'inject обязан запрашивать settingsScope (Issue #24)')
  assert.ok(exported.inject.includes('slots'), 'inject обязан содержать slots')
})
