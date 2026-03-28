#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  printf 'Usage: %s <output_dir> <rendered_mp4_name>\n' "$0" >&2
  exit 1
fi

OUTPUT_DIR=$1
RENDERED_MP4_NAME=$2
RENDERED_MP4_PATH="$OUTPUT_DIR/$RENDERED_MP4_NAME"
STANDARD_MP4_PATH="$OUTPUT_DIR/output.mp4"
MANIFEST_PATH="$OUTPUT_DIR/artifact-manifest.txt"

required_paths=(
  "$OUTPUT_DIR/research.json"
  "$OUTPUT_DIR/script.json"
  "$OUTPUT_DIR/quality-report.md"
  "$OUTPUT_DIR/output.srt"
  "$OUTPUT_DIR/screenshots"
  "$RENDERED_MP4_PATH"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    printf 'Missing required artifact: %s\n' "$path" >&2
    exit 1
  fi
done

PNG_COUNT=$(find "$OUTPUT_DIR/screenshots" -type f -name '*.png' | wc -l | tr -d ' ')
if [[ "$PNG_COUNT" == "0" ]]; then
  printf 'No PNG screenshots found in %s\n' "$OUTPUT_DIR/screenshots" >&2
  exit 1
fi

cp "$RENDERED_MP4_PATH" "$STANDARD_MP4_PATH"

get_size() {
  wc -c < "$1" | tr -d ' '
}

{
  printf 'output_dir: %s\n' "$OUTPUT_DIR"
  printf 'output.mp4 bytes: %s\n' "$(get_size "$STANDARD_MP4_PATH")"
  printf 'output.srt bytes: %s\n' "$(get_size "$OUTPUT_DIR/output.srt")"
  printf 'research.json bytes: %s\n' "$(get_size "$OUTPUT_DIR/research.json")"
  printf 'script.json bytes: %s\n' "$(get_size "$OUTPUT_DIR/script.json")"
  printf 'quality-report.md bytes: %s\n' "$(get_size "$OUTPUT_DIR/quality-report.md")"
  printf 'screenshots png count: %s\n' "$PNG_COUNT"
  if command -v ffprobe >/dev/null 2>&1; then
    FFPROBE_OUTPUT=$(ffprobe -v error -show_entries stream=width,height -show_entries format=duration -of default=noprint_wrappers=1 "$STANDARD_MP4_PATH")
    printf '%s\n' "$FFPROBE_OUTPUT"
  fi
} > "$MANIFEST_PATH"

printf 'Packaged artifacts in %s\n' "$OUTPUT_DIR"
