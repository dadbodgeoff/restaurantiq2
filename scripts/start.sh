#!/bin/bash
# scripts/start.sh - Complete RestaurantIQ Enterprise Stack Startup

set -e

echo "🚀 Starting RestaurantIQ Enterprise Stack..."
echo "=========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker
check_docker() {
    if ! command_exists docker; then
        echo "❌ Docker is not installed or not in PATH"
        echo "   Please install Docker from https://docker.com/get-started"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker daemon is not running"
        echo "   Please start Docker Desktop or run: sudo systemctl start docker"
        exit 1
    fi

    echo "✅ Docker is running"
}

# Function to check docker-compose
check_docker_compose() {
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        echo "❌ docker-compose is not installed"
        echo "   Please install docker-compose or use 'docker compose' (Docker v2.0+)"
        exit 1
    fi

    echo "✅ Docker Compose is available"
}

# Function to create required directories
create_directories() {
    echo "📁 Creating required directories..."
    mkdir -p data/postgres data/redis data/prometheus data/grafana
    mkdir -p logs/nginx logs backups monitoring/grafana/provisioning
    echo "✅ Directories created"
}

# Function to generate SSL certificates
generate_ssl() {
    if [ ! -f "nginx/ssl/restaurantiq.local.crt" ]; then
        echo "🔐 Generating SSL certificates..."
        chmod +x scripts/generate-ssl.sh
        ./scripts/generate-ssl.sh
        echo "✅ SSL certificates generated"
    else
        echo "✅ SSL certificates already exist"
    fi
}

# Function to setup local DNS
setup_dns() {
    echo "🌐 Setting up local DNS..."
    chmod +x scripts/setup-local-dns.sh
    ./scripts/setup-local-dns.sh
    echo "✅ Local DNS configured"
}

# Function to start services
start_services() {
    echo "🐳 Starting Docker services..."

    # Use docker compose (v2) if available, fallback to docker-compose (v1)
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    # Start services
    $COMPOSE_CMD up -d

    echo "⏳ Waiting for services to start..."
    sleep 30

    echo "🔍 Checking service health..."
}

# Function to verify services
verify_services() {
    echo "🔍 Verifying service health..."

    local services=("postgres" "redis" "backend" "frontend" "nginx" "prometheus" "grafana")
    local failed_services=()

    for service in "${services[@]}"; do
        if docker ps | grep -q "restaurantiq-$service"; then
            echo "✅ $service is running"
        else
            echo "❌ $service failed to start"
            failed_services+=("$service")
        fi
    done

    if [ ${#failed_services[@]} -gt 0 ]; then
        echo "⚠️  Some services failed to start: ${failed_services[*]}"
        echo "📋 Check logs with: docker-compose logs"
        return 1
    fi

    return 0
}

# Function to test endpoints
test_endpoints() {
    echo "🌐 Testing endpoints..."

    # Test health endpoint
    if curl -f -k https://restaurantiq.local/api/v1/health >/dev/null 2>&1; then
        echo "✅ API health check passed"
    else
        echo "⚠️  API health check failed (this is normal for first startup)"
    fi

    # Test frontend
    if curl -f -k https://restaurantiq.local >/dev/null 2>&1; then
        echo "✅ Frontend is responding"
    else
        echo "⚠️  Frontend not responding yet (waiting for build)"
    fi
}

# Function to setup backup cron
setup_backup_cron() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "⏰ Setting up backup cron job..."

        # Check if cron job already exists
        if ! crontab -l 2>/dev/null | grep -q "backup-postgres.sh"; then
            # Add cron job for daily backup at 2 AM
            (crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./scripts/backup-postgres.sh >> ./logs/backup.log 2>&1") | crontab -
            echo "✅ Daily backup cron job added (2 AM)"
        else
            echo "ℹ️  Backup cron job already exists"
        fi
    else
        echo "⏰ Skipping cron setup (macOS optimized)"
    fi
}

# Main startup sequence
main() {
    echo "🔍 Pre-flight checks..."
    check_docker
    check_docker_compose

    echo ""
    echo "📋 Setup sequence:"

    create_directories
    echo ""

    generate_ssl
    echo ""

    setup_dns
    echo ""

    start_services
    echo ""

    if verify_services; then
        echo ""
        test_endpoints
        echo ""

        setup_backup_cron
        echo ""

        echo "🎉 RestaurantIQ Enterprise Stack is running!"
        echo "=========================================="
        echo ""
        echo "🌐 Access URLs:"
        echo "   - Main Application: https://restaurantiq.local"
        echo "   - API Endpoint:     https://restaurantiq.local/api/v1"
        echo "   - Health Check:     https://restaurantiq.local/api/v1/health"
        echo "   - Monitoring:       http://localhost:9090 (Prometheus)"
        echo "   - Dashboard:        http://localhost:3002 (Grafana)"
        echo ""
        echo "🔧 Management Commands:"
        echo "   - View logs:        docker-compose logs -f"
        echo "   - Stop services:    docker-compose down"
        echo "   - Restart service:  docker-compose restart <service>"
        echo "   - View processes:   docker-compose ps"
        echo ""
        echo "📁 Important directories:"
        echo "   - Logs:            ./logs/"
        echo "   - Backups:         ./backups/"
        echo "   - Data:            ./data/"
        echo "   - SSL certs:       ./nginx/ssl/"
        echo ""
        echo "💡 Tips:"
        echo "   - First visit: Trust the SSL certificate in your browser"
        echo "   - Development: Use './scripts/dev-workflow.sh' for workflow"
        echo "   - Remote access: Run './scripts/setup-tailscale.sh'"
        echo ""
        echo "✅ Setup complete! RestaurantIQ is ready for development."
    else
        echo ""
        echo "❌ Some services failed to start. Check the logs above."
        echo "🔧 Troubleshooting:"
        echo "   - Check Docker resources (16GB RAM recommended)"
        echo "   - View detailed logs: docker-compose logs"
        echo "   - Restart services: docker-compose restart"
        exit 1
    fi
}

# Run main function
main "$@"
