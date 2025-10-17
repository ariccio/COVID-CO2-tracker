#!/bin/bash
# Gitleaks Runner for Git Hooks - COVID CO2 Tracker
# Detects secrets and credentials before commits
# Critical for preventing Heroku token, database URL, and API key leaks

set -euo pipefail

# Script directory and paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source TTY-aware color definitions (auto-disables in GitHub Desktop)
source "$SCRIPT_DIR/../lib/tty-colors.sh"

# Default values
STAGED_ONLY=${1:-false}
EXIT_ON_ERROR=true

# ============================================================================
# Helper Functions
# ============================================================================

print_info() {
    echo -e "${BLUE}ℹ${NC} Gitleaks: $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} Gitleaks: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} Gitleaks: $1"
}

print_error() {
    echo -e "${RED}✗${NC} Gitleaks: $1"
}

# ============================================================================
# Check Gitleaks Installation
# ============================================================================

check_gitleaks() {
    if ! command -v gitleaks &> /dev/null; then
        print_warning "Gitleaks not installed. Skipping secret detection."
        print_info "To install Gitleaks:"
        echo "    brew install gitleaks         # macOS with Homebrew"
        echo "    go install github.com/gitleaks/gitleaks/v8@latest"
        echo
        print_info "Gitleaks detects:"
        print_info "  - Heroku API tokens"
        print_info "  - Database URLs with passwords"
        print_info "  - AWS credentials"
        print_info "  - Rails secret keys"
        print_info "  - API tokens and keys"
        echo
        # Exit cleanly - don't block commits
        exit 0
    fi
}

# ============================================================================
# Run Gitleaks on Staged Files
# ============================================================================

run_staged_scan() {
    print_info "Scanning staged files for secrets..."

    # Create temp file with staged content
    local temp_dir=$(mktemp -d)
    local found_secrets=false

    # Export staged files to temp directory
    git diff --cached --name-only --diff-filter=ACM | while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            local dir=$(dirname "$file")
            mkdir -p "$temp_dir/$dir"
            git show ":$file" > "$temp_dir/$file" 2>/dev/null || true
        fi
    done

    # Run gitleaks on temp directory
    local config_flag=""
    if [[ -f "$REPO_ROOT/.gitleaks.toml" ]]; then
        config_flag="--config=$REPO_ROOT/.gitleaks.toml"
        print_info "Using custom .gitleaks.toml configuration"
    fi

    # Run scan
    if gitleaks detect \
        --source="$temp_dir" \
        --no-git \
        --redact \
        --exit-code 1 \
        $config_flag 2>&1 | tee /tmp/gitleaks-output.txt; then
        print_success "No secrets found in staged files"
    else
        found_secrets=true
        print_error "Secrets detected in staged files!"
        parse_gitleaks_output
    fi

    # Cleanup
    rm -rf "$temp_dir"

    if [[ "$found_secrets" == true ]]; then
        return 1
    fi
    return 0
}

# ============================================================================
# Run Gitleaks on Git History
# ============================================================================

run_history_scan() {
    local depth="${1:-10}"  # Default to last 10 commits

    print_info "Scanning last $depth commits for secrets..."

    local config_flag=""
    if [[ -f "$REPO_ROOT/.gitleaks.toml" ]]; then
        config_flag="--config=$REPO_ROOT/.gitleaks.toml"
    fi

    # Run gitleaks on git history
    if gitleaks detect \
        --log-opts="-${depth}" \
        --redact \
        --exit-code 1 \
        $config_flag 2>&1 | tee /tmp/gitleaks-output.txt; then
        print_success "No secrets found in recent history"
    else
        print_error "Secrets found in git history!"
        parse_gitleaks_output
        return 1
    fi

    return 0
}

# ============================================================================
# Parse Gitleaks Output
# ============================================================================

parse_gitleaks_output() {
    if [[ -f "/tmp/gitleaks-output.txt" ]]; then
        # Check for Rails/Heroku critical patterns
        if grep -q "HEROKU_API_KEY\|DATABASE_URL\|SECRET_KEY_BASE\|RAILS_MASTER_KEY" /tmp/gitleaks-output.txt; then
            echo
            print_error "CRITICAL: Rails/Heroku credentials detected!"
            print_info "Production credentials must never be committed to version control"
        fi

        # Check for high-risk secrets
        if grep -q "sk_live\|AKIA\|-----BEGIN.*PRIVATE KEY" /tmp/gitleaks-output.txt; then
            echo
            print_error "HIGH RISK: Production credentials detected!"
            print_info "Rotate these credentials immediately"
        fi

        echo
        print_info "To see full details: cat /tmp/gitleaks-output.txt"
        print_info "To bypass (NOT recommended): git commit --no-verify"
    fi
}

# ============================================================================
# Quick Pattern Check (Fallback)
# ============================================================================

quick_pattern_check() {
    print_info "Running quick pattern-based secret check..."

    local found_issues=false

    # Critical patterns that should never be committed to Rails/Heroku app
    local patterns=(
        "HEROKU_API_KEY"
        "AKIA[0-9A-Z]{16}"              # AWS access key
        "DATABASE_URL.*postgres://"      # Database connection string
        "SECRET_KEY_BASE"                # Rails secret key base
        "RAILS_MASTER_KEY"               # Rails master key
        "api_key.*[\"'][A-Za-z0-9]"     # Generic API key
        "password.*[\"'][^\"]"           # Hardcoded password
        "sk_live_"                       # Stripe live key
        "AIza[0-9A-Za-z-_]{35}"         # Google API key
        "access_token.*[\"'][A-Za-z0-9]" # Generic access token
    )

    for pattern in "${patterns[@]}"; do
        if git diff --cached | grep -E "$pattern" > /dev/null 2>&1; then
            print_error "Found suspicious pattern: $pattern"
            found_issues=true
        fi
    done

    if [[ "$found_issues" == true ]]; then
        return 1
    fi

    print_success "Quick pattern check passed"
    return 0
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Change to repo root for consistent paths
    cd "$REPO_ROOT"

    # Check if gitleaks is installed
    check_gitleaks

    # Determine scan type
    if [[ "$STAGED_ONLY" == "true" ]]; then
        # Pre-commit: scan only staged files
        if ! run_staged_scan; then
            if [[ "$EXIT_ON_ERROR" == true ]]; then
                echo
                print_error "Secrets found! Cannot commit."
                print_info "Remove secrets and try again"
                print_info "For emergency bypass: git commit --no-verify"
                exit 1
            fi
        fi
    else
        # Pre-push: scan recent history
        if ! run_history_scan 10; then
            if [[ "$EXIT_ON_ERROR" == true ]]; then
                echo
                print_error "Secrets found in history! Cannot push."
                print_info "Clean history before pushing"
                print_info "See: https://rtyley.github.io/bfg-repo-cleaner/"
                exit 1
            fi
        fi
    fi

    # Always run quick pattern check as backup
    if ! command -v gitleaks &> /dev/null; then
        if ! quick_pattern_check; then
            print_error "Suspicious patterns detected!"
            if [[ "$EXIT_ON_ERROR" == true ]]; then
                exit 1
            fi
        fi
    fi

    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --staged)
            STAGED_ONLY=true
            shift
            ;;
        --no-exit)
            EXIT_ON_ERROR=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  --staged      Only scan staged files (for pre-commit)"
            echo "  --no-exit     Don't exit on errors (warning only)"
            echo "  --help        Show this help message"
            echo
            echo "This script runs Gitleaks to detect:"
            echo "  - Heroku API tokens"
            echo "  - Database URLs with passwords"
            echo "  - AWS credentials"
            echo "  - Rails secret keys"
            echo "  - API tokens and keys"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Run main function
main
