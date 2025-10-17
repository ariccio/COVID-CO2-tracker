#!/bin/bash

# shellcheck-runner.sh - Runner script for shellcheck linting
# Works even if shellcheck is not installed (with graceful warning)

set -euo pipefail

# Source TTY-aware color definitions (auto-disables in GitHub Desktop)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/tty-colors.sh"

# Check if shellcheck is installed
if ! command -v shellcheck &> /dev/null; then
    echo -e "${YELLOW}⚠  shellcheck not installed. Skipping shell script linting.${NC}"
    echo -e "${YELLOW}   To install: brew install shellcheck${NC}"
    exit 0  # Exit cleanly - don't block commits when tool is missing
fi

# Get files to check
if [ "$#" -eq 0 ]; then
    # No files specified, check staged files
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.sh$' || true)
else
    # Files specified as arguments
    FILES="$*"
fi

# Exit if no shell scripts to check
if [ -z "$FILES" ]; then
    exit 0
fi

# Count files
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo -e "${GREEN}⟐ Running shellcheck on $FILE_COUNT shell script(s)...${NC}"

# Run shellcheck with appropriate settings
# -x: Follow source statements
# -P: Set path for relative imports
# --severity=warning: Show warnings and errors (not style/info)
ERRORS_FOUND=0

for file in $FILES; do
    if [ -f "$file" ]; then
        # Skip files with unsupported shebangs (zsh, fish, etc.)
        # shellcheck only supports sh/bash/dash/ksh/busybox sh
        shebang=$(head -n 1 "$file" 2>/dev/null || true)
        if echo "$shebang" | grep -qE '^#!/.*(zsh|fish|tcsh|csh)'; then
            echo -e "${YELLOW}⊙ Skipping $file (unsupported shell: $shebang)${NC}"
            continue
        fi

        if ! shellcheck -x --severity=warning "$file"; then
            ERRORS_FOUND=1
        fi
    fi
done

if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Shellcheck passed!${NC}"
    exit 0
else
    echo -e "${RED}⊗ Shellcheck found issues. Please fix them before committing.${NC}"
    echo -e "${YELLOW}   To bypass (not recommended): use --no-verify${NC}"
    exit 1
fi
