# findings.md: Issue #35 — Code Audit & UI Reference

## 1. UI Style from dsh-clinebot
- CSS tokens and classes:
  - Isolated namespace prefix: `.cb-*` in clinebot, `.gx-*` in grok-xsearch.
  - Structure: `.gx-section-card` (border, layer-3 bg, 12px radius, 16-18px padding), `.gx-section-title` (16px bold), `.gx-section-desc` (13px secondary).
  - Badges: `.gx-badge-ok` (success with green tint background), `.gx-badge-warn` (warning amber tint), `.gx-badge-bad` (error red tint).
  - Buttons: `.gx-btn` base, `.gx-btn-primary` (high-contrast label-primary bg), `.gx-btn-danger` (red subtle outline and hover), `.gx-btn-mini` (compact).
  - Visual Progress / Stat Bars: `.gx-bar-container`, `.gx-bar-track`, `.gx-bar-fill`, `.gx-bar-meta` (used for cache usage and telemetry).
  - Alerts: `.gx-alert-ok`, `.gx-alert-bad`, `.gx-alert-err` with soft tinted background and crisp text.
  - ErrorBoundary: Catch React runtime exceptions gracefully and show a recovery button instead of crashing the slot entry!

## 2. Code Audit Discoveries
1. **Dead code**:
   - `lib/oauth.js`: `requestOrigin(req)` and `webCallbackUri(origin)` are never imported or invoked anywhere across the codebase.
   - `lib/blob.js`: `publicAccountView(blob, extra)` is exported but unused.
2. **Hardcoded User-Agent**:
   - `lib/xsearch.js:338`: `'user-agent': 'dsh-grok-xsearch/0.3.0'` hardcodes outdated `0.3.0` while package is `0.3.9`. Should dynamically reference the package version.
3. **Defensive Service Lookups**:
   - `lib/token-manager.js`: Uses `ctx.credentials.resolve`, `ctx.credentials.set`, `ctx.credentials.unset`. Needs `(typeof ctx?.get === 'function' ? ctx.get('credentials') : ctx?.credentials)`.
   - `lib/index.js`: Needs safe lookup for `ctx.tools` and `ctx.webServer` to prevent `undefined` proxy property bugs.
4. **Test Coverage Gaps**:
   - `lib/blob.js`: Missing tests for `serializeBlob` throwing on missing tokens, `parseBlob` JSON parsing.
   - `lib/oauth.js`: Missing test for `buildAuthorizeUrl` parameter encoding and extra params.
   - `lib/http.js`: Missing test for `writeJson`, `writeHtml`, `escapeHtml`.
   - `lib/wire.js`: Missing test for `formTokenRequest` with timeout signal and `tokenBlobFromOAuth`.
