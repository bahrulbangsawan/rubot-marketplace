---
name: owasp-authentication
version: 1.1.0
description: |
  Audits authentication mechanisms against OWASP ASVS v5.0 Chapter V6 covering password security, MFA, credential lifecycle, out-of-band auth, cryptographic authentication (FIDO/WebAuthn), and IdP integration.
  MUST activate for: authentication audit, password security review, MFA review, login security, credential management audit, ASVS V6, brute force protection, account lockout review, WebAuthn audit, FIDO review, IdP integration review, password policy review, authentication bypass.
  Also activate when: user asks to review login or registration code, check password hashing algorithm, audit MFA enrollment flow, verify brute-force protections on login endpoint, check for default credentials, review password reset token expiration, assess better-auth configuration, or evaluate TOTP drift window settings.
  Do NOT activate for: session management (use owasp-session-management), OAuth/OIDC flows (use owasp-oauth-oidc), JWT token validation (use owasp-self-contained-tokens), authorization/RBAC (use owasp-authorization), general secure coding patterns (use owasp-secure-coding).
  Covers: authentication documentation, password length/complexity policy (NIST-aligned), breach password list checking, password hashing (bcrypt, scrypt, Argon2id), password hints prohibition, password change verification, MFA enforcement, account lockout and progressive delays, credential stuffing prevention, default credential detection, generic authentication error messages, anti-automation (CAPTCHA), secure enrollment and identity verification, time-limited single-use reset tokens, recovery notification, TOTP drift and single-use validation, backup codes entropy, SMS/email OTP expiration, push notification context, WebAuthn/FIDO challenge-response, attestation verification, IdP assertion validation (SAML/OIDC), assertion replay prevention, better-auth integration audit.
agents:
  - debug-master
---

# OWASP ASVS V6 -- Authentication Audit

## Overview

This skill audits authentication implementations against OWASP ASVS v5.0
Chapter V6. Authentication is the process of verifying the identity of a user,
device, or system. Weak authentication is one of the most exploited attack
vectors, enabling account takeover, credential stuffing, and unauthorized access.

This skill covers eight sub-sections:

| Section | Topic |
|---------|-------|
| V6.1 | Authentication Documentation |
| V6.2 | Password Security |
| V6.3 | General Authentication Security |
| V6.4 | Authentication Factor Lifecycle and Recovery |
| V6.5 | General Multi-factor Authentication |
| V6.6 | Out-of-Band Authentication |
| V6.7 | Cryptographic Authentication (FIDO/WebAuthn) |
| V6.8 | Authentication with Identity Providers |

## When to Use

- Reviewing login, registration, or password-reset code
- Auditing MFA enrollment and verification flows
- Evaluating brute-force / account-lockout mechanisms
- Reviewing WebAuthn / FIDO / passkey implementations
- Assessing IdP integration (SAML, OIDC federation)
- Checking password hashing and storage
- Validating credential recovery flows

## Verification Requirements

### V6.1 -- Authentication Documentation

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.1.1 | Document all authentication mechanisms, MFA configuration, and password policies | | X | X |
| 6.1.2 | Document the trust boundaries between authentication components | | X | X |
| 6.1.3 | Document which authentication mechanisms are used for which sensitivity levels | | X | X |

**Checklist:**
- [ ] Authentication architecture diagram exists
- [ ] Password policy is documented (length, complexity, rotation)
- [ ] MFA requirements by user role are documented
- [ ] Recovery flow documentation is current

### V6.2 -- Password Security

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.2.1 | Minimum password length of 8 characters (12+ recommended) | X | X | X |
| 6.2.2 | No maximum password length below 64 characters | X | X | X |
| 6.2.3 | No character composition rules (uppercase, special chars, etc.) | X | X | X |
| 6.2.4 | Passwords checked against a breach/common-password list | X | X | X |
| 6.2.5 | Passwords stored using approved one-way hash (bcrypt, scrypt, Argon2id) | X | X | X |
| 6.2.6 | No password hints stored or disclosed | X | X | X |
| 6.2.7 | Password change requires current password verification | X | X | X |

**Checklist:**
- [ ] Minimum length >= 8 (12+ at L2/L3)
- [ ] Maximum length >= 64
- [ ] No composition rules enforced
- [ ] Breach password list checked on registration and password change
- [ ] Hash algorithm is bcrypt (cost >= 10), scrypt, or Argon2id
- [ ] No password hints in database schema
- [ ] Password change endpoint requires old password

### V6.3 -- General Authentication Security

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.3.1 | MFA required for all users at L2+, hardware-based at L3 | | X | X |
| 6.3.2 | Account lockout or brute-force protection after N failed attempts | X | X | X |
| 6.3.3 | Credential stuffing prevention (rate limiting, CAPTCHA, IP blocking) | X | X | X |
| 6.3.4 | No default or well-known credentials in production | X | X | X |
| 6.3.5 | Authentication error messages do not reveal whether account exists | X | X | X |
| 6.3.6 | Anti-automation controls on authentication endpoints | X | X | X |

**Checklist:**
- [ ] MFA enforced at L2+, hardware-based MFA at L3
- [ ] Account lockout after 5-10 failed attempts with progressive delays
- [ ] Rate limiting on login endpoint (e.g., 10 attempts per minute)
- [ ] No default admin/admin, test/test credentials
- [ ] Generic error: "Invalid credentials" (not "User not found")
- [ ] CAPTCHA or similar anti-automation after threshold

### V6.4 -- Authentication Factor Lifecycle and Recovery

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.4.1 | Secure enrollment requires identity verification | X | X | X |
| 6.4.2 | Recovery does not bypass MFA (must use equivalent or stronger factor) | | X | X |
| 6.4.3 | Reset flow uses time-limited, single-use tokens | X | X | X |
| 6.4.4 | Reset tokens invalidated after use or expiry | X | X | X |
| 6.4.5 | Account recovery notifies user on all registered channels | | X | X |

**Checklist:**
- [ ] MFA enrollment requires authenticated session or identity proof
- [ ] Password reset does not disable MFA
- [ ] Reset tokens expire within 1 hour
- [ ] Reset tokens are single-use
- [ ] User notified via email/SMS on credential changes

### V6.5 -- General Multi-factor Authentication

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.5.1 | Lookup secrets (backup codes) are single-use and sufficiently random | | X | X |
| 6.5.2 | TOTP codes validated with at most 1 time-step drift | | X | X |
| 6.5.3 | TOTP time window is appropriately limited (30-60 seconds) | | X | X |
| 6.5.4 | TOTP codes are single-use within the validity window | | X | X |

**Checklist:**
- [ ] Backup codes are >= 112 bits of entropy
- [ ] Backup codes marked as used after single use
- [ ] TOTP drift window <= 1 step (30 seconds each side)
- [ ] TOTP code replay within same window is rejected

### V6.6 -- Out-of-Band Authentication

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.6.1 | Push notifications preferred over SMS for OOB auth | | X | X |
| 6.6.2 | SMS-based OTP is time-limited and single-use | X | X | X |
| 6.6.3 | Email not used as sole authentication factor | X | X | X |
| 6.6.4 | OOB verifier expires after reasonable timeout | X | X | X |

**Checklist:**
- [ ] SMS OTP expires within 10 minutes
- [ ] SMS OTP is single-use
- [ ] Email magic links expire within 15 minutes
- [ ] Push notification includes context (IP, location, device)

### V6.7 -- Cryptographic Authentication (FIDO/WebAuthn)

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.7.1 | FIDO/WebAuthn supported for passwordless or second factor | | | X |
| 6.7.2 | Challenge-response uses server-generated random challenges | | | X |
| 6.7.3 | Authenticator attestation verified when required | | | X |
| 6.7.4 | Smart card / certificate-based authentication supported | | | X |

**Checklist:**
- [ ] WebAuthn registration stores credential ID and public key
- [ ] Challenge is >= 16 bytes, cryptographically random
- [ ] Replay protection via challenge binding
- [ ] Attestation format validated (packed, tpm, android-key, etc.)

### V6.8 -- Authentication with Identity Providers

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 6.8.1 | IdP assertions validated (signature, expiry, audience) | X | X | X |
| 6.8.2 | IdP communication uses TLS | X | X | X |
| 6.8.3 | Assertion replay prevention (nonce, timestamp, one-time-use) | | X | X |
| 6.8.4 | IdP spoofing prevention (certificate pinning, metadata validation) | | X | X |

**Checklist:**
- [ ] SAML assertion signature verified
- [ ] SAML assertion audience matches SP entity ID
- [ ] OIDC ID token validated (sig, exp, aud, iss)
- [ ] IdP metadata fetched over TLS with certificate validation

## better-auth Integration

Since the project tech stack uses `better-auth`, audit its configuration against ASVS V6 requirements.

### better-auth Configuration Audit Checklist

```typescript
// auth.ts — typical better-auth setup
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  // V6.2.1 — Check minimum password length (default is 8, should be 8+)
  // V6.2.2 — Check max password length (better-auth defaults to 128, OK)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,         // ✅ L2/L3: 12+ recommended
    maxPasswordLength: 128,        // ✅ >= 64
    autoSignIn: false,             // ✅ Require explicit login after registration
    requireEmailVerification: true, // ✅ V6.4.1: Verify identity on enrollment
    sendResetPassword: async ({ user, url }) => {
      // V6.4.3: Reset tokens are time-limited (better-auth default: 1 hour ✅)
      // Verify: email contains one-time link, NOT the password itself
      await sendEmail({ to: user.email, subject: 'Reset', url });
    },
  },

  // V6.2.5 — Password hashing algorithm
  // better-auth uses bcrypt by default (cost=10). Verify:
  //   - cost factor >= 10 (default ✅)
  //   - or switch to argon2id/scrypt for L3
  // To override: set `hash` and `verify` in advanced config

  // V6.3.1 — MFA at L2+
  // Requires the twoFactor plugin
  plugins: [
    twoFactor({
      issuer: 'MyApp',
      // V6.5.2: TOTP drift window <= 1 step
      totpOptions: { window: 1, period: 30 },
      // V6.5.1: Backup codes are single-use
      backupCodes: { count: 10, length: 10 },
    }),
  ],

  // V6.3.2 — Rate limiting / brute-force protection
  rateLimit: {
    enabled: true,
    window: 60,       // 60 seconds
    max: 10,          // 10 attempts per window
    // Custom storage for distributed rate limiting:
    // storage: 'redis',
  },

  // V6.3.5 — Generic error messages
  // better-auth returns generic errors by default ✅
  // Verify: custom error handlers don't leak user existence

  // V6.8 — Identity Provider integration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  // V7.2 — Session security (see owasp-session-management for full audit)
  session: {
    expiresIn: 60 * 60 * 24,         // 24 hours absolute timeout
    updateAge: 60 * 60,               // Refresh session token every hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                 // 5 min cookie cache
    },
  },

  // V13.3 — Secret management
  secret: process.env.BETTER_AUTH_SECRET!,  // ✅ From env, not hardcoded
});
```

### better-auth ASVS Verification Matrix

| ASVS Req | better-auth Feature | Default Status | Action Needed |
|----------|-------------------|----------------|---------------|
| V6.2.1 | `minPasswordLength` | 8 (OK for L1) | Set 12+ for L2/L3 |
| V6.2.2 | `maxPasswordLength` | 128 | None (compliant) |
| V6.2.3 | No composition rules | Not enforced | None (compliant) |
| V6.2.4 | Breach password check | Not built-in | Add custom `password` validator with HaveIBeenPwned API |
| V6.2.5 | bcrypt (cost 10) | Compliant | Consider Argon2id for L3 |
| V6.3.1 | MFA via `twoFactor` plugin | Not enabled by default | Enable plugin for L2+ |
| V6.3.2 | `rateLimit` config | Disabled by default | Enable and configure |
| V6.3.5 | Generic error messages | Compliant | Verify custom handlers |
| V6.4.3 | Reset token expiry | 1 hour | Compliant |
| V6.8.1 | Social provider validation | Handles automatically | Verify IdP config |
| V7.2 | `session` config | Database-backed | Compliant |
| V7.3 | `expiresIn` + `updateAge` | Configurable | Set appropriate timeouts |

### better-auth Gaps to Address

1. **Breach password checking (V6.2.4)** — Add a custom password validator:
```typescript
import { betterAuth } from 'better-auth';
import crypto from 'crypto';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      async validate(password) {
        // Check against HaveIBeenPwned
        const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = sha1.substring(0, 5);
        const suffix = sha1.substring(5);
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await res.text();
        if (text.split('\n').some(line => line.startsWith(suffix))) {
          return { valid: false, message: 'This password has appeared in a data breach. Choose a different one.' };
        }
        return { valid: true };
      },
    },
  },
});
```

2. **Argon2id for L3 (V6.2.5)** — Override the default hasher:
```typescript
import { betterAuth } from 'better-auth';
import argon2 from 'argon2';

export const auth = betterAuth({
  advanced: {
    hash: {
      hash: (password) => argon2.hash(password, { type: argon2.argon2id }),
      verify: ({ hash, password }) => argon2.verify(hash, password),
    },
  },
});
```

3. **WebAuthn/Passkeys for L3 (V6.7)** — Use the passkey plugin:
```typescript
import { betterAuth } from 'better-auth';
import { passkey } from 'better-auth/plugins/passkey';

export const auth = betterAuth({
  plugins: [
    passkey({
      rpID: 'example.com',
      rpName: 'My App',
      origin: 'https://example.com',
    }),
  ],
});
```

## Code Review Patterns

Use these search patterns to locate authentication-related code for review.

### better-auth Configuration

```bash
# Find better-auth setup files
grep -rn "betterAuth\|better-auth\|from.*better.auth" --include="*.{ts,js,tsx}"

# Check password length config
grep -rn "minPasswordLength\|maxPasswordLength" --include="*.{ts,js}"

# Check rate limiting
grep -rn "rateLimit" --include="*.{ts,js}" | grep -i "auth\|login\|better"

# Check MFA/2FA plugin
grep -rn "twoFactor\|two-factor\|totp\|passkey" --include="*.{ts,js}" | grep -i "plugin\|better"

# Check session config
grep -rn "expiresIn\|updateAge\|cookieCache" --include="*.{ts,js}" | grep -i "session\|auth"

# Check for hardcoded secrets
grep -rn "secret.*['\"].*[a-zA-Z0-9]" --include="*.{ts,js}" | grep -i "auth\|better"
```

### Password Policy Violations

```bash
# Find hardcoded password length limits
grep -rn "minlength\|minLength\|MIN_PASSWORD\|min_password\|password.*length" --include="*.{ts,js,py,java,rb,go}"

# Find password composition rules (anti-pattern)
grep -rn "uppercase\|lowercase\|special.*char\|digit.*required\|complexity" --include="*.{ts,js,py,java,rb,go}"

# Find password maximum length restrictions (anti-pattern if < 64)
grep -rn "maxlength\|maxLength\|MAX_PASSWORD\|max_password" --include="*.{ts,js,py,java,rb,go}"

# Find weak password hashing
grep -rn "md5\|sha1\|sha256\|SHA-1\|SHA-256\|createHash" --include="*.{ts,js,py,java,rb,go}"

# Find password hints
grep -rn "password.*hint\|hint.*password\|security.*question\|secret.*question" --include="*.{ts,js,py,java,rb,go}"
```

### Authentication Error Disclosure

```bash
# Find user enumeration in error messages
grep -rn "user.*not.*found\|email.*not.*registered\|account.*does.*not.*exist\|no.*account\|unknown.*user" --include="*.{ts,js,py,java,rb,go}"

# Find login error messages
grep -rn "invalid.*password\|wrong.*password\|incorrect.*password\|password.*incorrect" --include="*.{ts,js,py,java,rb,go}"
```

### Brute-Force Protection

```bash
# Find rate limiting on auth endpoints
grep -rn "rateLimit\|rate_limit\|throttle\|lockout\|max.*attempts\|failed.*attempts\|login.*attempts" --include="*.{ts,js,py,java,rb,go}"

# Find CAPTCHA implementations
grep -rn "captcha\|recaptcha\|hcaptcha\|turnstile" --include="*.{ts,js,py,java,rb,go,html}"
```

### MFA Implementation

```bash
# Find TOTP implementations
grep -rn "totp\|speakeasy\|otplib\|pyotp\|authenticator\|two.factor\|2fa\|mfa" --include="*.{ts,js,py,java,rb,go}"

# Find backup code handling
grep -rn "backup.*code\|recovery.*code\|lookup.*secret" --include="*.{ts,js,py,java,rb,go}"

# Find WebAuthn / FIDO
grep -rn "webauthn\|fido\|passkey\|authenticatorAttachment\|attestation\|PublicKeyCredential" --include="*.{ts,js,py,java,rb,go}"
```

### Default Credentials

```bash
# Find default or hardcoded credentials
grep -rn "admin.*admin\|password.*=.*['\"]password\|default.*password\|test.*test\|changeme" --include="*.{ts,js,py,java,rb,go,yml,yaml,json,env}"
```

## Remediation Guidance

### Secure Password Hashing (Node.js / bcrypt)

```javascript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Cost factor >= 10

async function hashPassword(plaintext) {
  // bcrypt truncates at 72 bytes; validate length first
  if (plaintext.length < 8) throw new Error('Password too short');
  if (plaintext.length > 64) throw new Error('Password too long');
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}
```

### Secure Password Hashing (Python / Argon2id)

```python
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    type=argon2.Type.ID  # Argon2id
)

def hash_password(plaintext: str) -> str:
    return ph.hash(plaintext)

def verify_password(plaintext: str, hash_str: str) -> bool:
    try:
        return ph.verify(hash_str, plaintext)
    except argon2.exceptions.VerifyMismatchError:
        return False
```

### Breach Password Check

```javascript
import crypto from 'crypto';

async function isBreachedPassword(password) {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.substring(0, 5);
  const suffix = sha1.substring(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await response.text();

  return text.split('\n').some(line => line.startsWith(suffix));
}
```

### Generic Authentication Error Response

```javascript
// WRONG -- reveals whether account exists
if (!user) return res.status(401).json({ error: 'User not found' });
if (!validPassword) return res.status(401).json({ error: 'Wrong password' });

// CORRECT -- generic message
return res.status(401).json({ error: 'Invalid credentials' });
```

### Brute-Force Protection with Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

### TOTP Validation with Drift Limit

```javascript
import { authenticator } from 'otplib';

// Allow at most 1 step drift (30 seconds each side)
authenticator.options = { window: 1 };

function verifyTOTP(token, secret) {
  return authenticator.verify({ token, secret });
}
```

### WebAuthn Registration (Server-side)

```javascript
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

const options = await generateRegistrationOptions({
  rpName: 'My App',
  rpID: 'example.com',
  userID: user.id,
  userName: user.email,
  attestationType: 'direct',
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'required',
  },
});
// Challenge is automatically >= 16 bytes, cryptographically random

const verification = await verifyRegistrationResponse({
  response: credential,
  expectedChallenge: storedChallenge,
  expectedOrigin: 'https://example.com',
  expectedRPID: 'example.com',
});
```

## ASVS Level Reference

| Level | Description | Authentication Requirements |
|-------|-------------|----------------------------|
| L1 | Baseline | Password security, brute-force protection, generic errors |
| L2 | Standard | All L1 + MFA required, secure recovery, breach password checks |
| L3 | Advanced | All L2 + hardware-based MFA, WebAuthn/FIDO, cryptographic auth |

## References

- [OWASP ASVS v5.0 -- V6 Authentication](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x14-V6-Authentication.md)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [WebAuthn Guide](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)
