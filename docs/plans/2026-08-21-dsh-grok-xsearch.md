# Plan: dsh-grok-xsearch v1

## Goal

Publishable plugin exposing `x_search` via xAI Responses API with separate SuperGrok OAuth.

## Tasks

- [x] Scaffold `@goodandready/dsh-grok-xsearch`
- [x] OAuth Connect UI + `GROK_XSEARCH_OAUTH_1`
- [x] `x_search` tool + unit tests
- [x] Staging install + manual OAuth smoke (HTTP 200, client.js 200, oauth/start OK; Connect pending user)
- [ ] RELEASE + GitHub/npm publish

## Out of scope

- Chat Grok LLM provider (dsh-subscriptions)
- Image/video generation tools
