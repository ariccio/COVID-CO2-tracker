#!/bin/bash

# markdownlint-runner.sh - Runner script for Markdown linting
# Works even if markdownlint is not installed (with graceful warning)

set -euo pipefail

# Source TTY-aware color definitions (auto-disables in GitHub Desktop)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/tty-colors.sh"

# Check if markdownlint is installed (try multiple versions)
MARKDOWNLINT_CMD=""
if command -v markdownlint-cli2 &> /dev/null; then
    MARKDOWNLINT_CMD="markdownlint-cli2"
elif command -v markdownlint &> /dev/null; then
    MARKDOWNLINT_CMD="markdownlint"
elif command -v mdl &> /dev/null; then
    # Ruby version
    MARKDOWNLINT_CMD="mdl"
else
    echo -e "${YELLOW}⚠  markdownlint not installed. Skipping Markdown linting.${NC}"
    echo -e "${YELLOW}   To install: npm install -g markdownlint-cli2${NC}"
    exit 0  # Exit cleanly - don't block commits when tool is missing
fi

# Get files to check
if [ "$#" -eq 0 ]; then
    # No files specified, check staged files
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$' || true)
else
    # Files specified as arguments
    FILES="$*"
fi

# Exit if no Markdown files to check
if [ -z "$FILES" ]; then
    exit 0
fi

# Count files
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo -e "${GREEN}⟐ Running markdownlint on $FILE_COUNT Markdown file(s)...${NC}"

# Check for config file
CONFIG_FILE=""
if [ -f ".markdownlint.yml" ]; then
    CONFIG_FILE="--config .markdownlint.yml"
elif [ -f ".markdownlint.yaml" ]; then
    CONFIG_FILE="--config .markdownlint.yaml"
elif [ -f ".markdownlint.json" ]; then
    CONFIG_FILE="--config .markdownlint.json"
elif [ -f ".markdownlintrc" ]; then
    CONFIG_FILE="--config .markdownlintrc"
fi

# Run markdownlint based on version
ERRORS_FOUND=0

if [ "$MARKDOWNLINT_CMD" = "markdownlint-cli2" ]; then
    # markdownlint-cli2 syntax
    # shellcheck disable=SC2086
    if ! $MARKDOWNLINT_CMD $CONFIG_FILE $FILES; then
        ERRORS_FOUND=1
    fi
elif [ "$MARKDOWNLINT_CMD" = "mdl" ]; then
    # Ruby mdl syntax
    for file in $FILES; do
        if [ -f "$file" ]; then
            if ! mdl "$file"; then
                ERRORS_FOUND=1
            fi
        fi
    done
else
    # Original markdownlint syntax
    for file in $FILES; do
        if [ -f "$file" ]; then
            # shellcheck disable=SC2086
            if ! $MARKDOWNLINT_CMD $CONFIG_FILE "$file"; then
                ERRORS_FOUND=1
            fi
        fi
    done
fi

if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Markdownlint passed!${NC}"
    exit 0
else
    echo -e "${RED}⊗ Markdownlint found issues. Please fix them before committing.${NC}"
    echo -e "${YELLOW}   To auto-fix: markdownlint-cli2 --fix <files>${NC}"
    echo -e "${YELLOW}   To bypass (not recommended): use --no-verify${NC}"
    exit 1
fi
