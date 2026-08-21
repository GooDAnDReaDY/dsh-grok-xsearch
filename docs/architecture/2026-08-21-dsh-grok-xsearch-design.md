# Architecture: dsh-grok-xsearch

## Separation

| Concern | dsh-subscriptions | dsh-grok-xsearch |
|---|---|---|
| Purpose | LLM chat providers | `x_search` tool only |
| OAuth ref | `GROK_OAUTH_*` | `GROK_XSEARCH_OAUTH_1` |
| API | cli-chat-proxy / responses chat | `api.x.ai/v1/responses` + tool type `x_search` |

## Flow

Settings Connect → PKCE OAuth → credential blob → tool `execute` → POST `/responses`.

## Impersonality

No user tokens or OAuth secrets in repository. Client id configured in DSH profile Settings.


## Reference implementation

Ported from Hermes `tools/x_search_tool.py` (non-streaming `POST /responses` with built-in tool `x_search`). Chat Grok in `dsh-subscriptions` uses a different path (streaming LLM adapter) and must not be reused.

## Credential choice

Separate `GROK_XSEARCH_OAUTH_1` (not `GROK_OAUTH_*` from subscriptions) — intentional product split: search account vs chat account.
