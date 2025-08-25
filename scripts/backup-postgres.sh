#!/bin/bash
# scripts/backup-postgres.sh - Automated PostgreSQL backups

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/restaurantiq_$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"
CONTAINER_NAME="restaurantiq-postgres"
DB_NAME="restaurantiq"
DB_USER="restaurantiq"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "💾 Starting PostgreSQL backup..."
echo "📁 Backup directory: $BACKUP_DIR"
echo "📄 Backup file: $BACKUP_FILE_GZ"

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ PostgreSQL container is not running"
    echo "💡 Start the infrastructure first: docker-compose up -d"
    exit 1
fi

# Perform backup
echo "📤 Creating database backup..."
docker exec "$CONTAINER_NAME" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --verbose > "$BACKUP_FILE"

# Check if backup was successful
if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
    echo "❌ Backup failed - file not created or empty"
    exit 1
fi

# Compress backup
echo "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"

# Verify compressed file
if [ ! -f "$BACKUP_FILE_GZ" ] || [ ! -s "$BACKUP_FILE_GZ" ]; then
    echo "❌ Compression failed"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
echo "✅ Backup completed successfully!"
echo "📊 Backup size: $BACKUP_SIZE"

# Keep only last 7 days of backups
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

# List current backups
echo "📋 Current backups:"
ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"

# Create backup metadata
METADATA_FILE="$BACKUP_DIR/backup_metadata.json"
cat > "$METADATA_FILE" << EOF
{
  "latest_backup": "$BACKUP_FILE_GZ",
  "timestamp": "$TIMESTAMP",
  "size": "$BACKUP_SIZE",
  "container": "$CONTAINER_NAME",
  "database": "$DB_NAME",
  "created_at": "$(date -Iseconds)"
}
EOF

echo "📝 Backup metadata saved to: $METADATA_FILE"

# Optional: Copy to external backup location
if [ -n "$EXTERNAL_BACKUP_DIR" ] && [ -d "$EXTERNAL_BACKUP_DIR" ]; then
    echo "📤 Copying to external backup location..."
    cp "$BACKUP_FILE_GZ" "$EXTERNAL_BACKUP_DIR/"
    echo "✅ External backup created"
fi

echo ""
echo "🎉 PostgreSQL backup process completed!"
echo "🔄 Next backup will run automatically at 2 AM (if cron is set up)"
echo "📂 Backup location: $BACKUP_DIR"
echo ""
echo "💡 To restore this backup:"
echo "   gunzip $BACKUP_FILE_GZ"
echo "   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < ${BACKUP_FILE}"
