# Dockerfile.frontend - Next.js 15 with Turbopack
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Development stage
FROM base AS development

# Install development dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY --chown=nextjs:nodejs . ./

# Create .next directory for caching
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Switch to non-root user
USER nextjs

# Health check for Next.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

# Start development server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy source code and build
COPY --chown=nextjs:nodejs . ./
RUN npm run build

# Switch to non-root user
USER nextjs

# Start production server
CMD ["npm", "start"]

EXPOSE 3001
