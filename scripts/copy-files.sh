#!/bin/bash

DEST_DIR="dist/extension"
SOURCE_DIR="src/extension"

MANIFEST="$SOURCE_DIR/manifest.json"
KEY="$SOURCE_DIR/dummy-dev-key.pem"

if [ ! -f "$MANIFEST" ] || [ ! -f "$KEY" ]; then
  echo "One or more required files are missing during build:"
  [ ! -f "$MANIFEST" ] && echo "  Missing: $MANIFEST"
  [ ! -f "$KEY" ] && echo "  Missing: $KEY"
  exit 1
fi

mkdir -p "$DEST_DIR"

cp "$MANIFEST" "$KEY" "$DEST_DIR"

echo "Copied manifest and dev key to $DEST_DIR"
