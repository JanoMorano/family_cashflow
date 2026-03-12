#!/bin/sh
# Spusť jednou na serveru — zbuilduje Docker image
# Použití:  sh build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔨 Builduji image rozpocet-app..."
docker build -t rozpocet-app:latest "$SCRIPT_DIR/backend"

echo "✅ Hotovo! Image 'rozpocet-app:latest' je připravený."
echo ""
echo "Teď v Portaineru:"
echo "  Stacks → Add stack → Web editor"
echo "  Vlož obsah souboru docker-compose.portainer.yml"
echo "  Klikni 'Deploy the stack'"
