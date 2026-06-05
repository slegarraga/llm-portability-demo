# llm-portability-demo

[![CI](https://github.com/slegarraga/llm-portability-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-portability-demo/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/slegarraga/llm-portability-demo/badge)](https://scorecard.dev/viewer/?uri=github.com/slegarraga/llm-portability-demo)
[![license](https://img.shields.io/github/license/slegarraga/llm-portability-demo.svg)](./LICENSE)
[![offline demo](https://img.shields.io/badge/demo-offline-brightgreen.svg)](./demo.mjs)

Security posture is tracked in [docs/security-posture.md](./docs/security-posture.md),
including CodeQL, OpenSSF Scorecard, Dependabot, branch rules and the tracked
npm lockfile.

The zero-dependency provider-portability package suite working together, end to
end:

- [`json-from-llm`](https://www.npmjs.com/package/json-from-llm) — recover JSON from reasoning, markdown or prose output.
- [`tool-schema`](https://www.npmjs.com/package/tool-schema) — one JSON Schema → valid OpenAI / Anthropic / Gemini / MCP tools, including MCP `outputSchema`.
- [`llm-sse`](https://www.npmjs.com/package/llm-sse) — parse the streaming response into unified events; collect a message.
- [`llm-errors`](https://www.npmjs.com/package/llm-errors) — normalize a provider error; decide whether to retry or fall back.
- [`llm-messages`](https://www.npmjs.com/package/llm-messages) — port the identical conversation to another provider.

## Suite status

| Package | npm | Downloads | CI |
| --- | --- | --- | --- |
| [tool-schema](https://github.com/slegarraga/tool-schema) | [![npm](https://img.shields.io/npm/v/tool-schema.svg)](https://www.npmjs.com/package/tool-schema) | [![downloads](https://img.shields.io/npm/dm/tool-schema.svg)](https://www.npmjs.com/package/tool-schema) | [![CI](https://github.com/slegarraga/tool-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/tool-schema/actions/workflows/ci.yml) |
| [llm-sse](https://github.com/slegarraga/llm-sse) | [![npm](https://img.shields.io/npm/v/llm-sse.svg)](https://www.npmjs.com/package/llm-sse) | [![downloads](https://img.shields.io/npm/dm/llm-sse.svg)](https://www.npmjs.com/package/llm-sse) | [![CI](https://github.com/slegarraga/llm-sse/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-sse/actions/workflows/ci.yml) |
| [llm-errors](https://github.com/slegarraga/llm-errors) | [![npm](https://img.shields.io/npm/v/llm-errors.svg)](https://www.npmjs.com/package/llm-errors) | [![downloads](https://img.shields.io/npm/dm/llm-errors.svg)](https://www.npmjs.com/package/llm-errors) | [![CI](https://github.com/slegarraga/llm-errors/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-errors/actions/workflows/ci.yml) |
| [llm-messages](https://github.com/slegarraga/llm-messages) | [![npm](https://img.shields.io/npm/v/llm-messages.svg)](https://www.npmjs.com/package/llm-messages) | [![downloads](https://img.shields.io/npm/dm/llm-messages.svg)](https://www.npmjs.com/package/llm-messages) | [![CI](https://github.com/slegarraga/llm-messages/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-messages/actions/workflows/ci.yml) |
| [json-from-llm](https://github.com/slegarraga/json-from-llm) | [![npm](https://img.shields.io/npm/v/json-from-llm.svg)](https://www.npmjs.com/package/json-from-llm) | [![downloads](https://img.shields.io/npm/dm/json-from-llm.svg)](https://www.npmjs.com/package/json-from-llm) | [![CI](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml) |

## Run

```sh
npm install
npm start
```

It runs **offline** against a canned OpenAI streaming response, so you can see the whole flow without an API key. CI also runs this offline path.

## Live provider mode

Live mode is opt-in and only runs when `LLM_DEMO_LIVE=1` is set. A provider API key by itself is not enough, which keeps CI and local demos cost-safe by default.

```sh
LLM_DEMO_LIVE=1 \
LLM_DEMO_API_KEY="$OPENAI_API_KEY" \
LLM_DEMO_MODEL="gpt-4o-mini" \
npm start
```

For OpenAI-compatible providers, point the demo at a compatible `/v1` base URL:

```sh
LLM_DEMO_LIVE=1 \
LLM_DEMO_BASE_URL="https://openrouter.ai/api/v1" \
LLM_DEMO_API_KEY="$OPENROUTER_API_KEY" \
LLM_DEMO_MODEL="openai/gpt-4o-mini" \
npm start
```

Live-mode rules:

- `LLM_DEMO_LIVE=1` is required to make any network call.
- `LLM_DEMO_API_KEY` and `LLM_DEMO_MODEL` are required in live mode.
- `LLM_DEMO_BASE_URL` is optional and defaults to `https://api.openai.com/v1`.
- The demo never prints API keys, request headers or error response bodies.
- Live calls may incur provider costs; use a cheap model and a low-limit key.

## Portability map

Read the [provider portability map](./docs/provider-portability.md) for the
problem breakdown, package roles and why `llm-messages` is the strongest single
repo to use for the OpenAI Codex for OSS application. The
[OpenAI-compatible agent portability article](./docs/openai-compatible-agent-portability.md)
explains the suite from the perspective of agent fallback and provider choice.

## What it shows

```
1) json-from-llm  recover JSON from reasoning/prose output
2) tool-schema    one JSON Schema -> OpenAI tool + MCP outputSchema
3) llm-sse        parse the stream live, collect an assistant message
4) llm-errors     primary provider 429s -> retryable, Retry-After 30s -> fall back
5) llm-messages   the same conversation, ported to Anthropic shape
```

Write the agent once. JSON extraction, tools, structured tool outputs, streaming,
errors and conversation — all portable across providers. Each package is MIT and
has zero runtime dependencies; they share data shapes (OpenAI Chat Completions
as the hub) rather than depending on each other.
