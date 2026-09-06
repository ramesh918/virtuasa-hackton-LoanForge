#!/usr/bin/env bash
# PreToolUse hook (Edit|Write): blocks writes that log raw PII fields in clear text.
set -euo pipefail
PATTERN='console\.log\(.*(income|ssn|accountNumber|applicantName)'
if git diff --cached -U0 2>/dev/null | grep -E "$PATTERN"; then
  echo "pii-redaction-check: raw PII field passed to console.log — use redact() from src/api/src/common/logging.ts" >&2
  exit 2
fi
exit 0
