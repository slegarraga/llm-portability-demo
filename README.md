# llm-portability-demo

The four zero-dependency provider-portability packages working together, end to end:

- [`tool-schema`](https://www.npmjs.com/package/tool-schema) — one JSON Schema → a valid OpenAI / Anthropic / Gemini / MCP tool.
- [`llm-sse`](https://www.npmjs.com/package/llm-sse) — parse the streaming response into unified events; collect a message.
- [`llm-errors`](https://www.npmjs.com/package/llm-errors) — normalize a provider error; decide whether to retry or fall back.
- [`llm-messages`](https://www.npmjs.com/package/llm-messages) — port the identical conversation to another provider.

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
