# Bash Pipeline Robustness Pattern: Explicit Stage-by-Stage Error Handling

## Problem: Silent Pipeline Failures with `set -euo pipefail`

When using `set -euo pipefail` (which is generally a good practice), pipelines can fail silently when intermediate commands like `grep` return non-zero exit codes. More importantly, pipelines hide WHERE failures occur and WHY.

### Common Anti-Pattern
```bash
set -euo pipefail
# This can fail at any stage with no context:
RESULTS=$(find . -name "*.txt" | grep -v "exclude" | sort | head -10)
# Which command failed? Why? What was the input/output at each stage?
```

## Solution: Explicit Stage-by-Stage Processing with Error Checking

### The Robust Pattern: Check Each Stage
```bash
set -euo pipefail

# Stage 1: Find files with explicit error checking
echo "Stage 1: Finding text files..."
ALL_FILES=$(find . -name "*.txt" 2>&1) || {
    exit_code=$?
    echo "ERROR: Find command failed with exit code $exit_code" >&2
    echo "Output: $ALL_FILES" >&2
    exit 1
}

if [ -z "$ALL_FILES" ]; then
    echo "No .txt files found in current directory"
    exit 0
fi

echo "Found $(echo "$ALL_FILES" | wc -l) files"

# Stage 2: Filter with explicit checking
echo "Stage 2: Filtering out excluded files..."
FILTERED_FILES=""
excluded_count=0
included_count=0

while IFS= read -r file; do
    if [[ "$file" == *"exclude"* ]]; then
        ((excluded_count++))
        echo "  Excluding: $file" >&2
    else
        FILTERED_FILES="${FILTERED_FILES}${file}"$'\n'
        ((included_count++))
    fi
done <<< "$ALL_FILES"

if [ -z "$FILTERED_FILES" ]; then
    echo "All $excluded_count files were excluded, no files remaining"
    exit 0
fi

echo "Excluded $excluded_count files, kept $included_count files"

# Stage 3: Sort with error checking
echo "Stage 3: Sorting files..."
SORTED_FILES=$(echo "$FILTERED_FILES" | sort 2>&1) || {
    exit_code=$?
    echo "ERROR: Sort failed with exit code $exit_code" >&2
    exit 1
}

# Stage 4: Limit results with validation
echo "Stage 4: Taking first 10 results..."
FINAL_RESULTS=$(echo "$SORTED_FILES" | head -10)
final_count=$(echo "$FINAL_RESULTS" | grep -c . || echo "0")
echo "Returning $final_count results"
```

### Benefits of This Approach
1. **Clear error context**: Know exactly which stage failed
2. **Debugging information**: See counts and excluded items
3. **Graceful handling**: Differentiate between "no results" and "error"
4. **Audit trail**: Can log what was filtered and why
5. **Maintainable**: Easy to add new stages or modify logic

### Simplified Pattern for Common Cases

#### For Counting with Context
```bash
# Instead of:
COUNT=$(echo "$TEXT" | grep -E "pattern" | wc -l | tr -d '[:space:]')

# Do:
echo "Searching for pattern matches..."
MATCHES=$(echo "$TEXT" | grep -E "pattern" 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 1 ]; then
        echo "No matches found for pattern"
        COUNT=0
    else
        echo "ERROR: grep failed with exit code $exit_code" >&2
        exit 1
    fi
}

if [ -n "$MATCHES" ]; then
    COUNT=$(echo "$MATCHES" | wc -l | tr -d '[:space:]')
    echo "Found $COUNT matches"
else
    COUNT=0
fi
```

#### For File Processing with Validation
```bash
# Instead of:
RESULT=$(cat file.txt | process | transform)

# Do:
# Stage 1: Read file
if [ ! -f "file.txt" ]; then
    echo "ERROR: file.txt not found" >&2
    exit 1
fi

FILE_CONTENT=$(cat file.txt 2>&1) || {
    exit_code=$?
    echo "ERROR: Failed to read file.txt (exit code $exit_code)" >&2
    exit 1
}

if [ -z "$FILE_CONTENT" ]; then
    echo "WARNING: file.txt is empty"
    exit 0
fi

# Stage 2: Process
PROCESSED=$(echo "$FILE_CONTENT" | process 2>&1) || {
    exit_code=$?
    echo "ERROR: Processing failed (exit code $exit_code)" >&2
    echo "Input was: ${FILE_CONTENT:0:100}..." >&2
    exit 1
}

# Stage 3: Transform
RESULT=$(echo "$PROCESSED" | transform 2>&1) || {
    exit_code=$?
    echo "ERROR: Transform failed (exit code $exit_code)" >&2
    exit 1
}

echo "Successfully processed $(echo "$FILE_CONTENT" | wc -l) lines"
```

## Real Example: Applying to rubocop-session-check.sh

### Before (Pipeline that could fail silently):
```bash
MODIFIED_FILES=$(find . -type f \( -name "*.rb" \) -mmin -240 | grep -v vendor/ | grep -v node_modules/ | head -20)
```

### After (Explicit stage-by-stage checking):
```bash
# Stage 1: Find Ruby files
echo "Looking for Ruby files modified in last $HOURS hours..."
ALL_MODIFIED=$(find . -type f \( -name "*.rb" -o -name "*.rake" \) -mmin -${MINUTES} 2>&1) || {
    exit_code=$?
    echo "ERROR: Find command failed (exit code $exit_code)" >&2
    echo "Output: $ALL_MODIFIED" >&2
    exit 1
}

if [ -z "$ALL_MODIFIED" ]; then
    echo "No Ruby files modified in the last ${HOURS} hours"
    exit 0
fi

file_count=$(echo "$ALL_MODIFIED" | wc -l)
echo "Found $file_count modified Ruby files"

# Stage 2: Filter out vendor and node_modules
MODIFIED_FILES=""
excluded_count=0
included_count=0

while IFS= read -r file; do
    if [[ "$file" == *"/vendor/"* ]]; then
        ((excluded_count++))
        echo "  Excluding vendor file: $file" >&2
    elif [[ "$file" == *"/node_modules/"* ]]; then
        ((excluded_count++))
        echo "  Excluding node_modules file: $file" >&2
    else
        MODIFIED_FILES="${MODIFIED_FILES}${file}"$'\n'
        ((included_count++))
    fi
done <<< "$ALL_MODIFIED"

echo "Filtered: kept $included_count files, excluded $excluded_count files"

if [ -z "$MODIFIED_FILES" ]; then
    echo "No Ruby files to check after filtering (all $excluded_count files were in vendor/node_modules)"
    exit 0
fi
```

## Scripts in This Repo That Need This Pattern

### 1. **scripts/post-rubocop-check.sh**
Line 70 needs refactoring:
```bash
# Current (fragile):
OFFENSE_COUNT=$(echo "$OFFENSES" | grep -E "^[CWE]:" | wc -l | tr -d '[:space:]')

# Better:
OFFENSE_LINES=$(echo "$OFFENSES" | grep -E "^[CWE]:" 2>&1) || {
    if [ $? -eq 1 ]; then
        OFFENSE_COUNT=0
        echo "No offenses found"
    else
        echo "ERROR: Failed to parse Rubocop output" >&2
        exit 1
    fi
}
if [ -n "$OFFENSE_LINES" ]; then
    OFFENSE_COUNT=$(echo "$OFFENSE_LINES" | wc -l | tr -d '[:space:]')
    echo "Found $OFFENSE_COUNT offenses"
fi
```

### 2. **scripts/capture-rubocop-baseline.sh**
Line 36 needs similar treatment.

## Cross-Repository Application

To find and fix similar issues:

### Step 1: Identify Scripts
```bash
# Find all bash scripts with pipefail
find . -name "*.sh" -type f -exec grep -l "set.*pipefail" {} \;

# Find pipeline patterns that need attention
find . -name "*.sh" -type f -exec grep -n ".*|.*|.*" {} /dev/null \;
```

### Step 2: Look for These Patterns
- Multi-stage pipelines: `cmd1 | cmd2 | cmd3`
- grep in pipelines: `| grep` or `grep.*|`
- Counting pipelines: `| wc -l`
- Filtering pipelines: `grep -v`

### Step 3: Apply the Pattern
Break each pipeline into stages with:
1. Capture output with error checking
2. Validate the output (empty? error?)
3. Process with context
4. Report what happened

## Testing Your Refactored Scripts

Test with these scenarios:
```bash
# Test with no input
echo "" | your_script

# Test with no matches
echo "no matches here" | your_script

# Test with errors
chmod 000 testfile && your_script testfile

# Test with large input
seq 1 1000000 | your_script
```

## Key Benefits

1. **Debuggability**: Know exactly where and why failures occur
2. **Observability**: See what's happening at each stage
3. **Maintainability**: Easy to modify individual stages
4. **Reliability**: Handle edge cases explicitly
5. **User-Friendly**: Provide context-appropriate error messages

## The Philosophy

> "Make the implicit explicit. Show your work. Fail loudly with context."

This pattern trades conciseness for clarity and robustness. The extra lines of code pay dividends when debugging production issues at 3 AM.