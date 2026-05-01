#!/bin/sh
# Builds x86_64 image (for NAS/server) even on ARM Mac
# Usage: sh build.sh

set -e

IMAGE=family_cashflow:latest
ARCHIVE_NAME="$(node scripts/write-version.mjs --archive-name)"

node scripts/cleanup-build.mjs
node scripts/write-version.mjs

echo "==> Building image $IMAGE for linux/amd64 ..."
docker build --platform linux/amd64 --no-cache -t $IMAGE .

echo "==> Saving to $ARCHIVE_NAME ..."
docker save $IMAGE | gzip -c > "$ARCHIVE_NAME"

echo ""
echo "Done! $ARCHIVE_NAME is ready for import."
echo "Portainer:           Images -> Import -> select $ARCHIVE_NAME"
echo "QNAP Container St.:  Images -> Import from file -> select $ARCHIVE_NAME"
