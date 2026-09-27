#!/usr/bin/env bash
# Production build without network access: Google Fonts CSS is mocked (the fonts themselves
# aren't needed to check that the app compiles and type-checks). Uses webpack because the
# Turbopack font loader can't read a JS mock.
set -euo pipefail
cd "$(dirname "$0")/../.."
rm -rf .next
NEXT_FONT_GOOGLE_MOCKED_RESPONSES="$PWD/qa/harness/font-mock.cjs" \
DATABASE_URL="${DATABASE_URL:-postgresql://bunks:bunks@localhost:5432/bunks_qa}" \
  npx next build --webpack
