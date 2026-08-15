#!/bin/bash

# ============================================================================
# install.sh — install Iron and Anvil's toolchain and JS dependencies
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Ensure a runtime dependency exists, installing it via pacman when missing.
ensure_pacman_pkg() {
    local binary="$1" package="$2"
    if command -v "$binary" >/dev/null 2>&1; then
        return 0
    fi
    echo "Missing '$binary' — installing package '$package'..."
    if ! sudo pacman -S --needed --noconfirm "$package"; then
        echo "Failed to install '$package'. Run manually: sudo pacman -S $package" >&2
        exit 1
    fi
}

main() {
    cd "$SCRIPT_DIR"

    ensure_pacman_pkg node nodejs
    ensure_pacman_pkg npm npm
    # pnpm, not npm: this project depends on @kuhyx/ts-core, a subdirectory of
    # the kuhyx/utils monorepo, and npm cannot install a subdirectory of a git
    # repo -- it ignores the `&path:` key and fails looking for package.json at
    # the repo root.
    ensure_pacman_pkg pnpm pnpm

    echo "Installing JavaScript dependencies..."
    if [[ -f pnpm-lock.yaml ]]; then
        pnpm install --frozen-lockfile
    else
        pnpm install
    fi

    echo "Done. Run the game with ./run.sh"
}

main "$@"
