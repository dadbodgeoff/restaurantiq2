#!/bin/bash

echo "🧹 Starting RestaurantIQ Backend Cleanup..."

# Navigate to src
cd src || exit 1

echo "📁 Deleting placeholder modules..."

# Delete menu and prep modules (agent scaffolding)
rm -rf domains/menu 2>/dev/null && echo "✅ Deleted: domains/menu"
rm -rf domains/prep 2>/dev/null && echo "✅ Deleted: domains/prep"

echo "🎉 Backend cleanup complete!"
