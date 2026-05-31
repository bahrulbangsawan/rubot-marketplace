// execute-tasks — dynamic workflow that EXECUTES an already-rewritten,
// strict-format prompt produced by fix-prompt. It is the second half of the
// /rubot-fix-prompt flow:
//
//   1. user gives a vague prompt
//   2. fix-prompt.js rewrites it into the strict task-based plan
//   3. the command creates the task list (TaskCreate) like before — for queue visibility
//   4. THIS workflow executes that plan group-by-group, verifies, and returns
//      the canonical REPORT
//
// There is NO mid-run user input and NO plan mode — the user already chose
// "Create tasks list and execute" in the main session before this runs.
//
// Input (args): the FULL strict-format prompt text (MAIN PROBLEM / GOALS /
// CONTEXT / RULES / numbered TASKs / PARALLEL EXECUTION PLAN / VERIFICATION),
// passed as a raw string or { prompt }.
//
// Phases:
//   1. Parse    — one agent turns the prompt text into a structured plan
//   2. Execute  — walk the PARALLEL EXECUTION PLAN group-by-group; parallel
//                 groups fan out concurrently, sequential groups run in order.
//                 One real subagent per TASK-NNN (its per-task AGENT), each
//                 loading the matched skills and editing files in scope.
//   3. Verify   — run the VERIFICATION checks + react-doctor for React projects
//   4. Report   — assemble the canonical Pattern 13 REPORT (deterministic)
//
// Requires Claude Code v2.1.154 or later (dynamic workflows runtime).

export const meta = {
  name: 'execute-tasks',
  description:
    'Execute an already-rewritten strict-format prompt from fix-prompt: parse the plan, fan out one subagent per TASK-NNN group-by-group (parallel where the plan allows, sequential where dependent), run the VERIFICATION checks + react-doctor, and return the canonical REPORT. Consumes meaningfully more tokens than a standard session.',
  phases: [
    { title: 'Parse', detail: 'turn the strict-format prompt into a structured plan (tasks + groups + rules + verification)' },
    { title: 'Execute', detail: 'walk the PARALLEL EXECUTION PLAN group-by-group; one subagent per TASK-NNN, parallel where independent' },
    { title: 'Verify', detail: 'run the VERIFICATION checks + react-doctor; record PASS / FAIL / NOT RUN' },
    { title: 'Report', detail: 'assemble the canonical REPORT block from the task + validation results' },
  ],
}

// ---------------------------------------------------------------------------
// Input — accept a raw string or { prompt }
// ---------------------------------------------------------------------------
const planText = (typeof args === 'string' ? args : (args && args.prompt) || '').trim()
if (!planText) {
  return [
    'execute-tasks workflow received no plan.',
    'Pass the rewritten strict-format prompt (the fix-prompt output) as args, e.g. the command launches it after the user picks "Create tasks list and execute".',
  ].join(' ')
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'goals', 'rules', 'tasks', 'groups', 'verification', 'isReact'],
  properties: {
    title: { type: 'string', description: 'short imperative title for the overall change, derived from MAIN PROBLEM' },
    goals: { type: 'array', items: { type: 'string' }, description: 'every line of the GOALS block, verbatim (empty array if no GOALS block)' },
    rules: { type: 'array', items: { type: 'string' }, description: 'every line of the RULES block, verbatim' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'agent', 'use', 'issues', 'files', 'solution'],
        properties: {
          id: { type: 'string', description: 'TASK-NNN' },
          title: { type: 'string' },
          agent: { type: 'string', description: 'the AGENT: value; default "general-purpose"' },
          use: { type: 'string', description: 'the full USE: line' },
          issues: { type: 'string' },
          files: { type: 'string', description: 'the FILE RELATED: value' },
          solution: { type: 'string', description: 'the full SOLUTION text' },
        },
      },
    },
    groups: {
      type: 'array',
      description: 'the PARALLEL EXECUTION PLAN, in order',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'mode', 'taskIds'],
        properties: {
          name: { type: 'string', description: 'e.g. "Group 1"' },
          mode: { type: 'string', enum: ['parallel', 'sequential'] },
          taskIds: { type: 'array', items: { type: 'string' }, description: 'the TASK-NNN ids in this group' },
          note: { type: 'string', description: 'the inline dependency reason' },
        },
      },
    },
    verification: { type: 'array', items: { type: 'string' }, description: 'every runnable check from the VERIFICATION block' },
    isReact: { type: 'boolean', description: 'true if the plan/RULES mention react/next/vite/react-native or react-doctor' },
  },
}

const TASK_RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['taskId', 'status', 'filesChanged', 'skillsLoaded', 'summary'],
  properties: {
    taskId: { type: 'string' },
    status: { type: 'string', enum: ['completed', 'failed', 'deferred'] },
    filesChanged: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['op', 'path', 'explanation'],
        properties: {
          op: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] },
          path: { type: 'string' },
          explanation: { type: 'string', description: 'one or two sentences: what changed AND why' },
        },
      },
    },
    skillsLoaded: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string', description: 'one-line summary of what this task did' },
    deferredReason: { type: 'string', description: 'why the task was not completed (only when status != completed)' },
  },
}

const VALIDATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['checks'],
  properties: {
    checks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['command', 'status', 'result'],
        properties: {
          command: { type: 'string' },
          status: { type: 'string', enum: ['PASS', 'FAIL', 'NOT RUN'] },
          result: { type: 'string', description: 'brief result, or the reason it was not run' },
        },
      },
    },
  },
}

// Native goal-keeping gate — reproduces the intent of Claude Code's /goal command
// ("keep working toward the goal") INSIDE the workflow, because /goal has no
// programmatic API and cannot be invoked from a skill/command/workflow. After
// verification, a read-only evaluator judges plan.goals against the results +
// validation and may propose up to MAX_GOAL_ITERATIONS rounds of repair tasks.
const MAX_GOAL_ITERATIONS = 2

const GOAL_EVAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['met', 'unmetGoals', 'gaps', 'repairTasks'],
  properties: {
    met: { type: 'boolean', description: 'true if every plan goal is satisfied (or there were no goals)' },
    unmetGoals: { type: 'array', items: { type: 'string' }, description: 'the goals not yet satisfied, verbatim' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'concrete gaps between the current results and the goals' },
    repairTasks: {
      type: 'array',
      description: 'concrete tasks (same shape as normal tasks) that would close the gap; empty if met',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'agent', 'use', 'issues', 'files', 'solution'],
        properties: {
          id: { type: 'string', description: 'TASK-NNN (use a fresh id, e.g. TASK-R01)' },
          title: { type: 'string' },
          agent: { type: 'string', description: 'the AGENT to spawn; default "general-purpose"' },
          use: { type: 'string', description: 'the full USE: line (skills/MCPs to load)' },
          issues: { type: 'string' },
          files: { type: 'string', description: 'real file paths reused from the results' },
          solution: { type: 'string', description: 'the full SOLUTION text that closes the gap' },
        },
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
function parsePrompt(text) {
  return [
    'You are the PARSE agent in a task-execution workflow. Turn the strict-format prompt below into a structured plan.',
    'Do NOT execute anything, edit any file, or run any command. Parse only.',
    '',
    'Extract:',
    '- title: a short imperative title for the overall change, derived from MAIN PROBLEM.',
    '- goals: every line of the GOALS block, verbatim (these are the outcomes the change must achieve). Emit an empty array if there is no GOALS block.',
    '- rules: every line of the RULES block, verbatim (these are global and apply to every task).',
    '- tasks: one object per numbered TASK — id (TASK-NNN), title, agent (the AGENT: value; default "general-purpose"), use (the full USE: line), issues (ISSUES:), files (FILE RELATED:), solution (the full SOLUTION text).',
    '- groups: parse the PARALLEL EXECUTION PLAN into ordered groups. One object per group — name ("Group 1"), mode ("parallel" if the line says "(parallel...)", otherwise "sequential"), taskIds (the TASK-NNN ids listed in that group), note (the inline reason). Preserve group order exactly. A "(sequential after Group N)" group has mode "sequential".',
    '- verification: every runnable check listed in the VERIFICATION block.',
    '- isReact: true if the plan or RULES mention react / next / vite / react-native or react-doctor.',
    '',
    'If there is no PARALLEL EXECUTION PLAN block, emit a single sequential group containing every task in order.',
    '',
    'STRICT-FORMAT PROMPT:',
    '"""', text, '"""',
  ].join('\n')
}

function taskPrompt(t, rules) {
  return [
    'You are executing ONE task from a strict-format execution plan. Do the real work — edit the files in scope and make the change correct.',
    '',
    'BEFORE substantial work: run the @tanstack/intent skill loader (`bunx @tanstack/intent@latest list`, or `npx -y @tanstack/intent@latest list`) to detect matching local skills, and load every skill named in USE via `load <package>#<skill>`; follow the returned SKILL.md. If a required skill, MCP, or the loader is unavailable, STOP and report it as the deferredReason instead of guessing.',
    '',
    'TASK ID: ' + t.id,
    'TITLE: ' + t.title,
    'AGENT: ' + (t.agent || 'general-purpose'),
    'USE: ' + (t.use || 'none'),
    'ISSUES: ' + (t.issues || ''),
    'FILE RELATED: ' + (t.files || ''),
    'SOLUTION:',
    t.solution || '',
    '',
    'GLOBAL RULES (apply to every step):',
    (rules && rules.length ? rules.map((r) => '- ' + r).join('\n') : '- (none parsed)'),
    '',
    'AFTER implementing: run the relevant discovered validation commands for the files you touched; for any React / Next.js / Vite / React Native change run `npx react-doctor@latest --fail-on warning` and resolve every diagnostic before returning. NEVER use any git stash commands — use `git switch -c wip/<topic>` if you must set work aside.',
    '',
    'Return a structured result: the task id, final status (completed / failed / deferred), every file you changed (op CREATE|UPDATE|DELETE + real path + a one-line explanation of what changed AND why), the skills you actually loaded, a one-line summary, and — only if you did not complete it — the reason in deferredReason.',
  ].join('\n')
}

function verifyPrompt(plan, changedPaths) {
  return [
    'You are the VERIFY agent. The execution tasks just finished. Run the verification checks and report each result HONESTLY.',
    '',
    'Files changed across all tasks:',
    (changedPaths.length ? changedPaths.map((p) => '- ' + p).join('\n') : '- (none reported)'),
    '',
    'VERIFICATION checks to run (from the plan):',
    (plan.verification && plan.verification.length ? plan.verification.map((v) => '- ' + v).join('\n') : '- (none listed in the plan)'),
    '',
    plan.isReact
      ? 'This is a React/Next/Vite/React Native project — also run `npx react-doctor@latest --fail-on warning` and report its result.'
      : 'Not a React project — skip react-doctor.',
    '',
    'For each check: ACTUALLY run its command. Report status PASS (ran, exit 0), FAIL (ran, non-zero), or NOT RUN (could not run — give the concrete reason, e.g. "no test runner configured" or "command not found"). Never claim PASS without running the command. Return the structured checks array (include react-doctor as one of the checks when applicable).',
  ].join('\n')
}

function goalEvalPrompt(plan, results, validation) {
  const goals = plan.goals || []
  const resultLines = (results || []).map((r) => {
    const files = (r.filesChanged || []).map((f) => f.op + ' ' + f.path).join(', ')
    return '- ' + r.taskId + ' [' + r.status + '] ' + (r.summary || '') + (files ? ' | files: ' + files : '')
  })
  const checkLines = ((validation && validation.checks) || []).map((c) => '- ' + c.status + ': ' + c.command)
  return [
    'You are the GOAL-GATE evaluator — a READ-ONLY judge. Reproduce the intent of Claude Code\'s /goal command: decide whether the plan GOALS are actually satisfied by the work that was just done.',
    'Do NOT execute anything, edit any file, or run any command. You only JUDGE and PROPOSE.',
    '',
    'GOALS to satisfy:',
    (goals.length ? goals.map((gl) => '- ' + gl).join('\n') : '- (no GOALS block — treat as already met)'),
    '',
    'TASK RESULTS so far:',
    (resultLines.length ? resultLines.join('\n') : '- (no task results)'),
    '',
    'VERIFICATION checks:',
    (checkLines.length ? checkLines.join('\n') : '- (no checks run)'),
    '',
    'If plan.goals is empty, or every goal is satisfied by the results + passing checks, return met:true with empty unmetGoals, gaps, and repairTasks.',
    'Otherwise return met:false, list the unmetGoals (verbatim) and the concrete gaps, and propose repairTasks that would close the gap. Each repair task uses the SAME shape as a normal task (id, title, agent, use, issues, files, solution) and MUST reuse the REAL file paths from the results above. Keep the repair set minimal — only what is needed to meet the goals. Do NOT propose work for goals that are already met.',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Model tiering for token efficiency (Claude 4.x): read-only / structured /
// low-stakes work runs on the cheapest capable model, and the strongest model
// is reserved for tasks where correctness is hard (security, auth, crypto,
// migrations, architecture, race conditions, root-cause debugging).
//   haiku  — parse, verify, goal-eval, and read-only/docs/config/rename tasks
//   sonnet — standard implementation work (the default)
//   opus   — security-critical and hard-correctness tasks
// ---------------------------------------------------------------------------
function modelForTask(task) {
  const t = (
    (task.agent || '') + ' ' + (task.use || '') + ' ' + (task.issues || '') + ' ' + (task.solution || '') + ' ' + (task.title || '')
  ).toLowerCase()
  // opus is evaluated first so it wins when both opus and haiku signals match.
  if ((task.agent || '') === 'debug-master' || /security|owasp|v\d+|\[v\d+\]|auth|crypto|encrypt|token|jwt|oauth|migration|schema change|architect|race condition|root cause/.test(t)) {
    return 'opus'
  }
  if ((task.agent || '') === 'Explore' || /read-only|inspect|find all|list |rename|docs?|comment|typo|config|\.md|changelog/.test(t)) {
    return 'haiku'
  }
  return 'sonnet'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uniq(arr) {
  return Array.from(new Set(arr))
}

// Standalone agent model: this workflow assumes NO specialist agents are
// installed. The ONLY agent types guaranteed to be spawnable are the built-ins.
// Everything else (a rubot specialist like `backend-master`, or a custom agent
// the user installed) MIGHT exist — we cannot know from a hardcoded list, so we
// never assume a roster. Two safety layers handle the rest:
//   1. sanitizeAgent (here)  — proactively fixes the KNOWN error class: a SKILL
//      name in the AGENT slot (e.g. "owasp-validation-logic" leaked out of USE).
//      Passing a skill to agent({agentType}) throws "agent type '<name>'".
//   2. runTask attempt-with-fallback — for any non-built-in name we cannot
//      verify, we TRY to spawn it; if the runtime rejects it (not installed),
//      we fall back to general-purpose. This keeps a real installed specialist
//      OR custom agent working, while degrading gracefully when it is absent.
const BUILTIN_AGENTS = new Set(['general-purpose', 'Explore', 'Plan'])

// Heuristic: does this AGENT value look like a SKILL that leaked out of USE,
// rather than an agent? owasp-* / asvs-* are the dominant case (the rewrite is
// OWASP-saturated) and are never agents. We only PROACTIVELY rewrite these; any
// other unknown name is left for runTask to attempt (it may be a real agent).
function looksLikeSkill(name) {
  return /^(owasp|asvs)-/i.test(name)
}

function sanitizeAgent(t) {
  const raw = (t.agent || '').trim()
  if (!raw || BUILTIN_AGENTS.has(raw)) return t
  if (looksLikeSkill(raw)) {
    // Definitely a skill, not an agent — coerce to a built-in and preserve the
    // skill in USE so its capability is kept.
    const addition = 'skill `' + raw + '` (moved from AGENT — it is a skill, not an agent)'
    const cleaned = { ...t, agent: 'general-purpose' }
    cleaned.use = t.use ? t.use + '; ' + addition : addition
    log('Coerced skill-in-AGENT "' + raw + '" on ' + (t.id || 'task') + ' -> general-purpose (moved to USE)')
    return cleaned
  }
  // Unknown, but plausibly a real installed agent (rubot specialist or custom).
  // Leave it; runTask will attempt it and fall back to general-purpose if the
  // runtime reports it unavailable.
  return t
}

async function runTask(t, rules, label) {
  const safe = sanitizeAgent(t)
  const model = modelForTask(safe)
  const requested = safe.agent || 'general-purpose'
  try {
    return await agent(taskPrompt(safe, rules), {
      label,
      phase: 'Execute',
      agentType: requested,
      schema: TASK_RESULT_SCHEMA,
      model,
    })
  } catch (e) {
    // Standalone fallback: the requested specialist/custom agent is not
    // installed in this project (agent({agentType}) threw). Retry once on the
    // always-available general-purpose agent so the task still runs.
    if (requested !== 'general-purpose') {
      try {
        log('Agent "' + requested + '" not installed on ' + (safe.id || 'task') + ' — falling back to general-purpose')
        return await agent(taskPrompt({ ...safe, agent: 'general-purpose' }, rules), {
          label: label + ' (fallback)',
          phase: 'Execute',
          agentType: 'general-purpose',
          schema: TASK_RESULT_SCHEMA,
          model,
        })
      } catch (e2) {
        return null
      }
    }
    return null
  }
}

function normalizeResult(t, r) {
  if (!r) {
    return {
      taskId: t.id,
      status: 'failed',
      filesChanged: [],
      skillsLoaded: [],
      summary: 'Agent returned no result (errored, skipped, or the agent type was unavailable).',
      deferredReason: 'Execution error or unavailable agent type "' + (t.agent || 'general-purpose') + '".',
    }
  }
  return {
    taskId: r.taskId || t.id,
    status: r.status || 'completed',
    filesChanged: r.filesChanged || [],
    skillsLoaded: r.skillsLoaded || [],
    summary: r.summary || '',
    deferredReason: r.deferredReason || '',
  }
}

function buildReport(plan, results, validation, goalEval) {
  const changes = []
  for (const r of results) for (const f of r.filesChanged || []) changes.push(f)
  const changedPaths = uniq(changes.map((c) => c.path))
  const skills = uniq(results.flatMap((r) => r.skillsLoaded || []))
  const agentsUsed = uniq(plan.tasks.map((t) => t.agent || 'general-purpose'))
  const agentField = agentsUsed.length === 1 ? agentsUsed[0] : 'multiple (per task)'
  const deferred = results.filter((r) => r.status !== 'completed')
  const checks = (validation && validation.checks) || []
  const goals = plan.goals || []
  const ge = goalEval || { met: true, unmetGoals: [], gaps: [], repairTasks: [] }
  const unmetGoals = ge.unmetGoals || []

  const L = []
  L.push('------------------- REPORT -------------------')
  L.push('')
  L.push(plan.title || 'Execute rewritten prompt')
  L.push('')
  L.push('Agent: ' + agentField)
  L.push('Skills Loaded: ' + (skills.length ? skills.join(', ') : 'None'))
  L.push('Total Files Changed: ' + changedPaths.length)
  L.push('')
  L.push('------------------- CHANGES -------------------')
  L.push('')
  if (changes.length) {
    changes.forEach((c, i) => {
      L.push(i + 1 + '. ' + c.op + ': @' + c.path)
      L.push('   Explanation:')
      L.push('   ' + (c.explanation || '').trim())
      L.push('')
    })
  } else {
    L.push('No files were changed.')
    L.push('')
  }
  L.push('------------------- VALIDATION -------------------')
  L.push('')
  if (checks.length) {
    checks.forEach((c) => {
      L.push('- ' + c.status + ': ' + c.command)
      L.push('  Result:')
      L.push('  ' + (c.result || '').trim())
      L.push('')
    })
  } else {
    L.push('- NOT RUN: (no verification checks parsed)')
    L.push('  Result:')
    L.push('  The plan VERIFICATION block produced no runnable checks.')
    L.push('')
  }
  L.push('------------------- GOAL STATUS -------------------')
  L.push('')
  if (!goals.length) {
    L.push('- (no GOALS block parsed — goal gate skipped)')
    L.push('')
  } else {
    goals.forEach((gl) => {
      const isUnmet = unmetGoals.some((u) => u === gl)
      L.push('- ' + (isUnmet ? 'UNMET' : 'MET') + ': ' + gl)
    })
    L.push('')
    if (unmetGoals.length) {
      L.push('Unmet goals remain after the goal-keeping gate; see DEFERRED for recommended actions.')
      L.push('')
    }
  }
  if (deferred.length || unmetGoals.length) {
    L.push('------------------- DEFERRED -------------------')
    L.push('')
    let n = 0
    deferred.forEach((r) => {
      n++
      const t = plan.tasks.find((x) => x.id === r.taskId) || {}
      L.push(n + '. Task:')
      L.push('   ' + (t.title ? r.taskId + ' — ' + t.title : r.taskId))
      L.push('')
      L.push('   Related Files:')
      L.push('   ' + (t.files || '(unknown)'))
      L.push('')
      L.push('   Explanation:')
      L.push('   ' + (r.deferredReason || r.summary || 'Not completed.'))
      L.push('')
      L.push('   Recommended Action:')
      L.push('   Re-run this task in a focused session, or complete it manually.')
      L.push('')
    })
    unmetGoals.forEach((gl) => {
      n++
      L.push(n + '. Goal:')
      L.push('   ' + gl)
      L.push('')
      L.push('   Explanation:')
      L.push('   Goal not satisfied after ' + MAX_GOAL_ITERATIONS + ' round(s) of repair tasks.')
      L.push('')
      L.push('   Recommended Action:')
      L.push('   Re-run /rubot-fix-prompt focused on this goal, or address it manually.')
      L.push('')
    })
  }
  L.push('------------------- DONE -------------------')
  return L.join('\n')
}

// ---------------------------------------------------------------------------
// Phase 1 — Parse the strict-format prompt into a structured plan
// ---------------------------------------------------------------------------
phase('Parse')
const plan = await agent(parsePrompt(planText), { label: 'parse-plan', phase: 'Parse', schema: PLAN_SCHEMA, model: 'haiku' })
if (!plan || !plan.tasks || !plan.tasks.length) {
  return 'execute-tasks: could not parse any TASK from the plan. Re-run /rubot-fix-prompt, or execute the tasks inline.'
}
// Guard every parsed task: rewrite any AGENT that is clearly a SKILL leaked into
// the AGENT slot (e.g. an owasp-* chapter) back to a built-in + move it to USE,
// before it ever reaches agent({agentType}). Unknown-but-plausible agent names
// are left as-is and attempted at spawn time (runTask falls back if absent).
plan.tasks = plan.tasks.map(sanitizeAgent)
const tasksById = {}
for (const t of plan.tasks) tasksById[t.id] = t
const groups =
  plan.groups && plan.groups.length
    ? plan.groups
    : [{ name: 'Group 1', mode: 'sequential', taskIds: plan.tasks.map((t) => t.id), note: 'no plan block parsed — sequential fallback' }]
log('Parsed ' + plan.tasks.length + ' task(s) across ' + groups.length + ' group(s)')

// ---------------------------------------------------------------------------
// Phase 2 — Execute group-by-group, honoring the PARALLEL EXECUTION PLAN
// ---------------------------------------------------------------------------
phase('Execute')
const results = []
for (let gi = 0; gi < groups.length; gi++) {
  const g = groups[gi]
  const groupTasks = (g.taskIds || []).map((id) => tasksById[id]).filter(Boolean)
  if (!groupTasks.length) continue
  const isParallel = g.mode === 'parallel' && groupTasks.length > 1
  log('Execute ' + (g.name || 'Group ' + (gi + 1)) + ' (' + (isParallel ? 'parallel' : 'sequential') + ') — ' + groupTasks.map((t) => t.id).join(', '))
  if (isParallel) {
    const groupResults = await parallel(
      groupTasks.map((t) => () => runTask(t, plan.rules, (g.name || 'Group ' + (gi + 1)) + ':' + t.id)),
    )
    groupTasks.forEach((t, i) => results.push(normalizeResult(t, groupResults[i])))
  } else {
    for (const t of groupTasks) {
      const r = await runTask(t, plan.rules, (g.name || 'Group ' + (gi + 1)) + ':' + t.id)
      results.push(normalizeResult(t, r))
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — Verify (run the VERIFICATION checks + react-doctor once, globally)
// ---------------------------------------------------------------------------
phase('Verify')
const changedPaths = uniq(results.flatMap((r) => (r.filesChanged || []).map((f) => f.path)))
// `validation` is reassigned by the goal-keeping gate below, so it must be `let`.
let validation = await agent(verifyPrompt(plan, changedPaths), { label: 'verify', phase: 'Verify', schema: VALIDATION_SCHEMA, model: 'haiku' })

// ---------------------------------------------------------------------------
// Phase 3.5 — Goal Gate (native goal-keeping; reproduces /goal inside the run)
// A read-only evaluator judges plan.goals against the results + validation. If
// goals are unmet, it dispatches up to MAX_GOAL_ITERATIONS rounds of repair
// tasks, re-verifying after each round. The hard cap guarantees termination.
// ---------------------------------------------------------------------------
let goalEval = await agent(goalEvalPrompt(plan, results, validation), { schema: GOAL_EVAL_SCHEMA, model: 'haiku', label: 'goal-gate' })
let goalIter = 0
while (!goalEval.met && goalIter < MAX_GOAL_ITERATIONS && (goalEval.repairTasks || []).length) {
  goalIter++
  log('Goal gate round ' + goalIter + ' — ' + goalEval.repairTasks.length + ' repair task(s)')
  const repairResults = await parallel(goalEval.repairTasks.map((rt) => () => runTask(rt, plan.rules, rt.id + ' ' + rt.title)))
  goalEval.repairTasks.forEach((rt, i) => results.push(normalizeResult(rt, repairResults[i])))
  const changedPaths2 = uniq(results.flatMap((r) => (r.filesChanged || []).map((f) => f.path)))
  validation = await agent(verifyPrompt(plan, changedPaths2), { label: 'verify-' + goalIter, phase: 'Verify', schema: VALIDATION_SCHEMA, model: 'haiku' })
  goalEval = await agent(goalEvalPrompt(plan, results, validation), { schema: GOAL_EVAL_SCHEMA, model: 'haiku', label: 'goal-gate-' + goalIter })
}

// ---------------------------------------------------------------------------
// Phase 4 — Report (assemble the canonical Pattern 13 REPORT deterministically)
// ---------------------------------------------------------------------------
phase('Report')
log('Assembling REPORT — ' + results.filter((r) => r.status === 'completed').length + '/' + results.length + ' task(s) completed')
return buildReport(plan, results, validation, goalEval)
