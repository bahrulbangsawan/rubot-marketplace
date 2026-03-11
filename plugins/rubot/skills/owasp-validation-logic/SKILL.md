---
name: owasp-validation-logic
version: 1.0.0
description: |
  Audits application code for OWASP ASVS V2 compliance covering input validation, business
  logic security, anti-automation, and validation documentation. Provides verification
  checklists, code review patterns, and remediation guidance for type/length/range validation,
  schema validation, business logic bypass prevention, rate limiting, and bot detection.

  Trigger on: "input validation audit", "business logic security", "validation review",
  "ASVS V2", "schema validation", "rate limiting", "anti-automation", "bot detection",
  "CAPTCHA review", "JSON Schema validation", "allowlist validation", "business logic bypass",
  "credential stuffing prevention", "anti-tampering"

  DO NOT trigger for: output encoding or sanitization (use owasp-encoding-sanitization),
  authentication mechanisms (use owasp-authentication), session management,
  file upload validation (use owasp-file-handling), API structure validation (use owasp-api-security)
agents:
  - debug-master
---

# OWASP ASVS V2 -- Validation and Business Logic Security Audit

## Overview

ASVS V2 ensures applications properly validate all input data and enforce business logic
constraints that cannot be bypassed by manipulating requests. This includes type, length,
and range validation, schema enforcement for structured data, sequential workflow integrity,
and anti-automation controls. Weak validation is a root cause for data corruption, logic
bypass, privilege escalation, and denial-of-service attacks.

## When to Use

- Reviewing input validation across form submissions, API endpoints, or file uploads
- Auditing business logic flows for bypass vulnerabilities (e.g., skipping payment steps)
- Evaluating rate limiting and anti-automation defenses
- Checking API request/response schema validation
- Assessing whether validation rules are documented and consistently applied
- Performing a targeted ASVS V2 compliance check

## Verification Requirements

### V2.1 -- Validation and Business Logic Documentation

| ID | Requirement | Level |
|----|-------------|-------|
| V2.1.1 | Validation rules for each input field are documented (type, length, format, allowed values) | L2 |
| V2.1.2 | Business logic constraints and limits are documented (e.g., max transfer amount, daily limits) | L2 |
| V2.1.3 | Validation is applied consistently on both client and server side | L1 |
| V2.1.4 | A central validation framework or library is used rather than ad-hoc checks | L2 |

**Audit steps:**

1. Check for validation documentation (API specs, OpenAPI/Swagger, JSON Schema definitions).
2. Verify that each API endpoint has explicit validation rules defined.
3. Confirm server-side validation exists even when client-side validation is present.
4. Identify the validation framework in use (Zod, Joi, class-validator, Pydantic, etc.).
5. Look for inconsistencies between client and server validation rules.

### V2.2 -- Input Validation

| ID | Requirement | Level |
|----|-------------|-------|
| V2.2.1 | All input is validated for type (string, number, boolean, date, enum) | L1 |
| V2.2.2 | String inputs have maximum length constraints enforced server-side | L1 |
| V2.2.3 | Numeric inputs have range validation (min/max) | L1 |
| V2.2.4 | Input uses allowlist validation where a finite set of values is expected | L1 |
| V2.2.5 | Email, URL, and other structured formats are validated against standard patterns | L1 |
| V2.2.6 | API request bodies are validated against a schema (JSON Schema, OpenAPI, Zod, etc.) | L1 |
| V2.2.7 | Date and time inputs are validated for format and reasonable range | L1 |
| V2.2.8 | Redirects and forwards validate target URLs against an allowlist | L1 |
| V2.2.9 | Regular expressions used for validation are safe from ReDoS | L2 |

**Audit steps:**

1. Review each endpoint handler for explicit validation before processing.
2. Check that numeric inputs are parsed and range-checked (not just string-checked).
3. Verify enum fields are validated against a defined set of allowed values.
4. Look for missing length limits on text fields, especially those stored in databases.
5. Test URL redirect parameters for open redirect by checking allowlist enforcement.
6. Audit regular expressions for catastrophic backtracking patterns.

### V2.3 -- Business Logic Security

| ID | Requirement | Level |
|----|-------------|-------|
| V2.3.1 | Multi-step processes enforce sequential order and cannot be skipped | L1 |
| V2.3.2 | Business logic limits are enforced server-side (not just UI-enforced) | L1 |
| V2.3.3 | Price, quantity, and financial values cannot be tampered with via client-side manipulation | L1 |
| V2.3.4 | Race conditions in business logic are prevented (e.g., double-spend, double-submit) | L2 |
| V2.3.5 | Time-of-check to time-of-use (TOCTOU) vulnerabilities are mitigated | L2 |
| V2.3.6 | Business rules cannot be bypassed by replaying or reordering requests | L2 |
| V2.3.7 | Negative quantities, negative prices, and integer overflow are handled | L1 |

**Audit steps:**

1. Map out multi-step workflows (checkout, registration, approval) and test each step independently.
2. Verify price and quantity come from server-side sources, not client requests.
3. Check for race conditions in balance updates, inventory changes, and coupon redemption.
4. Look for missing server-side enforcement of business rules visible only in UI code.
5. Test with negative values, zero values, and boundary values.

### V2.4 -- Anti-automation

| ID | Requirement | Level |
|----|-------------|-------|
| V2.4.1 | Rate limiting is applied to authentication endpoints (login, registration, password reset) | L1 |
| V2.4.2 | Rate limiting is applied to sensitive business operations | L2 |
| V2.4.3 | CAPTCHA or equivalent challenge is used after repeated failures | L2 |
| V2.4.4 | Account lockout or progressive delays are implemented for brute-force protection | L1 |
| V2.4.5 | Bot detection mechanisms are in place for public-facing forms | L2 |
| V2.4.6 | API rate limiting uses appropriate identifiers (API key, user ID, IP) | L1 |
| V2.4.7 | Credential stuffing is mitigated through rate limiting and breach password detection | L2 |

**Audit steps:**

1. Identify all authentication and sensitive endpoints.
2. Verify rate limiting middleware is applied (express-rate-limit, Flask-Limiter, etc.).
3. Check that rate limits use appropriate keys (not just IP, which fails behind NAT/proxies).
4. Test whether failed login attempts trigger progressive delays or account lockout.
5. Review CAPTCHA integration for bypass opportunities.

## Code Review Patterns

### Missing Input Validation

```bash
# Endpoints without validation middleware (Express.js)
grep -rn "app\.\(get\|post\|put\|patch\|delete\)(" --include="*.ts" --include="*.js" | grep -v "validate\|schema\|zod\|joi\|yup"

# Direct use of req.body/req.params without validation
grep -rn "req\.body\.\|req\.params\.\|req\.query\." --include="*.ts" --include="*.js"

# Flask endpoints without validation
grep -rn "request\.form\|request\.args\|request\.json" --include="*.py"

# Missing length checks
grep -rn "\.length\|\.size()" --include="*.ts" --include="*.js" | grep -v ">\|<\|max\|min\|limit"
```

### Business Logic Vulnerabilities

```bash
# Client-side price/quantity in request bodies
grep -rn "price\|amount\|total\|discount\|quantity" --include="*.ts" --include="*.js" | grep "req\.body"

# Missing server-side recalculation
grep -rn "total.*=.*req\.\|price.*=.*req\.\|amount.*=.*req\." --include="*.ts" --include="*.js"

# Race condition indicators (missing locks/transactions)
grep -rn "balance\|inventory\|stock\|quantity" --include="*.ts" --include="*.js" | grep -v "transaction\|lock\|atomic"

# Open redirect patterns
grep -rn "redirect(\|res\.redirect\|location.*=\|window\.location" --include="*.ts" --include="*.js" --include="*.tsx"
grep -rn "redirect(\|RedirectResponse\|redirect_to" --include="*.py"
```

### Rate Limiting Gaps

```bash
# Auth endpoints without rate limiting
grep -rn "login\|signin\|register\|signup\|reset-password\|forgot-password" --include="*.ts" --include="*.js" | grep "router\.\|app\."

# Rate limiter configuration
grep -rn "rateLimit\|rate-limit\|RateLimiter\|throttle\|Throttle" --include="*.ts" --include="*.js" --include="*.py"
```

### ReDoS Vulnerable Patterns

```bash
# Complex regex patterns (potential ReDoS)
grep -rn "new RegExp\|/.*[+*].*[+*]" --include="*.ts" --include="*.js"
grep -rn "re\.compile\|re\.match\|re\.search" --include="*.py"
```

## Remediation Guidance

### Schema Validation with Zod (TypeScript)

```typescript
import { z } from 'zod';

// Define schema with type, length, and range validation
const createUserSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(100),
  age: z.number().int().min(13).max(150),
  role: z.enum(['user', 'editor', 'admin']),
  bio: z.string().max(2000).optional(),
});

// Validate in route handler
app.post('/users', (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  // Use result.data -- fully validated and typed
  createUser(result.data);
});
```

### Schema Validation with Pydantic (Python)

```python
from pydantic import BaseModel, Field, validator
from enum import Enum

class UserRole(str, Enum):
    user = "user"
    editor = "editor"
    admin = "admin"

class CreateUserRequest(BaseModel):
    email: str = Field(..., max_length=254, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=13, le=150)
    role: UserRole
    bio: str = Field(None, max_length=2000)

@app.post("/users")
async def create_user(user: CreateUserRequest):
    # Pydantic validates automatically; invalid input returns 422
    return await save_user(user)
```

### Business Logic -- Server-Side Price Calculation

```typescript
// VULNERABLE -- trusting client-sent total
app.post('/checkout', async (req, res) => {
  const { items, total } = req.body; // total from client!
  await processPayment(total);
});

// SAFE -- recalculate server-side
app.post('/checkout', async (req, res) => {
  const { items } = req.body;
  const validatedItems = checkoutSchema.parse(items);

  // Recalculate total from server-side prices
  let total = 0;
  for (const item of validatedItems) {
    const product = await db.products.findById(item.productId);
    if (!product) throw new NotFoundError();
    if (item.quantity < 1 || item.quantity > product.maxQuantity) {
      throw new ValidationError('Invalid quantity');
    }
    total += product.price * item.quantity;
  }

  await processPayment(total);
});
```

### Race Condition Prevention

```typescript
// VULNERABLE -- race condition on balance
app.post('/transfer', async (req, res) => {
  const user = await db.users.findById(req.userId);
  if (user.balance >= req.body.amount) {
    user.balance -= req.body.amount;
    await user.save();
  }
});

// SAFE -- use database transaction with row-level locking
app.post('/transfer', async (req, res) => {
  await db.transaction(async (tx) => {
    const user = await tx.users
      .findById(req.userId)
      .forUpdate(); // row-level lock
    if (user.balance < req.body.amount) {
      throw new InsufficientFundsError();
    }
    await tx.users.update(req.userId, {
      balance: user.balance - req.body.amount,
    });
  });
});
```

### Rate Limiting (Express.js)

```typescript
import rateLimit from 'express-rate-limit';

// Apply to authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // or req.body.email for per-account
});

app.post('/login', authLimiter, loginHandler);
app.post('/register', authLimiter, registerHandler);
app.post('/forgot-password', authLimiter, forgotPasswordHandler);

// Stricter limit for sensitive operations
const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

app.post('/transfer', sensitiveOpLimiter, transferHandler);
```

## ASVS Level Reference

| Section | L1 (Minimum) | L2 (Standard) | L3 (Advanced) |
|---------|-------------|---------------|---------------|
| V2.1 Documentation | Client + server validation consistency | Full validation rule documentation, central framework | Complete business logic specification |
| V2.2 Input Validation | Type/length/range/allowlist, schema validation, format checks | ReDoS-safe regex, redirect allowlists | Comprehensive input fuzzing |
| V2.3 Business Logic | Sequential flow enforcement, server-side limits, no negative values | Race condition prevention, TOCTOU mitigation, replay protection | Full business logic threat model |
| V2.4 Anti-automation | Auth rate limiting, account lockout, API rate limits | CAPTCHA, bot detection, credential stuffing mitigation | Advanced bot detection, behavioral analysis |

## References

- [OWASP ASVS v5.0 -- V2: Validation, Sanitization, and Encoding](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x13-V2-Validation.md)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP Business Logic Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html)
- [OWASP Credential Stuffing Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)
- [OWASP Unvalidated Redirects and Forwards Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [Zod Documentation](https://zod.dev/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [JSON Schema Specification](https://json-schema.org/)
