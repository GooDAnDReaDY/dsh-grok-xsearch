# Changelog

Notable changes to `@goodandready/dsh-grok-xsearch`.

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
