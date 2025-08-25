#!/bin/bash
# scripts/dev-workflow.sh - RestaurantIQ Development Workflow Management

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if Docker Compose is available
get_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        print_error "Docker Compose not found"
        exit 1
    fi
}

# Function to show service status
show_status() {
    print_info "Service Status:"
    echo ""

    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD ps

    echo ""
    print_info "Resource Usage:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Docker Desktop: Check Docker Desktop > Preferences > Resources"
    else
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    fi
}

# Function to show logs
show_logs() {
    local service="$2"

    COMPOSE_CMD=$(get_compose_cmd)

    if [ -z "$service" ]; then
        print_info "Showing logs for all services..."
        $COMPOSE_CMD logs -f --tail=100
    else
        print_info "Showing logs for $service..."
        $COMPOSE_CMD logs -f "$service"
    fi
}

# Function to restart services
restart_service() {
    local service="$2"

    COMPOSE_CMD=$(get_compose_cmd)

    if [ -z "$service" ]; then
        print_info "Restarting all services..."
        $COMPOSE_CMD restart
        print_status "All services restarted"
    else
        print_info "Restarting $service..."
        $COMPOSE_CMD restart "$service"
        print_status "$service restarted"
    fi
}

# Function to access service shell
access_shell() {
    local service="$2"

    if [ -z "$service" ]; then
        print_error "Usage: $0 shell <service-name>"
        echo "Available services:"
        echo "  - postgres (PostgreSQL database)"
        echo "  - redis (Redis cache)"
        echo "  - backend (Node.js API)"
        echo "  - frontend (Next.js app)"
        echo "  - nginx (Reverse proxy)"
        echo "  - prometheus (Monitoring)"
        echo "  - grafana (Dashboard)"
        return 1
    fi

    COMPOSE_CMD=$(get_compose_cmd)

    print_info "Accessing shell for $service..."
    case "$service" in
        "postgres")
            $COMPOSE_CMD exec "$service" psql -U restaurantiq -d restaurantiq
            ;;
        "redis")
            $COMPOSE_CMD exec "$service" redis-cli
            ;;
        *)
            $COMPOSE_CMD exec "$service" /bin/sh
            ;;
    esac
}

# Function to run database operations
db_operations() {
    local operation="$2"

    case "$operation" in
        "backup")
            print_info "Creating database backup..."
            ./scripts/backup-postgres.sh
            ;;
        "migrate")
            print_info "Running database migrations..."
            COMPOSE_CMD=$(get_compose_cmd)
            $COMPOSE_CMD exec backend npm run db:migrate
            print_status "Migrations completed"
            ;;
        "studio")
            print_info "Opening Prisma Studio..."
            COMPOSE_CMD=$(get_compose_cmd)
            $COMPOSE_CMD exec backend npm run db:studio
            ;;
        "seed")
            print_info "Seeding database..."
            COMPOSE_CMD=$(get_compose_cmd)
            $COMPOSE_CMD exec backend npm run db:seed
            print_status "Database seeded"
            ;;
        *)
            print_error "Usage: $0 db {backup|migrate|studio|seed}"
            ;;
    esac
}

# Function to manage SSL certificates
ssl_management() {
    local operation="$2"

    case "$operation" in
        "generate")
            print_info "Generating new SSL certificates..."
            ./scripts/generate-ssl.sh
            ;;
        "renew")
            print_info "Renewing SSL certificates..."
            rm -f nginx/ssl/restaurantiq.local.*
            ./scripts/generate-ssl.sh
            print_status "SSL certificates renewed"
            ;;
        "check")
            print_info "Checking SSL certificates..."
            if [ -f "nginx/ssl/restaurantiq.local.crt" ]; then
                openssl x509 -in nginx/ssl/restaurantiq.local.crt -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
            else
                print_error "SSL certificates not found"
            fi
            ;;
        *)
            print_error "Usage: $0 ssl {generate|renew|check}"
            ;;
    esac
}

# Function to run tests
run_tests() {
    local scope="$2"

    COMPOSE_CMD=$(get_compose_cmd)

    case "$scope" in
        "backend")
            print_info "Running backend tests..."
            $COMPOSE_CMD exec backend npm test
            ;;
        "frontend")
            print_info "Running frontend tests..."
            $COMPOSE_CMD exec frontend npm test
            ;;
        "all")
            print_info "Running all tests..."
            $COMPOSE_CMD exec backend npm test
            $COMPOSE_CMD exec frontend npm test
            ;;
        *)
            print_info "Running backend tests..."
            $COMPOSE_CMD exec backend npm test
            ;;
    esac
}

# Function to show help
show_help() {
    echo "RestaurantIQ Development Workflow Manager"
    echo "=========================================="
    echo ""
    echo "USAGE:"
    echo "  $0 <command> [subcommand]"
    echo ""
    echo "COMMANDS:"
    echo "  start           Start all services"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  restart <svc>   Restart specific service"
    echo "  status          Show service status"
    echo "  logs            Show all service logs"
    echo "  logs <svc>      Show specific service logs"
    echo "  shell <svc>     Access service shell"
    echo "  db <op>         Database operations (backup|migrate|studio|seed)"
    echo "  ssl <op>        SSL certificate management (generate|renew|check)"
    echo "  test [scope]    Run tests (backend|frontend|all)"
    echo "  backup          Create database backup"
    echo "  clean           Clean up Docker resources"
    echo "  help            Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 start           # Start all services"
    echo "  $0 logs backend    # Show backend logs"
    echo "  $0 shell postgres  # Access PostgreSQL shell"
    echo "  $0 db backup       # Create database backup"
    echo "  $0 ssl check       # Check SSL certificates"
    echo "  $0 test all        # Run all tests"
    echo ""
    echo "SERVICES:"
    echo "  postgres, redis, backend, frontend, nginx,"
    echo "  prometheus, grafana"
}

# Main command processing
main() {
    local command="$1"
    local subcommand="$2"

    case "$command" in
        "start")
            print_info "Starting RestaurantIQ..."
            ./scripts/start.sh
            ;;
        "stop")
            print_info "Stopping all services..."
            COMPOSE_CMD=$(get_compose_cmd)
            $COMPOSE_CMD down
            print_status "All services stopped"
            ;;
        "restart")
            restart_service "$@"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$@"
            ;;
        "shell")
            access_shell "$@"
            ;;
        "db")
            db_operations "$@"
            ;;
        "ssl")
            ssl_management "$@"
            ;;
        "test")
            run_tests "$@"
            ;;
        "backup")
            print_info "Creating database backup..."
            ./scripts/backup-postgres.sh
            ;;
        "clean")
            print_warning "Cleaning up Docker resources..."
            COMPOSE_CMD=$(get_compose_cmd)
            $COMPOSE_CMD down -v --remove-orphans
            docker system prune -f
            print_status "Docker resources cleaned"
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running"
        print_info "Please start Docker Desktop or run: sudo systemctl start docker"
        exit 1
    fi
}

# Pre-flight checks
check_docker

# Run main function
main "$@"
