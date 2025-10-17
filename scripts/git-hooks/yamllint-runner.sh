#!/bin/bash

# yamllint-runner.sh - Runner script for yamllint linting
# Works even if yamllint is not installed (with graceful warning)

set -euo pipefail

# Source TTY-aware color definitions (auto-disables in GitHub Desktop)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/tty-colors.sh"

# Check if yamllint is installed
if ! command -v yamllint &> /dev/null; then
    echo -e "${YELLOW}⚠  yamllint not installed. Skipping YAML linting.${NC}"
    echo -e "${YELLOW}   To install: pip install --user yamllint${NC}"
    exit 0  # Exit cleanly - don't block commits when tool is missing
fi

# Get files to check
if [ "$#" -eq 0 ]; then
    # No files specified, check staged files
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(yml|yaml)$' || true)
else
    # Files specified as arguments
    FILES="$*"
fi

# Exit if no YAML files to check
if [ -z "$FILES" ]; then
    exit 0
fi

# Count files
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo -e "${GREEN}⟐ Running yamllint on $FILE_COUNT YAML file(s)...${NC}"

# Check if config file exists
CONFIG_FILE=""
if [ -f ".yamllint" ]; then
    CONFIG_FILE="-c .yamllint"
elif [ -f ".yamllint.yml" ]; then
    CONFIG_FILE="-c .yamllint.yml"
elif [ -f ".yamllint.yaml" ]; then
    CONFIG_FILE="-c .yamllint.yaml"
fi

# Run yamllint
ERRORS_FOUND=0
for file in $FILES; do
    if [ -f "$file" ]; then
        # shellcheck disable=SC2086
        if ! yamllint $CONFIG_FILE "$file"; then
            ERRORS_FOUND=1
        fi
    fi
done

if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Yamllint passed!${NC}"
    exit 0
else
    echo -e "${RED}⊗ Yamllint found issues. Please fix them before committing.${NC}"
    echo -e "${YELLOW}   To bypass (not recommended): use --no-verify${NC}"
    exit 1
fi
