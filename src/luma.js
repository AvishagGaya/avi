#!/usr/bin/env node
// Create Luma events from a JSON file of event payloads.
//
//   LUMA_API_KEY=... node src/luma.js events/gypsy-promotion/luma-events.json
//   node src/luma.js events/gypsy-promotion/luma-events.json --dry-run
//
// The key comes from luma.com → calendar → settings → API keys (Luma Plus).
// Each event gets the shared registration questions below unless the payload
// carries its own `registration_questions`.

import fs from 'fs';
import path from 'path';

const API = 'https://public-api.luma.com/v1';

const SHARED_QUESTIONS = [
  { id: 'diet', question_type: 'select', label: 'dietary preferences', required: true,
    options: ['none', 'vegetarian', 'vegan', 'gluten free', 'keto'] },
  { id: 'allergies', question_type: 'select', label: 'allergies', required: true, multiple: true,
    options: ['none', 'milk', 'eggs', 'peanuts', 'tree nuts', 'fish', 'shellfish', 'wheat', 'soy', 'sesame', 'other'] },
  { id: 'notes', question_type: 'text', label: 'anything else we should know', required: false, multiline: true },
];

function usage() {
  console.error('usage: node src/luma.js <events.json> [--dry-run]');
  process.exit(1);
}

async function createEvent(apiKey, payload) {
  const res = await fetch(`${API}/events/create`, {
    method: 'POST',
    headers: { 'x-luma-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return JSON.parse(text);
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  if (!file) usage();

  const events = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const apiKey = process.env.LUMA_API_KEY;
  if (!dryRun && !apiKey) {
    console.error('LUMA_API_KEY is not set. run with --dry-run to preview the payloads.');
    process.exit(1);
  }

  for (const entry of events) {
    const { _campaign, ...payload } = entry;
    payload.registration_questions ??= SHARED_QUESTIONS;

    console.log(`\n⟡ ${_campaign ?? payload.name}`);
    console.log(`  ${payload.name}`);
    console.log(`  ${payload.start_at} → ${payload.end_at} (${payload.timezone}), ${payload.visibility}`);

    if (dryRun) {
      console.log(JSON.stringify(payload, null, 2).replace(/^/gm, '  '));
      continue;
    }

    try {
      const { id } = await createEvent(apiKey, payload);
      console.log(`  created ${id}`);
      console.log(`  manage ⤐ https://luma.com/event/manage/${id}`);
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

main();
