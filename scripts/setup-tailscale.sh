#!/bin/bash
# scripts/setup-tailscale.sh - Set up Tailscale for remote access to RestaurantIQ

set -e

echo "🌐 Setting up Tailscale for remote RestaurantIQ access..."

# Check if Tailscale is already installed
if ! command -v tailscale &> /dev/null; then
    echo "📥 Installing Tailscale..."

    # Install Tailscale based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🍎 macOS detected - installing Tailscale..."
        brew install tailscale

    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Linux detected - installing Tailscale..."

        # Add Tailscale repository
        curl -fsSL https://tailscale.com/install.sh | sh

    else
        echo "❌ Unsupported OS: $OSTYPE"
        echo "Please install Tailscale manually from https://tailscale.com/download"
        exit 1
    fi

    echo "✅ Tailscale installed successfully"
else
    echo "ℹ️  Tailscale is already installed"
fi

# Check if Tailscale is already running
if tailscale status &> /dev/null; then
    echo "ℹ️  Tailscale is already running"
    tailscale status
else
    echo "🔄 Starting Tailscale..."

    # Start Tailscale
    sudo tailscale up --advertise-routes=172.20.0.0/16 --accept-routes

    echo "✅ Tailscale started successfully"
fi

# Display current status
echo ""
echo "📊 Tailscale Status:"
tailscale status

echo ""
echo "🌐 Remote Access URLs:"
echo "   - Main App: https://restaurantiq.local"
echo "   - API: https://restaurantiq.local/api/v1"
echo "   - Monitoring: http://localhost:9090 (Prometheus)"
echo "   - Dashboard: http://localhost:3002 (Grafana)"
echo ""
echo "📋 Tailscale IP Addresses:"
tailscale ip -4
tailscale ip -6

echo ""
echo "🔧 Management Commands:"
echo "   - Check status: tailscale status"
echo "   - Stop service: sudo tailscale down"
echo "   - Restart: sudo tailscale up --advertise-routes=172.20.0.0/16 --accept-routes"
echo ""
echo "💡 To share access with stakeholders:"
echo "1. Share your Tailscale IP address with them"
echo "2. They can access https://restaurantiq.local from any browser"
echo "3. No VPN client installation required!"
echo ""
echo "✅ Tailscale setup complete! RestaurantIQ is now remotely accessible."

# Optional: Create a systemd service for auto-start (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]] && [ -d "/etc/systemd/system" ]; then
    echo ""
    echo "🔄 Setting up auto-start service..."

    cat > /tmp/tailscale-restaurantiq.service << 'EOF'
[Unit]
Description=Tailscale RestaurantIQ Network
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/tailscale up --advertise-routes=172.20.0.0/16 --accept-routes
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/tailscale-restaurantiq.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable tailscale-restaurantiq

    echo "✅ Auto-start service configured"
fi
