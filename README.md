# 🍽️ RestaurantIQ - Enterprise Restaurant Intelligence Platform

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/redis-%23DC382D.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Next.js](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

> **Enterprise-grade restaurant management platform with modular architecture, Docker containerization, and professional development workflow.**

## 📋 Table of Contents

- [🏗️ Architecture Overview](#-architecture-overview)
- [🚀 Quick Start](#-quick-start)
- [🔧 Development Workflow](#-development-workflow)
- [🏢 Enterprise Features](#-enterprise-features)
- [🐳 Docker Infrastructure](#-docker-infrastructure)
- [🔒 Security & SSL](#-security--ssl)
- [📊 Monitoring & Observability](#-monitoring--observability)
- [💾 Backup & Recovery](#-backup--recovery)
- [🌐 Remote Access](#-remote-access)
- [⚙️ Configuration](#-configuration)
- [📈 Scaling & Deployment](#-scaling--deployment)
- [🧪 Testing](#-testing)
- [🔍 Troubleshooting](#-troubleshooting)
- [📚 API Documentation](#-api-documentation)

## 🏗️ Architecture Overview

### 🏛️ Enterprise Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │   Express API   │    │   PostgreSQL    │
│   (React 19)    │◄──►│   (Node.js)     │◄──►│   Database      │
│   Port 3001     │    │   Port 3000     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   Cache &       │
                    │   Sessions      │
                    │   Port 6379     │
                    └─────────────────┘
```

### 🏢 Full Infrastructure Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 Nginx Reverse Proxy                   │
│                    SSL Termination (Port 443)              │
└─────────────────────────────────────────────────────────────┘
                │
   ┌────────────┼────────────┐
   │            │            │
┌──▼──┐    ┌───▼───┐    ┌───▼───┐
│Frontend │  │Backend│    │Database│
│Next.js  │  │Express│    │Postgres│
│Port 3001│  │Port 3000│  │Port 5432│
└────────┘  └────────┘    └────────┘
   │            │            │
   └────────────┼────────────┘
                │
         ┌──────▼──────┐
         │   Redis     │
         │   Cache     │
         │ Port 6379   │
         └─────────────┘
                │
   ┌────────────┼────────────┐
   │            │            │
┌──▼──┐    ┌───▼───┐    ┌───▼───┐
│Prometheus││Grafana│    │Tailscale│
│Monitoring││Dashboard│  │Remote   │
│Port 9090 ││Port 3002│  │Access   │
└─────────┘└─────────┘    └────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **macOS** (M4 Pro recommended, 16GB RAM minimum)
- **Docker Desktop** installed and running
- **Git** for version control

### One-Command Setup
```bash
# Clone and setup everything
git clone <your-repo-url>
cd RestaurantIQ

# 🚀 Start the complete enterprise stack
./scripts/start.sh
```

**That's it!** The script will:
- ✅ Check Docker installation
- ✅ Create required directories
- ✅ Generate SSL certificates
- ✅ Setup local DNS resolution
- ✅ Start all 7 services
- ✅ Configure automated backups
- ✅ Verify health endpoints

### Access Your Application
```bash
🌐 Main App:        https://restaurantiq.local
🔗 API:             https://restaurantiq.local/api/v1
📊 Monitoring:      http://localhost:9090
📈 Dashboard:       http://localhost:3002
```

---

## 🔧 Development Workflow

### Daily Development Commands

```bash
# Start development environment
./scripts/dev-workflow.sh start

# View service status
./scripts/dev-workflow.sh status

# View logs (all services or specific)
./scripts/dev-workflow.sh logs
./scripts/dev-workflow.sh logs backend

# Access service shells
./scripts/dev-workflow.sh shell postgres
./scripts/dev-workflow.sh shell redis

# Database operations
./scripts/dev-workflow.sh db backup
./scripts/dev-workflow.sh db migrate
./scripts/dev-workflow.sh db studio

# SSL certificate management
./scripts/dev-workflow.sh ssl check
./scripts/dev-workflow.sh ssl renew

# Run tests
./scripts/dev-workflow.sh test all

# Stop all services
./scripts/dev-workflow.sh stop
```

### Hot Reload Development
The infrastructure supports **hot reload** for both frontend and backend:

```bash
# Frontend hot reload (Next.js 15 + Turbopack)
# Changes to ./frontend/ automatically reload

# Backend hot reload (ts-node-dev)
# Changes to ./src/ automatically reload

# Database changes with Prisma
npm run db:migrate  # Apply schema changes
npm run db:studio   # Visual database editor
```

---

## 🏢 Enterprise Features

### 🔐 Security & Authentication
- **JWT-based authentication** with refresh tokens
- **Hierarchical permission system** (Owner → Admin → Manager → Staff)
- **Multi-tenant architecture** (restaurant isolation)
- **SSL/TLS encryption** for all communications
- **Rate limiting** and security headers
- **SQL injection protection** via Prisma ORM

### 🏗️ Architecture Standards

#### Repository Pattern (MANDATORY)
All database repositories **MUST** extend `BaseRepository` and follow these standards:

```typescript
// ✅ CORRECT - Follow this pattern
export class NewRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string) {
    this.validateId(id, 'EntityName');
    return this.executeQuery(async () => {
      this.logOperation('findById', { id });
      // Implementation...
    }, 'findById');
  }
}
```

**Standards:**
- ✅ **Extend BaseRepository** for consistent error handling
- ✅ **Input validation** using `validateId()` and `validateRequiredString()`
- ✅ **Error handling** via `executeQuery()` wrapper
- ✅ **Development logging** via `logOperation()`
- ✅ **Safe optional handling** via `safeOptional()`
- ✅ **TypeScript interfaces** for all data types

**File Location:** `src/domains/shared/base-repository.ts`

**Quick Reference:** `REPOSITORY_PATTERN_GUIDE.md`

### 📊 Monitoring & Observability
- **Prometheus metrics collection**
- **Grafana dashboards** for visualization
- **Health checks** for all services
- **Structured logging** with Pino
- **Performance monitoring** and alerting
- **Resource usage tracking**

### 🌐 Remote Access & Collaboration
- **Tailscale integration** for secure remote access
- **Zero-trust networking** (no public ports)
- **Stakeholder access** via Tailscale
- **Development team** collaboration
- **Demo environments** for clients

### ⚡ Performance & Scaling
- **Docker containerization** for consistency
- **Horizontal scaling** support
- **Load balancing** via Nginx
- **Caching layers** (Redis + Next.js)
- **Optimized for M4 Pro** (ARM64 native)
- **Resource limits** tuned for 16GB RAM
---

## 🐳 Docker Infrastructure

### Service Architecture

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| **postgres** | PostgreSQL 15 | 5432 | Primary database |
| **redis** | Redis 7 | 6379 | Cache & sessions |
| **backend** | Node.js + Express | 3000 | REST API |
| **frontend** | Next.js 15 | 3001 | React application |
| **nginx** | Nginx Alpine | 80/443 | Reverse proxy + SSL |
| **prometheus** | Prometheus | 9090 | Metrics collection |
| **grafana** | Grafana | 3002 | Monitoring dashboard |

### Resource Allocation (M4 Pro Optimized)

```yaml
# Total: ~8GB RAM, 3 CPU cores
postgres:   2GB RAM, 1.0 CPU  # Database operations
backend:    4GB RAM, 2.0 CPU  # Application logic
frontend:   2GB RAM, 1.0 CPU  # UI rendering
redis:      512MB RAM, 0.5 CPU # Caching
nginx:      256MB RAM, 0.5 CPU # Proxy
prometheus: 1GB RAM, 0.5 CPU  # Metrics
grafana:    512MB RAM, 0.5 CPU # Dashboard
```

---

## 🔒 Security & SSL

### SSL Certificate Management

```bash
# Generate self-signed certificates
./scripts/generate-ssl.sh

# Check certificate validity
./scripts/dev-workflow.sh ssl check

# Renew certificates (2-year validity)
./scripts/dev-workflow.sh ssl renew
```

### Certificate Details
- **Domain:** `restaurantiq.local`
- **Validity:** 2 years (renewable)
- **Type:** Self-signed for development
- **Algorithm:** RSA 2048-bit
- **Browser Trust:** Manual (one-time setup)

---

## 💾 Backup & Recovery

### Automated Backup System

```bash
# Daily automated backups (2 AM)
# Configured via cron job on macOS

# Manual backup
./scripts/backup-postgres.sh

# Backup location: ./backups/
ls -la ./backups/
```

### Backup Features

- **Compressed archives** (.sql.gz format)
- **Retention policy** (7 days automatic cleanup)
- **Metadata tracking** (size, timestamp, checksums)
- **External storage** support (optional)
- **Point-in-time recovery** capability

---

## 🌐 Remote Access

### Tailscale Setup

```bash
# Install and configure Tailscale
./scripts/setup-tailscale.sh

# Share access with stakeholders
tailscale ip -4  # Get your IP address
```

### Benefits
- ✅ **Zero configuration** for stakeholders
- ✅ **End-to-end encryption** (WireGuard protocol)
- ✅ **No public ports** exposed
- ✅ **Browser access** (no VPN client needed)
- ✅ **Team collaboration** (share with developers)
- ✅ **Client demos** (secure presentation access)

---

## ⚙️ Configuration

### Environment Variables

```bash
# Core Configuration (.env)
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://restaurantiq:password123@localhost:5432/restaurantiq

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-at-least-32-characters-long

# Cache
REDIS_URL=redis://redis:6379

# CORS & Networking
CORS_ORIGINS=http://localhost:3000,https://restaurantiq.local
```
---

## 🎯 Next Steps

### Immediate Actions
1. **Start the infrastructure**: `./scripts/start.sh`
2. **Trust SSL certificate** in your browser
3. **Explore Grafana dashboards** at http://localhost:3002
4. **Test the API** at https://restaurantiq.local/api/v1/health

### Development Roadmap
1. **Add authentication UI** (login/register pages)
2. **Implement menu management** module
3. **Add inventory tracking** features
4. **Create analytics dashboard**
5. **Scale to 8-10 modules** as planned

### Production Considerations
1. **Replace self-signed SSL** with Let's Encrypt
2. **Configure production database** (AWS RDS/PostgreSQL)
3. **Set up CI/CD pipeline** (GitHub Actions)
4. **Configure monitoring alerts** (PagerDuty/Slack)
5. **Implement backup strategy** (AWS S3)

---

## 🏆 Enterprise Value Proposition

### 💰 Cost Savings
- **Local development**: $0/month (vs $200+ cloud)
- **Docker efficiency**: Consistent environments
- **Team productivity**: 1-command setup for new devs

### 🚀 Competitive Advantages
- **Rapid deployment**: Docker + automated pipeline
- **Professional monitoring**: Enterprise observability
- **Security first**: SSL + authentication + rate limiting
- **Scalable architecture**: 8-10 modules ready

### 🎯 Business Impact
- **Faster feature delivery** (automated testing/deployment)
- **Better collaboration** (Tailscale remote access)
- **Enterprise credibility** (professional infrastructure)
- **Reduced downtime** (monitoring + health checks)

---

## 🎉 Conclusion

**RestaurantIQ Enterprise Infrastructure** is now ready for professional development, testing, and deployment. This setup provides:

- ✅ **Enterprise-grade architecture** (7 production services)
- ✅ **M4 Pro optimization** (ARM64 native, resource-tuned)
- ✅ **Professional workflow** (hot reload, monitoring, backups)
- ✅ **Security & compliance** (SSL, authentication, rate limiting)
- ✅ **Scalability foundation** (8-10 modules ready)
- ✅ **Team collaboration** (Tailscale remote access)
- ✅ **Production parity** (Docker containerization)

**The infrastructure is designed to scale with your vision** - from local development to enterprise deployment, RestaurantIQ is built for success.

**Ready to start developing?** 🚀

```bash
# Begin your RestaurantIQ journey
./scripts/start.sh
```

*Welcome to the future of restaurant intelligence!* 🌟
