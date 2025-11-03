#!/bin/bash

# Script to migrate imports from local types to SDK
# Usage: ./migrate-imports.sh

echo "🔄 Migrating imports from @/lib/types/bulk-launcher to @launcher-ads/sdk..."

# Find all TypeScript files in apps/web
find apps/web -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "from '@/lib/types/bulk-launcher'" "$file"; then
    echo "  📝 Updating: $file"

    # Replace the import statement
    # From: import { X, Y, Z } from '@/lib/types/bulk-launcher'
    # To: import { X, Y, Z } from '@launcher-ads/sdk'
    sed -i '' "s|from '@/lib/types/bulk-launcher'|from '@launcher-ads/sdk'|g" "$file"

    # Also handle type imports
    # From: import type { X } from '@/lib/types/bulk-launcher'
    # Already covered by the above
  fi
done

echo "✅ Migration complete!"
echo ""
echo "⚠️  Next steps:"
echo "  1. Review the changes with: git diff"
echo "  2. Delete apps/web/lib/types/bulk-launcher.ts"
echo "  3. Run: pnpm typecheck to verify"
