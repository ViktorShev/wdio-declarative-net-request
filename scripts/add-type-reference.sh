#!/bin/bash

FILE="dist/index.d.ts"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE. Did you forget to run build?"
  exit 1
fi

echo '/// <reference types="chrome" />' | cat - "$FILE" > temp && mv temp "$FILE"

echo "Type reference added to top of $FILE"
