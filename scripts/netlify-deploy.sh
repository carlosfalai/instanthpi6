#!/usr/bin/env bash
# Deploy the built frontend (dist/public) to Netlify production without printing secrets.
# Usage: ./scripts/netlify-deploy.sh

set -euo pipefail

# Load secrets from Keychain if available (names only, no values printed)
if [ -f "scripts/load-secrets.sh" ]; then
  # shellcheck disable=SC1091
  source scripts/load-secrets.sh
fi

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "Error: NETLIFY_AUTH_TOKEN not found. Add it to macOS Keychain with:\n  security add-generic-password -a $USER -s instanthpi_netlify_token -w {{NETLIFY_AUTH_TOKEN}} -U\nThen re-run this script."
  exit 1
fi

# Build if needed
if [ ! -d dist/public ]; then
  echo "Building project..."
  npm run build
fi

# If the repo is already linked, this will just deploy. If not, you can set NETLIFY_SITE_ID in your env.
echo "Deploying to Netlify production..."
npx -y netlify-cli@23.4.1 deploy --dir=dist/public --prod --auth=$NETLIFY_AUTH_TOKEN --message="Automated deploy: physician dashboard hero rotation"

echo "Deployment command completed. Verify at: https://instanthpi.ca/doctor-dashboard"

