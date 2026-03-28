#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
ONE_SHOT_DIR="$ROOT_DIR/test-output/phase-18/one-shot"
RESUME_DIR="$ROOT_DIR/test-output/phase-18/resume"
CONFIG_PATH="$ROOT_DIR/video-script.config.json"

cd "$ROOT_DIR"

npm run build
npm run typecheck

if [[ ! -f "$CONFIG_PATH" ]]; then
  printf 'Missing config: %s\n' "$CONFIG_PATH" >&2
  exit 1
fi

LLM_PROVIDER=$(node --input-type=module -e "import {readFileSync} from 'node:fs'; const config = JSON.parse(readFileSync(process.argv[1], 'utf8')); const provider = config?.llm?.provider; if (provider !== 'openai' && provider !== 'anthropic') { console.error('Unsupported llm.provider: ' + String(provider)); process.exit(1); } process.stdout.write(provider);" "$CONFIG_PATH")

if [[ "$LLM_PROVIDER" == "openai" ]]; then
  if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    printf 'OPENAI_API_KEY is required when llm.provider=openai\n' >&2
    exit 1
  fi
fi

if [[ "$LLM_PROVIDER" == "anthropic" ]]; then
  if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    printf 'ANTHROPIC_API_KEY is required when llm.provider=anthropic\n' >&2
    exit 1
  fi
fi

rm -rf "$ONE_SHOT_DIR" "$RESUME_DIR"
mkdir -p "$ONE_SHOT_DIR" "$RESUME_DIR"

node dist/cli/index.js --help >/dev/null

printf 'Preflight passed for provider=%s\n' "$LLM_PROVIDER"
