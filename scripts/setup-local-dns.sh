#!/bin/bash
# scripts/setup-local-dns.sh - Configure local DNS resolution for restaurantiq.local

set -e

DOMAIN="restaurantiq.local"
HOST_ENTRY="127.0.0.1 $DOMAIN"

echo "🌐 Setting up local DNS resolution for $DOMAIN..."

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected"

    # Check if entry already exists
    if grep -q "$DOMAIN" /etc/hosts; then
        echo "ℹ️  $DOMAIN already exists in /etc/hosts"
        echo "📋 Current entry:"
        grep "$DOMAIN" /etc/hosts
    else
        echo "📝 Adding $DOMAIN to /etc/hosts..."
        echo "$HOST_ENTRY" | sudo tee -a /etc/hosts > /dev/null
        echo "✅ Added $DOMAIN to /etc/hosts"
    fi

    echo ""
    echo "🔍 Verifying DNS resolution..."
    if ping -c 1 -t 1 $DOMAIN &> /dev/null; then
        echo "✅ DNS resolution working!"
    else
        echo "⚠️  DNS resolution not working yet. This is normal - restart your browser if needed."
    fi

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected"

    # Check if entry already exists
    if grep -q "$DOMAIN" /etc/hosts; then
        echo "ℹ️  $DOMAIN already exists in /etc/hosts"
        echo "📋 Current entry:"
        grep "$DOMAIN" /etc/hosts
    else
        echo "📝 Adding $DOMAIN to /etc/hosts..."
        echo "$HOST_ENTRY" | sudo tee -a /etc/hosts > /dev/null
        echo "✅ Added $DOMAIN to /etc/hosts"
    fi

else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please manually add the following line to your hosts file:"
    echo "127.0.0.1 $DOMAIN"
    exit 1
fi

echo ""
echo "📋 Summary:"
echo "Domain: $DOMAIN"
echo "IP: 127.0.0.1"
echo "Hosts file: /etc/hosts"
echo ""
echo "🌐 Next steps:"
echo "1. Generate SSL certificates: ./scripts/generate-ssl.sh"
echo "2. Start the infrastructure: docker-compose up -d"
echo "3. Access your application at: https://$DOMAIN"
echo ""
echo "🔒 Don't forget to trust the SSL certificate in your browser for the first visit!"
echo "   (Chrome: click the lock icon → Certificate → Trust)"
echo ""
echo "✅ Local DNS setup complete!"
