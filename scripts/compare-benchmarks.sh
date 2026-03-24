#!/bin/bash

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Temporary files for benchmark results
TEMP_CURRENT="bench_current.txt"
TEMP_BASE="bench_base.txt"

# Cleanup function
cleanup() {
    rm -f "$TEMP_CURRENT" "$TEMP_BASE"
}
trap cleanup EXIT

echo "------------------------------------------------------------"
echo "Starting benchmark comparison..."
echo "------------------------------------------------------------"

# 1. Run benchmarks on current state
echo "1/3: Benchmarking CURRENT changes..."
npm run bench > "$TEMP_CURRENT" 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Benchmarks failed on current changes."
    cat "$TEMP_CURRENT"
    exit 1
fi

# 2. Check for changes and stash
STASH_NEEDED=$(git status --porcelain)
STASH_CREATED=false

if [ -n "$STASH_NEEDED" ]; then
    echo "2/3: Stashing current changes to benchmark BASE state..."
    # We use -u to include untracked files as requested
    STASH_OUT=$(git stash push -u -m "bench-compare-temp-stash-$(date +%s)")
    if [[ "$STASH_OUT" != "No local changes to save" ]]; then
        STASH_CREATED=true
    fi
else
    echo "2/3: No changes detected. Comparing current state against itself."
fi

# 3. Run benchmarks on base state (if stashed)
if [ "$STASH_CREATED" = true ]; then
    echo "3/3: Benchmarking BASE state..."
    npm run bench > "$TEMP_BASE" 2>&1
    BENCH_BASE_EXIT=$?
    
    echo "Restoring current changes..."
    git stash pop --quiet
else
    cp "$TEMP_CURRENT" "$TEMP_BASE"
    BENCH_BASE_EXIT=0
fi

if [ $BENCH_BASE_EXIT -ne 0 ]; then
    echo "Error: Benchmarks failed on base state."
    cat "$TEMP_BASE"
    exit 1
fi

# 4. Format and print comparison
echo ""
node scripts/format-benchmark-comparison.js "$TEMP_BASE" "$TEMP_CURRENT"
