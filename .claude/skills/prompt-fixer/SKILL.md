---
name: prompt-fixer
version: 3.6.0
description: |
  Rewrites vague prompts into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs with ID, AGENT, USE, ISSUES, FILE RELATED, SOLUTION / PARALLEL EXECUTION PLAN / VERIFICATION / EXECUTION) that is **OWASP ASVS 5.0.0 compliant** and **mobile-first responsive by default**. Runs parallel Explore agents, discovers connected MCPs, installed skills, and available subagents, **matches each discovered skill and MCP to specific task signals**, embeds explicit `Use skills: …` and `Use MCP: …` directives in CONTEXT, and adds a per-task `USE:` field telling the agent exactly which skills/MCPs to load for that task (e.g. "Use Cloudflare skills and MCP"). Analyzes tasks for parallel agent execution, enforces engineering rules from rule banks (Universal + Frontend/Responsive + Backend + Security with V1-V17 chapter mappings), then asks the user to choose between task-list execution (TaskCreate + TodoWrite, parallel where possible), plan mode (EnterPlanMode), or cancel. Output is a single copy-ready prompt — no preamble, no commentary. The `rubot-fix-prompt` command halts if the OWASP ASVS 5.0.0 skill suite is not installed.
  MUST activate for: "fix my prompt", "improve this prompt", "rewrite this prompt", "make this prompt better", "this prompt is too vague", "help me write a better prompt", "prompt engineering", "how should I ask Claude to", "rephrase this for Claude", or when the user provides a clearly vague instruction and asks for help making it more specific.
  Also activate when: "Claude keeps doing the wrong thing", "Claude doesn't understand what I want", "how do I get better results", "why does Claude keep failing", or the user references the `/rubot-fix-prompt` command.
  Do NOT activate for: actually executing the rewritten prompt, general coding tasks, SEO audits, design audits, security audits, environment checks, or any task where the user wants implementation rather than prompt improvement.
  Covers: prompt rewriting, prompt engineering, vague-to-specific transformation, strict task-based output format, mandatory RULES enforcement, OWASP ASVS 5.0.0 V1-V17 chapter rule mapping, mobile-first responsive enforcement, per-task AGENT assignment, parallel agent execution analysis, dependency-aware grouping, verification injection, file path scoping, phased execution, codebase-aware enrichment, skill recommendation, MCP recommendation, subagent recommendation, user-chosen execution (task list / plan mode / cancel), TodoWrite + TaskCreate orchestration with parallel fan-out.
agents:
  - debug-master
  - owasp-asvs-audit
  - responsive-master
---

# Prompt Fixer Skill

Rewrite vague prompts into a strict, technical, todo-based instruction with mandatory engineering rules. Grounded in parallel codebase research. Single copy-ready output. No commentary.

## Goal

Produce a prompt that:
1. Names the problem in one sentence.
2. Lists measurable goals.
3. Surfaces installed skills, connected MCPs, and available subagents — **matches each one to the prompt's task signals** and explicitly tells the executing agent to USE them (e.g. "Use Cloudflare skills and MCP", "Use PostHog MCP via `query-run`").
4. Enforces engineering rules from rule banks — **OWASP ASVS 5.0.0 (V1-V17) for any security-touching task; mobile-first responsive for any UI-touching task**.
5. Decomposes work into numbered TASKs with stable IDs.
6. Pins each task to real files and concrete solutions.
7. Assigns an AGENT per task, lists the skills + MCPs to invoke via the per-task `USE:` field, and analyzes which tasks can execute in parallel vs. sequentially.
8. Includes runnable verification.
9. Defers execution to the user via a 3-option `AskUserQuestion`: task-list execution (parallel where possible, sequential where dependent), plan mode, or cancel.

## Prerequisites

The `rubot-fix-prompt` command **halts before Step 1** if the OWASP ASVS 5.0.0 skill suite is not installed. Required skills:

| Skill | Chapter |
|-------|---------|
| `owasp-asvs-audit` | Master orchestrator |
| `owasp-encoding-sanitization` | V1 — Encoding & Sanitization |
| `owasp-validation-logic` | V2 — Validation Logic |
| `owasp-web-frontend-security` | V3 — Web Frontend Security |
| `owasp-api-security` | V4 — API & Web Service Security |
| `owasp-file-handling` | V5 — File Handling |
| `owasp-authentication` | V6 — Authentication |
| `owasp-session-management` | V7 — Session Management |
| `owasp-authorization` | V8 — Authorization |
| `owasp-self-contained-tokens` | V9 — Self-Contained Tokens |
| `owasp-oauth-oidc` | V10 — OAuth & OIDC |
| `owasp-cryptography` | V11 — Cryptography |
| `owasp-secure-communication` | V12 — Secure Communication |
| `owasp-configuration-security` | V13 — Configuration Security |
| `owasp-data-protection` | V14 — Data Protection |
| `owasp-secure-coding` | V15 — Secure Coding & Architecture |
| `owasp-security-logging` | V16 — Security Logging & Error Handling |
| `owasp-webrtc-security` | V17 — WebRTC Security |

Recommended (non-blocking) for UI tasks: `responsive-design`, `wcag-fix`, `design-tokens`, `component-consistency`.

Install missing skills with:

```bash
npx @bahrulbangsawan/rubot add owasp-asvs-audit owasp-encoding-sanitization owasp-validation-logic owasp-web-frontend-security owasp-api-security owasp-file-handling owasp-authentication owasp-session-management owasp-authorization owasp-self-contained-tokens owasp-oauth-oidc owasp-cryptography owasp-secure-communication owasp-configuration-security owasp-data-protection owasp-secure-coding owasp-security-logging owasp-webrtc-security responsive-design
```

## Tool Strategy

### Discovery (run BEFORE rewriting, in parallel)

| Tool | Purpose |
|------|---------|
| `Agent` (`Explore`) | Codebase map: framework, paths, reference files |
| `Agent` (`Explore`) | Find similar existing implementation |
| `ListMcpResourcesTool` | **Connected MCPs (match each to prompt task signals)** — figma, shadcn, notion, drive, sandbox, cloudflare-docs, cloudflare-bindings, posthog, Neon, etc. |
| `Bash` | List skills in `plugins/rubot/skills/`, `.claude/skills/`, `~/.claude/skills/` — **match each to prompt task signals via Pattern 8** |
| `Bash` | List available subagents in `plugins/rubot/agents/`, `.claude/agents/`, `~/.claude/agents/` (for per-task `AGENT:` assignment) |
| `Read` | `package.json` / `wrangler.toml` / `pyproject.toml` |
| `WebFetch` | Doc/design URL only if user provided one |
| `TeamCreate` | Optional fan-out, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

**Skill/MCP relevance matching is mandatory.** After listing all installed skills and connected MCPs, for each one ask: *"does this skill/MCP help the executing agent perform any task in this rewrite?"* If yes, list it in `CONTEXT.Use skills:` / `CONTEXT.Use MCP:` with a one-line purpose, AND attach it to every matching task's `USE:` field. The output prompt must read like a directive: "Use Cloudflare skills and MCP", not a passive note.

### Decision (run AFTER displaying the rewritten prompt)

| Tool | Purpose |
|------|---------|
| `AskUserQuestion` | Single 3-option prompt: task-list execution / plan mode / cancel |

### Execution path A — task-list execution (with parallel fan-out)

| Tool | Purpose |
|------|---------|
| `TodoWrite` | One pending todo per `TASK-NNN` for visible progress; include `[GROUP N · AGENT: <name>]` prefix per todo so the parallel plan is visible |
| `TaskCreate` | Spawn one subagent per TASK-NNN with the full task body + RULES; **fan out parallel groups in a single message with multiple `TaskCreate` calls** |
| `TaskList` | Poll the queue when checking status |
| `TaskGet` | Inspect a specific task's output or final state |
| `TaskUpdate` | Adjust task scope or instructions mid-flight (rare) |
| `TaskStop` | Halt the active task on user interrupt |

### Execution path B — plan mode

| Tool | Purpose |
|------|---------|
| `EnterPlanMode` | Hand the rewritten prompt to plan mode and wait for approval |

Rules:
- Never invent file paths. Discovery is the only source.
- Never recommend skills that aren't installed.
- Never recommend MCPs that aren't connected.
- Never recommend subagents that aren't installed (verify against the discovery list).
- Never auto-enter plan mode and never auto-create tasks. The 3-option `AskUserQuestion` is mandatory.
- The `PARALLEL EXECUTION PLAN` block is mandatory. When a single task exists, list it as `Group 1 (sequential): TASK-001`. When multiple tasks exist, analyze dependencies and group them.

## Strict Output Format

Output ONLY this template inside a fenced code block. No preamble. No commentary.

```
MAIN PROBLEM: <one-sentence problem statement>

GOALS:
- <measurable outcome>
- <measurable outcome>
- <measurable outcome>

CONTEXT:
- Framework: <detected framework + version>
- Use skills: `<skill1>` (purpose), `<skill2>` (purpose) — agent MUST load these before executing matched tasks.
- Use MCP: `<mcp>` via `<tool>` for <purpose> — agent MUST call this MCP tool for matched tasks.
- Available subagents: `<agent1>`, `<agent2>` (only those discovered)
- Reference: `<path>` (existing pattern to follow)

RULES:
- <universal rule>
- <universal rule>
- <domain rule, if applicable>
- <domain rule, if applicable>

1. <Imperative Title>
-> TASK ID: TASK-001
-> AGENT: <agent-name from discovery, e.g. general-purpose, Explore, frontend-master>
-> USE: skill `<skill-name>` (purpose), MCP `<mcp-name>` via `<tool>` (purpose) — agent must invoke these before SOLUTION steps.
-> ISSUES: <specific symptom, current state, line numbers if known>
-> FILE RELATED: `<path>:<line-range>` or "new file: <path>"
-> SOLUTION: <technical, step-by-step; max 3 steps; reference the USE skills/MCPs by name>

2. <Imperative Title>
-> TASK ID: TASK-002
-> AGENT: <agent-name>
-> USE: <skills + MCPs matched to this task, or "none" if discovery found no relevant match>
-> ISSUES: <...>
-> FILE RELATED: <...>
-> SOLUTION: <...>

PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002 — independent file scopes, no shared state
- Group 2 (sequential after Group 1): TASK-003 — depends on TASK-001 schema change
- Group 3 (parallel after Group 2): TASK-004, TASK-005 — independent once schema is in place

VERIFICATION:
- <test command / build check / screenshot diff / a11y scan>
- <metric or condition that confirms done>

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

After displaying the block, immediately call `AskUserQuestion` with the 3-option decision prompt (see "Decision Prompt" section).

### Format Rules (non-negotiable)

| Field | Rule |
|-------|------|
| `MAIN PROBLEM` | One sentence. Present tense. Names the gap. |
| `GOALS` | Bulleted. Measurable outcomes only. No "make it nicer." |
| `CONTEXT.Use skills` | **Imperative phrasing.** Format: `` `skill-name` (one-line purpose) ``. List only skills surfaced by discovery that match a task signal. Each skill must also appear in at least one task's `USE:` field. Omit the line if no skill matches. |
| `CONTEXT.Use MCP` | **Imperative phrasing.** Format: `` `mcp-name` via `tool-name` for <purpose> ``. List only MCPs surfaced by `ListMcpResourcesTool` that match a task signal. Each MCP must also appear in at least one task's `USE:` field. Omit the line if no MCP matches. |
| `CONTEXT` | Omit empty lines. Drop block if all empty. `Available subagents` line lists ONLY agents discovered in `plugins/rubot/agents/`, `.claude/agents/`, or `~/.claude/agents/` (plus the always-available `general-purpose`, `Explore`, `Plan`). |
| `RULES` | **Mandatory.** Never omitted, never empty. Universal bank always included. Domain banks added by task signal. Minimum 4 rules. |
| Task numbering | Sequential from 1. |
| `TASK ID` | `TASK-NNN` zero-padded. Stable across edits. |
| `AGENT` | **Mandatory per task.** Single agent name from discovery. Default to `general-purpose` if no specialist matches. Use `Explore` for read-only analysis tasks. |
| `USE` | **Mandatory per task.** Lists every skill + MCP from `CONTEXT` whose purpose matches this task. Format: `skill \`name\` (purpose), MCP \`mcp\` via \`tool\` (purpose)`. Write `"none"` only when discovery surfaced no relevant skill or MCP for this task. The agent loads these BEFORE running SOLUTION steps. |
| Title | Imperative form ("Replace arbitrary values", not "Arbitrary values fix"). |
| `ISSUES` | Specific. Cite line numbers, current state, error text. |
| `FILE RELATED` | Real path. Line range when narrowable. `"new file: <path>"` when creating. |
| `SOLUTION` | Imperative. ≤3 steps. No prose paragraphs. When `USE` lists a skill/MCP, reference it by name in at least one SOLUTION step (e.g. "Activate `design-tokens` skill, then …", "Query `cloudflare-docs` MCP for the binding pattern, then …"). |
| `PARALLEL EXECUTION PLAN` | **Mandatory.** Groups every TASK-NNN exactly once. Each group is either `(parallel)` (independent) or `(sequential after Group N)` (dependent). Single-task plans: one group, marked `(sequential)`. |
| `VERIFICATION` | At least one runnable check. |
| `EXECUTION` | Always the deferred line: `EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).` |
| Decision prompt | Mandatory `AskUserQuestion` call after the code block (see "Decision Prompt"). |

### Forbidden in Output

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Empty or missing `RULES` block
- Empty or missing `PARALLEL EXECUTION PLAN` block
- Missing `AGENT:` line on any task
- **Missing `USE:` line on any task** — every task declares `USE:` (skills + MCPs, or `"none"` if discovery surfaced no relevant match).
- **A skill listed in `CONTEXT.Use skills` but not referenced by any task's `USE:` field** — every CONTEXT-listed skill must be tied to ≥1 task.
- **An MCP listed in `CONTEXT.Use MCP` but not referenced by any task's `USE:` field** — every CONTEXT-listed MCP must be tied to ≥1 task.
- **Passive phrasing of skill/MCP usage** — `CONTEXT` and `USE` lines must read like directives: "Use Cloudflare skills and MCP", not "Cloudflare skills may be helpful".
- A `USE:` field that lists a skill or MCP NOT present in the discovery output (Pattern 8 / Pattern 9 sources). No inventions.
- **Missing responsive rules when ANY task touches UI/component/page/style** — mobile-first, relative units, touch targets, and no-horizontal-scroll are non-negotiable for UI work.
- **Missing OWASP ASVS 5.0.0 chapter rules when ANY task touches a V1-V17 domain** — every Security rule must carry its `[Vn]` chapter prefix so reviewers can audit coverage.
- Generic Security rules without an ASVS chapter mapping (e.g. "use crypto" without `[V11]`).
- Any preamble, commentary, or explanation outside the template
- A custom `EXECUTION` line that auto-selects plan mode or task execution — the choice is always the user's via the decision prompt
- A `reply 'go' to execute.` closing line (replaced by the `AskUserQuestion` decision prompt)

## Decision Prompt (mandatory)

After emitting the rewritten prompt code block, call `AskUserQuestion` exactly once with these three options:

```
AskUserQuestion:
  question: "How do you want to proceed?"
  header: "Prompt Ready"
  options:
    - label: "Create tasks list and execute"
      description: "Convert TASK-NNN entries into TaskCreate/TodoWrite items and run them in order"
    - label: "Create plan using EnterPlanMode"
      description: "Enter plan mode, present the plan, and wait for approval before any code change"
    - label: "Cancel"
      description: "Stop here — keep the rewritten prompt only"
  multiSelect: false
```

### Branch — "Create tasks list and execute"

1. Call `TodoWrite` once with one `pending` todo per TASK-NNN.
   - `content` = `[GROUP N · AGENT: <agent>] <imperative title>` (e.g. `[GROUP 1 · AGENT: frontend-master] Replace arbitrary Tailwind values with tokens`).
   - `activeForm` = present-progressive form (e.g. `Replacing arbitrary Tailwind values with tokens`).
   - The group prefix makes the parallel plan visible to the user during execution.
2. Walk the `PARALLEL EXECUTION PLAN` group-by-group, in order:
   - For a `(parallel)` group: send **one message containing multiple `TaskCreate` calls** — one per TASK-NNN in the group, each using the per-task `AGENT` value as `subagent_type`. Wait for the entire group to finish before starting the next group.
   - For a `(sequential)` group or `(sequential after Group N)` group: send `TaskCreate` calls one at a time, each with its per-task `AGENT` value.
   - Each `TaskCreate` prompt = full task body (TASK ID + AGENT + ISSUES + FILE RELATED + SOLUTION) + the global RULES block.
3. Track progress:
   - Mark each TodoWrite item `in_progress` immediately before its `TaskCreate` fires and `completed` immediately after the agent reports success.
   - For parallel groups, multiple items may be `in_progress` at once — that is the point.
   - Use `TaskList` for queue overview, `TaskGet` for a specific task's output, `TaskUpdate` to adjust scope mid-flight.
4. On user interrupt or scope change, call `TaskStop` to halt the active task(s).
5. After the final group succeeds, run the `VERIFICATION` checks and report results.

### Branch — "Create plan using EnterPlanMode"

- Call `EnterPlanMode` and feed the rewritten prompt as plan input.
- The plan presented to the user MUST surface the `PARALLEL EXECUTION PLAN` block so they can see which tasks fan out and which run sequentially before approving.
- Wait for explicit plan approval before any code change.

### Branch — "Cancel"

- Stop. Do not call `TodoWrite`, `TaskCreate`, or `EnterPlanMode`.
- Leave the rewritten prompt visible so the user can copy it.

## Rule Banks

`RULES` is mandatory in every output. Assemble from these banks:

### Universal (always include)

- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass after every change.
- **DON'T USE ANY GIT STASH COMMANDS** (`git stash`, `git stash push`, `git stash pop`, `git stash apply`, `git stash drop`, `git stash clear`). Stashed work is invisible, easy to lose, and conflates unrelated changes. If you need to set work aside, commit it to a scratch branch instead.

### Frontend & Responsive (add when task signal: UI / component / page / style / responsive / a11y) — MANDATORY for any UI task

- Follow the existing design system: tokens from `index.css` (colors, spacing, radius, typography). No arbitrary Tailwind values (`p-[13px]`, `text-[15px]`, `bg-[#aaa]`).
- **Mobile-first responsive (non-negotiable)**: design xs (375px) up; layer breakpoints sm (640px), md (768px), lg (1024px), xl (1280px). Never desktop-down.
- **Relative units only**: `rem`/`em` for spacing, typography, and radius; `vh`/`dvh`/`%`/`fr` for layout. Forbidden: `w-[400px]`, `text-[18px]`, `p-[20px]`, `gap-[15px]`, `rounded-[12px]`.
- **No horizontal scroll on mobile**: parents constrain children; only intentional carousels use `overflow-x-auto`.
- **Touch targets ≥2.75rem (44px)** for buttons, links, and form controls — verify with axe-core target-size rule.
- **Mobile navigation uses `Sheet` (drawer/hamburger)** — never collapse desktop `NavigationMenu` into an unusable half-state.
- **Use `min-h-dvh`, not `h-screen`**, for full-viewport sections to avoid mobile Safari address-bar jumps.
- **WCAG 2.2 AA**: ARIA on interactive elements, keyboard navigation, visible focus ring, contrast ≥4.5:1 (≥3:1 for large text).
- **UX visibility**: render loading, error, empty, and success states explicitly — no silent failures.
- Reuse `shadcn/ui` primitives before building custom components.

### Backend (add when task signal: API / route / server / database)

- Validate all input at the boundary with Zod (or framework equivalent) — fail closed on unexpected input.
- Parameterized queries / ORM bindings — never string-concatenated SQL.
- Authenticate every endpoint by default; opt-out per route is explicit.
- Authorize server-side; never trust client-supplied role claims.
- Rate-limit by IP + account; return `429` with `Retry-After`.
- Secure cookies: `HttpOnly`, `Secure`, `SameSite=Lax|Strict`.
- Structured error responses — never leak stack traces or DB errors.

### Security — OWASP ASVS 5.0.0 (mandatory when task signal touches ANY V1-V17 domain)

The OWASP ASVS 5.0.0 control set is the source of truth. Apply rules grouped by chapter; default to Level 2, bump to Level 3 for high-value targets (finance, health, auth services, PII-heavy data stores).

**V1 — Encoding & Sanitization**
- Context-aware output encoding (HTML, attribute, URL, JS, CSS) — never concat user input into sinks.
- Sanitize before storage as defense-in-depth; encode on output is primary.

**V2 — Validation Logic**
- Whitelist validation at every trust boundary; fail closed.
- Validate type, length, range, format, and business rules with Zod (or framework equivalent).

**V3 — Web Frontend Security**
- Strict CSP with nonces or hashes — no `unsafe-inline`, no `unsafe-eval`.
- Anti-clickjacking: `Content-Security-Policy: frame-ancestors 'none'` (or explicit allowlist).
- Trusted Types where supported; sanitize all DOM sinks.

**V4 — API & Web Service Security**
- Authenticate every endpoint by default; rate-limit by IP + account.
- CORS allowlist — never `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`.

**V5 — File Handling**
- Validate filename, MIME, and magic bytes — never trust client-supplied content-type.
- Store uploads outside webroot; generate random server-side filenames.
- Scan critical paths for malware.

**V6 — Authentication**
- Generic error messages — never reveal whether the username exists.
- Account lockout / exponential backoff after repeated failures.
- Support MFA for high-value accounts.

**V7 — Session Management**
- Server-side session storage; cookies are opaque references.
- Regenerate session ID on login and privilege change; expire on logout, inactivity, and absolute timeout.
- `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` for sensitive flows).

**V8 — Authorization**
- Server-side enforcement; deny-by-default — explicit allow per resource/action.
- Check authorization on every request, not just navigation.

**V9 — Self-Contained Tokens (JWT)**
- Sign with strong algorithm (`HS256` minimum, `RS256`/`EdDSA` preferred) — never `alg=none`.
- Validate `iss`, `aud`, `exp`, `nbf` on every verification.
- Short access-token expiry (≤15 min); rotate refresh tokens.

**V10 — OAuth / OIDC**
- PKCE on every public client; reject implicit flow.
- Validate `state` and `nonce`; bind to session.
- Verify `aud` and `iss` from issuer discovery.

**V11 — Cryptography**
- AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption.
- Argon2id (preferred) or bcrypt cost ≥12 for password hashing.
- Constant-time comparison for secrets; platform crypto only (`crypto.subtle`, libsodium).

**V12 — Secure Communication**
- TLS 1.2+ (1.3 preferred); HSTS with `includeSubDomains`.
- Strong cipher suites; reject `RC4`, `3DES`, `MD5`, `SHA-1`.

**V13 — Configuration Security**
- No secrets in code or repo — env vars + secrets manager only.
- Security headers: `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`.
- Disable debug/verbose errors in production.

**V14 — Data Protection**
- Encrypt PII at rest; minimize storage; document retention windows.
- Never log secrets, tokens, or PII — redact at the logger layer.
- Secure deletion (overwrite) for sensitive blobs, not just unlink.

**V15 — Secure Coding & Architecture**
- Avoid memory-unsafe primitives; prefer safe wrappers.
- Strict type checks (`tsc --strict`); deny `any` for security-relevant code.
- Dependency audit (`npm audit`, `pip-audit`, `cargo audit`) in CI.

**V16 — Security Logging & Error Handling**
- Structured logs (JSON) include trace ID, hashed user ID, action.
- Alert on auth failures, authz denials, rate-limit hits.
- Logs are tamper-evident — append-only or HMAC-chained for high-value targets.

**V17 — WebRTC Security**
- DTLS-SRTP encryption for media; reject plain RTP.
- Authenticated STUN/TURN; rotate credentials.
- Origin pinning for signaling channels.

Pick only chapters whose domain the task touches; include at least the chapter's top rule (more if applicable). The chapter label (e.g. `[V6]`) MUST prefix each Security rule emitted into the `RULES` block.

### Selection logic

- Universal → always.
- Frontend & Responsive → triggered by: "UI", "component", "page", "style", "design", "responsive", "mobile", "breakpoint", "Tailwind", "shadcn", "carousel", "card", "form", "modal", "navbar", "footer", "hero", "drawer", "accessibility", "a11y", "WCAG", "ARIA", "keyboard", "touch target", "viewport". **The full responsive ruleset is mandatory whenever this bank applies** — mobile-first, relative units, touch targets, no horizontal scroll.
- Backend → triggered by: "API", "endpoint", "route", "server", "database", "schema", "migration", "query", "model", "ORM", "Drizzle", "Prisma", "Hono", "tRPC".
- Security (OWASP ASVS 5.0.0) → **mandatory** when ANY task signal touches: "auth", "login", "password", "session", "token", "secret", "crypto", "hash", "encrypt", "JWT", "OAuth", "OIDC", "cookies", "CORS", "CSP", "headers", "input", "validation", "sanitization", "XSS", "SQL injection", "file upload", "PII", "logging", "config", "env", "WebRTC". Map each task signal to the matching V1-V17 chapter(s) and emit `[Vn]`-prefixed rules.
- Multiple banks may apply — combine. Deduplicate overlapping rules.

## Transformation Patterns

### Pattern 1 — Verification

Encode "how do we know it's correct?" into the `VERIFICATION` block. Always runnable: test command, build, screenshot diff, axe-core, lighthouse, curl + grep, etc.

### Pattern 2 — Real Paths

Every `FILE RELATED` value must come from discovery. Add line ranges (`src/foo.ts:42-58`) when narrowable.

### Pattern 3 — Reference Pattern

The second Explore agent surfaces a similar implementation. Pin it in `CONTEXT.Reference` so Claude follows the existing convention.

### Pattern 4 — Symptom + Root-Cause Hint

`ISSUES` field: describe symptom + likely cause + observable trigger. Example: `"Login fails after 30min idle. Likely token-refresh race in src/auth/refresh.ts:88. Reproduces with backgrounded tab."`

### Pattern 5 — Phase via TASK Decomposition

Multi-file or architectural work → multiple TASKs. One TASK = one logical change. The numbered list IS the phased plan.

### Pattern 6 — Output Format Templating

When the deliverable is a report/config/structured output, embed the template inside the relevant `SOLUTION` block.

### Pattern 7 — Rich Context

In `ISSUES` or `SOLUTION`, use `@<path>` refs, paste error text, paste expected output. Use `[YOUR: ...]` placeholders for user-supplied context (screenshots, secrets, error logs).

### Pattern 8 — Recommend Installed Skills

Match task signal → skill from discovery list. Add to `CONTEXT.Activate skills`. Common matches:

| Task signal | Skill |
|-------------|-------|
| responsive, mobile-first, breakpoints, touch target, overflow | `responsive-design` |
| cards inconsistent, carousel broken, button drift | `component-consistency` |
| color tokens, `text-[15px]`, arbitrary values, OKLCH | `design-tokens` |
| accessibility, ARIA, keyboard, contrast, focus | `wcag-fix` |
| full security audit, OWASP coverage review | `owasp-asvs-audit` |
| input validation, sanitization, XSS, SQL injection | `owasp-encoding-sanitization`, `owasp-validation-logic` |
| CSP, clickjacking, frontend hardening | `owasp-web-frontend-security` |
| API auth, rate limit, CORS | `owasp-api-security` |
| file upload, content-type validation | `owasp-file-handling` |
| login, MFA, password policy | `owasp-authentication` |
| sessions, cookies, session fixation | `owasp-session-management` |
| RBAC, ACL, authorization checks | `owasp-authorization` |
| JWT, token signing/validation | `owasp-self-contained-tokens` |
| OAuth, OIDC, PKCE, state/nonce | `owasp-oauth-oidc` |
| password hashing, encryption, crypto primitives | `owasp-cryptography` |
| TLS, HSTS, certificate pinning | `owasp-secure-communication` |
| security headers, secrets, env config | `owasp-configuration-security` |
| PII, data protection, retention | `owasp-data-protection` |
| memory safety, dep audit, strict types | `owasp-secure-coding` |
| security logging, monitoring, alerting | `owasp-security-logging` |
| WebRTC, peer-to-peer media security | `owasp-webrtc-security` |
| SEO audit, meta tags | `seo-audit` |
| AI search, citability, GEO, llms.txt | `geo-audit` |
| Cloudflare Workers / DO / Agents SDK / queues | `workers-best-practices`, `durable-objects`, `agents-sdk`, `wrangler` |
| LCP, INP, CLS, "make it faster" | `web-perf`, `performance` |
| Figma-to-code, pixel-perfect | `figma-slicing` |
| `settings.json`, hooks, env, permissions | `update-config` |
| CLAUDE.md audit | `claude-md-improver` |
| Agentation feedback toolbar | `agentation` |

Skip a skill row only if discovery did not surface it. For security-touching tasks, all relevant OWASP V1-V17 skills are **required** discovery hits — if any are missing, the `rubot-fix-prompt` command halts (see Prerequisites).

### Pattern 9 — Recommend Connected MCPs

Match task signal → MCP from `ListMcpResourcesTool` output. Add to `CONTEXT.Use MCP`. Common matches:

| Task signal | MCP + tool |
|-------------|------------|
| Figma node extraction, design handoff | `figma` MCP |
| shadcn component install / lookup | `shadcn` MCP (`get_add_command_for_items`, `view_items_in_registries`, `search_items_in_registries`) |
| Notion / Drive / Gmail / Calendar context | `claude_ai_Notion`, `claude_ai_Google_Drive`, `claude_ai_Gmail`, `claude_ai_Google_Calendar` |
| Sandboxed code execution | `Polar-Sandbox` MCP |

Skip if MCP not connected.

### Pattern 10 — User Chooses Execution

Always emit the deferred `EXECUTION:` line and the 3-option `AskUserQuestion` decision prompt. Do not auto-enter plan mode and do not auto-create tasks.

The user picks:
- **Create tasks list and execute** → `TodoWrite` + per-TASK `TaskCreate`, tracked via `TaskList` / `TaskGet` / `TaskUpdate` / `TaskStop`.
- **Create plan using EnterPlanMode** → `EnterPlanMode` with the rewritten prompt as input.
- **Cancel** → no execution, prompt remains visible to copy.

For trivial single-line changes, the user typically picks "Cancel" and applies the edit themselves — but the choice is theirs, not yours.

### Pattern 11 — Parallel Agent Execution Analysis

Every rewrite analyzes which tasks can run in parallel and which must wait. The output reflects the decision in two places: the per-task `AGENT:` field and the `PARALLEL EXECUTION PLAN` block.

#### Step A — Assign an AGENT per task

Match the task signal to a discovered subagent. Default to `general-purpose` when no specialist matches. Common matches:

| Task signal | AGENT |
|-------------|-------|
| Read-only inspection / "find all X" / "where is Y" | `Explore` |
| UI / component / Tailwind / shadcn / responsive / a11y | `frontend-master` (or `shadcn-ui-designer`, `responsive-master`, `theme-master` — pick the most specific) |
| API / route / server / endpoint | `backend-master` |
| Database / schema / migration / Drizzle | `database-master` |
| Deployment / CI / Cloudflare / wrangler | `deployment-master` |
| Tests / Vitest / Playwright | `testing-master` |
| SEO / meta / structured data | `seo-master` |
| Bug hunt / root cause | `debug-master` |
| Anything else | `general-purpose` |

Only list agents the discovery step actually surfaced. Never invent.

#### Step B — Determine parallel-vs-sequential dependency

Two tasks can run in parallel when ALL of the following hold:
1. They edit disjoint files (no shared file path, no shared symbol).
2. Neither depends on the other's output (e.g. one creates a type that the other imports → sequential).
3. They do not share schema, route, or config state being mutated.

Tasks must run sequentially when:
1. Task B reads or extends Task A's new file/type/schema.
2. Tasks edit overlapping line ranges in the same file.
3. Task B's verification depends on Task A's change being live (e.g. migration first, then query update).

#### Step C — Group and emit `PARALLEL EXECUTION PLAN`

Group all TASK-NNN entries into ordered groups. Each task appears in exactly one group. Format:

```
PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002 — independent file scopes
- Group 2 (sequential after Group 1): TASK-003 — consumes TASK-001 schema
- Group 3 (parallel after Group 2): TASK-004, TASK-005 — independent verification suites
```

Single-task plan:

```
PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001
```

When in doubt about independence, default to sequential — false parallelism causes merge conflicts and broken builds. The reason ("independent file scopes", "consumes TASK-001 schema", "shared route handler") goes inline so reviewers can challenge the grouping.

#### Step D — Honor the plan during execution

When the user picks "Create tasks list and execute":
- Read `PARALLEL EXECUTION PLAN` group-by-group.
- For a parallel group → fan out TaskCreate in a single message with multiple tool calls.
- For a sequential group → fire TaskCreate calls one at a time.
- Never skip a group boundary — if Group 2 says "sequential after Group 1", wait for every Group 1 task to finish first.

When the user picks plan mode, the plan content must surface the parallel grouping so the user can review fan-out before approving.

### Pattern 12 — Per-task `USE:` Directive (skills + MCPs)

Every rewrite must tell the executing agent exactly which skills and MCPs to load for each task. Discovery (Step 2 of the command) lists *all* available skills and MCPs; the rewrite filters to *relevant* ones per task.

#### Step A — Match every discovered skill to task signals

For each installed skill, ask: *"would loading this skill help any task in the rewrite?"* If yes:
1. Add it to `CONTEXT.Use skills:` with a one-line purpose.
2. Add it to the `USE:` field of every task it applies to.

Examples:

| Task | Skills to USE |
|------|---------------|
| "Deploy this Worker to Cloudflare" | `cloudflare` (platform overview), `wrangler` (CLI commands), `workers-best-practices` (review checklist) |
| "Fix mobile layout on /dashboard" | `responsive-design` (breakpoint rules), `design-tokens` (token compliance), `wcag-fix` (touch targets) |
| "Add authentication" | `owasp-authentication` (V6 rules), `owasp-session-management` (V7), `owasp-cryptography` (V11), `responsive-design` (login UI) |
| "Send transactional email" | `cloudflare-email-service` (binding + REST patterns) |
| "Build durable game lobby" | `durable-objects` (DO patterns), `agents-sdk` (if agent-shaped), `cloudflare` |

#### Step B — Match every connected MCP to task signals

For each MCP returned by `ListMcpResourcesTool`, ask: *"can the executing agent invoke an MCP tool to do this task faster or more accurately?"* If yes:
1. Add to `CONTEXT.Use MCP:` as `` `mcp-name` via `tool-name` for <purpose> ``.
2. Add to the `USE:` field of matched tasks.

Examples:

| Task | MCPs to USE |
|------|-------------|
| "Pull Figma frame X into code" | `figma` MCP via node-extraction tool |
| "Install a new shadcn component" | `shadcn` MCP via `get_add_command_for_items`, `view_items_in_registries` |
| "Look up Cloudflare Workers binding syntax" | `cloudflare-docs` MCP via `search_cloudflare_documentation` |
| "Provision a Neon branch + run migration" | `Neon` MCP via `create_branch`, `prepare_database_migration` |
| "Query LLM cost in PostHog" | PostHog MCP via `query-run` |

#### Step C — Write the USE field imperatively

The USE field reads like a directive to the executing agent, not a passive suggestion:

✅ Good:
```
-> USE: skill `cloudflare` (platform patterns), skill `wrangler` (CLI), MCP `cloudflare-docs` via `search_cloudflare_documentation` for binding syntax.
```

❌ Bad (passive, not imperative):
```
-> USE: cloudflare stuff might help.
```

❌ Bad (skill not in discovery list):
```
-> USE: skill `cloudflare-magic` (purpose).   # invented skill, fails Pattern 12
```

#### Step D — Reference USE in SOLUTION steps

When `USE:` lists a skill or MCP, mention it by name in at least one SOLUTION step so the agent knows when to invoke it:

```
-> USE: skill `cloudflare-email-service` (binding patterns), MCP `cloudflare-docs` via `search_cloudflare_documentation`.
-> SOLUTION:
   1. Activate `cloudflare-email-service` skill; follow its Workers binding recipe.
   2. Query `cloudflare-docs` MCP for current `wrangler.jsonc` binding schema.
   3. Add the binding and deploy with `wrangler deploy`.
```

#### Step E — `USE: none` is allowed but must be honest

If discovery surfaced no relevant skill or MCP for a specific task, write `USE: none`. Do not invent. Do not pad with unrelated skills.

```
-> USE: none — task is a single-file rename, no skill/MCP applies.
```

## Examples

### Vague: `make the dashboard look better`

```
MAIN PROBLEM: Dashboard mixes hardcoded Tailwind values and inconsistent spacing across breakpoints, breaking visual hierarchy.

GOALS:
- All spacing/typography/radius values pulled from index.css tokens.
- Card grid renders consistently across xs/sm/md/lg breakpoints.
- No visual regressions vs. the current screenshot.

CONTEXT:
- Framework: Next.js 15 (App Router) + Tailwind CSS 4
- Use skills: `design-tokens` (token compliance audit), `responsive-design` (mobile-first breakpoint rules), `component-consistency` (card pattern checks), `wcag-fix` (focus + touch targets) — agent MUST load these before executing matched tasks.
- Use MCP: `shadcn` via `view_items_in_registries` for card/grid reference patterns.
- Available subagents: `theme-master`, `responsive-master`, `shadcn-ui-designer`, `frontend-master`, `general-purpose`
- Reference: `src/components/widgets/HotDogWidget.tsx` (token-compliant pattern)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.
- Follow the existing design system: tokens from `index.css` (colors, spacing, radius, typography). No arbitrary Tailwind values (`p-[13px]`, `text-[15px]`, `bg-[#aaa]`).
- Mobile-first responsive: design xs (375px), scale up via sm (640px) / md (768px) / lg (1024px) / xl (1280px).
- Relative units only: `rem`/`em` for spacing/typography/radius; `vh`/`dvh`/`%`/`fr` for layout. No `w-[400px]`, `text-[18px]`, `p-[20px]`.
- No horizontal scroll on mobile — parents constrain children; carousels use `overflow-x-auto` only when intentional.
- Touch targets ≥2.75rem (44px) for buttons, links, form controls.
- Mobile navigation uses `Sheet` (drawer/hamburger), not desktop-only `NavigationMenu`.
- Use `min-h-dvh`, not `h-screen`, for full-viewport sections.
- WCAG 2.2 AA: ARIA on interactive elements, keyboard navigation, visible focus ring, contrast ≥4.5:1.
- UX visibility: render loading, error, empty, and success states explicitly.
- Reuse `shadcn/ui` primitives before building custom components.

1. Replace arbitrary Tailwind values with tokens
-> TASK ID: TASK-001
-> AGENT: theme-master
-> USE: skill `design-tokens` (token compliance audit), skill `responsive-design` (rem conversions for px).
-> ISSUES: src/pages/dashboard.tsx contains `p-[13px]`, `text-[15px]`, `rounded-[12px]` — bypasses --spacing/--font-sans/--radius.
-> FILE RELATED: `src/pages/dashboard.tsx:24-180`
-> SOLUTION:
   1. Activate `design-tokens` skill; enumerate every arbitrary bracket value in scope.
   2. Replace arbitrary brackets with token classes (p-3, text-base, rounded-lg); cross-check `responsive-design` skill for rem equivalents.
   3. Run `bun run build` — no Tailwind warnings.

2. Align card grid breakpoints
-> TASK ID: TASK-002
-> AGENT: responsive-master
-> USE: skill `responsive-design` (mobile-first breakpoint patterns), skill `component-consistency` (grid alignment), MCP `shadcn` via `view_items_in_registries` for canonical card-grid reference.
-> ISSUES: Cards collapse to 1 column at md but parent container stays at max-w-7xl, leaving dead space.
-> FILE RELATED: `src/pages/dashboard.tsx:62-95`
-> SOLUTION:
   1. Activate `responsive-design` skill; apply mobile-first grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3.
   2. Set container to max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8.
   3. Cross-check `component-consistency` skill: match HotDogWidget card padding pattern.

3. Normalize typography scale
-> TASK ID: TASK-003
-> AGENT: frontend-master
-> USE: skill `design-tokens` (typography token scale), skill `wcag-fix` (heading-hierarchy rule).
-> ISSUES: Heading levels jump h1 → h3 → h2 in dashboard sections.
-> FILE RELATED: `src/pages/dashboard.tsx:24-58`
-> SOLUTION:
   1. Activate `wcag-fix` skill; reorder to h1 → h2 → h3 per WCAG heading-hierarchy rule.
   2. Apply existing text-display/text-heading/text-body classes from `design-tokens` token scale.

PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002, TASK-003 — all touch dashboard.tsx but on disjoint line ranges (24-180 token swap, 62-95 grid container, 24-58 heading order); each agent works on a different concern. Coordinate by writing back through the same TodoWrite list.
- Note: if line ranges overlap during execution, fall back to sequential — token swap first, then grid, then headings.

VERIFICATION:
- Take a screenshot before and after, diff side-by-side, list deltas.
- Run `bun run build` — exit 0.
- Run `bun run lint` — no new warnings.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `add authentication`

```
MAIN PROBLEM: App has no auth — every route is public, no session handling, no logout.

GOALS:
- Email/password login at /login.
- Protected routes redirect unauthenticated users to /login.
- Server-side session with secure HttpOnly cookie.
- Tests cover login success, login failure, protected access while logged out, logout.

CONTEXT:
- Framework: Vite + React 19 + TanStack Router
- Use skills: `owasp-authentication` (V6 auth rules), `owasp-session-management` (V7 cookie/session lifecycle), `owasp-validation-logic` (V2 Zod schemas), `owasp-cryptography` (V11 password hashing), `owasp-configuration-security` (V13 secrets handling), `owasp-security-logging` (V16 structured logs), `responsive-design` (mobile-first login UI) — agent MUST load these before executing matched tasks.
- Available subagents: `backend-master`, `frontend-master`, `database-master`, `testing-master`, `general-purpose`
- Reference: `src/routes/index.tsx` (existing route pattern)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.
- [V2] Validate all input at the boundary with Zod — fail closed on unexpected fields.
- [V6] Generic auth error messages — never reveal whether the username exists.
- [V6] Account lockout / exponential backoff after repeated failed logins.
- [V7] Server-side session storage; regenerate session ID on login; expire on logout + idle + absolute timeout.
- [V7] Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, opaque session reference only.
- [V8] Authorize server-side; deny-by-default per route.
- [V11] Argon2id (preferred) or bcrypt cost ≥12 for password hashing; constant-time compare; platform crypto only.
- [V13] No secrets in code — env vars + secrets manager only.
- [V14] Never log secrets, tokens, or PII — redact at the logger layer.
- [V16] Structured logs include trace ID + hashed user ID; alert on auth failures.
- Mobile-first responsive on `/login` UI: relative units, touch targets ≥2.75rem, no horizontal scroll.
- WCAG 2.2 AA: form labels, visible focus, contrast ≥4.5:1.
- Structured error responses — never leak stack traces.

1. Define session storage schema
-> TASK ID: TASK-001
-> AGENT: backend-master
-> USE: skill `owasp-session-management` (V7 lifecycle + cookie flags), skill `owasp-configuration-security` (V13 secret handling for session signing key).
-> ISSUES: No session table or cookie infrastructure exists.
-> FILE RELATED: "new file: src/server/session.ts"
-> SOLUTION:
   1. Activate `owasp-session-management` skill; define Session = { id, userId, expiresAt } with idle + absolute timeout.
   2. Use HttpOnly + SameSite=Lax + Secure cookie named "sid"; opaque session reference only.
   3. Regenerate session ID on login per skill's V7 checklist.

2. Build /login route + form
-> TASK ID: TASK-002
-> AGENT: frontend-master
-> USE: skill `owasp-authentication` (V6 auth flow), skill `owasp-validation-logic` (V2 Zod), skill `owasp-cryptography` (V11 password compare), skill `responsive-design` (mobile-first login UI).
-> ISSUES: No login UI.
-> FILE RELATED: "new file: src/routes/login.tsx"
-> SOLUTION:
   1. Activate `responsive-design` skill; build mobile-first login form, touch targets ≥2.75rem, mirror `src/routes/index.tsx` route export pattern.
   2. Activate `owasp-validation-logic` skill; POST handler validates credentials with Zod, fails closed.
   3. Activate `owasp-cryptography` skill; Argon2id or bcrypt cost ≥12 password compare; set cookie; redirect.

3. Add route guard for protected paths
-> TASK ID: TASK-003
-> AGENT: frontend-master
-> USE: skill `owasp-authorization` (V8 deny-by-default), skill `owasp-session-management` (V7 expiry check).
-> ISSUES: All routes accessible without auth.
-> FILE RELATED: `src/router.tsx:18-44`
-> SOLUTION:
   1. Activate `owasp-authorization` skill; add beforeLoad guard that checks session cookie, deny-by-default.
   2. Redirect to /login when missing/expired per `owasp-session-management` V7 expiry rules.
   3. Whitelist /login and /signup only.

4. Logout endpoint
-> TASK ID: TASK-004
-> AGENT: backend-master
-> USE: skill `owasp-session-management` (V7 server-side invalidation), skill `owasp-security-logging` (V16 structured logout log).
-> ISSUES: No way to invalidate session.
-> FILE RELATED: "new file: src/routes/logout.ts"
-> SOLUTION:
   1. Activate `owasp-session-management` skill; POST /logout deletes session row server-side + clears cookie.
   2. Emit structured logout event per `owasp-security-logging` V16 (trace ID + hashed user ID).
   3. Redirect to /login.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — defines the Session type and cookie helpers consumed by every other task.
- Group 2 (parallel after Group 1): TASK-002, TASK-004 — both consume the session helper but write to different new files (`src/routes/login.tsx`, `src/routes/logout.ts`).
- Group 3 (sequential after Group 2): TASK-003 — guards rely on /login and /logout existing before the redirect logic can be tested.

VERIFICATION:
- Run `bun run test src/server/session.test.ts` — all 4 cases pass.
- Manual: log in, refresh, access /dashboard, log out, attempt /dashboard → redirected.
- Run `bun run build` — exit 0.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `fix the bug`

```
MAIN PROBLEM: [YOUR: paste symptom + reproduction steps + error text]

GOALS:
- Failing test reproduces the bug.
- Root cause fixed (not symptom suppressed).
- Test passes.
- Full suite still green.

CONTEXT:
- Framework: <detected>
- Available subagents: `debug-master`, `testing-master`, `general-purpose`
- Reference: `<file>` (likely origin from Explore agent)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.

1. Reproduce
-> TASK ID: TASK-001
-> AGENT: testing-master
-> USE: none — discovery surfaced no test-framework-specific skill or MCP for this codebase.
-> ISSUES: Bug is not deterministically reproducible in tests.
-> FILE RELATED: "new file: <test path matching origin>"
-> SOLUTION:
   1. Write a failing test that triggers the symptom.
   2. Confirm it fails for the documented reason.

2. Fix root cause
-> TASK ID: TASK-002
-> AGENT: debug-master
-> USE: none — single-file logic fix, no skill/MCP applies.
-> ISSUES: <root cause hypothesis from Explore agent>
-> FILE RELATED: `<path>:<line>`
-> SOLUTION:
   1. Patch the underlying logic.
   2. No try/catch suppression.
   3. Add inline comment only if WHY is non-obvious.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — establishes the failing test that anchors the fix.
- Group 2 (sequential after Group 1): TASK-002 — depends on TASK-001's test to verify the fix flips red → green.

VERIFICATION:
- Failing test from TASK-001 passes.
- `bun run test` — full suite green.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `rename foo to bar in src/utils.ts`

```
MAIN PROBLEM: Identifier `foo` is misnamed and should be `bar` for clarity.

GOALS:
- All references updated, no dangling old name.

CONTEXT:
- Framework: <detected>
- Available subagents: `general-purpose`, `Explore`

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.

1. Rename identifier
-> TASK ID: TASK-001
-> AGENT: general-purpose
-> USE: none — single atomic rename, no skill/MCP applies.
-> ISSUES: `foo` exported from src/utils.ts and consumed by N callers.
-> FILE RELATED: `src/utils.ts` + all importers
-> SOLUTION:
   1. Rename declaration in src/utils.ts.
   2. Update all imports (rg "foo" -l).

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — single atomic rename, no fan-out possible.

VERIFICATION:
- `bun run build` — exit 0.
- `rg "foo" src/` — no matches.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `deploy this to Cloudflare Workers`

```
MAIN PROBLEM: App is local-only — no Cloudflare Workers deployment, no wrangler config, no bindings declared.

GOALS:
- `wrangler deploy` succeeds and returns a `*.workers.dev` URL.
- All required bindings (KV, R2, secrets) declared in `wrangler.jsonc` and matched in code.
- Observability enabled (Workers Logs, tail logs visible via `wrangler tail`).

CONTEXT:
- Framework: Hono on Cloudflare Workers (detected from package.json)
- Use skills: `cloudflare` (platform overview), `wrangler` (CLI + config schema), `workers-best-practices` (anti-patterns, secrets, observability) — agent MUST load these before executing matched tasks.
- Use MCP: `cloudflare-docs` via `search_cloudflare_documentation` for current binding/config syntax; `cloudflare-bindings` via auth-required tools for binding inspection.
- Available subagents: `deployment-master`, `backend-master`, `general-purpose`
- Reference: existing `src/index.ts` Hono app entry

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.
- [V13] No secrets in code — use `wrangler secret put` + env bindings.
- [V13] Security headers on responses (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`).
- [V16] Structured logs — enable Workers Logs / Logpush, never log secrets or PII.
- Validate every endpoint with Zod at the boundary — fail closed.

1. Create `wrangler.jsonc` with bindings
-> TASK ID: TASK-001
-> AGENT: deployment-master
-> USE: skill `wrangler` (config schema), skill `cloudflare` (platform binding semantics), MCP `cloudflare-docs` via `search_cloudflare_documentation` for current binding format.
-> ISSUES: No `wrangler.jsonc` exists; no bindings declared.
-> FILE RELATED: "new file: wrangler.jsonc"
-> SOLUTION:
   1. Activate `wrangler` skill; query `cloudflare-docs` MCP for the current `wrangler.jsonc` schema.
   2. Declare entry `main = "src/index.ts"`, compatibility_date, observability.enabled = true.
   3. Add KV/R2/secret bindings matching env reads in `src/index.ts`.

2. Wire bindings into Hono app
-> TASK ID: TASK-002
-> AGENT: backend-master
-> USE: skill `workers-best-practices` (binding access patterns, no global state), skill `cloudflare` (Env typing).
-> ISSUES: `src/index.ts` reads `process.env.*`; Workers exposes bindings via `c.env`.
-> FILE RELATED: `src/index.ts`
-> SOLUTION:
   1. Activate `workers-best-practices` skill; type `Env` interface to match `wrangler.jsonc` bindings.
   2. Replace `process.env.X` with `c.env.X`.
   3. Validate inbound requests with Zod (fail closed); return structured errors.

3. Deploy + verify
-> TASK ID: TASK-003
-> AGENT: deployment-master
-> USE: skill `wrangler` (deploy + tail commands), skill `workers-best-practices` (smoke-test checklist).
-> ISSUES: Deployment never run.
-> FILE RELATED: `package.json` scripts
-> SOLUTION:
   1. Activate `wrangler` skill; `npx wrangler deploy` from project root.
   2. `npx wrangler tail` in a side terminal; hit one endpoint; confirm structured log appears.
   3. Curl the deployed URL; assert 200 + expected body.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — `wrangler.jsonc` must exist before app code can be wired to its bindings.
- Group 2 (sequential after Group 1): TASK-002 — types depend on `wrangler.jsonc` bindings.
- Group 3 (sequential after Group 2): TASK-003 — deploy needs both config and code to be coherent.

VERIFICATION:
- `npx wrangler deploy` exits 0 and prints a `*.workers.dev` URL.
- `curl <url>` returns 200 with expected body.
- `npx wrangler tail` shows structured logs with no secrets.
- `npx wrangler types` runs cleanly; `tsc --noEmit` passes.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

## Anti-Patterns

- Don't invent file paths.
- Don't recommend uninstalled skills, unconnected MCPs, or undiscovered subagents.
- Don't auto-enter plan mode or auto-create tasks. Always show the 3-option decision prompt.
- Don't pad single-line tasks into multi-task plans.
- Don't include `Original Prompt` / `Issues Identified` / `Why This Is Better` — ever.
- Don't omit the `RULES` block — it is mandatory in every output.
- **Don't omit the `USE:` field on any task.** If discovery surfaced no relevant skill/MCP, write `USE: none — <reason>`. Never silently drop the line.
- **Don't list a skill/MCP in `CONTEXT.Use skills` or `CONTEXT.Use MCP` without tying it to at least one task's `USE:` field.** Orphan context entries waste the agent's load budget.
- **Don't reference a skill/MCP in `USE:` that wasn't surfaced by discovery.** No inventions; no hallucinated MCPs.
- **Don't write passive USE phrasing.** "cloudflare might help" is wrong — write "Use Cloudflare skills and MCP" + name the specific skill/MCP.
- **Don't omit the responsive ruleset on a UI task.** Mobile-first + relative units + touch targets + no-horizontal-scroll are non-negotiable.
- **Don't omit OWASP ASVS 5.0.0 rules on a security-touching task.** Every Security rule must carry its `[Vn]` chapter prefix (V1-V17).
- **Don't emit Security rules without a chapter mapping.** "Use crypto" alone is wrong — it must be `[V11] Use AES-256-GCM …`.
- Don't omit the `AGENT:` field on any task — it drives parallel execution.
- Don't omit the `PARALLEL EXECUTION PLAN` block — even single-task plans must declare `Group 1 (sequential)`.
- Don't claim parallelism between tasks that touch the same file or share schema/types — default to sequential when uncertain.
- Don't write prose `SOLUTION` blocks. Imperative steps only.
- Don't use `ALWAYS` / `NEVER` excessively in `SOLUTION`. State the action.
- Don't skip `TodoWrite` when the user picks task-list execution — visible progress with `[GROUP N · AGENT: <name>]` prefixes is the point.
- Don't fan out parallel `TaskCreate` calls in separate messages — group them in a single message so they actually run concurrently.
- Don't proceed past Step 0 if the OWASP ASVS 5.0.0 skill suite is incomplete — the command halts.
- Don't emit any `git stash` instructions in `SOLUTION` or `VERIFICATION` blocks. Stashing is forbidden — recommend a scratch branch (`git switch -c wip/<topic>`) when work needs to be set aside.

## When NOT to Rewrite

| Prompt category | Action |
|-----------------|--------|
| Exploration ("what could we improve?") | Reply: open-ended is the point. Do not rewrite. |
| Learning ("explain how X works") | Reply: specificity would limit the answer. Do not rewrite. |
| Already-specific ("rename foo to bar in src/utils.ts") | Reply: `Prompt is already specific. No rewrite needed.` Stop. |

## References

- Tools Reference: https://code.claude.com/docs/en/tools-reference
- Best Practices: https://code.claude.com/docs/en/best-practices
- Subagents: https://code.claude.com/docs/en/sub-agents
- Common Workflows: https://code.claude.com/docs/en/common-workflows
