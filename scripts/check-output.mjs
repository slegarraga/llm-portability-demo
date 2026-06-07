import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const env = { ...process.env };
delete env.LLM_DEMO_LIVE;
delete env.LLM_DEMO_BASE_URL;
delete env.LLM_DEMO_API_KEY;
delete env.LLM_DEMO_MODEL;

const run = spawnSync(process.execPath, ['demo.mjs'], {
  cwd: root,
  env,
  encoding: 'utf8',
});

if (run.status !== 0) {
  console.error((run.stderr || run.stdout || '').trimEnd());
  process.exit(run.status || 1);
}

const normalize = (text) => text.replace(/\r\n/g, '\n').trimEnd();
const actual = normalize(run.stdout);
const expected = normalize(readFileSync(join(root, 'docs', 'sample-output.txt'), 'utf8'));

if (actual !== expected) {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const max = Math.max(actualLines.length, expectedLines.length);
  let mismatchAt = 0;
  while (mismatchAt < max && actualLines[mismatchAt] === expectedLines[mismatchAt]) {
    mismatchAt += 1;
  }
  console.error(`offline demo output changed at line ${mismatchAt + 1}`);
  console.error(`expected: ${expectedLines[mismatchAt] ?? '<missing>'}`);
  console.error(`actual:   ${actualLines[mismatchAt] ?? '<missing>'}`);
  console.error('Run `node demo.mjs` and update docs/sample-output.txt if the change is intentional.');
  process.exit(1);
}

const requiredSnippets = [
  'json-from-llm',
  'tool-schema',
  'llm-sse',
  'llm-errors',
  'llm-messages',
  'plan: {"city":"Santiago","units":"metric","fallbackProvider":"anthropic","maxRetryMs":1000}',
  'provider targets: {"openai":"get_weather","anthropic":"object","gemini":"object","mcp":["object","object"]}',
  'tool call: get_weather',
  'args: {"city":"Santiago","units":"metric"}',
  'result: {"city":"Santiago","temperature":18.4,"units":"metric","condition":"clear","observedAt":"2026-06-07T12:00:00-04:00"}',
  'decision: retry delay exceeds 1000ms budget -> fall back to anthropic',
  '"type":"tool_use"',
  '"functionCall":{"id":"call_weather_santiago","name":"get_weather","args":{"city":"Santiago","units":"metric"}}',
  'Proof matrix',
  'json-from-llm -> plan city=Santiago units=metric fallback=anthropic',
  'tool-schema   -> OpenAI tool=get_weather, MCP output fields=5',
  'llm-sse       -> assistant tool_call=get_weather args=city,units',
  'offline tool  -> fixture result=Santiago/18.4 metric clear',
  'llm-errors    -> openai/rate_limit retryAfter=30000ms fallback=anthropic',
  'llm-messages  -> Anthropic messages=3, Gemini contents=3',
  'Proof:',
];

for (const snippet of requiredSnippets) {
  if (!actual.includes(snippet)) {
    console.error(`offline demo output is missing ${JSON.stringify(snippet)}`);
    process.exit(1);
  }
}

console.log(
  `check passed: offline demo output matches docs/sample-output.txt (${actual.split('\n').length} lines)`,
);
