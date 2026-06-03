// The four provider-portability packages working together, end to end.
//
//   npm install && npm start
//
// Runs offline against a canned OpenAI streaming response. Swap
// `mockOpenAIStream()` for `(await fetch(...)).body` and it goes live — the rest
// is unchanged. That's the whole point: write the agent once, run it anywhere.
import { toTool } from 'tool-schema';
import { toAnthropic } from 'llm-messages';
import { normalizeError, getRetryDelayMs } from 'llm-errors';
import { parseOpenAIStream, collectStream, toAssistantMessage } from 'llm-sse';

const log = (s) => console.log(s);

// 1) tool-schema — one JSON Schema becomes a valid OpenAI tool.
const { tool } = toTool(
  {
    name: 'get_weather',
    description: 'Get the current weather for a city',
    schema: {
      type: 'object',
      properties: { city: { type: 'string', description: 'City name' } },
      required: ['city'],
    },
  },
  { target: 'openai' },
);
log('1) tool-schema   one JSON Schema -> OpenAI tool');
log('   ' + JSON.stringify(tool));

// A canned OpenAI streaming response: the model calls the tool.
async function* mockOpenAIStream() {
  const chunks = [
    { choices: [{ delta: { role: 'assistant', content: 'Let me check that.' } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'get_weather', arguments: '' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"city":' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"Santiago"}' } }] } }] },
    { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
  ];
  for (const chunk of chunks) yield `data: ${JSON.stringify(chunk)}\n\n`;
  yield 'data: [DONE]\n\n';
}

// 2) llm-sse — parse the stream as it arrives, then collect a message.
log('\n2) llm-sse       parse the stream live');
for await (const event of parseOpenAIStream(mockOpenAIStream())) {
  if (event.type === 'text') log('   text: ' + JSON.stringify(event.text));
  if (event.type === 'tool_call_start') log('   tool call: ' + event.name);
  if (event.type === 'finish') log('   finish: ' + event.reason);
}
const collected = await collectStream(parseOpenAIStream(mockOpenAIStream()));
const assistant = toAssistantMessage(collected);
log('   collected -> assistant message: ' + JSON.stringify(assistant));

// The conversation so far, in the OpenAI "hub" format.
const history = [
  { role: 'user', content: "What's the weather in Santiago?" },
  assistant,
];

// 3) llm-errors — the primary provider rate-limits us; decide what to do.
const rateLimited = {
  status: 429,
  headers: { 'retry-after': '30' },
  error: { type: 'rate_limit_error', code: 'rate_limit_exceeded', param: null },
};
const failure = normalizeError(rateLimited);
log('\n3) llm-errors    primary provider failed');
log(
  `   ${failure.provider}/${failure.category}  retryable=${failure.retryable}  ` +
    `retryAfter=${getRetryDelayMs(failure, 0)}ms`,
);
log('   -> too slow to wait; fall back to another provider, same conversation.');

// 4) llm-messages — port the identical conversation to Anthropic.
const claude = toAnthropic(history);
log('\n4) llm-messages  same conversation, Anthropic shape');
log('   ' + JSON.stringify(claude));

log('\nWrote the agent once. Tools, streaming, errors and conversation — all portable.');
