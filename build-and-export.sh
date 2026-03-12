#!/bin/sh
# Spusť na svém počítači (kde máš Docker)
# Zbuilduje image a uloží ho jako tar pro Container Station
#
# Použití:
#   cd rozpocet-app
#   sh build-and-export.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="rozpocet-app:latest"
OUTPUT="$SCRIPT_DIR/rozpocet-app.tar"

echo "🔨 Builduji Docker image..."
docker build --platform linux/amd64 -t "$IMAGE" "$SCRIPT_DIR/backend"

echo "📦 Exportuji jako tar..."
docker save "$IMAGE" -o "$OUTPUT"

echo ""
echo "✅ Hotovo!"
echo "   Soubor: $OUTPUT"
echo ""
echo "Container Station → Images → Import → vyber rozpocet-app.tar"
