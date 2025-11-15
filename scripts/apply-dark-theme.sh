#!/bin/bash

# Script to apply dark theme color replacements across all TypeScript/TSX files
# This script replaces hardcoded color values with Tailwind theme variables

echo "Applying dark theme color replacements..."

# Find all TSX/TS files in client/src
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) | while read file; do
  echo "Processing: $file"
  
  # Replace common color patterns
  sed -i '' \
    -e 's/bg-\[#0d0d0d\]/bg-background/g' \
    -e 's/bg-\[#1a1a1a\]/bg-card/g' \
    -e 's/bg-\[#222\]/bg-secondary/g' \
    -e 's/bg-\[#2a2a2a\]/bg-accent/g' \
    -e 's/bg-\[#333\]/bg-accent/g' \
    -e 's/bg-\[#151515\]/bg-secondary/g' \
    -e 's/bg-\[#1e1e1e\]/bg-card/g' \
    -e 's/bg-\[#252525\]/bg-accent/g' \
    -e 's/text-\[#e6e6e6\]/text-foreground/g' \
    -e 's/text-\[#999\]/text-muted-foreground/g' \
    -e 's/text-\[#666\]/text-muted-foreground/g' \
    -e 's/text-\[#ccc\]/text-foreground/g' \
    -e 's/text-\[#8b5cf6\]/text-primary/g' \
    -e 's/border-\[#333\]/border-border/g' \
    -e 's/border-\[#2a2a2a\]/border-border/g' \
    -e 's/border-\[#444\]/border-border/g' \
    -e 's/hover:bg-\[#222\]/hover:bg-secondary/g' \
    -e 's/hover:bg-\[#2a2a2a\]/hover:bg-accent/g' \
    -e 's/focus:ring-\[#8b5cf6\]/focus:ring-primary/g' \
    "$file"
done

echo "Dark theme replacements complete!"

