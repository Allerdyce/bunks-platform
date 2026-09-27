#!/usr/bin/env bash
# Starts the local QA stack. Usage: qa/harness/start.sh [workdir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${1:-/tmp/bunks-qa}"
mkdir -p "$WORK/ical" "$WORK/emails"
cp "$ROOT"/qa/fixtures/ical/*.ics "$WORK/ical/"
export DATABASE_URL="${QA_DATABASE_URL:-postgresql://bunks:bunks@localhost:5432/bunks_qa}"
case "$DATABASE_URL" in *localhost*|*127.0.0.1*) ;; *) echo "Refusing: QA DATABASE_URL must be local" >&2; exit 1;; esac
export STRIPE_SECRET_KEY=sk_test_mock STRIPE_WEBHOOK_SECRET=whsec_localqa
export STRIPE_API_HOST=localhost STRIPE_API_PORT=12111 STRIPE_API_PROTOCOL=http
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_mock
export EMAIL_CAPTURE_DIR="$WORK/emails"
export ADMIN_PASSWORD=qa-admin-password ADMIN_SESSION_SECRET=qa-session-secret-0123456789abcdef0123456789
export CRON_SECRET=qa-cron-secret ICAL_FEED_SECRET=qa-ical-secret
export NEXT_PUBLIC_SITE_URL=http://localhost:3000
(cd "$WORK/ical" && nohup python3 -m http.server 8765 > "$WORK/ical.log" 2>&1 &)
nohup node "$ROOT/qa/harness/stripe-mock.mjs" > "$WORK/stripe-mock.log" 2>&1 &
cd "$ROOT" && nohup npx next dev -p 3000 > "$WORK/next.log" 2>&1 &
for i in $(seq 1 60); do curl -s -o /dev/null localhost:3000/api/admin/session && break; sleep 2; done
echo "QA stack up (logs in $WORK)"
