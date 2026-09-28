#!/usr/bin/env node
import { run } from './runner.mjs';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--dry-run')) {
  console.error('Usage: node scripts/airbnb-price-runner/index.mjs [--dry-run]');
  process.exitCode = 1;
} else {
  try { await run({ dryRun: args.includes('--dry-run') }); }
  catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
