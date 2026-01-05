# Rubot Plugin - Global Consistency & Conflict Audit Report

**Date**: 2024-12-31
**Version Audited**: 2.5.1
**Auditor**: Claude Opus 4.5

---

## Executive Summary

| Category | Issues Found |
|----------|--------------|
| Critical Conflicts | 4 |
| High-Priority Ambiguities | 6 |
| Medium-Priority Inconsistencies | 8 |
| Low-Priority Redundancies | 3 |

**Overall Status**: REQUIRES REFACTORING

---

## 1. Critical Conflicts (Must Fix)

### 1.1 Agent Count Mismatch

**Location**: Multiple files
**Severity**: CRITICAL
**Issue**: Inconsistent agent count across documentation

| File | Stated Count |
|------|--------------|
| README.md | "14 Total" |
| plugin.json | "14 specialist subagents" |
| rubot.md (command) | "13 registered specialist subagents" |
| rubot.md (agent) | "14 registered subagents" |
| orchestration/SKILL.md | "14 registered specialist subagents" |

**Actual Count**: 15 agent files exist:
1. backend-master
2. chart-master
3. cloudflare
4. dashboard-master
5. debug-master
6. hydration-solver
7. neon-master
8. plan-supervisor
9. qa-tester
10. responsive-master
11. rubot (orchestrator)
12. seo-master
13. shadcn-ui-designer
14. tanstack
15. theme-master

**Root Cause**: plan-supervisor was added in v2.4.0 but rubot.md command was not updated.

**Recommendation**:
- Update rubot.md command: 13 → 14 (exclude rubot orchestrator from count)
- OR clarify: "14 specialist subagents + 1 orchestrator (rubot)"

---

### 1.2 Circular Sub-Agent Dependency

**Location**: dashboard-master.md, shadcn-ui-designer.md
**Severity**: CRITICAL
**Issue**: Circular invocation pattern creates infinite delegation loop

**Conflict Chain**:
```
shadcn-ui-designer states:
  "dashboard-master is a SUB-AGENT operating under shadcn-ui-designer authority"

dashboard-master states:
  "Mandatory Agent Orchestration Protocol: Invoke shadcn-ui-designer to ensure visual consistency"
```

**Ambiguity**: Who invokes whom?
- If dashboard-master is a sub-agent of shadcn-ui-designer, it should NOT invoke shadcn-ui-designer
- This creates: dashboard-master → shadcn-ui-designer → dashboard-master (circular)

**Recommendation**:
- Remove "Invoke shadcn-ui-designer" from dashboard-master
- Clarify sub-agent invocation is ONE-WAY: shadcn-ui-designer → dashboard-master
- Add explicit rule: "Sub-agents do NOT invoke their parent agent"

---

### 1.3 Non-Existent Agent Reference

**Location**: tanstack.md
**Severity**: CRITICAL
**Issue**: References agent that does not exist

**Offending Lines**:
```markdown
- **NEVER implement authentication directly** - ALWAYS delegate to auth-specialist agent
- **Authentication**: ALWAYS use Task tool to invoke auth-specialist
```

**Reality**: No `auth-specialist` agent exists in `/agents/` directory.

**Recommendation**:
- Option A: Create `auth-specialist.md` agent
- Option B: Remove references, delegate auth to `backend-master` instead
- Option B is simpler: Replace "auth-specialist" with "backend-master" in tanstack.md

---

### 1.4 Framework Contradiction

**Location**: theme-master.md, shadcn-ui-designer.md
**Severity**: CRITICAL
**Issue**: Agent examples contradict mandatory framework rules

**theme-master.md description example**:
```
"Set up the theme for my new Next.js project with shadcn"
```

**shadcn-ui-designer.md mandatory rule**:
```
**NEVER USE:**
- ❌ Next.js
```

**Recommendation**:
- Update theme-master.md example to reference TanStack Start instead:
  - OLD: "Set up the theme for my new Next.js project with shadcn"
  - NEW: "Set up the theme for my new TanStack Start project with shadcn"

---

## 2. High-Priority Ambiguities (Should Fix)

### 2.1 Sub-Agent Invocation Direction Unclear

**Location**: shadcn-ui-designer.md, chart-master.md, responsive-master.md, theme-master.md, dashboard-master.md
**Issue**: Sub-agent relationship is declared but invocation direction is ambiguous

**Current State**:
- shadcn-ui-designer declares 4 sub-agents
- Sub-agents say they "operate under shadcn-ui-designer authority"
- But no sub-agent explicitly states "I am invoked BY shadcn-ui-designer"

**Recommendation**:
Add to each sub-agent's system prompt:
```markdown
## Invocation Model
This agent is invoked BY shadcn-ui-designer (parent) for specialized tasks.
This agent does NOT operate independently for UI tasks.
```

---

### 2.2 plan-supervisor Not in Command Agent List

**Location**: rubot.md (command)
**Issue**: plan-supervisor missing from registered agents table

**Current table** lists 13 agents, missing:
- plan-supervisor

**Recommendation**:
Add row to agent table:
```
| plan-supervisor | Plan.md tracking, task completion |
```

---

### 2.3 Mandatory Verification Inconsistency

**Location**: Multiple agents
**Issue**: "Mandatory Verification" section inconsistent across agents

| Agent | Has Mandatory Verification Section |
|-------|-----------------------------------|
| shadcn-ui-designer | Yes - "Always use agent debug-master" |
| responsive-master | Yes - "Always use agent debug-master" |
| theme-master | No |
| dashboard-master | No |
| chart-master | Yes - "Always use agent debug-master" |
| cloudflare | Yes - "Always use agent debug-master" |
| tanstack | Yes - "Always use agent debug-master" |
| qa-tester | Yes - "Always use agent debug-master" |
| seo-master | No |

**Recommendation**:
- Add "Mandatory Verification" section to theme-master, dashboard-master, seo-master
- OR remove from all (inconsistent enforcement is worse than no enforcement)

---

### 2.4 Theme-Master Output Constraint Conflict

**Location**: theme-master.md
**Issue**: Conflicting behavioral rules

**Rule 1** (Behavioral Rules):
```
1. **Never** output explanations, commentary, or markdown formatting
4. Your output begins with `:root {` and ends with the closing `}` of `@theme inline`. No text before or after.
```

**Rule 2** (Mandatory Tools section):
```
### 1. AskUserQuestion - ALWAYS ASK FOR CLARIFICATION
When requirements are unclear...
```

**Conflict**: Cannot ask questions if "never output explanations or commentary"

**Recommendation**:
- Clarify: "When generating CSS theme output, no commentary. When clarifying requirements, use AskUserQuestion tool."
- Add exception: "AskUserQuestion invocations are not subject to the CSS-only output constraint"

---

### 2.5 SEO Confirmation Required - Enforcement Unclear

**Location**: seo-master.md, rubot.md (agent), orchestration/SKILL.md
**Issue**: "User-confirmed" requirement mentioned but enforcement mechanism unclear

**Current**: Multiple files say `seo-master (requires user confirmation)`

**Missing**: No explicit instruction on HOW to confirm. Should it:
- Use AskUserQuestion before any seo-master invocation?
- Check a flag in rubot.local.md?
- Ask once per project or per task?

**Recommendation**:
Add explicit protocol to orchestration/SKILL.md:
```markdown
### SEO Confirmation Protocol
Before invoking seo-master:
1. Check if `.claude/rubot/rubot.local.md` contains `seo_enabled: true`
2. If not present, use AskUserQuestion:
   "Does this project need SEO? (Public website vs. dashboard/internal app)"
3. Record decision in rubot.local.md for future invocations
```

---

### 2.6 Skill-to-Agent Mapping Unclear

**Location**: skills/ directory
**Issue**: No explicit mapping of which skills belong to which agents

**Current skills**:
- orchestration → rubot (implicit)
- env-check → cloudflare? debug-master? (unclear)
- tanstack-router → tanstack (implicit)
- tanstack-query → tanstack (implicit)
- tanstack-form → tanstack + shadcn-ui-designer? (unclear)
- tanstack-table → tanstack (implicit)
- tanstack-db → tanstack (implicit)
- rbac-auth → backend-master + neon-master? (unclear)
- url-state-management → tanstack (implicit)

**Recommendation**:
Add `agents` field to skill frontmatter:
```yaml
---
name: tanstack-form
agents:
  - tanstack
  - shadcn-ui-designer
---
```

---

## 3. Medium-Priority Inconsistencies (Should Address)

### 3.1 Inconsistent "Mandatory Tools" Section Ordering

**Issue**: Different agents list mandatory tools in different orders

| Agent | Order |
|-------|-------|
| shadcn-ui-designer | AskUserQuestion → shadcn MCP → Kibo UI MCP → Context7 → Exa |
| backend-master | AskUserQuestion → Context7 → Exa |
| cloudflare | AskUserQuestion → Cloudflare MCP → Context7 → Exa → Bash |

**Recommendation**: Standardize to:
1. AskUserQuestion
2. Domain-specific MCP (if any)
3. Context7 MCP
4. Exa MCP
5. Other tools

---

### 3.2 Tool Access Inconsistency

**Location**: Agent frontmatter `tools:` field
**Issue**: Some agents specify tools, others don't

| Agent | Has `tools:` field |
|-------|-------------------|
| plan-supervisor | Yes (Read, Edit, Glob, Grep) |
| shadcn-ui-designer | Yes (extensive list) |
| rubot | Yes (Task, Read, Write, etc.) |
| backend-master | No |
| tanstack | No |
| etc. | No |

**Recommendation**:
- Either add `tools:` to ALL agents
- OR remove from all and rely on permission mode

---

### 3.3 Permission Mode Inconsistency

**Location**: Agent frontmatter
**Issue**: Some agents have `permissionMode: bypassPermissions`, others don't

| Agent | Permission Mode |
|-------|----------------|
| qa-tester | bypassPermissions |
| cloudflare | bypassPermissions |
| tanstack | bypassPermissions |
| chart-master | bypassPermissions |
| responsive-master | bypassPermissions |
| shadcn-ui-designer | bypassPermissions |
| backend-master | Not specified |
| debug-master | Not specified |
| others | Not specified |

**Recommendation**:
- Explicitly set for ALL agents
- Document rationale for which agents bypass permissions

---

### 3.4 Color Duplication

**Location**: Agent frontmatter
**Issue**: Multiple agents use same color

| Color | Agents |
|-------|--------|
| blue | shadcn-ui-designer, dashboard-master |
| orange | tanstack, chart-master |
| red | rubot, responsive-master |

**Recommendation**: Assign unique colors:
- dashboard-master → teal
- chart-master → yellow
- responsive-master → brown

---

### 3.5 Backend Stack Reference Inconsistency

**Location**: tanstack.md, backend-master.md
**Issue**: Different backend technology lists

**tanstack.md**:
```
**Backend:**
- **Hono**: Fast, lightweight web framework
- **tRPC**: End-to-end type-safe APIs
- **Zod**: Schema validation
- **Drizzle ORM**: Type-safe database queries
- **better-auth**: Authentication
```

**backend-master.md description**:
```
ElysiaJS, Drizzle ORM, tRPC, or Zod
```

**Conflict**: tanstack says "Hono", backend-master says "ElysiaJS"

**Recommendation**: Standardize to ONE backend framework (suggest Hono based on tanstack being the primary agent)

---

### 3.6 Documentation Location Inconsistency

**Location**: Multiple agents
**Issue**: Different doc output paths referenced

| Agent | Documentation Path |
|-------|-------------------|
| qa-tester | `.docs/qa-tester/` |
| cloudflare | `.docs/cloudflare/` |
| tanstack | `.docs/tanstack/` |

**Note**: Some use `.docs/` (hidden), recommendation to use `docs/` (visible) would be cleaner

---

### 3.7 Model Specification Inconsistency

**Location**: Agent frontmatter
**Issue**: Some agents specify model, others don't

| Agent | Model |
|-------|-------|
| plan-supervisor | haiku |
| All others | opus |

**Recommendation**: Explicitly set `model: opus` for all agents except plan-supervisor

---

### 3.8 Scripts Not Integrated into Agent Workflow

**Location**: scripts/, agents/
**Issue**: Scripts exist but no agent explicitly references them

| Script | Referenced By |
|--------|---------------|
| env_checker.sh | rubot-init (command), env-check (skill) |
| css_validator.py | rubot-check (command) |
| responsive_audit.py | rubot-check (command), responsive-master? |
| seo_audit.py | rubot-check (command), seo-master? |
| registry_validator.py | rubot-check (command) |
| agent_manager.py | Documentation only |

**Recommendation**: Add explicit script references to relevant agents

---

## 4. Low-Priority Redundancies (Nice to Fix)

### 4.1 Duplicate "UI Restrictions" Text

**Location**: cloudflare.md, tanstack.md, qa-tester.md
**Issue**: Same "CRITICAL - UI RESTRICTIONS" section copy-pasted

**Recommendation**: Extract to shared skill or note in orchestration/SKILL.md

---

### 4.2 Duplicate MCP Protocol Text

**Location**: All agents
**Issue**: Nearly identical "Mandatory Tools & Context Protocol" sections

**Recommendation**: Create `skills/mcp-protocol/SKILL.md` and reference it

---

### 4.3 Redundant Domain Keywords

**Location**: orchestration/SKILL.md
**Issue**: Some keywords overlap unnecessarily

Example:
- "useForm, form field, form validation" → tanstack, shadcn-ui-designer
- But tanstack-form skill exists specifically for this

**Recommendation**: Consolidate domain classification to avoid ambiguity

---

## 5. Conflict Matrix

| Agent A | Agent B | Conflict Type | Severity |
|---------|---------|---------------|----------|
| dashboard-master | shadcn-ui-designer | Circular invocation | CRITICAL |
| tanstack | (none) | References non-existent auth-specialist | CRITICAL |
| theme-master | shadcn-ui-designer | Framework contradiction (Next.js) | CRITICAL |
| tanstack | backend-master | Backend framework mismatch (Hono vs ElysiaJS) | MEDIUM |
| theme-master | (self) | Output rules vs clarification rules | HIGH |
| rubot (command) | rubot (agent) | Agent count mismatch | CRITICAL |

---

## 6. Refactoring Recommendations

### Immediate Actions (Critical)

1. **Fix agent count**: Update rubot.md command to list 14 agents (add plan-supervisor)
2. **Fix circular dependency**: Remove "invoke shadcn-ui-designer" from dashboard-master
3. **Fix auth-specialist reference**: Replace with backend-master in tanstack.md
4. **Fix framework example**: Update theme-master Next.js reference to TanStack Start

### Short-Term Actions (High Priority)

5. **Clarify sub-agent invocation**: Add "invoked BY parent" to all sub-agents
6. **Standardize mandatory verification**: Add to all agents or remove from all
7. **Define SEO confirmation protocol**: Explicit steps in orchestration skill
8. **Add skill-agent mapping**: Update skill frontmatter with `agents:` field

### Medium-Term Actions

9. **Standardize backend framework**: Choose Hono OR ElysiaJS, not both
10. **Standardize tool sections**: Same order across all agents
11. **Assign unique colors**: No duplicates
12. **Standardize permission modes**: Explicit for all agents

### Long-Term Actions

13. **Extract common sections**: Create shared skills for repeated content
14. **Script-agent integration**: Explicit references from agents to scripts
15. **Documentation path standardization**: `docs/` vs `.docs/`

---

## 7. Final Consistency Checklist

### Role & Responsibility Clarity
- [ ] Each agent has ONE clearly defined role - **PARTIALLY MET** (sub-agent roles unclear)
- [ ] No overlapping ownership between agents - **NOT MET** (dashboard-master/shadcn-ui-designer conflict)
- [ ] No duplicated responsibilities - **PARTIALLY MET** (some redundancy exists)
- [ ] Supervisor vs executor roles clearly separated - **MET** (rubot, plan-supervisor are distinct)

### Skill Alignment
- [ ] Skills map cleanly to agent responsibilities - **NOT MET** (no explicit mapping)
- [ ] No skill contradicts another skill - **MET**
- [ ] Naming is consistent and descriptive - **MET**
- [ ] Skill scope is explicit and non-overlapping - **PARTIALLY MET**

### Command Consistency
- [ ] Commands follow unified structure - **MET**
- [ ] No duplicated or conflicting commands - **MET**
- [ ] Clear invocation rules - **MET**
- [ ] No hidden side effects - **MET**

### Script Safety
- [ ] Scripts do not override agent logic - **MET**
- [ ] Clear execution boundaries - **MET**
- [ ] No implicit state mutation - **MET**
- [ ] Idempotent where applicable - **MET**

### Interaction Contracts
- [ ] Agent-to-agent communication rules explicit - **NOT MET** (circular dependency exists)
- [ ] Notification paths well-defined - **PARTIALLY MET**
- [ ] No circular dependencies - **NOT MET** (dashboard-master ↔ shadcn-ui-designer)
- [ ] Mandatory escalation paths respected - **MET**

### MCP Usage Rules
- [ ] MCP responsibilities consistent across agents - **MET**
- [ ] No agent bypasses required MCP usage - **MET**
- [ ] MCP purpose unambiguous - **MET**

### Naming & Structure
- [ ] File names reflect actual responsibility - **MET**
- [ ] Directory structure predictable - **MET**
- [ ] No legacy or unused artifacts - **MET**
- [ ] No misleading abstractions - **PARTIALLY MET** (sub-agent hierarchy unclear)

### Default Behaviors
- [ ] Defaults explicit - **PARTIALLY MET**
- [ ] No implicit assumptions - **NOT MET** (SEO confirmation unclear)
- [ ] Safe fallbacks defined - **MET**
- [ ] Error states deterministic - **MET**

---

## Appendix A: Files Audited

### Agents (15)
- agents/backend-master.md
- agents/chart-master.md
- agents/cloudflare.md
- agents/dashboard-master.md
- agents/debug-master.md
- agents/hydration-solver.md
- agents/neon-master.md
- agents/plan-supervisor.md
- agents/qa-tester.md
- agents/responsive-master.md
- agents/rubot.md
- agents/seo-master.md
- agents/shadcn-ui-designer.md
- agents/tanstack.md
- agents/theme-master.md

### Commands (9)
- commands/rubot.md
- commands/rubot-check.md
- commands/rubot-commit.md
- commands/rubot-execute.md
- commands/rubot-init.md
- commands/rubot-new-pr.md
- commands/rubot-new-repo.md
- commands/rubot-plan.md
- commands/rubot-push-pr.md

### Skills (9)
- skills/env-check/SKILL.md
- skills/orchestration/SKILL.md
- skills/rbac-auth/SKILL.md
- skills/tanstack-db/SKILL.md
- skills/tanstack-form/SKILL.md
- skills/tanstack-query/SKILL.md
- skills/tanstack-router/SKILL.md
- skills/tanstack-table/SKILL.md
- skills/url-state-management/SKILL.md

### Scripts (6)
- scripts/agent_manager.py
- scripts/css_validator.py
- scripts/env_checker.sh
- scripts/registry_validator.py
- scripts/responsive_audit.py
- scripts/seo_audit.py

### Configuration
- .claude-plugin/plugin.json
- README.md
- CHANGELOG.md
- templates/components.json.template

---

**End of Audit Report**
