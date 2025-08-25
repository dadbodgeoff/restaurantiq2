#!/bin/bash
# 🚀 Enterprise Template Setup Script
# Converts RestaurantIQ into a clean template for new projects

set -e

echo "🏗️  Converting RestaurantIQ to Enterprise Template..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
read -p "Enter new project name (e.g., 'MyAwesomeApp'): " PROJECT_NAME
read -p "Enter project description: " PROJECT_DESC
read -p "Enter your name/organization: " AUTHOR_NAME

# Convert to lowercase for technical names
PROJECT_SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

echo -e "${GREEN}🚀 Setting up template for: $PROJECT_NAME${NC}"
echo -e "${YELLOW}📦 Technical name: $PROJECT_SLUG${NC}"

# 1. Update package.json
echo -e "${GREEN}📦 Updating package.json...${NC}"
sed -i.bak "s/restaurantiq/$PROJECT_SLUG/g" package.json
sed -i.bak "s/RestaurantIQ/$PROJECT_NAME/g" package.json
sed -i.bak "s/Enterprise restaurant management system/$PROJECT_DESC/g" package.json
sed -i.bak "s/Your Name/$AUTHOR_NAME/g" package.json

# 2. Update Docker Compose
echo -e "${GREEN}🐳 Updating Docker Compose...${NC}"
sed -i.bak "s/restaurantiq/$PROJECT_SLUG/g" docker-compose.yml

# 3. Clean up business-specific files
echo -e "${GREEN}🧹 Removing business-specific files...${NC}"

# Remove restaurant-specific domains
rm -rf src/domains/restaurant/
rm -rf src/domains/auth/  # Keep auth structure but remove restaurant-specific logic

# Remove restaurant-specific routes
rm -f src/infrastructure/web/routes/restaurants.ts
rm -f src/infrastructure/web/routes/users.ts
rm -f src/infrastructure/web/routes/menu.ts

# Keep only template structure
cat > src/domains/auth/services/auth.service.ts << 'EOF'
import { BaseRepository } from '../../shared/base-repository';

export class AuthService {
  constructor(private readonly userRepository: any) {}

  async authenticate(credentials: any) {
    // TODO: Implement authentication
    throw new Error('Authentication not implemented - template placeholder');
  }
}
EOF

# 4. Clean database schema
echo -e "${GREEN}🗄️  Creating clean database schema...${NC}"
cat > prisma/schema.prisma << 'EOF'
// Enterprise Template Database Schema
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "darwin-arm64", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here following enterprise patterns
// Example:
/*
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
*/
EOF

# 5. Update README and documentation
echo -e "${GREEN}📚 Updating documentation...${NC}"
sed -i.bak "s/RestaurantIQ/$PROJECT_NAME/g" README.md
sed -i.bak "s/restaurantiq/$PROJECT_SLUG/g" README.md
sed -i.bak "s/restaurant management system/$PROJECT_DESC/g" README.md

# 6. Create template-specific README
cat > TEMPLATE_README.md << EOF
# 🏗️ $PROJECT_NAME - Enterprise Template

This project was created from the RestaurantIQ Enterprise Template.

## 🧹 What's Been Cleaned Up

### ✅ KEPT (Infrastructure/Plumbing)
- Multi-stage Docker builds
- Repository pattern with BaseRepository
- Dependency injection container
- Logging and monitoring setup
- Security middleware and patterns
- Database migration structure
- Development workflow scripts
- Enterprise documentation standards

### ❌ REMOVED (Business Logic)
- Restaurant-specific models and services
- Authentication implementation (structure kept)
- Business-specific API routes
- Restaurant domain logic
- Frontend restaurant UI

### 🔧 TO IMPLEMENT
1. Add your domain models to \`prisma/schema.prisma\`
2. Create domain services in \`src/domains/\`
3. Implement authentication in \`src/domains/auth/\`
4. Add API routes in \`src/infrastructure/web/routes/\`
5. Build your frontend in \`frontend/src/\`

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development environment
./scripts/start.sh

# Run database migrations
npm run db:migrate:dev

# Start coding!
\`\`\`

## 📚 Documentation

- [\`DEVELOPMENT_GUIDE.md\`] - Complete development workflow
- [\`REPOSITORY_PATTERN_GUIDE.md\`] - Repository implementation guide
- [\`.cursorrules\`] - IDE enforcement of standards

## 🎯 Enterprise Standards

This template follows enterprise development patterns:
- Repository Pattern with BaseRepository
- Dependency Injection with Awilix
- Structured logging with correlation IDs
- Input validation and error handling
- Multi-stage Docker builds
- Security-first approach
- Comprehensive monitoring

Happy coding! 🏗️✨
EOF

# 7. Clean up data and logs
echo -e "${GREEN}🧽 Cleaning up development artifacts...${NC}"
rm -rf data/  # Remove database files
rm -rf logs/  # Remove log files
rm -rf backups/  # Remove backup files
rm -rf dist/  # Remove build artifacts
rm -f *.log  # Remove log files

# 8. Reset git (optional)
read -p "Reset git history? (y/N): " RESET_GIT
if [[ $RESET_GIT =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔄 Resetting git history...${NC}"
    rm -rf .git
    git init
    git add .
    git commit -m "Initial commit from Enterprise Template"
fi

echo -e "${GREEN}✅ Template setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Review TEMPLATE_README.md for implementation guide"
echo "2. Add your domain models to prisma/schema.prisma"
echo "3. Implement your business logic following the established patterns"
echo "4. Update environment variables and configuration"
echo ""
echo -e "${GREEN}🎯 Your enterprise foundation is ready!${NC}"
