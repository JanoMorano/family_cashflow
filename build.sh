#!/bin/sh
# Run once on the server — builds the Docker image
# Usage:  sh build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔨 Building image family_cashflow..."
docker build -t family_cashflow:latest "$SCRIPT_DIR/backend"

echo "✅ Done! Image 'family_cashflow:latest' is ready."
echo ""
echo "Next steps in Portainer:"
echo "  Stacks → Add stack → Web editor"
echo "  Paste the contents of docker-compose.portainer.yml"
echo "  Click 'Deploy the stack'"
