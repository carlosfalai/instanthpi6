#!/bin/bash

# Set environment variables
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
  echo "Error: NETLIFY_AUTH_TOKEN environment variable is required"
  echo "Set it with: export NETLIFY_AUTH_TOKEN=your_token_here"
  exit 1
fi

# Build the project
echo "Building the project..."
npm run build

# Deploy to Netlify
echo "Deploying to Netlify..."
npx netlify-cli deploy \
  --dir=dist/public \
  --prod \
  --auth=$NETLIFY_AUTH_TOKEN \
  --json \
  --message="Deploy from InstantHPI"

echo "Deployment complete!"