#!/bin/bash
#
# Shell wrapper for TypeScript emoji checker
# Provides backward compatibility for shell-based hooks
#

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the TypeScript emoji checker with all arguments passed through
exec npx ts-node "$SCRIPT_DIR/check-emoji-usage.ts" "$@"