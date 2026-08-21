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
