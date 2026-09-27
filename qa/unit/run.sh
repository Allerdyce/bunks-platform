#!/usr/bin/env bash
# Unit tests for pure server logic, run under several server timezones.
cd "$(dirname "$0")/../.."
status=0
for tz in UTC America/Denver Europe/London Asia/Tokyo; do
  echo "== TZ=$tz"
  TZ=$tz DATABASE_URL=${DATABASE_URL:-postgresql://unused@localhost/unused} \
    TSX_TSCONFIG_PATH=qa/unit/tsconfig.json node --import tsx --test qa/unit/*.test.ts 2>&1 | grep -E "^# (pass|fail)|not ok|Error" || true
  TZ=$tz DATABASE_URL=${DATABASE_URL:-postgresql://unused@localhost/unused} \
    TSX_TSCONFIG_PATH=qa/unit/tsconfig.json node --import tsx --test qa/unit/*.test.ts >/dev/null 2>&1 || status=1
done
exit $status
