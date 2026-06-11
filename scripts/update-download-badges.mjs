import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const packages = [
  'tool-schema',
  'llm-sse',
  'llm-errors',
  'llm-messages',
  'json-from-llm',
];

const outDir = path.join('badges', 'npm-downloads');
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultWindow() {
  const now = process.env.DOWNLOAD_BADGE_TODAY
    ? new Date(`${process.env.DOWNLOAD_BADGE_TODAY}T00:00:00.000Z`)
    : new Date();

  if (Number.isNaN(now.getTime())) {
    throw new Error(`Invalid DOWNLOAD_BADGE_TODAY: ${process.env.DOWNLOAD_BADGE_TODAY}`);
  }

  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 1,
  ));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);

  return {
    start: process.env.DOWNLOAD_BADGE_START || isoDate(start),
    end: process.env.DOWNLOAD_BADGE_END || isoDate(end),
  };
}

function formatDownloads(downloads) {
  if (downloads >= 1_000_000) {
    return `${(downloads / 1_000_000).toFixed(1).replace(/\\.0$/, '')}m`;
  }

  if (downloads >= 1_000) {
    return `${(downloads / 1_000).toFixed(1).replace(/\\.0$/, '')}k`;
  }

  return String(downloads);
}

function colorFor(downloads) {
  if (downloads === 0) return 'red';
  if (downloads < 100) return 'yellowgreen';
  if (downloads < 1_000) return 'green';
  return 'brightgreen';
}

async function fetchDownloads(pkg, start, end) {
  const url = `https://api.npmjs.org/downloads/range/${start}:${end}/${encodeURIComponent(pkg)}`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'llm-portability-demo-download-badge-refresh',
    },
  });

  if (!response.ok) {
    throw new Error(`npm downloads API failed for ${pkg}: ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  const rows = Array.isArray(body.downloads) ? body.downloads : [];
  const downloads = rows.reduce((sum, row) => sum + Number(row.downloads || 0), 0);

  return { downloads, start: body.start || start, end: body.end || end };
}

function badgeJson(pkg, result) {
  return {
    schemaVersion: 1,
    label: 'downloads',
    message: `${formatDownloads(result.downloads)}/30d`,
    color: colorFor(result.downloads),
    cacheSeconds: 3600,
    namedLogo: 'npm',
  };
}

async function readExisting(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const { start, end } = defaultWindow();
  const updates = [];

  await mkdir(outDir, { recursive: true });

  for (const pkg of packages) {
    const result = await fetchDownloads(pkg, start, end);
    const file = path.join(outDir, `${pkg}.json`);
    const next = `${JSON.stringify(badgeJson(pkg, result), null, 2)}\n`;
    const current = await readExisting(file);

    updates.push(`${pkg}: ${result.downloads} downloads (${result.start}..${result.end})`);

    if (checkOnly && current !== next) {
      throw new Error(`${file} is stale. Run node scripts/update-download-badges.mjs`);
    }

    if (!checkOnly) {
      await writeFile(file, next);
    }
  }

  console.log(updates.join('\n'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
