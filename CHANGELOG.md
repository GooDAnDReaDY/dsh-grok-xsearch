# Changelog

Notable changes to `@goodandready/dsh-grok-xsearch`.

## 0.3.19

### Security
- **Fail-closed route security & protected GET config** (#42). Enforced fail-closed origin, `Sec-Fetch-Site` and loopback host verification in `isTrustedSettingsRequest()`. Moved trust checks to protect both GET and PUT on `/dsh-grok-xsearch/config`, shielding account credentials and status against cross-site callers.
- **Search cache account isolation & restricted disk file mode** (#66). Scoped search cache keys by SHA-256 account fingerprint derived from `accessToken` or explicit `account_fingerprint`, completely preventing cross-account result leakage. Scoped disk cache to `DSH_PROFILE`, enforced `0600` file mode on atomic writes, and hooked `clearXSearchCache()` into tools disposer and `/logout`.

### Fixed
- **Settings fallback without settingsApi** (#25). Decoupled `settings` from hard-required service inject list and removed 503 error on `PUT /dsh-grok-xsearch/config`. When running on DSH 0.1.7 without a separate settings service, config updates now gracefully apply in-memory and trigger `syncTools()`.

## 0.3.18

### Performance
- **Debounced atomic async disk cache persistence** (#59). Replaced synchronous `writeFileSync` in `lib/xsearch.js` with debounced atomic asynchronous writes (`.tmp` + `rename`), preventing Node.js event loop blocking during search execution and avoiding JSON corruption on sudden shutdown.

### Fixed
- **Reactive tool registration on configuration change** (#60). Added `syncTools()` call to `scope.watch` in `lib/index.js`, ensuring agent tools are immediately unregistered when disabled in settings and reconfigured when timeouts or parameters change.
- **Fallback version alignment** (#62). Updated obsolete version fallbacks in `lib/xsearch.js` and `lib/client.js` to match current release.

### Refactored
- **Client code size reduction** (#61). Compacted repetitive CSS and helper markup in `lib/client.js`, reducing file length from 610 to 577 lines (< 580) to comply with DSH authoring guidelines.

## 0.3.17

### Fixed
- Settings no longer wait on the removed settingsScope service. The client uses configForms (#63).

## 0.3.16

### Fixed
- **The plugin page shows the configure control again** (#55). DSH core
  0.1.6-alpha.2 renders a plugin's settings on its own page only for rows seated
  in `plugins.item`, so a `plugins.row.config`-only seat left the settings
  unreachable. The card is now registered into `plugins.item` with
  `id: 'dsh-grok-xsearch'` (the row id from `cordis.patch.yml`), `order: 60` and a
  static `label`, and it is view-aware: `view: 'summary'` renders the one-line
  state, `view: 'page'` the open form without our card header (class `gx-page`).
  The `plugins.row.config` and legacy `settings.plugin.item` seats stay registered;
  `settings.section` remains absent.

## 0.3.15

### Fixed
- **Settings reachable again**: the card registered into `settings.plugin.item`, a
  slot the current DSH core (0.1.6-alpha.2) no longer renders, so the plugin's
  settings were unreachable. The surface now registers into the Plugins page row
  seat `plugins.row.config`, keyed `@goodandready/dsh-grok-xsearch#dsh-grok-xsearch`
  (`rowConfigKey(package, rowId)`): the plugin's row gains a configure control whose
  page is the settings form (`view: 'page'`, open and without our card header — the
  host page draws the title, icon, crumb and padding) plus a one-line state for
  `view: 'summary'`. The legacy seat stays registered as a fallback for older cores,
  and no `settings.section` duplicate is created (the rule from #51 is preserved).

### Changed
- The placement-failure diagnostic now names the row seat, and the matching test
  asserts it.

### Added
- This changelog.
