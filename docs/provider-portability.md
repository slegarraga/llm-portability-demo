# Provider portability map

Modern agent code often starts with OpenAI-shaped messages, tools, streaming
events and retry behavior, then needs to run against another provider or a
fallback provider. The APIs are close enough to look interchangeable, but not
close enough to switch safely without adapters.

This suite keeps those adapters small, typed and inspectable.

## Problem areas

| Area | Portability problem | Package |
| --- | --- | --- |
| Tools | Each provider accepts a different tool/function schema shape. | [`tool-schema`](https://github.com/slegarraga/tool-schema) |
| Streams | Server-sent event chunks use different event names and payload shapes. | [`llm-sse`](https://github.com/slegarraga/llm-sse) |
| Errors | Rate limits, retry hints and provider failures are reported differently. | [`llm-errors`](https://github.com/slegarraga/llm-errors) |
| Messages | Conversation roles, tool calls and tool results need provider-specific serialization. | [`llm-messages`](https://github.com/slegarraga/llm-messages) |
| JSON output | Reasoning output, Markdown fences and prose often wrap the JSON a tool pipeline expects. | [`json-from-llm`](https://github.com/slegarraga/json-from-llm) |

## Composition

1. Describe a tool once as JSON Schema.
2. Convert that schema into the provider-specific tool format.
3. Stream and collect the assistant response into a stable message shape.
4. Normalize retryable errors and fallback decisions.
5. Port the resulting conversation to the next provider without rewriting the
   agent loop.

`llm-messages` is the best single repository for the OpenAI Codex for OSS
application because it sits at the conversation boundary: it preserves OpenAI
tool-call semantics while converting to Anthropic and Gemini message shapes.

## Design constraints

- MIT licensed.
- Zero runtime dependencies in the npm packages.
- TypeScript-first APIs with tests and CI.
- OpenAI Chat Completions-compatible data as the hub shape.
- Explicit reporting for lossy conversions instead of silently dropping data.
- Small packages that can be adopted individually or together.

The demo runs offline so maintainers can inspect the whole flow without API
keys. Live OpenAI conformance tests are the next useful layer once API credits
are available.
