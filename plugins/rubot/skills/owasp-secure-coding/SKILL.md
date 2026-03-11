---
name: owasp-secure-coding
version: 1.0.0
description: |
  Audits secure coding practices against OWASP ASVS V15 requirements.
  Covers security architecture documentation, dependency management,
  defensive coding patterns, and safe concurrency. Detects prototype
  pollution, mass assignment, type juggling, race conditions, TOCTOU
  vulnerabilities, and insecure dependency usage.

  Trigger on: "secure coding audit", "code security review",
  "dependency audit", "ASVS V15", "prototype pollution", "mass assignment",
  "race condition review", "TOCTOU check", "SBOM review",
  "supply chain security", "dependency vulnerability scan",
  "concurrency review"

  DO NOT trigger for: input validation specifics (use owasp-validation-logic),
  authentication logic (use owasp-authentication), cryptographic code
  (use owasp-cryptography), SQL injection or XSS (use owasp-encoding-sanitization)
agents:
  - debug-master
---

# OWASP ASVS V15 -- Secure Coding Verification

## Overview

This skill audits secure coding practices against OWASP ASVS V15 requirements. It covers the identification and documentation of dangerous functionality, dependency management and supply chain security, defensive coding patterns to prevent common vulnerability classes, and safe concurrency practices.

Secure coding goes beyond avoiding specific vulnerability types. It encompasses the overall approach to building resilient software: managing dependencies, preventing entire classes of bugs through defensive patterns, understanding and mitigating concurrency risks, and maintaining awareness of dangerous functionality in the codebase.

## When to Use

- Reviewing code architecture for security anti-patterns
- Auditing third-party dependency security and supply chain risks
- Checking for prototype pollution, mass assignment, or type juggling
- Reviewing concurrent code for race conditions and TOCTOU vulnerabilities
- Assessing SBOM (Software Bill of Materials) completeness
- Evaluating sandboxing and isolation of risky components
- Reviewing object mapping and deserialization safety
- Conducting a full ASVS V15 compliance audit

## Verification Requirements

### V15.1 -- Secure Coding and Architecture Documentation

| ID | Requirement | Level |
|---|---|---|
| V15.1.1 | Dangerous functionality is identified and documented (admin panels, file processors, deserializers, templating engines) | L2 |
| V15.1.2 | An inventory of risky components exists (parsers, file handlers, native code integrations) | L2 |
| V15.1.3 | Vulnerability remediation timeframes are defined by severity (critical: 24h, high: 7d, medium: 30d) | L2 |
| V15.1.4 | Secure coding guidelines are documented and followed by the development team | L2 |
| V15.1.5 | Threat modeling is performed for new features and architectural changes | L3 |

**Audit Steps:**
1. Request documentation of dangerous functionality in the application.
2. Verify an inventory of risky components exists.
3. Check vulnerability remediation SLAs and verify they are being met.
4. Review secure coding guidelines and enforcement mechanisms.

### V15.2 -- Security Architecture and Dependencies

| ID | Requirement | Level |
|---|---|---|
| V15.2.1 | All dependencies are tracked in a manifest file (package.json, requirements.txt, go.mod, etc.) | L1 |
| V15.2.2 | Dependencies are scanned for known vulnerabilities (SCA) on every build | L1 |
| V15.2.3 | An SBOM (Software Bill of Materials) is generated and maintained | L2 |
| V15.2.4 | Risky components are sandboxed or containerized with minimal privileges | L2 |
| V15.2.5 | Network isolation separates components of different trust levels | L2 |
| V15.2.6 | Dependency pinning or lock files prevent unexpected version changes | L1 |
| V15.2.7 | Unused dependencies are removed | L1 |
| V15.2.8 | Dependencies are sourced from trusted registries only | L2 |
| V15.2.9 | Transitive dependencies are monitored for vulnerabilities | L2 |
| V15.2.10 | Dependency update processes are automated and timely | L2 |

**Audit Steps:**
1. Verify lock files exist and are committed to version control.
2. Check CI/CD pipeline for SCA scanning integration.
3. Run dependency audit (npm audit, pip-audit, go vuln check).
4. Check for unused or abandoned dependencies.
5. Verify SBOM generation if L2+ required.
6. Review container configurations for sandboxing.

### V15.3 -- Defensive Coding

| ID | Requirement | Level |
|---|---|---|
| V15.3.1 | Type juggling vulnerabilities are prevented (strict comparison operators, explicit type casting) | L1 |
| V15.3.2 | Prototype pollution is prevented (Object.freeze, null prototype objects, input validation) | L1 |
| V15.3.3 | Mass assignment is prevented (allowlisting permitted fields, DTOs, explicit mapping) | L1 |
| V15.3.4 | HTTP parameter pollution is mitigated (consistent parameter parsing, deduplication) | L1 |
| V15.3.5 | Update mechanisms verify integrity (signed updates, checksum verification) | L2 |
| V15.3.6 | Object mapping uses explicit field mapping, not automatic reflection-based mapping | L2 |
| V15.3.7 | Deserialization of untrusted data is avoided or uses safe alternatives (JSON instead of unsafe serialization formats) | L1 |
| V15.3.8 | Template injection is prevented (sandboxed template engines, no user-controlled templates) | L1 |
| V15.3.9 | Regular expressions are safe from ReDoS (no catastrophic backtracking) | L1 |
| V15.3.10 | Integer overflow and underflow are handled appropriately | L2 |

**Audit Steps:**
1. Search for loose equality comparisons in security-sensitive code.
2. Check for prototype pollution vectors in object merging operations.
3. Review model binding and ORM save operations for mass assignment.
4. Verify deserialization safety.
5. Audit regular expressions for ReDoS potential.
6. Review template engine usage for injection risks.

### V15.4 -- Safe Concurrency

| ID | Requirement | Level |
|---|---|---|
| V15.4.1 | Race conditions are prevented in security-critical operations (balance checks, permission checks) | L1 |
| V15.4.2 | TOCTOU (Time-of-Check-to-Time-of-Use) vulnerabilities are mitigated | L1 |
| V15.4.3 | Deadlock prevention strategies are implemented | L2 |
| V15.4.4 | Shared mutable state uses proper synchronization (mutexes, semaphores, atomic operations) | L2 |
| V15.4.5 | Database operations use appropriate isolation levels and transactions | L1 |
| V15.4.6 | File operations use atomic operations or proper locking | L2 |
| V15.4.7 | Optimistic or pessimistic locking is used for concurrent data modifications | L2 |

**Audit Steps:**
1. Identify security-critical operations and check for race condition protection.
2. Review file system operations for TOCTOU vulnerabilities.
3. Check database transactions and isolation levels.
4. Review shared state access patterns for proper synchronization.
5. Check for atomic operations in concurrent counter/balance updates.

## Code Review Patterns

### Detecting Prototype Pollution

```bash
# Deep merge / extend without protection
grep -rn "Object\.assign\|\.extend(\|deepMerge\|deep-extend\|merge(\|lodash.*merge\|_.merge\|defaultsDeep" --include="*.{js,ts,jsx,tsx}"

# Direct __proto__ or constructor access
grep -rn "__proto__\|constructor\[.*\]\|\.prototype\s*=" --include="*.{js,ts,jsx,tsx}"

# Recursive object operations on user input
grep -rn "req\.body.*\.\.\.\|req\.query.*\.\.\.\|JSON\.parse.*merge\|Object\.keys.*forEach.*\[" --include="*.{js,ts,jsx,tsx}"
```

### Detecting Mass Assignment

```bash
# Express/Node.js mass assignment
grep -rn "\.create(req\.body)\|\.update(req\.body)\|\.findOneAndUpdate.*req\.body\|new Model(req\.body)\|Object\.assign.*req\.body" --include="*.{js,ts}"

# Django mass assignment
grep -rn "\.objects\.create(\*\*request\.\|form\.save()\|ModelForm.*exclude\s*=\s*\[\]" --include="*.py"

# Rails mass assignment
grep -rn "\.create(params\[:\|\.update(params\[:\|attr_accessible\|attr_protected" --include="*.rb"

# Java/Spring mass assignment
grep -rn "@ModelAttribute\|@RequestBody.*save\|BeanUtils\.copyProperties" --include="*.java"
```

### Detecting Type Juggling

```bash
# JavaScript loose equality
grep -rn "\s==\s\|!=\s[^=]" --include="*.{js,ts,jsx,tsx}"

# PHP loose comparison
grep -rn "\s==\s\|strcmp\s*(" --include="*.php"

# Implicit type coercion
grep -rn "parseInt\s*(\s*req\.\|Number(\s*req\.\|parseInt\s*(\s*params\.\|Boolean(\s*req\." --include="*.{js,ts,jsx,tsx}"
```

### Detecting Unsafe Deserialization

```bash
# Python unsafe deserialization (use json.loads instead)
grep -rn "pickle\.loads\|pickle\.load\|cPickle\|shelve\.open\|marshal\.loads" --include="*.py"

# Java deserialization
grep -rn "ObjectInputStream\|readObject()\|XMLDecoder\|XStream\|fromXML\|readResolve" --include="*.java"

# PHP unserialize
grep -rn "unserialize\(" --include="*.php"

# Node.js unsafe YAML loading
grep -rn "yaml\.load\b\|YAML\.load\b\|js-yaml.*load\b" --include="*.{js,ts}"

# Ruby unsafe deserialization
grep -rn "Marshal\.load\|YAML\.load\b" --include="*.rb"
```

### Detecting Race Conditions and TOCTOU

```bash
# File existence check followed by operation (TOCTOU)
grep -rn "existsSync.*\(.*\)\|access\(.*F_OK\|os\.path\.exists\|File\.exists\?" --include="*.{js,ts,py,java,rb,go}"

# Non-atomic balance/counter operations
grep -rn "balance\s*=\s*balance\|count\s*=\s*count\|quantity\s*-=\|balance\s*-=\|amount\s*+=\|\.increment\b" --include="*.{js,ts,py,java,go,rb}"

# Missing transaction in database operations
grep -rn "SELECT.*FOR UPDATE\|BEGIN TRANSACTION\|START TRANSACTION\|serializable\|REPEATABLE READ" --include="*.{js,ts,py,java,go,rb,sql}"
```

### Detecting ReDoS Patterns

```bash
# Nested quantifiers (potential ReDoS)
grep -rn "new RegExp\|/.*\(.*[+*].*\)[+*].*/" --include="*.{js,ts,jsx,tsx}"

# Common ReDoS patterns
grep -rn "\(\.\*\)\+\|\(\.\+\)\+\|\(a\+\)\+\|\(a\|a\)\*\|\(a\|b\|ab\)\*" --include="*.{js,ts,py,java,go,rb}"
```

### Detecting Dependency Issues

```bash
# Check for lock files
ls -la package-lock.json yarn.lock pnpm-lock.yaml Pipfile.lock poetry.lock Gemfile.lock go.sum Cargo.lock 2>/dev/null

# Check for unpinned dependencies
grep -rn '"\*"\|"latest"\|">=\|">\|"~\|"\^' package.json

# Run dependency audit
npm audit --json 2>/dev/null || pip-audit --format json 2>/dev/null || go vuln check ./... 2>/dev/null
```

## Remediation Guidance

### Prevent Prototype Pollution

```javascript
// WRONG: Deep merge without protection
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') {
      target[key] = merge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// CORRECT: Protect against prototype pollution
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Skip dangerous keys
    }
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      target[key] = safeMerge(target[key] || Object.create(null), source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// BEST: Use null prototype objects
const safeObj = Object.create(null);
// Or freeze prototypes
Object.freeze(Object.prototype);
```

### Prevent Mass Assignment

```javascript
// WRONG: Passing request body directly to model
app.post('/users', async (req, res) => {
  const user = await User.create(req.body); // Attacker can set isAdmin: true
});

// CORRECT: Explicit field allowlisting
app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });
});

// CORRECT: Using a DTO/schema
const createUserSchema = z.object({
  name: z.string().max(100),
  email: z.string().email(),
  password: z.string().min(8)
});

app.post('/users', async (req, res) => {
  const data = createUserSchema.parse(req.body); // Only allowed fields
  const user = await User.create(data);
});
```

### Prevent Race Conditions

```javascript
// WRONG: Non-atomic balance check and update
app.post('/transfer', async (req, res) => {
  const account = await Account.findById(req.body.fromId);
  if (account.balance >= req.body.amount) {
    account.balance -= req.body.amount;  // Race condition!
    await account.save();
  }
});

// CORRECT: Use database transactions with row locking
app.post('/transfer', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',
      [req.body.fromId]
    );
    if (result.rows[0].balance >= req.body.amount) {
      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [req.body.amount, req.body.fromId]
      );
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [req.body.amount, req.body.toId]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});
```

### Prevent TOCTOU in File Operations

```javascript
// WRONG: Check then use (TOCTOU)
if (fs.existsSync(filePath)) {
  const data = fs.readFileSync(filePath); // File may have changed!
}

// CORRECT: Use atomic operations with error handling
try {
  const data = fs.readFileSync(filePath);
  // Process data
} catch (err) {
  if (err.code === 'ENOENT') {
    // File does not exist, handle accordingly
  } else {
    throw err;
  }
}

// For writes, use atomic write patterns
const { writeFileSync, renameSync } = require('fs');
const tmpPath = `${filePath}.tmp.${process.pid}`;
writeFileSync(tmpPath, data, { mode: 0o600 });
renameSync(tmpPath, filePath); // Atomic on same filesystem
```

### Prevent Unsafe Deserialization

```python
# WRONG: Deserializing untrusted data with unsafe formats
# (e.g., formats that allow arbitrary code execution)

# CORRECT: Use JSON for untrusted data
import json
data = json.loads(user_input)  # Safe deserialization

# If YAML is needed, use safe_load
import yaml
data = yaml.safe_load(user_input)  # Not yaml.load()
```

### Prevent ReDoS

```javascript
// WRONG: Vulnerable regex (catastrophic backtracking)
const emailRegex = /^([a-zA-Z0-9]+)*@example\.com$/;

// CORRECT: Use non-backtracking patterns
const emailRegex = /^[a-zA-Z0-9]+@example\.com$/;

// BEST: Use a regex safety library
const safeRegex = require('safe-regex');
if (!safeRegex(pattern)) {
  throw new Error('Potentially unsafe regex pattern');
}
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V15.1 Secure Coding Documentation | -- | Required | Required |
| V15.2 Architecture & Dependencies | Required | Required | Required |
| V15.3 Defensive Coding | Required | Required | Required |
| V15.4 Safe Concurrency | Required | Required | Required |

## References

- [OWASP ASVS V15 -- Secure Coding](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)
- [OWASP Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [OWASP Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
- [CWE-362: Race Condition](https://cwe.mitre.org/data/definitions/362.html)
- [CWE-367: TOCTOU Race Condition](https://cwe.mitre.org/data/definitions/367.html)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)
