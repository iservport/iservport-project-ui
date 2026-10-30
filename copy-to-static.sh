#!/usr/bin/env bash

set -euo pipefail

# Always run paths relative to this script, regardless of the caller's cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASE_NAME="project"
TARGET_NAME="project"

SOURCE_DIR="$SCRIPT_DIR/dist/iservport-$BASE_NAME-ui/browser"
TARGET_DIR="$SCRIPT_DIR/../iservport-root/static/$TARGET_NAME"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "ERROR: Source folder not found: $SOURCE_DIR"
  echo "Run the build and make sure dist/browser exists before copying."
  exit 1
fi

if [ -z "$(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  echo "ERROR: Source folder is empty: $SOURCE_DIR"
  exit 1
fi

mkdir -p "$TARGET_DIR"

echo "Clearing target folder: $TARGET_DIR"
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +

echo "Copying $SOURCE_DIR to $TARGET_DIR"
cp -R "$SOURCE_DIR"/. "$TARGET_DIR"/

echo "Done."
