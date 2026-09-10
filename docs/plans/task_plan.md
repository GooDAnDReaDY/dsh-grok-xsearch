# task_plan.md: Issue #35 — UI Overhaul (dsh-clinebot style) & Stability Hardening

## Goal
1. Overhaul UI of `@goodandready/dsh-grok-xsearch` settings card to match the premium, cohesive look and design system of `dsh-clinebot` (isolated CSS tokens, structured section cards, visual telemetry/cache meters, badges, alerts, keyboard accessibility).
2. Code audit & stability hardening:
   - Remove dead code (`requestOrigin`, `webCallbackUri` in `oauth.js`; `publicAccountView` in `blob.js`).
   - Dynamic user-agent in `xsearch.js` reading current package version.
   - Robust defensive service proxy lookups `ctx.get('credentials')` / `ctx.get('tools')` / `ctx.get('webServer')`.
   - Comprehensive unit tests covering `blob.js`, `oauth.js`, `http.js`, `wire.js`, and new UI contracts.

## Current Phase: 5 (Verification & Ready to Commit)
## Next Step: Review, Commit & Merge via PR to main

## Phases
- [x] Phase 1: Research, Audit & Planning <!-- id: 0 -->
- [x] Phase 2: Stability & Code Cleanup <!-- id: 1 -->
- [x] Phase 3: UI Redesign to dsh-clinebot style <!-- id: 2 -->
- [x] Phase 4: Extended Test Suite & Verification <!-- id: 3 -->
- [ ] Phase 5: Documentation, PR, Merge & Final Cleanup <!-- id: 4 -->

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| N/A | | |
