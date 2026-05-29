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
  required: ['title', 'rules', 'tasks', 'groups', 'verification', 'isReact'],
  properties: {
    title: { type: 'string', description: 'short imperative title for the overall change, derived from MAIN PROBLEM' },
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uniq(arr) {
  return Array.from(new Set(arr))
}

async function runTask(t, rules, label) {
  try {
    return await agent(taskPrompt(t, rules), {
      label,
      phase: 'Execute',
      agentType: t.agent || 'general-purpose',
      schema: TASK_RESULT_SCHEMA,
    })
  } catch (e) {
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

function buildReport(plan, results, validation) {
  const changes = []
  for (const r of results) for (const f of r.filesChanged || []) changes.push(f)
  const changedPaths = uniq(changes.map((c) => c.path))
  const skills = uniq(results.flatMap((r) => r.skillsLoaded || []))
  const agentsUsed = uniq(plan.tasks.map((t) => t.agent || 'general-purpose'))
  const agentField = agentsUsed.length === 1 ? agentsUsed[0] : 'multiple (per task)'
  const deferred = results.filter((r) => r.status !== 'completed')
  const checks = (validation && validation.checks) || []

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
  if (deferred.length) {
    L.push('------------------- DEFERRED -------------------')
    L.push('')
    deferred.forEach((r, i) => {
      const t = plan.tasks.find((x) => x.id === r.taskId) || {}
      L.push(i + 1 + '. Task:')
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
  }
  L.push('------------------- DONE -------------------')
  return L.join('\n')
}

// ---------------------------------------------------------------------------
// Phase 1 — Parse the strict-format prompt into a structured plan
// ---------------------------------------------------------------------------
phase('Parse')
const plan = await agent(parsePrompt(planText), { label: 'parse-plan', phase: 'Parse', schema: PLAN_SCHEMA })
if (!plan || !plan.tasks || !plan.tasks.length) {
  return 'execute-tasks: could not parse any TASK from the plan. Re-run /rubot-fix-prompt, or execute the tasks inline.'
}
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
const validation = await agent(verifyPrompt(plan, changedPaths), { label: 'verify', phase: 'Verify', schema: VALIDATION_SCHEMA })

// ---------------------------------------------------------------------------
// Phase 4 — Report (assemble the canonical Pattern 13 REPORT deterministically)
// ---------------------------------------------------------------------------
phase('Report')
log('Assembling REPORT — ' + results.filter((r) => r.status === 'completed').length + '/' + results.length + ' task(s) completed')
return buildReport(plan, results, validation)
