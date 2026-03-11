#!/bin/sh
set -e

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  BOLD='\033[1m'
  DIM='\033[2m'
  GREEN='\033[32m'
  RED='\033[31m'
  YELLOW='\033[33m'
  RESET='\033[0m'
else
  BOLD='' DIM='' GREEN='' RED='' YELLOW='' RESET=''
fi

PACKAGE="@bahrulbangsawan/rubot"

info()  { printf "${BOLD}${GREEN}✓${RESET} %s\n" "$1"; }
warn()  { printf "${BOLD}${YELLOW}!${RESET} %s\n" "$1"; }
error() { printf "${BOLD}${RED}✗${RESET} %s\n" "$1"; }

# ─── Detect shell profile ────────────────────────────────────────────
detect_profile() {
  SHELL_NAME=$(basename "$SHELL" 2>/dev/null || echo "sh")
  case "$SHELL_NAME" in
    zsh)  echo "${HOME}/.zshrc" ;;
    bash)
      if [ -f "${HOME}/.bashrc" ]; then
        echo "${HOME}/.bashrc"
      else
        echo "${HOME}/.bash_profile"
      fi
      ;;
    fish) echo "${HOME}/.config/fish/config.fish" ;;
    *)    echo "${HOME}/.profile" ;;
  esac
}

# ─── Setup npm global prefix in user home ─────────────────────────────
setup_npm_prefix() {
  NPM_GLOBAL_DIR="${HOME}/.npm-global"
  CURRENT_PREFIX=$(npm config get prefix 2>/dev/null || echo "")

  # Already configured to a user-writable location
  if [ -w "${CURRENT_PREFIX}/bin" ] 2>/dev/null; then
    return 0
  fi

  warn "npm global directory (${CURRENT_PREFIX}) requires elevated permissions"
  printf "  Setting up user-local prefix at ${NPM_GLOBAL_DIR}...\n"

  mkdir -p "${NPM_GLOBAL_DIR}"
  npm config set prefix "${NPM_GLOBAL_DIR}"

  PROFILE=$(detect_profile)
  EXPORT_LINE="export PATH=\"\${HOME}/.npm-global/bin:\$PATH\""

  if [ -f "$PROFILE" ] && grep -qF ".npm-global/bin" "$PROFILE" 2>/dev/null; then
    : # Already in profile
  else
    printf "\n# npm global prefix (added by rubot installer)\n%s\n" "$EXPORT_LINE" >> "$PROFILE"
    info "Added PATH entry to ${PROFILE}"
  fi

  export PATH="${NPM_GLOBAL_DIR}/bin:$PATH"
  info "npm global prefix set to ${NPM_GLOBAL_DIR}"
}

# ─── Check prerequisites ──────────────────────────────────────────────
check_requirements() {
  if ! command -v node >/dev/null 2>&1; then
    error "Node.js is required but not installed"
    printf "  Install it from https://nodejs.org (v20+)\n"
    exit 1
  fi

  NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
  if [ "$NODE_MAJOR" -lt 20 ] 2>/dev/null; then
    error "Node.js v20+ is required (found v$(node -v | tr -d 'v'))"
    printf "  Update from https://nodejs.org\n"
    exit 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    error "npm is required but not installed"
    exit 1
  fi
}

# ─── Install ──────────────────────────────────────────────────────────
do_install() {
  printf "\n${BOLD}  rubot installer${RESET}\n\n"

  check_requirements
  setup_npm_prefix

  printf "\n  Installing ${PACKAGE}...\n\n"
  npm install -g "${PACKAGE}"

  if command -v rubot >/dev/null 2>&1; then
    VERSION=$(rubot --version 2>/dev/null || echo "unknown")
    printf "\n"
    info "rubot v${VERSION} installed successfully!"
    printf "\n  Get started:\n"
    printf "    ${DIM}rubot search${RESET}              Browse available skills\n"
    printf "    ${DIM}rubot add --skill drizzle-orm${RESET}  Install a skill\n"
    printf "    ${DIM}rubot list${RESET}               Show installed skills\n"
    printf "    ${DIM}rubot --help${RESET}             Full command reference\n"
  else
    printf "\n"
    warn "rubot was installed but is not in your current PATH"
    printf "  Restart your terminal or run:\n"
    printf "    source $(detect_profile)\n"
  fi

  printf "\n"
}

# ─── Uninstall ────────────────────────────────────────────────────────
do_uninstall() {
  printf "\n${BOLD}  rubot uninstaller${RESET}\n\n"

  if ! npm list -g "${PACKAGE}" >/dev/null 2>&1; then
    warn "rubot is not installed globally"
    printf "\n"
    exit 0
  fi

  printf "  Removing ${PACKAGE}...\n\n"
  npm uninstall -g "${PACKAGE}"

  info "rubot has been uninstalled"

  # Clean up PATH entry from profile (optional, non-destructive)
  PROFILE=$(detect_profile)
  if [ -f "$PROFILE" ] && grep -qF "# npm global prefix (added by rubot installer)" "$PROFILE" 2>/dev/null; then
    printf "\n"
    warn "The npm global PATH entry in ${PROFILE} was left in place"
    printf "  Remove these lines manually if no longer needed:\n"
    printf "    ${DIM}# npm global prefix (added by rubot installer)${RESET}\n"
    printf "    ${DIM}export PATH=\"\${HOME}/.npm-global/bin:\$PATH\"${RESET}\n"
  fi

  printf "\n"
}

# ─── Entry point ──────────────────────────────────────────────────────
case "${1:-}" in
  --uninstall) do_uninstall ;;
  *)           do_install ;;
esac
