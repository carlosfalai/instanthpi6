#!/usr/bin/env bash
# Load secrets from macOS Keychain into environment variables (no printing of secret values)
# Usage: source scripts/load-secrets.sh

set -euo pipefail

# Helper: fetch a secret by service name
_fetch_secret() {
  local service="$1"
  security find-generic-password -w -s "$service" 2>/dev/null || true
}

# Netlify token
if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  NETLIFY_AUTH_TOKEN="$(_fetch_secret instanthpi_netlify_token)"
  export NETLIFY_AUTH_TOKEN
fi

# You can add other services similarly (commented out as placeholders):
# if [ -z "${OPENAI_API_KEY:-}" ]; then
#   OPENAI_API_KEY="$(_fetch_secret instanthpi_openai_api_key)"; export OPENAI_API_KEY; fi
# if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
#   ANTHROPIC_API_KEY="$(_fetch_secret instanthpi_anthropic_api_key)"; export ANTHROPIC_API_KEY; fi
# if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
#   SUPABASE_SERVICE_KEY="$(_fetch_secret instanthpi_supabase_service_key)"; export SUPABASE_SERVICE_KEY; fi

# Print which vars were loaded (names only, never values)
loaded=()
[ -n "${NETLIFY_AUTH_TOKEN:-}" ] && loaded+=(NETLIFY_AUTH_TOKEN)
# [ -n "${OPENAI_API_KEY:-}" ] && loaded+=(OPENAI_API_KEY)
# [ -n "${ANTHROPIC_API_KEY:-}" ] && loaded+=(ANTHROPIC_API_KEY)
# [ -n "${SUPABASE_SERVICE_KEY:-}" ] && loaded+=(SUPABASE_SERVICE_KEY)

if [ ${#loaded[@]} -gt 0 ]; then
  echo "Loaded secrets into environment: ${loaded[*]}"
else
  echo "No secrets loaded (add them to Keychain)."
fi

