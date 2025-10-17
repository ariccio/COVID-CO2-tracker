#!/bin/zsh
#
# TTY Color Detection Utility
# Sources this file to get color variables that auto-disable in non-TTY environments
#
# Usage in your script:
#   source "$(dirname "$0")/../lib/tty-colors.sh"
#   echo -e "${GREEN}Success!${NC}"
#
# Why: GitHub Desktop, CI, and other non-terminal environments cannot render
# ANSI escape sequences, causing garbled output like "[36;1m" to appear literally.
# This utility detects TTY and disables colors automatically.

# Detect if output is a TTY (terminal)
# GitHub Desktop pipes hook output, so [[ -t 1 ]] returns false
if [[ -t 1 ]]; then
    # Terminal detected - enable colors
    export RED='\033[0;31m'
    export GREEN='\033[0;32m'
    export YELLOW='\033[1;33m'
    export BLUE='\033[0;34m'
    export CYAN='\033[0;36m'
    export MAGENTA='\033[0;35m'
    export BOLD='\033[1m'
    export NC='\033[0m' # No Color
    export TTY_DETECTED=true
else
    # Non-terminal (GitHub Desktop, CI, etc.) - disable all colors
    export RED=''
    export GREEN=''
    export YELLOW=''
    export BLUE=''
    export CYAN=''
    export MAGENTA=''
    export BOLD=''
    export NC=''
    export TTY_DETECTED=false

    # Set environment variables to disable colors in child processes
    export NO_COLOR=1
    export TERM=dumb
fi
