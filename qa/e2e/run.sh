#!/usr/bin/env bash
# Runs the E2E scenarios with the same work dir as qa/harness/start.sh. Usage: qa/e2e/run.sh [filter] [workdir]
WORK="${2:-${QA_WORK:-/tmp/bunks-qa}}"
cd "$(dirname "$0")/../.." && EMAIL_CAPTURE_DIR="$WORK/emails" QA_ICAL_DIR="$WORK/ical" node qa/e2e/run-all.mjs "${1:-}"
