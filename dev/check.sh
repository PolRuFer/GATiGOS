#!/bin/sh
# Gate for every commit: theme check must pass with zero errors and zero warnings.
cd "$(dirname "$0")/.."
out=$(shopify theme check --fail-level warning 2>&1)
status=$?
echo "$out" | grep -E "inspected|\[error\]|\[warning\]"
exit $status
