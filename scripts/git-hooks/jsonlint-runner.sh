#!/bin/bash

# jsonlint-runner.sh - Runner script for JSON linting
# Works even if jsonlint is not installed (with graceful warning)

set -euo pipefail

# Source TTY-aware color definitions (auto-disables in GitHub Desktop)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/tty-colors.sh"

# Check if jsonlint is installed (try multiple common names)
JSONLINT_CMD=""
if command -v jsonlint-cli &> /dev/null; then
    JSONLINT_CMD="jsonlint-cli"
elif command -v jsonlint &> /dev/null; then
    JSONLINT_CMD="jsonlint"
elif command -v json &> /dev/null; then
    # json.tool as fallback (Python built-in)
    JSONLINT_CMD="python"
else
    echo -e "${YELLOW}⚠  jsonlint not installed. Skipping JSON linting.${NC}"
    echo -e "${YELLOW}   To install: npm install -g @prantlf/jsonlint${NC}"
    exit 0  # Exit cleanly - don't block commits when tool is missing
fi

# Get files to check
if [ "$#" -eq 0 ]; then
    # No files specified, check staged files (include various JSON-like files)
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(json|jsonc|json5)$' || true)

    # Also check specific config files that are JSON
    EXTRA_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '(tsconfig|package-lock|composer\.lock|\.babelrc|\.eslintrc)' || true)
    if [ -n "$EXTRA_FILES" ]; then
        FILES="${FILES}${FILES:+$'\n'}${EXTRA_FILES}"
    fi
else
    # Files specified as arguments
    FILES="$*"
fi

# Exit if no JSON files to check
if [ -z "$FILES" ]; then
    exit 0
fi

# Count files
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo -e "${GREEN}⟐ Running JSON lint on $FILE_COUNT file(s)...${NC}"

# Run appropriate linter
ERRORS_FOUND=0

for file in $FILES; do
    if [ -f "$file" ]; then
        echo "Checking: $file"

        # Use Python's json.tool if that's all we have
        if [ "$JSONLINT_CMD" = "python" ]; then
            if ! python -m json.tool "$file" > /dev/null 2>&1; then
                echo -e "${RED}✗ Invalid JSON in $file${NC}"
                python -m json.tool "$file" 2>&1 | grep -v "^Expecting" || true
                ERRORS_FOUND=1
            fi
        else
            # Use actual jsonlint
            if ! $JSONLINT_CMD "$file" > /dev/null 2>&1; then
                echo -e "${RED}✗ Invalid JSON in $file${NC}"
                $JSONLINT_CMD "$file" 2>&1 | head -10
                ERRORS_FOUND=1
            fi
        fi
    fi
done

if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ JSON lint passed!${NC}"
    exit 0
else
    echo -e "${RED}⊗ JSON lint found issues. Please fix them before committing.${NC}"
    echo -e "${YELLOW}   To bypass (not recommended): use --no-verify${NC}"
    exit 1
fi
