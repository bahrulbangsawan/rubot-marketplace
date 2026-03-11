---
name: owasp-encoding-sanitization
version: 1.1.0
description: |
  Audits application code for OWASP ASVS V1 compliance covering encoding, sanitization, injection prevention, memory safety, and safe deserialization.
  MUST activate for: encoding audit, sanitization review, injection prevention, XSS audit, output encoding, deserialization security, ASVS V1, double encoding, buffer overflow, parameterized queries, HTML sanitization, DOMPurify, SQL injection review, LDAP injection, OS command injection, encoding architecture.
  Also activate when: user asks to review code for XSS vulnerabilities, check if queries are parameterized, audit innerHTML or unsafe HTML rendering usage, find unsafe deserialization calls, review template escaping, check for command injection risks, scan for insecure XML parsing, or assess output encoding strategy.
  Do NOT activate for: general OWASP overview requests, authentication or session management, file upload handling (use owasp-file-handling), API-specific security (use owasp-api-security), input validation logic (use owasp-validation-logic), cryptography concerns (use owasp-cryptography).
  Covers: output encoding architecture, context-aware encoding (HTML body, attribute, JavaScript, CSS, URL), centralized encoding libraries, SQL injection via parameterized queries, XSS prevention, CSS escaping, LDAP injection, OS command injection, XPath/XML injection, HTML sanitization with DOMPurify/Bleach, allowlist vs denylist sanitization, double-encoding detection, buffer overflow prevention, safe string functions, format string safety, ASLR/DEP/stack canaries, unsafe deserialization (Java ObjectInputStream, Python serializers, PHP unserialize), safe JSON/XML parsing, XXE prevention.
agents:
  - debug-master
---

# OWASP ASVS V1 -- Encoding, Sanitization, and Injection Prevention Audit

## Overview

ASVS V1 addresses how applications handle untrusted data through encoding, sanitization,
injection prevention, memory safety, and deserialization. These controls form the primary
defense against injection attacks -- consistently the most critical class of web application
vulnerabilities. This skill guides a thorough audit of code to verify compliance with each
V1 requirement across ASVS Levels 1, 2, and 3.

## When to Use

- Auditing an application for injection vulnerabilities (SQL, XSS, LDAP, OS command)
- Reviewing output encoding architecture and implementation
- Checking for double-encoding or missing encoding in template rendering
- Evaluating deserialization safety in APIs or message queues
- Assessing memory safety in applications using C/C++ or unmanaged code
- Performing a targeted ASVS V1 compliance check

## Verification Requirements

### V1.1 -- Encoding and Sanitization Architecture

| ID | Requirement | Level |
|----|-------------|-------|
| V1.1.1 | The application has a documented encoding strategy that specifies the processing order and where encoding is applied | L2 |
| V1.1.2 | Output encoding occurs as close to the rendering context as possible, not at input time | L1 |
| V1.1.3 | The application avoids double encoding by encoding only once at the output stage | L1 |
| V1.1.4 | Encoding is context-aware (HTML body, attribute, JavaScript, CSS, URL each use different encoding) | L1 |
| V1.1.5 | A centralized encoding library or framework feature is used rather than ad-hoc encoding | L2 |

**Audit steps:**

1. Identify where user input enters the system (request params, headers, database reads, file reads).
2. Trace each input to its output context and verify encoding is applied at output, not input.
3. Confirm encoding functions match the output context (e.g., HTML entity encoding for HTML body, JavaScript string escaping for inline JS).
4. Check for double-encoding symptoms: `&amp;amp;`, `%2520`, `&#38;amp;`.
5. Verify a single encoding library is used consistently (e.g., OWASP Java Encoder, `he` for Node.js).

### V1.2 -- Injection Prevention

| ID | Requirement | Level |
|----|-------------|-------|
| V1.2.1 | All SQL queries use parameterized queries or prepared statements | L1 |
| V1.2.2 | Output encoding is applied for HTML contexts to prevent reflected and stored XSS | L1 |
| V1.2.3 | Context-specific escaping is used for JavaScript output contexts | L1 |
| V1.2.4 | CSS values from user input are properly escaped or validated against allowlists | L1 |
| V1.2.5 | URL parameters are encoded using percent-encoding | L1 |
| V1.2.6 | LDAP special characters are escaped in LDAP queries | L2 |
| V1.2.7 | OS command arguments are escaped or avoided entirely (prefer language APIs over shell invocation) | L1 |
| V1.2.8 | XPath and XML injection is prevented through parameterization or escaping | L2 |

**Audit steps:**

1. Search for raw SQL string concatenation (see grep patterns below).
2. Identify all template rendering and verify auto-escaping is enabled or manual escaping is applied.
3. Check for `innerHTML`, `document.write`, `eval()` usage with user-controlled data.
4. Review any OS command invocation (child_process, subprocess) for argument injection.
5. Verify LDAP queries escape DN and filter special characters.

### V1.3 -- Sanitization

| ID | Requirement | Level |
|----|-------------|-------|
| V1.3.1 | When encoding is not possible, input is sanitized to remove dangerous characters | L1 |
| V1.3.2 | Rich text / HTML input is sanitized using a trusted library (e.g., DOMPurify, Bleach) | L1 |
| V1.3.3 | Sanitization is applied after decoding and canonicalization to prevent bypass | L1 |
| V1.3.4 | The sanitization allowlist approach is preferred over denylist | L2 |

**Audit steps:**

1. Find any custom regex-based sanitization and assess for bypass.
2. Verify HTML sanitization uses DOMPurify (client) or a server-side equivalent (Bleach, sanitize-html).
3. Confirm sanitization runs after URL decoding, Unicode normalization, and other transformations.
4. Check that allowlists define permitted characters/tags rather than trying to block known-bad.

### V1.4 -- Memory, String, and Unmanaged Code

| ID | Requirement | Level |
|----|-------------|-------|
| V1.4.1 | Buffer boundaries are checked to prevent overflow | L2 |
| V1.4.2 | Format strings do not accept user input | L2 |
| V1.4.3 | Stack canaries / ASLR / DEP are enabled in compiled binaries | L3 |
| V1.4.4 | Safe string functions are used (e.g., `strncpy` over `strcpy`, `snprintf` over `sprintf`) | L2 |

**Audit steps:**

1. For C/C++ code, search for unsafe functions: `strcpy`, `strcat`, `sprintf`, `gets`, `scanf`.
2. Check compiler flags for `-fstack-protector`, `-D_FORTIFY_SOURCE`, PIE, ASLR enablement.
3. Verify format string functions never accept user-controlled format arguments.
4. For managed languages (Java, C#, Go), verify native/FFI calls handle buffer sizes.

### V1.5 -- Safe Deserialization

| ID | Requirement | Level |
|----|-------------|-------|
| V1.5.1 | Untrusted data is not deserialized using unsafe methods (e.g., Java ObjectInputStream, Python pickle, PHP unserialize, Ruby Marshal) | L1 |
| V1.5.2 | JSON parsing uses safe parsers (JSON.parse, Jackson with default typing disabled) | L1 |
| V1.5.3 | XML parsing disables external entity resolution (XXE prevention) | L1 |
| V1.5.4 | Deserialized data is validated against an expected schema before use | L2 |

**Audit steps:**

1. Search for insecure deserialization methods (see grep patterns below).
2. Verify XML parsers disable DTD processing and external entities.
3. Confirm JSON parsers do not enable polymorphic type handling without safeguards.
4. Check that deserialized objects are validated before use in business logic.

## Code Review Patterns

Use these grep/search patterns to identify potential vulnerabilities:

### SQL Injection

```
# String concatenation in SQL (JavaScript/TypeScript)
Pattern: query.*\`.*\$\{    (in *.ts, *.js files)
Pattern: query.*+.*req\.    (in *.ts, *.js files)
Pattern: execute.*".*+.*"   (in *.ts, *.js files)

# Raw queries without parameterization (Python)
Pattern: execute.*%s        (in *.py files)
Pattern: execute.*f"        (in *.py files)
Pattern: cursor\.execute.*+ (in *.py files)

# Java SQL concatenation
Pattern: Statement.*execute.*".*+.*" (in *.java files)
Pattern: createQuery.*".*+.*"       (in *.java files)
```

### XSS / Output Encoding

```
# Dangerous DOM manipulation (JavaScript)
Pattern: innerHTML\s*=           (in *.ts, *.tsx, *.js, *.jsx files)
Pattern: document\.write          (in *.ts, *.js files)
Pattern: dangerouslySetInnerHTML  (in *.tsx, *.jsx files)
Pattern: v-html                   (in *.vue files)
Pattern: \|safe                   (in *.html files -- Django/Jinja2 safe filter)
Pattern: <%=.*%>                  (in *.ejs files -- unescaped EJS output)

# Bypass of template auto-escaping
Pattern: markSafe\|mark_safe\|Markup(  (in *.py files)
Pattern: Html\.Raw\|@Html\.Raw         (in *.cshtml files)
```

### OS Command Injection

```
# Shell invocation with user input
Pattern: child_process\|execSync\|spawn(  (in *.ts, *.js files)
Pattern: subprocess\.call\|subprocess\.Popen\|subprocess\.run  (in *.py files)
Pattern: Runtime\.getRuntime\(\)\.exec\|ProcessBuilder  (in *.java files)
Pattern: passthru(\|shell_exec(  (in *.php files)
```

### Insecure Deserialization

```
# Java deserialization
Pattern: ObjectInputStream\|readObject\|readUnshared  (in *.java files)
Pattern: XMLDecoder\|XStream  (in *.java files)

# Python deserialization
Pattern: pickle\.load\|pickle\.loads\|yaml\.load\b  (in *.py files)
Pattern: marshal\.load\|shelve\.open  (in *.py files)

# PHP deserialization
Pattern: unserialize(  (in *.php files)

# Node.js deserialization
Pattern: node-serialize\|serialize-javascript\|cryo  (in *.js, *.ts files)

# XXE in XML parsing
Pattern: XMLParser\|DOMParser\|SAXParser\|etree\.parse  (in *.py, *.java, *.js files)
Pattern: FEATURE.*external-general-entities  (in *.java files)
```

### Unsafe Memory Operations (C/C++)

```
Pattern: \bstrcpy\b\|\bstrcat\b\|\bsprintf\b\|\bgets\b\|\bscanf\b  (in *.c, *.cpp, *.h files)
Pattern: malloc\|calloc\|realloc\|free  (in *.c, *.cpp files)
```

## Remediation Guidance

### SQL Injection -- Use Parameterized Queries

**TypeScript/Node.js:**

```typescript
// INSECURE -- string interpolation in SQL
const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

// SECURE -- parameterized query
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// SECURE -- using an ORM (Drizzle example)
const result = await db.select().from(users).where(eq(users.id, userId));
```

**Python:**

```python
# INSECURE -- string interpolation
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# SECURE -- parameterized
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

### XSS -- Context-Appropriate Encoding

```typescript
// INSECURE -- innerHTML with user data
element.innerHTML = userComment;

// SECURE -- use textContent for plain text
element.textContent = userComment;

// SECURE -- use DOMPurify for rich text
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userComment);
```

```jsx
// React auto-escapes by default -- this is safe
return <div>{userInput}</div>;

// INSECURE -- bypasses React's escaping
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;

// SECURE -- sanitize before using dangerouslySetInnerHTML
return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />;
```

### OS Command Injection -- Avoid Shell Invocation

```typescript
// INSECURE -- shell invocation via string interpolation
import { execSync } from 'child_process';
const output = execSync(`ls ${userPath}`);

// SECURE -- use execFile with array arguments to avoid shell interpretation
import { execFileSync } from 'child_process';
const output = execFileSync('ls', [userPath]);

// SAFEST -- use Node.js built-in APIs instead of spawning processes
import { readdir } from 'fs/promises';
const files = await readdir(userPath);
```

### Safe Deserialization

**Python:**

```python
# INSECURE -- arbitrary code via deserialization
import pickle
data = pickle.loads(untrusted_bytes)

# SECURE -- use JSON
import json
data = json.loads(untrusted_string)

# SECURE YAML -- always use safe_load
import yaml
data = yaml.safe_load(untrusted_string)
```

**Java:**

```java
// INSECURE -- unrestricted deserialization
ObjectInputStream ois = new ObjectInputStream(inputStream);
Object obj = ois.readObject();

// SECURE -- use JSON with Jackson (disable default typing)
ObjectMapper mapper = new ObjectMapper();
// Do NOT enable: mapper.enableDefaultTyping();
MyClass obj = mapper.readValue(jsonString, MyClass.class);
```

### XXE Prevention

**Python:**

```python
# SECURE -- disable external entities in lxml
from lxml import etree
parser = etree.XMLParser(resolve_entities=False, no_network=True)
tree = etree.parse(source, parser)
```

**Java:**

```java
// SECURE -- disable DTDs and external entities
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

## ASVS Level Reference

| Section | L1 (Minimum) | L2 (Standard) | L3 (Advanced) |
|---------|-------------|---------------|---------------|
| V1.1 Encoding Architecture | Output encoding at render time, context-aware encoding | Documented encoding strategy, centralized library | Full architecture review |
| V1.2 Injection Prevention | Parameterized SQL, HTML/JS/CSS/URL encoding, no shell invocation with user input | LDAP escaping, XPath parameterization | All injection vectors covered |
| V1.3 Sanitization | Trusted HTML sanitizer, sanitize after decode | Allowlist approach | Custom sanitizer audit |
| V1.4 Memory Safety | -- | Buffer checks, safe string functions, no user format strings | ASLR/DEP/stack canaries |
| V1.5 Deserialization | No unsafe deserialization, safe JSON/XML parsing | Schema validation of deserialized data | Full deserialization audit |

## References

- [OWASP ASVS v5.0 -- V1: Encoding, Sanitization](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x12-V1-Encoding-Sanitization.md)
- [OWASP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
- [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [OWASP Java Encoder](https://owasp.org/owasp-java-encoder/)
