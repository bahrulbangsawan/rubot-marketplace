// fix-prompt — dynamic workflow that rewrites a vague prompt into a strict,
// task-based execution plan using a 4-phase adversarial pipeline.
//
// Triggered as the DEFAULT execution path of /rubot-fix-prompt (the command
// includes the literal word "workflow" so Claude Code runs this script instead
// of working turn-by-turn). Override back to the inline flow with --simple /
// --no-workflow.
//
// Phases:
//   1. Analysis            — parse intent + discover the codebase/capabilities (parallel)
//   2. Generation          — produce N independent candidate rewrites (parallel strategies)
//   3. Adversarial Review  — independent agents refute/score each candidate (cross-check)
//   4. Synthesis           — converge on ONE final copy-ready prompt
//
// The script keeps every intermediate result in variables and returns a single
// consolidated result (the final prompt in a fenced markdown block). There is
// NO mid-run user input — the command runs the task-list / plan-mode / cancel
// decision in the main session AFTER this workflow returns.
//
// Requires Claude Code v2.1.154 or later (dynamic workflows runtime).

export const meta = {
  name: 'fix-prompt',
  description:
    'Rewrite a vague prompt into a strict task-based execution plan via a 4-phase adversarial workflow (analysis -> parallel generation -> adversarial review -> synthesis). Consumes meaningfully more tokens than a standard session.',
  phases: [
    { title: 'Analysis', detail: 'parse intent + constraints + failure modes, discover codebase & capabilities (parallel)' },
    { title: 'Generation', detail: 'produce N independent candidate rewrites across distinct strategies' },
    { title: 'Adversarial Review', detail: 'independent agents refute and score each candidate against the analysis criteria' },
    { title: 'Synthesis', detail: 'converge on one final copy-ready prompt in markdown' },
  ],
}

// ---------------------------------------------------------------------------
// Input — accept a raw string or { prompt, variants }
// ---------------------------------------------------------------------------
const vague = (typeof args === 'string' ? args : (args && args.prompt) || '').trim()
if (!vague) {
  return [
    'fix-prompt workflow received no prompt.',
    'Pass the vague prompt as args, e.g. `/fix-prompt make the dashboard better` or',
    'run the command form `/rubot-fix-prompt <your vague prompt>`.',
  ].join(' ')
}

// Number of candidate rewrites to generate. Default 3; allow an explicit
// override via args.variants; scale up modestly with an explicit token budget.
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }
const requested = args && Number(args.variants)
const budgeted = budget && budget.total ? Math.floor(budget.total / 150000) : 0
const VARIANT_COUNT = clamp(requested || budgeted || 3, 2, 6)

// Distinct generation strategies so the candidates are genuinely diverse
// (judge-panel pattern). Sliced to VARIANT_COUNT.
const STRATEGIES = [
  { key: 'minimal', angle: 'Minimal-risk MVP. The smallest correct rewrite: tightest task scope, fewest TASKs that still cover the goal, no speculative work. Prefer one sequential group unless parallelism is obviously safe.' },
  { key: 'comprehensive', angle: 'Comprehensive defense-in-depth. Enumerate every task the goal implies, attach all matching rule banks (Universal + Frontend/Responsive + Backend + TanStack + Security V1-V17), and maximise the VERIFICATION block.' },
  { key: 'parallel-first', angle: 'Execution-optimised. Decompose so independent file scopes fan out across the maximum number of SAFE parallel groups; assign the most specific discovered AGENT per task; default to sequential only on real dependencies.' },
  { key: 'guardrail', angle: 'Guardrail-first. Lead with the mandatory RULES (skill detection, validation hooks, React Doctor, final REPORT, no git stash, OWASP [Vn], responsive) and make each TASK trace back to a rule it satisfies.' },
  { key: 'reference-led', angle: 'Reference-led. Mirror the closest existing implementation found in discovery; pin its path in CONTEXT.Reference and make every SOLUTION follow that established convention.' },
  { key: 'verification-led', angle: 'Verification-led. Start from "how do we prove it is done", then back-fill TASKs so every GOAL maps to a runnable check (test/build/axe/lighthouse/react-doctor).' },
].slice(0, VARIANT_COUNT)

// ---------------------------------------------------------------------------
// Shared format contract — every generator and the synthesizer emit this exact
// structure. Kept terse here; agents load the repo `prompt-fixer` skill for the
// full rule banks when it is installed.
// ---------------------------------------------------------------------------
const FORMAT_CONTRACT = `
Emit ONLY this template (no preamble, no commentary):

MAIN PROBLEM: <one-sentence, present-tense, names the gap>

GOALS:
- <measurable outcome>   (no "make it nicer")

CONTEXT:
- Framework: <detected framework + version from discovery>
- Use skills: \`<skill>\` (purpose) — only skills surfaced by discovery; each must appear in >=1 task USE. Omit line if none.
- Use MCP: \`<mcp>\` via \`<tool>\` for <purpose> — only connected MCPs; each must appear in >=1 task USE. Omit if none.
- Available subagents: \`<agent>\` (only those discovered, plus general-purpose, Explore, Plan)
- Reference: \`<path>\` (existing pattern to follow)

RULES:
- (Universal, ALWAYS) follow existing patterns; real paths only; fix root causes; no regressions.
- (Universal) Mandatory skill detection before substantial work via the @tanstack/intent loader; load matching local skills.
- (Universal) Run discovered validation & commit hooks (lint/typecheck/test/build/format) after every phase.
- (Universal) React/Next/Vite/React Native -> run \`npx react-doctor@latest --fail-on warning\` and resolve diagnostics before the REPORT.
- (Universal) Emit the canonical final REPORT block after task-list execution.
- (Universal) DON'T USE ANY GIT STASH COMMANDS — use \`git switch -c wip/<topic>\` instead.
- (Frontend/Responsive, when ANY task touches UI) mobile-first; relative units only; touch targets >=2.75rem; no horizontal scroll on mobile; \`min-h-dvh\` not \`h-screen\`; \`Sheet\` mobile nav; WCAG 2.2 AA.
- (Backend, when ANY task touches API/route/server/db) validate input at the boundary; parameterized queries; authn+authz server-side; rate-limit; secure cookies.
- (TanStack, when \`@tanstack/*\` present or routing/data/mutation signals) Router automatic code splitting; official file naming; Query optimistic updates; DB local-first consistency.
- (Security OWASP ASVS 5.0.0, when ANY task touches a V1-V17 domain) every security rule MUST carry its \`[Vn]\` chapter prefix.
- Minimum 4 rules.

1. <Imperative Title>
-> TASK ID: TASK-001
-> AGENT: <most specific discovered subagent; default general-purpose; Explore for read-only>
-> USE: skill \`<name>\` (purpose), MCP \`<name>\` via \`<tool>\` (purpose) — or "none — <reason>"
-> ISSUES: <symptom + likely cause + observable trigger; cite line numbers if known>
-> FILE RELATED: \`<real path>:<line-range>\` or "new file: <path>"
-> SOLUTION: <imperative, <=3 steps; reference any USE skill/MCP by name in a step>

PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002 — independent file scopes
- Group 2 (sequential after Group 1): TASK-003 — consumes TASK-001 output
(single-task plans: "Group 1 (sequential): TASK-001"; every TASK appears exactly once)

VERIFICATION:
- <at least one runnable check: test/build/screenshot diff/axe-core/lighthouse>
- <metric or condition that confirms done>

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).

HARD GROUNDING RULES:
- Real file paths only, taken from discovery. No invented paths.
- Only skills/MCPs/subagents that appear in discovery. No hallucinated capabilities.
- If a task touches a security domain, map it to V1-V17 and prefix the rule \`[Vn]\`.
- If a task touches UI, the FULL responsive ruleset is mandatory (not a summary).
`.trim()

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mainProblem', 'intent', 'targetModel', 'constraints', 'failureModes', 'taskSignals', 'successCriteria'],
  properties: {
    mainProblem: { type: 'string', description: 'one-sentence problem statement' },
    intent: { type: 'string', description: 'what the user actually wants' },
    targetModel: { type: 'string', description: 'target model if implied (e.g. claude-opus-4-8) else "unspecified"' },
    constraints: { type: 'array', items: { type: 'string' } },
    failureModes: { type: 'array', items: { type: 'string' }, description: 'ways the vague prompt would mislead an agent' },
    taskSignals: { type: 'array', items: { type: 'string' }, description: 'domain signals: ui, api, db, security:Vn, tanstack, deploy, test, perf, seo...' },
    successCriteria: { type: 'array', items: { type: 'string' }, description: 'measurable done conditions' },
  },
}

const DISCOVERY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['framework', 'isReact', 'isTanStack', 'relevantPaths', 'referenceFiles', 'installedSkills', 'connectedMcps', 'subagents', 'validationCommands'],
  properties: {
    framework: { type: 'string', description: 'framework + version, or "unknown"' },
    isReact: { type: 'boolean' },
    isTanStack: { type: 'boolean' },
    relevantPaths: { type: 'array', items: { type: 'string' }, description: '3-5 most relevant real directories' },
    referenceFiles: { type: 'array', items: { type: 'string' }, description: '1-3 reference files demonstrating the pattern to follow' },
    installedSkills: { type: 'array', items: { type: 'string' } },
    connectedMcps: { type: 'array', items: { type: 'string' } },
    subagents: { type: 'array', items: { type: 'string' } },
    validationCommands: { type: 'array', items: { type: 'string' }, description: 'discovered lint/typecheck/test/build/format commands + hooks' },
  },
}

const CANDIDATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['strategy', 'prompt'],
  properties: {
    strategy: { type: 'string' },
    prompt: { type: 'string', description: 'the FULL strict-format rewrite, raw text, no surrounding code fence' },
    notes: { type: 'string', description: 'optional 1-line note on the angle taken' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['strategy', 'scores', 'overall', 'strengths', 'defects', 'fatalFlaws'],
  properties: {
    strategy: { type: 'string' },
    scores: {
      type: 'object',
      additionalProperties: false,
      required: ['specificity', 'groundedness', 'ruleCoverage', 'parallelism', 'verifiability'],
      properties: {
        specificity: { type: 'number', description: '0-10: measurable goals, concrete tasks, no vagueness' },
        groundedness: { type: 'number', description: '0-10: real paths/skills/MCPs only, zero inventions' },
        ruleCoverage: { type: 'number', description: '0-10: Universal + matched domain banks (OWASP [Vn], responsive, TanStack)' },
        parallelism: { type: 'number', description: '0-10: correct, safe parallel-vs-sequential grouping' },
        verifiability: { type: 'number', description: '0-10: runnable checks tie back to every goal' },
      },
    },
    overall: { type: 'number', description: '0-10 weighted overall' },
    strengths: { type: 'array', items: { type: 'string' } },
    defects: { type: 'array', items: { type: 'string' }, description: 'concrete violations found while trying to refute the candidate' },
    fatalFlaws: { type: 'array', items: { type: 'string' }, description: 'disqualifying issues: hallucinated paths/skills, missing mandatory rules, unsafe parallelism' },
  },
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
function analysisPrompt(p) {
  return [
    'You are the ANALYSIS agent in a prompt-rewrite workflow. Do NOT rewrite the prompt yet.',
    'Parse the vague prompt below and return a precise analysis object.',
    '',
    'Vague prompt:',
    '"""', p, '"""',
    '',
    'Identify: the one-sentence main problem; the true intent; any implied target model;',
    'hard constraints; the failure modes (how this prompt would mislead an executing agent);',
    'the domain task signals (ui, api, db, security:Vn, tanstack, deploy, test, perf, seo, ...);',
    'and the measurable success criteria. Be concrete; do not invent requirements the user did not imply.',
  ].join('\n')
}

function discoveryPrompt(p) {
  return [
    'You are the DISCOVERY agent (read-only) in a prompt-rewrite workflow.',
    'Map the current repo so the rewrite can be grounded in REAL paths and REAL capabilities.',
    '',
    'User wants: """' + p + '"""',
    '',
    'Report (real values only — never invent):',
    '1. Framework + version from package.json / wrangler.toml / next.config / pyproject.toml; whether it is a React project; whether it uses TanStack (@tanstack/*).',
    '2. The 3-5 directories most relevant to this prompt, and 1-3 reference files that demonstrate the pattern to follow.',
    '3. Installed skills — list directory names under plugins/rubot/skills/, .claude/skills/, and ~/.claude/skills/.',
    '4. Connected MCPs (use ListMcpResourcesTool if available) and available subagents under plugins/rubot/agents/, .claude/agents/, ~/.claude/agents/.',
    '5. Validation commands: lint/typecheck/test/build/format scripts in package.json plus any husky/git pre-commit/pre-push hooks.',
    'If a value cannot be determined, return an empty array or "unknown" — do NOT guess.',
  ].join('\n')
}

function generatePrompt(ctx, strat) {
  return [
    'You are a GENERATION agent in a prompt-rewrite workflow. Produce ONE candidate rewrite.',
    '',
    'STRATEGY (' + strat.key + '): ' + strat.angle,
    '',
    'If the `prompt-fixer` skill is installed (see discovery.installedSkills), load it via the Skill tool and follow its full rule banks. Otherwise apply the embedded contract verbatim.',
    '',
    'Original vague prompt:',
    '"""', ctx.vague, '"""',
    '',
    'ANALYSIS (authoritative): ' + JSON.stringify(ctx.analysis),
    '',
    'DISCOVERY (the ONLY source of real paths/skills/MCPs/subagents/validation): ' + JSON.stringify(ctx.discovery),
    '',
    'Rewrite the prompt into the strict format below, applying every rule bank whose task signal is present in the analysis. Use ONLY paths, skills, MCPs, and subagents from DISCOVERY. Return the rewrite as the `prompt` field (raw text, NO code fence).',
    '',
    FORMAT_CONTRACT,
  ].join('\n')
}

function reviewPrompt(ctx, candidate) {
  return [
    'You are an ADVERSARIAL REVIEW agent. You did NOT write this candidate. Try to REFUTE it.',
    'Score it honestly against the analysis criteria and surface every defect; default to skepticism.',
    '',
    'ANALYSIS (the criteria): ' + JSON.stringify(ctx.analysis),
    'DISCOVERY (ground truth for paths/skills/MCPs): ' + JSON.stringify(ctx.discovery),
    '',
    'CANDIDATE (strategy ' + candidate.strategy + '):',
    '"""', candidate.prompt, '"""',
    '',
    'Check specifically for: invented file paths or skills/MCPs not in discovery (FATAL);',
    'missing mandatory rules (skill detection, validation hooks, React Doctor for React, final REPORT, no git stash) (FATAL);',
    'missing responsive ruleset on a UI task, or security rules without a [Vn] prefix (FATAL);',
    'unsafe parallel grouping of tasks that share files/types/schema; vague or unmeasurable goals;',
    'verification that does not tie back to the goals. Return the structured review.',
  ].join('\n')
}

function synthesisPrompt(ctx, reviewed) {
  const bundle = reviewed.map((x, i) => ({
    index: i + 1,
    strategy: x.candidate.strategy,
    candidate: x.candidate.prompt,
    review: x.review,
  }))
  return [
    'You are the SYNTHESIS agent. Converge the reviewed candidates into ONE final prompt.',
    '',
    'Pick the strongest candidate as the base (highest overall review score with NO fatalFlaws),',
    'then graft in the best concrete improvements from the runners-up. Eliminate every defect and',
    'fatal flaw the reviewers raised. Keep ONLY real paths/skills/MCPs/subagents from discovery.',
    '',
    'ANALYSIS: ' + JSON.stringify(ctx.analysis),
    'DISCOVERY: ' + JSON.stringify(ctx.discovery),
    'REVIEWED CANDIDATES: ' + JSON.stringify(bundle),
    '',
    'Output requirements:',
    '- Output ONLY the final rewritten prompt, wrapped in a SINGLE fenced markdown code block (```), nothing before or after it.',
    '- The prompt MUST follow the strict format and pass every gate (no invented paths/skills; mandatory RULES present; OWASP [Vn] prefixes; full responsive ruleset on UI tasks; PARALLEL EXECUTION PLAN groups every TASK once; EXECUTION line defers to the user choice).',
    '- If the original prompt is already fully specific, output exactly: `Prompt is already specific. No rewrite needed.` (no code block).',
    '',
    'Format contract for reference:',
    FORMAT_CONTRACT,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Phase 1 — Analysis (parse intent + discover codebase/capabilities, in parallel)
// ---------------------------------------------------------------------------
phase('Analysis')
const [analysis, discovery] = await parallel([
  () => agent(analysisPrompt(vague), { label: 'analyze-intent', phase: 'Analysis', schema: ANALYSIS_SCHEMA }),
  () => agent(discoveryPrompt(vague), { label: 'discover-codebase', phase: 'Analysis', schema: DISCOVERY_SCHEMA, agentType: 'Explore' }),
])
if (!analysis) return 'Analysis phase failed — could not parse the prompt intent. Re-run, or use /rubot-fix-prompt --simple.'
const ctx = { vague, analysis, discovery: discovery || {} }
log(`Analysis done — ${analysis.taskSignals.length} task signal(s); ${(ctx.discovery.installedSkills || []).length} skill(s), ${(ctx.discovery.connectedMcps || []).length} MCP(s) discovered`)

// ---------------------------------------------------------------------------
// Phase 2 + 3 — Generation -> Adversarial Review (pipeline: each candidate is
// reviewed the moment it is generated; no barrier between the stages)
// ---------------------------------------------------------------------------
phase('Generation')
log(`Generating ${STRATEGIES.length} candidate rewrites across distinct strategies`)
const reviewed = await pipeline(
  STRATEGIES,
  (strat) => agent(generatePrompt(ctx, strat), { label: `gen:${strat.key}`, phase: 'Generation', schema: CANDIDATE_SCHEMA }),
  (candidate, strat) =>
    candidate && candidate.prompt
      ? agent(reviewPrompt(ctx, candidate), { label: `review:${strat.key}`, phase: 'Adversarial Review', schema: REVIEW_SCHEMA })
          .then((review) => ({ candidate, review }))
      : null,
)
const valid = reviewed.filter(Boolean).filter((x) => x.candidate && x.candidate.prompt)
if (!valid.length) return 'Generation produced no usable candidate rewrites. Re-run, or use /rubot-fix-prompt --simple.'
log(`${valid.length}/${STRATEGIES.length} candidate(s) generated and adversarially reviewed`)

// ---------------------------------------------------------------------------
// Phase 4 — Synthesis (converge on one final copy-ready prompt)
// ---------------------------------------------------------------------------
phase('Synthesis')
const final = await agent(synthesisPrompt(ctx, valid), { label: 'synthesize-final', phase: 'Synthesis' })
return final
