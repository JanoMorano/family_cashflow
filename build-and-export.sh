#!/bin/sh
# Run on your computer (where Docker is installed)
# Builds the image and saves it as a tar for Container Station
#
# Usage:
#   sh build-and-export.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="family_cashflow:latest"
ARCHIVE_NAME="$(node "$SCRIPT_DIR/scripts/write-version.mjs" --archive-name)"
OUTPUT="$SCRIPT_DIR/$ARCHIVE_NAME"

node "$SCRIPT_DIR/scripts/cleanup-build.mjs"
node "$SCRIPT_DIR/scripts/write-version.mjs"

echo "🔨 Building Docker image..."
docker build --platform linux/amd64 -t "$IMAGE" "$SCRIPT_DIR"

echo "📦 Exporting as $ARCHIVE_NAME..."
docker save "$IMAGE" | gzip -c > "$OUTPUT"

echo ""
echo "✅ Done!"
echo "   File: $OUTPUT"
echo ""
echo "Container Station → Images → Import → select $ARCHIVE_NAME"
