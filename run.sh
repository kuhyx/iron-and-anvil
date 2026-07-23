#!/bin/bash

# ============================================================================
# run.sh — build and launch Iron and Anvil in a browser
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly PORT="${IRON_AND_ANVIL_PORT:-4173}"

PREVIEW_PID=""

cleanup() {
    if [[ -n "$PREVIEW_PID" ]] && kill -0 "$PREVIEW_PID" 2>/dev/null; then
        kill "$PREVIEW_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Block until the preview server accepts TCP connections (no curl dependency).
wait_for_port() {
    local host="127.0.0.1" attempts=0
    while (( attempts < 100 )); do
        if (exec 3<>"/dev/tcp/${host}/${PORT}") 2>/dev/null; then
            exec 3>&- 3<&-
            return 0
        fi
        sleep 0.1
        (( attempts += 1 ))
    done
    echo "Preview server did not start on port ${PORT}." >&2
    return 1
}

main() {
    cd "$SCRIPT_DIR"

    if [[ ! -d node_modules ]]; then
        echo "Missing dependencies — running install.sh..."
        ./install.sh
    fi

    echo "Building the game..."
    npm run build

    echo "Starting preview server on http://localhost:${PORT} ..."
    npm run preview -- --port "$PORT" --strictPort --host 127.0.0.1 &
    PREVIEW_PID=$!

    wait_for_port

    local url="http://localhost:${PORT}/"
    echo "Opening the game: ${url}"
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url" >/dev/null 2>&1 || true
    else
        echo "Open manually in a browser: ${url}"
    fi

    echo "Game is running. Press Ctrl+C to stop."
    wait "$PREVIEW_PID"
}

main "$@"
