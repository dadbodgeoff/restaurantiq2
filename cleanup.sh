#!/bin/bash

echo "🧹 Starting RestaurantIQ Frontend Cleanup..."

# Navigate to frontend src
cd frontend/src || exit 1

echo "📁 Deleting empty directories..."

# Delete empty directories
rmdir components/forms 2>/dev/null && echo "✅ Deleted: components/forms"
rmdir domains/restaurant/components 2>/dev/null && echo "✅ Deleted: domains/restaurant/components"
rmdir domains/restaurant/services 2>/dev/null && echo "✅ Deleted: domains/restaurant/services"
rmdir domains/restaurant/hooks 2>/dev/null && echo "✅ Deleted: domains/restaurant/hooks"
rmdir domains/restaurant/types 2>/dev/null && echo "✅ Deleted: domains/restaurant/types"
rmdir domains/shared/components 2>/dev/null && echo "✅ Deleted: domains/shared/components"
rmdir domains/shared/hooks 2>/dev/null && echo "✅ Deleted: domains/shared/hooks"
rmdir domains/shared/types 2>/dev/null && echo "✅ Deleted: domains/shared/types"
rmdir hooks 2>/dev/null && echo "✅ Deleted: hooks"
rmdir infrastructure/api 2>/dev/null && echo "✅ Deleted: infrastructure/api"
rmdir infrastructure/error 2>/dev/null && echo "✅ Deleted: infrastructure/error"
rmdir styles 2>/dev/null && echo "✅ Deleted: styles"
rmdir types 2>/dev/null && echo "✅ Deleted: types"
rmdir utils 2>/dev/null && echo "✅ Deleted: utils"

echo "🎉 Frontend cleanup complete!"
