# OpenAI-compatible agent portability

OpenAI-shaped messages are a practical hub for agent infrastructure: roles,
tool calls, tool results, multimodal parts and streaming events are familiar to
many builders. The problem appears when the same agent needs to run against a
fallback provider, a customer-selected provider, or a provider-specific model.

The APIs look similar, but small differences break agent loops:

- A system prompt is a message in OpenAI, a top-level field in Anthropic and a
  system instruction in Gemini.
- Tool-call arguments are serialized JSON in OpenAI, but parsed objects in other
  providers.
- Tool results are separate messages in OpenAI, but nested content blocks or
  function responses elsewhere.
- Streaming chunks differ in event names, payload shape and tool-call deltas.
- Rate limits and retry hints are exposed through different error formats.

The provider-portability suite keeps those differences explicit and testable.

## Suite shape

| Step | Package | Role |
| --- | --- | --- |
| Describe tools | [`tool-schema`](https://github.com/slegarraga/tool-schema) | Convert one JSON Schema into OpenAI, Anthropic, Gemini and MCP tool schemas. |
| Stream output | [`llm-sse`](https://github.com/slegarraga/llm-sse) | Parse provider streams into unified text, tool-call and finish events. |
| Handle failures | [`llm-errors`](https://github.com/slegarraga/llm-errors) | Normalize provider errors, retryability and Retry-After values. |
| Move conversations | [`llm-messages`](https://github.com/slegarraga/llm-messages) | Convert roles, tool calls, tool results and multimodal parts across providers. |
| Extract JSON | [`json-from-llm`](https://github.com/slegarraga/json-from-llm) | Recover JSON from reasoning output, Markdown fences and prose. |

Each package is MIT licensed, TypeScript-first and zero runtime dependency. The
packages can be used independently, but together they cover the common seams in
an agent fallback loop.

## Why `llm-messages` is the application repo

`llm-messages` is the best single repository for the OpenAI Codex for OSS
application because it sits at the conversation boundary. It preserves the data
that usually breaks portability:

- tool-call ids and names;
- serialized versus parsed arguments;
- tool-result placement;
- role alternation requirements;
- system prompt placement;
- image, audio and document parts;
- warning codes for lossy conversions.

That makes it the most useful place to apply Codex and API credits: conformance
fixtures can prove whether OpenAI Responses API payloads, tool calls and
multimodal parts still map cleanly into the canonical hub shape.

## Maintenance model

The suite is intentionally small. Public CI stays offline and deterministic, and
maintainers refresh provider-backed fixtures only when the resulting payloads
improve public coverage. The roadmap and conformance fixture plan live in the
candidate repository:

- [`llm-messages` roadmap](https://github.com/slegarraga/llm-messages/blob/main/ROADMAP.md)
- [`llm-messages` conformance fixtures plan](https://github.com/slegarraga/llm-messages/blob/main/docs/conformance-fixtures.md)

The goal is not to hide provider differences behind a large SDK. The goal is to
make the conversion surface small enough that maintainers can inspect, test and
review it.
