// The five provider-portability packages working together, end to end.
//
//   npm install && npm start
//
// Runs offline against a canned OpenAI-compatible streaming response by default.
// Set LLM_DEMO_LIVE=1 plus explicit live-provider env vars to exercise the same
// flow against an OpenAI-compatible chat completions endpoint.
import { toTool } from 'tool-schema';
import { toAnthropic, toGemini } from 'llm-messages';
import { normalizeError, getRetryDelayMs } from 'llm-errors';
import { parseOpenAIStream, collectStream, toAssistantMessage } from 'llm-sse';
import { extractJson } from 'json-from-llm';

const log = (s) => console.log(s);
const liveMode = process.env.LLM_DEMO_LIVE === '1';
const providerLabel = liveMode ? 'live OpenAI-compatible endpoint' : 'offline canned OpenAI-compatible stream';

const weatherFixtures = new Map([
  [
    'Santiago',
    {
      metricTemperature: 18.4,
      condition: 'clear',
      observedAt: '2026-06-07T12:00:00-04:00',
    },
  ],
]);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Live mode requires ${name}. Run offline without LLM_DEMO_LIVE=1, or see README.md#live-provider-mode.`,
    );
  }
  return value;
}

function liveChatCompletionsUrl() {
  const baseUrl = process.env.LLM_DEMO_BASE_URL || 'https://api.openai.com/v1';
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
}

async function openAICompatibleStream({ city, tool }) {
  const apiKey = requiredEnv('LLM_DEMO_API_KEY');
  const model = requiredEnv('LLM_DEMO_MODEL');

  const response = await fetch(liveChatCompletionsUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        {
          role: 'user',
          content: `What is the weather in ${city}? Use the get_weather tool if available.`,
        },
      ],
      tools: [tool],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Live provider returned HTTP ${response.status} ${response.statusText}. Response body omitted to avoid logging secrets.`,
    );
  }

  if (!response.body) {
    throw new Error('Live provider returned an empty response body.');
  }

  return response.body;
}

async function* replay(events) {
  yield* events;
}

function getWeather({ city, units }) {
  const fixture = weatherFixtures.get(city);
  if (!fixture) {
    throw new Error(`No offline weather fixture for ${JSON.stringify(city)}.`);
  }
  const temperature =
    units === 'imperial'
      ? Math.round((fixture.metricTemperature * 1.8 + 32) * 10) / 10
      : fixture.metricTemperature;
  return {
    city,
    temperature,
    units,
    condition: fixture.condition,
    observedAt: fixture.observedAt,
  };
}

function firstToolCall(message) {
  const call = message.tool_calls?.[0];
  if (!call) {
    throw new Error(`${providerLabel} did not produce a tool call. Try a tool-capable model in live mode.`);
  }
  return call;
}

// 1) json-from-llm: extract a structured agent plan from model-shaped prose.
const config = extractJson(`
<think>Choose a provider-portable tool plan for a weather lookup.</think>

\`\`\`json
{
  "city": "Santiago",
  "units": "metric",
  "fallbackProvider": "anthropic",
  "maxRetryMs": 1000
}
\`\`\`
`);
log('1) json-from-llm  recover an agent plan from reasoning/prose output');
log('   plan: ' + JSON.stringify(config));

const weatherInputSchema = {
  type: 'object',
  properties: {
    city: { type: 'string', description: 'City name' },
    units: {
      type: 'string',
      enum: ['metric', 'imperial'],
      description: 'Temperature unit system',
    },
  },
  required: ['city', 'units'],
  additionalProperties: false,
};
const weatherOutputSchema = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    temperature: { type: 'number' },
    units: { type: 'string', enum: ['metric', 'imperial'] },
    condition: { type: 'string' },
    observedAt: { type: 'string', format: 'date-time' },
  },
  required: ['city', 'temperature', 'units', 'condition', 'observedAt'],
  additionalProperties: false,
};

const weatherToolDefinition = {
  name: 'get_weather',
  description: 'Get deterministic weather for a city from the offline fixture',
  schema: weatherInputSchema,
};

// 2) tool-schema: one JSON Schema becomes provider-specific tool schemas.
const { tool: openAITool } = toTool(weatherToolDefinition, { target: 'openai' });
const { tool: anthropicTool } = toTool(weatherToolDefinition, { target: 'anthropic' });
const { tool: geminiTool } = toTool(weatherToolDefinition, { target: 'gemini' });
const { tool: mcpTool } = toTool(
  {
    ...weatherToolDefinition,
    outputSchema: weatherOutputSchema,
  },
  { target: 'mcp' },
);
log('\n2) tool-schema    one JSON Schema -> OpenAI, Anthropic, Gemini, MCP');
log(
  '   provider targets: ' +
    JSON.stringify({
      openai: openAITool.function.name,
      anthropic: anthropicTool.input_schema.type,
      gemini: geminiTool.parameters.type,
      mcp: [mcpTool.inputSchema.type, mcpTool.outputSchema.type],
    }),
);
log('   OpenAI tool: ' + JSON.stringify(openAITool));
log('   MCP outputSchema: ' + JSON.stringify(mcpTool.outputSchema));

// A canned OpenAI streaming response: the model calls the tool.
async function* mockOpenAIStream() {
  const chunks = [
    { choices: [{ delta: { role: 'assistant', content: 'Let me check Santiago in metric units.' } }] },
    {
      choices: [
        {
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_weather_santiago',
                function: { name: 'get_weather', arguments: '' },
              },
            ],
          },
        },
      ],
    },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"city":' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"Santiago",' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"units":"metric"}' } }] } }] },
    { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
  ];
  for (const chunk of chunks) yield `data: ${JSON.stringify(chunk)}\n\n`;
  yield 'data: [DONE]\n\n';
}

// 3) llm-sse: parse the stream as it arrives, then collect a message.
log('\n3) llm-sse        parse the stream and collect the tool call');
log('   mode: ' + providerLabel);
const streamSource = liveMode
  ? await openAICompatibleStream({ city: config.city, tool: openAITool })
  : mockOpenAIStream();
const events = [];
for await (const event of parseOpenAIStream(streamSource)) {
  events.push(event);
  if (event.type === 'text') log('   text: ' + JSON.stringify(event.text));
  if (event.type === 'tool_call_start') log('   tool call: ' + event.name);
  if (event.type === 'finish') log('   finish: ' + event.reason);
}
const collected = await collectStream(replay(events));
const assistant = toAssistantMessage(collected);
log('   assistant: ' + JSON.stringify(assistant));

// 4) The offline tool executes the parsed arguments and emits an OpenAI tool result.
const toolCall = firstToolCall(assistant);
const toolArgs = extractJson(toolCall.function.arguments || '{}');
const toolResult = getWeather({
  city: toolArgs.city || config.city,
  units: toolArgs.units || config.units,
});
const toolMessage = {
  role: 'tool',
  tool_call_id: toolCall.id,
  content: JSON.stringify(toolResult),
};
log('\n4) offline tool   execute get_weather with deterministic fixture data');
log('   args: ' + JSON.stringify(toolArgs));
log('   result: ' + JSON.stringify(toolResult));

// The conversation so far, in the OpenAI "hub" format.
const history = [
  { role: 'user', content: `What's the weather in ${config.city}?` },
  assistant,
  toolMessage,
];

// 5) llm-errors: the primary provider rate-limits us; decide what to do.
const rateLimited = {
  status: 429,
  headers: { 'retry-after': '30' },
  error: { type: 'rate_limit_error', code: 'rate_limit_exceeded', param: null },
};
const failure = normalizeError(rateLimited);
const retryAfterMs = getRetryDelayMs(failure, 0);
log('\n5) llm-errors     primary provider failure becomes a routing decision');
log(
  `   ${failure.provider}/${failure.category}  retryable=${failure.retryable}  ` +
    `retryAfter=${retryAfterMs}ms`,
);
log(
  `   decision: retry delay exceeds ${config.maxRetryMs}ms budget -> ` +
    `fall back to ${config.fallbackProvider}`,
);

// 6) llm-messages: port the identical OpenAI-hub history to fallback providers.
const claude = toAnthropic(history);
const gemini = toGemini(history);
log('\n6) llm-messages   same OpenAI-hub history, provider-native fallback bodies');
log('   Anthropic: ' + JSON.stringify(claude));
log('   Gemini: ' + JSON.stringify(gemini));

log('\nProof matrix');
log(`   json-from-llm -> plan city=${config.city} units=${config.units} fallback=${config.fallbackProvider}`);
log(`   tool-schema   -> OpenAI tool=${openAITool.function.name}, MCP output fields=${mcpTool.outputSchema.required.length}`);
log(`   llm-sse       -> assistant tool_call=${toolCall.function.name} args=${Object.keys(toolArgs).join(',')}`);
log(
  `   offline tool  -> fixture result=${toolResult.city}/${toolResult.temperature} ` +
    `${toolResult.units} ${toolResult.condition}`,
);
log(
  `   llm-errors    -> ${failure.provider}/${failure.category} retryAfter=${retryAfterMs}ms ` +
    `fallback=${config.fallbackProvider}`,
);
log(`   llm-messages  -> Anthropic messages=${claude.messages.length}, Gemini contents=${gemini.contents.length}`);

log('\nProof: one offline agent plan, one tool schema, one streamed tool call, one error policy, portable provider bodies.');
