---
name: rubot-skills-security-check
description: Run ClawSec security advisory scan, skill integrity verification, and guarded install checks. Use when checking for malicious skills, verifying skill integrity, reviewing security advisories, or before installing new skills.
argument-hint: [skill-name-to-check]
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - AskUserQuestion
---

You are in the SECURITY CHECK PHASE of the rubot orchestration workflow.
This workflow uses **ClawSec Suite** for advisory monitoring, cryptographic signature verification, and approval-gated malicious-skill response.

## Prerequisites

### 1. Check ClawSec Suite Installation

Before anything else, verify that ClawSec Suite is installed:

```bash
ls -d ~/.claude/skills/clawsec-suite/ 2>/dev/null && echo "INSTALLED" || echo "NOT_INSTALLED"
```

**If ClawSec Suite is NOT installed**, install it automatically:

```bash
npx skills add prompt-security/clawsec@clawsec-suite -g -y
```

After installation, verify:

```bash
ls ~/.claude/skills/clawsec-suite/SKILL.md 2>/dev/null && echo "VERIFIED"
```

If installation fails, inform the user and ask them to install manually:
```
npx skills add prompt-security/clawsec@clawsec-suite -g -y
```

### 2. Check Required System Dependencies

ClawSec requires these binaries:

```bash
for cmd in curl jq shasum openssl; do
  command -v $cmd >/dev/null 2>&1 && echo "$cmd: OK" || echo "$cmd: MISSING"
done
```

If any are missing, warn the user before proceeding.

## Execution Modes

Parse `$ARGUMENTS` to determine the mode:

- **No arguments** → Full advisory scan (default)
- **Skill name provided** → Guarded install check for that specific skill

---

## Mode 1: Full Advisory Scan (Default)

### Step 1: Fetch and Verify Advisory Feed

Run the embedded advisory feed check:

```bash
SUITE_DIR="$HOME/.claude/skills/clawsec-suite"
FEED_URL="${CLAWSEC_FEED_URL:-https://clawsec.prompt.security/advisories/feed.json}"
STATE_FILE="${CLAWSEC_SUITE_STATE_FILE:-$HOME/.openclaw/clawsec-suite-feed-state.json}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Fetch remote feed
if ! curl -fsSLo "$TMP/feed.json" "$FEED_URL" 2>/dev/null; then
  echo "WARN: Remote feed unavailable, falling back to local seed"
  cp "$SUITE_DIR/advisories/feed.json" "$TMP/feed.json"
fi

# Validate feed structure
if ! jq -e '.version and (.advisories | type == "array")' "$TMP/feed.json" >/dev/null 2>&1; then
  echo "ERROR: Invalid advisory feed format"
  exit 1
fi

# Initialize state file if missing
mkdir -p "$(dirname "$STATE_FILE")"
if [ ! -f "$STATE_FILE" ]; then
  echo '{"schema_version":"1.0","known_advisories":[],"last_feed_check":null,"last_feed_updated":null}' > "$STATE_FILE"
  chmod 600 "$STATE_FILE"
fi

# Check for new advisories
jq -r --argfile state "$STATE_FILE" '($state.known_advisories // []) as $known | [.advisories[]?.id | select(. != null and ($known | index(.) | not))] | .[]?' "$TMP/feed.json" > "$TMP/new_ids.txt"

if [ -s "$TMP/new_ids.txt" ]; then
  echo "NEW ADVISORIES DETECTED:"
  while IFS= read -r id; do
    [ -z "$id" ] && continue
    jq -r --arg id "$id" '.advisories[] | select(.id == $id) | "- [\(.severity | ascii_upcase)] \(.id): \(.title)"' "$TMP/feed.json"
    jq -r --arg id "$id" '.advisories[] | select(.id == $id) | "  Exploitability: \(.exploitability_score // "unknown" | ascii_upcase)"' "$TMP/feed.json"
  done < "$TMP/new_ids.txt"
else
  echo "FEED_OK - no new advisories"
fi
```

### Step 2: Cross-Reference Against Installed Skills

Check if any advisories affect locally installed skills:

```bash
SUITE_DIR="$HOME/.claude/skills/clawsec-suite"
FEED_URL="${CLAWSEC_FEED_URL:-https://clawsec.prompt.security/advisories/feed.json}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Get feed (remote or local fallback)
curl -fsSLo "$TMP/feed.json" "$FEED_URL" 2>/dev/null || cp "$SUITE_DIR/advisories/feed.json" "$TMP/feed.json"

# List installed skills
ls -1 ~/.claude/skills/ 2>/dev/null > "$TMP/installed.txt"

# Cross-reference
AFFECTED=0
while IFS= read -r skill; do
  [ -z "$skill" ] && continue
  MATCHES=$(jq -r --arg s "$skill" '[.advisories[] | select(.affected[]? | ascii_downcase == ($s | ascii_downcase))] | length' "$TMP/feed.json" 2>/dev/null)
  if [ "$MATCHES" -gt 0 ]; then
    AFFECTED=$((AFFECTED + MATCHES))
    echo "ALERT: Skill '$skill' has $MATCHES matching advisory/advisories"
    jq -r --arg s "$skill" '.advisories[] | select(.affected[]? | ascii_downcase == ($s | ascii_downcase)) | "  - [\(.severity | ascii_upcase)] \(.id): \(.title) (Exploitability: \(.exploitability_score // "unknown" | ascii_upcase))"' "$TMP/feed.json"
  fi
done < "$TMP/installed.txt"

if [ "$AFFECTED" -eq 0 ]; then
  echo "SECURITY_OK - no installed skills affected by known advisories"
fi
```

### Step 3: Display Security Summary

Present a formatted security report:

```
╔══════════════════════════════════════════════════════════════╗
║                    SECURITY CHECK REPORT                    ║
╚══════════════════════════════════════════════════════════════╝

Feed Status:        [OK / WARN / ERROR]
New Advisories:     [count]
Affected Skills:    [count]
Last Check:         [timestamp]

ADVISORY DETAILS (if any)
────────────────────────────────────────────────────────────────
[List of advisories with severity, exploitability, and affected skills]

RECOMMENDATIONS
────────────────────────────────────────────────────────────────
[Recommendations based on findings]
```

### Step 4: Handle Affected Skills

If any installed skills are flagged by advisories, use AskUserQuestion:

```
AskUserQuestion({
  questions: [{
    question: "Security advisories affect [count] installed skill(s). How would you like to proceed?",
    header: "Security Alert",
    options: [
      {
        label: "Review details",
        description: "Show full advisory details for each affected skill"
      },
      {
        label: "Remove affected skills",
        description: "Remove flagged skills after confirmation (requires second approval)"
      },
      {
        label: "Suppress advisories",
        description: "Mark these advisories as reviewed and accepted (add to allowlist)"
      },
      {
        label: "Skip for now",
        description: "Acknowledge and continue without action"
      }
    ],
    multiSelect: false
  }]
})
```

**Removal follows the approval-gated contract:**
1. First confirmation: user selects "Remove affected skills"
2. Show full advisory details for each skill
3. Second confirmation: explicit approval before each deletion

---

## Mode 2: Guarded Install Check

When a skill name is provided as argument, run the guarded install check before installing:

### Step 1: Run Guarded Install

```bash
SUITE_DIR="$HOME/.claude/skills/clawsec-suite"
node "$SUITE_DIR/scripts/guarded_skill_install.mjs" --skill $ARGUMENTS
```

### Step 2: Handle Results

- **Exit code 0** (no advisory match): Inform user the skill is safe to install
- **Exit code 42** (advisory match found): Display advisory details and ask for explicit second confirmation:

```
AskUserQuestion({
  questions: [{
    question: "A security advisory matches this skill. Do you want to proceed with installation?",
    header: "Security Warning",
    options: [
      {
        label: "Yes, install anyway",
        description: "Proceed with installation after reviewing the advisory (second confirmation)"
      },
      {
        label: "No, cancel installation",
        description: "Do not install this skill"
      }
    ],
    multiSelect: false
  }]
})
```

If user confirms, run with `--confirm-advisory`:

```bash
node "$SUITE_DIR/scripts/guarded_skill_install.mjs" --skill $ARGUMENTS --confirm-advisory
```

---

## Discover Available Security Skills

To see what other ClawSec protections are available:

```bash
SUITE_DIR="$HOME/.claude/skills/clawsec-suite"
node "$SUITE_DIR/scripts/discover_skill_catalog.mjs" 2>/dev/null
```

If user wants to install additional protections, use the guarded install flow for each.

## Important Rules

- NEVER skip advisory checks — they are security-critical
- NEVER auto-remove skills without explicit double confirmation
- ALWAYS verify feed signatures when available
- Prioritize advisories by exploitability + severity combined
- A HIGH severity + HIGH exploitability advisory is more urgent than CRITICAL + LOW exploitability
- If clawsec-suite is not installed, install it before proceeding
- Keep advisory state file updated after each check
