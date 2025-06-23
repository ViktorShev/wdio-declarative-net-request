#!/bin/bash

DEST="dist/extension/manifest.json"
SOURCE="src/extension/manifest.json"

if [ ! -f "$SOURCE" ]; then
  echo "Manifest is missing during build."
  exit 1
fi

cp "$SOURCE" "$DEST"
