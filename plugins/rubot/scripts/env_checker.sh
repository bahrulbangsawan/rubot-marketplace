#!/usr/bin/env bash
#
# Environment Checker for Rubot Plugin
# =====================================
#
# Validates local tooling and stack readiness for modern web projects.
# Safe for local and CI usage. Fail-fast on critical missing tooling.
#
# Usage:
#     ./env_checker.sh [project_path]
#     ./env_checker.sh                    # uses current directory
#     ./env_checker.sh /path/to/project   # uses specified path
#
# Exit Codes:
#     0 - All checks passed
#     1 - Critical failure (missing required tooling)
#     2 - Non-critical failures (missing optional components)

set -uo pipefail
# Note: -e is not set to allow graceful error handling

# ==============================================================================
# Configuration
# ==============================================================================

readonly SCRIPT_NAME="env_checker"
readonly SCRIPT_VERSION="1.0.0"

# Colors for output (disabled if not a TTY)
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[0;33m'
    readonly BLUE='\033[0;34m'
    readonly CYAN='\033[0;36m'
    readonly BOLD='\033[1m'
    readonly NC='\033[0m' # No Color
else
    readonly RED=''
    readonly GREEN=''
    readonly YELLOW=''
    readonly BLUE=''
    readonly CYAN=''
    readonly BOLD=''
    readonly NC=''
fi

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
CRITICAL_FAIL=false

# Project path (default: current directory)
PROJECT_PATH="${1:-.}"

# ==============================================================================
# Output Functions
# ==============================================================================

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BOLD}${CYAN}── $1 ──${NC}"
    echo ""
}

print_pass() {
    echo -e "  ${GREEN}[PASS]${NC} $1"
    ((PASS_COUNT++))
}

print_fail() {
    echo -e "  ${RED}[FAIL]${NC} $1"
    ((FAIL_COUNT++))
}

print_warn() {
    echo -e "  ${YELLOW}[WARN]${NC} $1"
    ((WARN_COUNT++))
}

print_info() {
    echo -e "  ${BLUE}[INFO]${NC} $1"
}

print_remediation() {
    echo -e "         ${YELLOW}→ $1${NC}"
}

# ==============================================================================
# Tool Availability Checks
# ==============================================================================

check_tool_available() {
    local tool="$1"
    local required="${2:-false}"

    if command -v "$tool" &>/dev/null; then
        print_pass "$tool is available"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            print_fail "$tool is not installed (CRITICAL)"
            print_remediation "Install $tool to continue"
            CRITICAL_FAIL=true
        else
            print_warn "$tool is not installed"
            print_remediation "Install $tool for full functionality"
        fi
        return 1
    fi
}

check_tools() {
    print_section "Tool Availability"

    # Critical tools (fail fast if missing)
    check_tool_available "bun" "true" || true
    check_tool_available "node" "true" || true
    check_tool_available "git" "true" || true

    # Optional but recommended tools
    check_tool_available "wrangler" "false" || true
    check_tool_available "gh" "false" || true

    if [[ "$CRITICAL_FAIL" == "true" ]]; then
        echo ""
        echo -e "${RED}${BOLD}CRITICAL: Missing required tooling. Cannot continue.${NC}"
        exit 1
    fi
}

# ==============================================================================
# Version Checks
# ==============================================================================

get_version() {
    local tool="$1"
    local version_flag="${2:---version}"

    if command -v "$tool" &>/dev/null; then
        local version
        version=$("$tool" "$version_flag" 2>/dev/null | head -n1 || echo "unknown")
        echo "$version"
        return 0
    fi
    echo "not installed"
    return 1
}

check_versions() {
    print_section "Version Information"

    local bun_version node_version wrangler_version

    if command -v bun &>/dev/null; then
        bun_version=$(bun --version 2>/dev/null || echo "unknown")
        print_info "bun: v${bun_version}"
    else
        print_warn "bun: not installed"
    fi

    if command -v node &>/dev/null; then
        node_version=$(node --version 2>/dev/null || echo "unknown")
        print_info "node: ${node_version}"
    else
        print_warn "node: not installed"
    fi

    if command -v wrangler &>/dev/null; then
        wrangler_version=$(wrangler --version 2>/dev/null | head -n1 || echo "unknown")
        print_info "wrangler: ${wrangler_version}"
    else
        print_info "wrangler: not installed"
    fi
}

# ==============================================================================
# Wrangler Readiness Checks
# ==============================================================================

check_wrangler_readiness() {
    print_section "Wrangler Readiness"

    # Check if wrangler is installed
    if ! command -v wrangler &>/dev/null; then
        print_warn "wrangler not installed - skipping readiness checks"
        print_remediation "Install with: bun add -g wrangler"
        return
    fi

    print_pass "wrangler is installed"

    # Check wrangler authentication (this makes a network call)
    local whoami_output
    if whoami_output=$(wrangler whoami 2>&1) && [[ -n "$whoami_output" ]]; then
        # Extract account info from output
        local account_info
        account_info=$(echo "$whoami_output" | grep -E "(Account|email|👤)" | head -n1 | tr -d '\n' || echo "")
        if [[ -n "$account_info" ]]; then
            print_pass "wrangler is authenticated"
            print_info "$account_info"
        else
            print_pass "wrangler is authenticated"
        fi
    else
        print_warn "wrangler is not authenticated"
        print_remediation "Run: wrangler login"
    fi

    # Check for wrangler.toml
    if [[ -f "${PROJECT_PATH}/wrangler.toml" ]]; then
        print_pass "wrangler.toml exists"
    elif [[ -f "${PROJECT_PATH}/wrangler.jsonc" ]]; then
        print_pass "wrangler.jsonc exists"
    elif [[ -f "${PROJECT_PATH}/wrangler.json" ]]; then
        print_pass "wrangler.json exists"
    else
        print_warn "No wrangler config found (wrangler.toml/jsonc/json)"
        print_remediation "Create wrangler.toml for Cloudflare Workers deployment"
    fi
}

# ==============================================================================
# Project Stack Validation
# ==============================================================================

check_package_dependency() {
    local package="$1"
    local display_name="${2:-$package}"
    local required="${3:-false}"
    local package_json="${PROJECT_PATH}/package.json"

    if [[ ! -f "$package_json" ]]; then
        print_fail "package.json not found - cannot check dependencies"
        return 1
    fi

    # Check in dependencies and devDependencies
    if grep -q "\"$package\"" "$package_json" 2>/dev/null; then
        print_pass "$display_name is present"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            print_fail "$display_name is missing (expected in package.json)"
            print_remediation "Install with: bun add $package"
        else
            print_warn "$display_name is not present"
            print_remediation "Install with: bun add $package"
        fi
        return 1
    fi
}

check_stack_presence() {
    print_section "Project Stack Validation"

    local package_json="${PROJECT_PATH}/package.json"

    if [[ ! -f "$package_json" ]]; then
        print_fail "package.json not found - cannot validate stack"
        return
    fi

    # ElysiaJS
    check_package_dependency "elysia" "ElysiaJS" "false" || true

    # Drizzle ORM
    check_package_dependency "drizzle-orm" "Drizzle ORM" "false" || true

    # tRPC (check for core package)
    if grep -qE "\"@trpc/(server|client|react-query)\"" "$package_json" 2>/dev/null; then
        print_pass "tRPC is present"
    else
        print_warn "tRPC is not present"
        print_remediation "Install with: bun add @trpc/server @trpc/client"
    fi

    # Zod
    check_package_dependency "zod" "Zod" "false" || true

    # Neon (check for driver and env vars)
    if grep -qE "\"@neondatabase/serverless\"|\"pg\"|\"postgres\"" "$package_json" 2>/dev/null; then
        print_pass "Neon/PostgreSQL driver is present"
    else
        print_warn "No PostgreSQL driver found"
        print_remediation "Install with: bun add @neondatabase/serverless"
    fi

    # Check Neon env vars (presence only, no secret output)
    if [[ -f "${PROJECT_PATH}/.env" ]] || [[ -f "${PROJECT_PATH}/.env.local" ]]; then
        local env_file
        if [[ -f "${PROJECT_PATH}/.env.local" ]]; then
            env_file="${PROJECT_PATH}/.env.local"
        else
            env_file="${PROJECT_PATH}/.env"
        fi

        if grep -qE "^DATABASE_URL=|^NEON_|^POSTGRES_" "$env_file" 2>/dev/null; then
            print_pass "Database connection env vars configured"
        else
            print_warn "No database connection env vars found"
            print_remediation "Add DATABASE_URL or NEON_* vars to .env"
        fi
    fi

    # TanStack (check for any TanStack package)
    if grep -qE "\"@tanstack/(router|query|start|table|form|virtual)\"" "$package_json" 2>/dev/null; then
        print_pass "TanStack is present"

        # Detail which TanStack packages
        local tanstack_packages=""
        grep -oE "\"@tanstack/[^\"]+\"" "$package_json" 2>/dev/null | tr -d '"' | while read -r pkg; do
            print_info "  Found: $pkg"
        done
    else
        print_warn "TanStack is not present"
        print_remediation "Install with: bun add @tanstack/react-query"
    fi
}

# ==============================================================================
# Config File Checks
# ==============================================================================

check_config_files() {
    print_section "Configuration Files"

    # package.json
    if [[ -f "${PROJECT_PATH}/package.json" ]]; then
        print_pass "package.json exists"
    else
        print_fail "package.json is missing"
        print_remediation "Run: bun init"
    fi

    # bun.lockb
    if [[ -f "${PROJECT_PATH}/bun.lockb" ]]; then
        print_pass "bun.lockb exists"
    elif [[ -f "${PROJECT_PATH}/bun.lock" ]]; then
        print_pass "bun.lock exists"
    else
        print_warn "No bun lockfile found"
        print_remediation "Run: bun install"
    fi

    # wrangler config
    if [[ -f "${PROJECT_PATH}/wrangler.toml" ]]; then
        print_pass "wrangler.toml exists"
    elif [[ -f "${PROJECT_PATH}/wrangler.jsonc" ]]; then
        print_pass "wrangler.jsonc exists"
    elif [[ -f "${PROJECT_PATH}/wrangler.json" ]]; then
        print_pass "wrangler.json exists"
    else
        print_info "No wrangler config (not required for all projects)"
    fi

    # Drizzle config
    if [[ -f "${PROJECT_PATH}/drizzle.config.ts" ]]; then
        print_pass "drizzle.config.ts exists"
    elif [[ -f "${PROJECT_PATH}/drizzle.config.js" ]]; then
        print_pass "drizzle.config.js exists"
    elif [[ -f "${PROJECT_PATH}/drizzle.config.json" ]]; then
        print_pass "drizzle.config.json exists"
    else
        print_info "No Drizzle config found (not required if not using Drizzle)"
    fi

    # Environment files (presence only)
    local env_found=false
    if [[ -f "${PROJECT_PATH}/.env" ]]; then
        print_pass ".env exists"
        env_found=true
    fi
    if [[ -f "${PROJECT_PATH}/.env.local" ]]; then
        print_pass ".env.local exists"
        env_found=true
    fi
    if [[ "$env_found" == "false" ]]; then
        print_warn "No .env or .env.local found"
        print_remediation "Create .env.local for local environment configuration"
    fi

    # Check .env is in .gitignore
    if [[ -f "${PROJECT_PATH}/.gitignore" ]]; then
        if grep -qE "^\.env$|^\.env\.local$" "${PROJECT_PATH}/.gitignore" 2>/dev/null; then
            print_pass ".env files are in .gitignore"
        else
            print_warn ".env files may not be in .gitignore"
            print_remediation "Add .env and .env.local to .gitignore"
        fi
    fi
}

# ==============================================================================
# Command Checks
# ==============================================================================

check_validate_command() {
    print_section "Validation Command Check"

    local package_json="${PROJECT_PATH}/package.json"

    if [[ ! -f "$package_json" ]]; then
        print_info "package.json not found - skipping script check"
        return
    fi

    # Check if validate script exists
    if grep -q '"validate"' "$package_json" 2>/dev/null; then
        print_pass "validate script defined in package.json"

        # Extract and show the validate command
        local validate_cmd
        validate_cmd=$(grep -o '"validate"[[:space:]]*:[[:space:]]*"[^"]*"' "$package_json" 2>/dev/null | sed 's/.*: *"//' | sed 's/"$//' || echo "")
        if [[ -n "$validate_cmd" ]]; then
            print_info "Command: $validate_cmd"
        fi

        # Run the validate command
        echo ""
        print_info "Running: bun run validate"
        echo ""

        pushd "$PROJECT_PATH" > /dev/null
        if bun run validate 2>&1; then
            print_pass "bun run validate completed successfully"
        else
            print_fail "bun run validate failed"
        fi
        popd > /dev/null
    else
        print_info "No validate script defined in package.json"
        print_remediation "Add a validate script for CI/local checks"
    fi
}

# ==============================================================================
# Summary
# ==============================================================================

print_summary() {
    print_header "SUMMARY"

    local total=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

    echo -e "  ${GREEN}PASS:${NC} ${PASS_COUNT}"
    echo -e "  ${RED}FAIL:${NC} ${FAIL_COUNT}"
    echo -e "  ${YELLOW}WARN:${NC} ${WARN_COUNT}"
    echo ""
    echo -e "  Total checks: ${total}"
    echo ""

    if [[ "$FAIL_COUNT" -gt 0 ]]; then
        echo -e "  ${RED}${BOLD}Status: FAILED${NC}"
        echo ""
        echo -e "  ${YELLOW}Review the FAIL items above and apply remediation steps.${NC}"
        return 2
    elif [[ "$WARN_COUNT" -gt 0 ]]; then
        echo -e "  ${YELLOW}${BOLD}Status: PASSED WITH WARNINGS${NC}"
        echo ""
        echo -e "  ${YELLOW}Review the WARN items above for potential improvements.${NC}"
        return 0
    else
        echo -e "  ${GREEN}${BOLD}Status: PASSED${NC}"
        echo ""
        echo -e "  ${GREEN}All checks passed. Environment is ready.${NC}"
        return 0
    fi
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    # Resolve project path
    PROJECT_PATH=$(cd "$PROJECT_PATH" 2>/dev/null && pwd || echo "$PROJECT_PATH")

    print_header "RUBOT ENVIRONMENT CHECKER v${SCRIPT_VERSION}"

    print_info "Project: ${PROJECT_PATH}"
    print_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"

    # Run all checks
    check_tools
    check_versions
    check_wrangler_readiness
    check_config_files
    check_stack_presence
    check_validate_command

    # Print summary and exit with appropriate code
    print_summary
    exit_code=$?

    echo ""
    exit $exit_code
}

# Run main function
main "$@"
