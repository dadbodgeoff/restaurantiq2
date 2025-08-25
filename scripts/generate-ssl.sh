#!/bin/bash
# scripts/generate-ssl.sh - Generate self-signed SSL certificates

set -e

DOMAIN="restaurantiq.local"
SSL_DIR="./nginx/ssl"
CERT_FILE="$SSL_DIR/$DOMAIN.crt"
KEY_FILE="$SSL_DIR/$DOMAIN.key"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

echo "🔐 Generating self-signed SSL certificates for $DOMAIN..."

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$KEY_FILE" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$KEY_FILE" -out "$SSL_DIR/$DOMAIN.csr" -subj "/C=US/ST=State/L=City/O=RestaurantIQ/CN=$DOMAIN"

# Generate self-signed certificate (valid for 2 years)
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 730 -in "$SSL_DIR/$DOMAIN.csr" -signkey "$KEY_FILE" -out "$CERT_FILE"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

# Clean up CSR file
rm -f "$SSL_DIR/$DOMAIN.csr"

echo "✅ SSL certificates generated successfully!"
echo "📄 Certificate: $CERT_FILE"
echo "🔑 Private Key: $KEY_FILE"
echo ""
echo "📋 Certificate details:"
openssl x509 -in "$CERT_FILE" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|Subject Alternative Name:)"
echo ""
echo "🔒 Next steps:"
echo "1. Add '127.0.0.1 restaurantiq.local' to /etc/hosts"
echo "2. Trust the certificate in your browser (if needed)"
echo "3. Access https://restaurantiq.local in your browser"
echo ""
echo "⚠️  Note: This is a self-signed certificate for local development."
echo "   For production, use Let's Encrypt or a commercial certificate authority."
