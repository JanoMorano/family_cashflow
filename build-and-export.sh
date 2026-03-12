#!/bin/sh
# Run on your computer (where Docker is installed)
# Builds the image and saves it as a tar for Container Station
#
# Usage:
#   cd family_cashflow
#   sh build-and-export.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="family_cashflow:latest"
OUTPUT="$SCRIPT_DIR/family_cashflow.tar"

echo "🔨 Building Docker image..."
docker build --platform linux/amd64 -t "$IMAGE" "$SCRIPT_DIR/backend"

echo "📦 Exporting as tar..."
docker save "$IMAGE" -o "$OUTPUT"

echo ""
echo "✅ Done!"
echo "   File: $OUTPUT"
echo ""
echo "Container Station → Images → Import → select family_cashflow.tar"
