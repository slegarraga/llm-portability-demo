# llm-portability-demo

[![CI](https://github.com/slegarraga/llm-portability-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/llm-portability-demo/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/slegarraga/llm-portability-demo.svg)](./LICENSE)
[![offline demo](https://img.shields.io/badge/demo-offline-brightgreen.svg)](./demo.mjs)

The four zero-dependency provider-portability packages working together, end to end:

- [`tool-schema`](https://www.npmjs.com/package/tool-schema) — one JSON Schema → a valid OpenAI / Anthropic / Gemini / MCP tool.
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

Companion utility: [`json-from-llm`](https://github.com/slegarraga/json-from-llm) extracts JSON from reasoning-model output before it enters a provider-portable tool or message flow.

## Run

```sh
npm install
npm start
```

It runs **offline** against a canned OpenAI streaming response, so you can see the whole flow without an API key. Swap `mockOpenAIStream()` in `demo.mjs` for `(await fetch(...)).body` and it goes live — nothing else changes.

## What it shows

```
1) tool-schema   one JSON Schema -> OpenAI tool
2) llm-sse       parse the stream live, collect an assistant message
3) llm-errors    primary provider 429s -> retryable, Retry-After 30s -> fall back
4) llm-messages  the same conversation, ported to Anthropic shape
```

Write the agent once. Tools, streaming, errors and conversation — all portable across providers. Each package is MIT and has zero runtime dependencies; they share data shapes (OpenAI Chat Completions as the hub) rather than depending on each other.
