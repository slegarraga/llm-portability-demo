# llm-portability-demo

[![CI](https://github.com/slegarraga/llm-portability-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-portability-demo/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/slegarraga/llm-portability-demo/badge)](https://scorecard.dev/viewer/?uri=github.com/slegarraga/llm-portability-demo)
[![license](https://img.shields.io/github/license/slegarraga/llm-portability-demo.svg)](./LICENSE)
[![offline demo](https://img.shields.io/badge/demo-offline-brightgreen.svg)](./demo.mjs)

An offline, one-command proof that the five provider-portability packages can
compose into a useful agent flow:

1. Recover a structured agent plan from model-shaped prose.
2. Generate provider-native tool schemas from one JSON Schema.
3. Parse an OpenAI-compatible streaming tool call.
4. Execute a deterministic local tool and append the tool result.
5. Normalize a provider failure into a routing decision.
6. Convert the same OpenAI-hub conversation into Anthropic and Gemini request
   bodies.

No network call is made unless you explicitly opt into live mode.

## Quick start

```sh
npm install
npm start
```

Run the deterministic smoke check:

```sh
npm run check
```

`npm run check` syntax-checks the demo and checker, executes `node demo.mjs`
offline, compares the transcript with
[docs/sample-output.txt](./docs/sample-output.txt), and asserts the concrete
handoffs between packages. CI runs the same command.

## Expected output

The full transcript is committed at [docs/sample-output.txt](./docs/sample-output.txt).
The important shape is:

```text
1) json-from-llm  recover an agent plan from reasoning/prose output
2) tool-schema    one JSON Schema -> OpenAI, Anthropic, Gemini, MCP
3) llm-sse        parse the stream and collect the tool call
4) offline tool   execute get_weather with deterministic fixture data
5) llm-errors     primary provider failure becomes a routing decision
6) llm-messages   same OpenAI-hub history, provider-native fallback bodies

Proof matrix
   json-from-llm -> plan city=Santiago units=metric fallback=anthropic
   tool-schema   -> OpenAI tool=get_weather, MCP output fields=5
   llm-sse       -> assistant tool_call=get_weather args=city,units
   offline tool  -> fixture result=Santiago/18.4 metric clear
   llm-errors    -> openai/rate_limit retryAfter=30000ms fallback=anthropic
   llm-messages  -> Anthropic messages=3, Gemini contents=3

Proof: one offline agent plan, one tool schema, one streamed tool call, one error policy, portable provider bodies.
```

## Architecture

The demo keeps OpenAI Chat Completions messages as the canonical hub because that
is the common shape many OpenAI-compatible providers already speak.

```text
model-like prose
  -> json-from-llm extracts { city, units, fallbackProvider, maxRetryMs }
  -> tool-schema emits OpenAI, Anthropic, Gemini and MCP tool schemas
  -> llm-sse parses an OpenAI-compatible SSE stream into a tool-call message
  -> offline get_weather fixture returns deterministic tool output
  -> llm-errors normalizes a 429 + Retry-After into a fallback decision
  -> llm-messages ports the same hub history to Anthropic and Gemini bodies
```

This proves the packages share practical data boundaries without depending on
each other at runtime. The demo has only the five package dependencies and can be
run in CI, on an airplane, or inside a fresh clone after `npm install`.

## Package roles

- [`json-from-llm`](https://www.npmjs.com/package/json-from-llm) recovers JSON
  from reasoning, markdown or prose output.
- [`tool-schema`](https://www.npmjs.com/package/tool-schema) turns one JSON
  Schema into valid OpenAI, Anthropic, Gemini and MCP tools, including MCP
  `outputSchema`.
- [`llm-sse`](https://www.npmjs.com/package/llm-sse) parses streaming provider
  responses into unified events and collects an assistant message.
- [`llm-errors`](https://www.npmjs.com/package/llm-errors) normalizes provider
  failures so agents can retry, fail, or fall back intentionally.
- [`llm-messages`](https://www.npmjs.com/package/llm-messages) ports the
  identical conversation to another provider request shape.

## Live provider mode

Live mode is opt-in and only runs when `LLM_DEMO_LIVE=1` is set. A provider API
key by itself is not enough, which keeps CI and local demos cost-safe by default.

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

## Suite status

| Package | npm | Downloads | CI |
| --- | --- | --- | --- |
| [tool-schema](https://github.com/slegarraga/tool-schema) | [![npm](https://img.shields.io/npm/v/tool-schema.svg)](https://www.npmjs.com/package/tool-schema) | [![downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslegarraga%2Fllm-portability-demo%2Fmain%2Fbadges%2Fnpm-downloads%2Ftool-schema.json)](https://www.npmjs.com/package/tool-schema) | [![CI](https://github.com/slegarraga/tool-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/tool-schema/actions/workflows/ci.yml) |
| [llm-sse](https://github.com/slegarraga/llm-sse) | [![npm](https://img.shields.io/npm/v/llm-sse.svg)](https://www.npmjs.com/package/llm-sse) | [![downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslegarraga%2Fllm-portability-demo%2Fmain%2Fbadges%2Fnpm-downloads%2Fllm-sse.json)](https://www.npmjs.com/package/llm-sse) | [![CI](https://github.com/slegarraga/llm-sse/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-sse/actions/workflows/ci.yml) |
| [llm-errors](https://github.com/slegarraga/llm-errors) | [![npm](https://img.shields.io/npm/v/llm-errors.svg)](https://www.npmjs.com/package/llm-errors) | [![downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslegarraga%2Fllm-portability-demo%2Fmain%2Fbadges%2Fnpm-downloads%2Fllm-errors.json)](https://www.npmjs.com/package/llm-errors) | [![CI](https://github.com/slegarraga/llm-errors/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-errors/actions/workflows/ci.yml) |
| [llm-messages](https://github.com/slegarraga/llm-messages) | [![npm](https://img.shields.io/npm/v/llm-messages.svg)](https://www.npmjs.com/package/llm-messages) | [![downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslegarraga%2Fllm-portability-demo%2Fmain%2Fbadges%2Fnpm-downloads%2Fllm-messages.json)](https://www.npmjs.com/package/llm-messages) | [![CI](https://github.com/slegarraga/llm-messages/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-messages/actions/workflows/ci.yml) |
| [json-from-llm](https://github.com/slegarraga/json-from-llm) | [![npm](https://img.shields.io/npm/v/json-from-llm.svg)](https://www.npmjs.com/package/json-from-llm) | [![downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslegarraga%2Fllm-portability-demo%2Fmain%2Fbadges%2Fnpm-downloads%2Fjson-from-llm.json)](https://www.npmjs.com/package/json-from-llm) | [![CI](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml) |

Download badges use the npm downloads range API over the last 30 complete days
because the npm monthly point endpoint can lag for newly published packages.

## More docs

- [Provider portability map](./docs/provider-portability.md)
- [OpenAI-compatible agent portability article](./docs/openai-compatible-agent-portability.md)
- [Security posture](./docs/security-posture.md)
