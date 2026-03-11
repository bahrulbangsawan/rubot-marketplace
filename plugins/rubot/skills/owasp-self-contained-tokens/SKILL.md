---
name: owasp-self-contained-tokens
version: 1.1.0
description: |
  Audits self-contained token implementations (JWT, PASETO, etc.) against OWASP ASVS v5.0 Chapter V9 covering token source verification, signature validation, algorithm restrictions, key management, expiration, audience/issuer/scope validation, and cross-service token reuse prevention.
  MUST activate for: JWT security audit, token validation review, JWT best practices, ASVS V9, self-contained token, JWT algorithm confusion, alg none attack, JWT signing key, token expiration review, JWT claims validation, JOSE header security, PASETO review, token reuse prevention.
  Also activate when: user asks to review jwt.verify or jwt.decode calls, check if JWT algorithm is hardcoded, audit token expiration and lifetime settings, find hardcoded JWT secrets, verify audience and issuer claims are validated, review JWKS endpoint configuration, assess token refresh and rotation strategy, or check for sensitive data stored in JWT payloads.
  Do NOT activate for: session tokens / cookies (use owasp-session-management), OAuth/OIDC flows (use owasp-oauth-oidc), authentication mechanisms (use owasp-authentication), general cryptography (use owasp-cryptography).
  Covers: trusted issuer (iss) verification, token signature validation, algorithm restriction (no alg:none, no algorithm switching), approved algorithms (RS256, ES256, EdDSA), strong signing keys (RSA >= 2048-bit, EC P-256+), key rotation and JWKS endpoint, integrity-before-claims processing, expiration (exp) and not-before (nbf) enforcement, audience (aud) and issuer (iss) claim validation, subject (sub) identification, scope/permissions claim validation, cross-service reuse prevention, short token lifetimes (access 5-15 min), no sensitive data in payload, JTI-based revocation and replay prevention, algorithm none attack, RS256-to-HS256 confusion, weak HMAC secret brute-forcing, JWKS spoofing/JKU injection, kid injection, token lifetime abuse, jsonwebtoken/jose/PyJWT library patterns.
agents:
  - debug-master
---

# OWASP ASVS V9 -- Self-Contained Token Audit

## Overview

This skill audits self-contained token implementations (primarily JWT, but
also PASETO and similar formats) against OWASP ASVS v5.0 Chapter V9.
Self-contained tokens carry claims within the token itself, enabling stateless
verification. However, improper implementation leads to critical
vulnerabilities including authentication bypass, privilege escalation, and
unauthorized access.

This skill covers two sub-sections:

| Section | Topic |
|---------|-------|
| V9.1 | Token Source and Integrity |
| V9.2 | Token Content |

## When to Use

- Reviewing JWT creation and validation logic
- Auditing token signing algorithms and key management
- Evaluating token expiration and claim validation
- Testing for JWT-specific attacks (alg:none, key confusion)
- Reviewing JOSE header handling
- Assessing cross-service token reuse risks
- Checking token refresh and rotation mechanisms

## Verification Requirements

### V9.1 -- Token Source and Integrity

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 9.1.1 | Tokens verified against a trusted issuer (iss claim) | X | X | X |
| 9.1.2 | Token signature validated using a trusted key | X | X | X |
| 9.1.3 | Signing algorithm explicitly restricted (no alg:none, no algorithm switching) | X | X | X |
| 9.1.4 | Only approved algorithms accepted (RS256, ES256, EdDSA; no HS256 for public clients) | X | X | X |
| 9.1.5 | Signing keys are strong (RSA >= 2048-bit, EC P-256+) | X | X | X |
| 9.1.6 | Key rotation supported without service disruption | | X | X |
| 9.1.7 | JWK Set (JWKS) endpoint used for public key distribution | | X | X |
| 9.1.8 | Token integrity verified before any claim processing | X | X | X |

**Checklist:**
- [ ] iss claim validated against allowlist of trusted issuers
- [ ] Signature verified before processing any claims
- [ ] Algorithm hardcoded in verification config (not read from token header)
- [ ] alg:none explicitly rejected
- [ ] HS256 not used with public/shared keys
- [ ] RSA keys >= 2048 bits, EC keys >= P-256
- [ ] JWKS endpoint available for key distribution
- [ ] Key rotation mechanism in place

### V9.2 -- Token Content

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 9.2.1 | Expiration (exp) claim validated and enforced | X | X | X |
| 9.2.2 | Not-before (nbf) claim validated when present | X | X | X |
| 9.2.3 | Audience (aud) claim validated (token intended for this service) | X | X | X |
| 9.2.4 | Issuer (iss) claim validated against trusted issuers | X | X | X |
| 9.2.5 | Subject (sub) claim validated and used for user identification | X | X | X |
| 9.2.6 | Scope/permissions claims validated for the requested operation | X | X | X |
| 9.2.7 | Cross-service token reuse prevented (aud restriction) | | X | X |
| 9.2.8 | Token lifetime is appropriately short (access: 5-15 min, refresh: hours-days) | X | X | X |
| 9.2.9 | Sensitive data not stored in token payload (PII, secrets) | X | X | X |
| 9.2.10 | JTI (JWT ID) claim used for revocation/replay prevention at L3 | | | X |

**Checklist:**
- [ ] exp claim present and validated (reject expired tokens)
- [ ] nbf claim validated when present (reject tokens not yet valid)
- [ ] aud claim matches the current service identifier
- [ ] iss claim matches the expected authorization server
- [ ] sub claim used for user identification (not email or other mutable field)
- [ ] Scopes in token checked against endpoint requirements
- [ ] Tokens cannot be reused across different services
- [ ] Access token lifetime <= 15 minutes
- [ ] No PII, passwords, or secrets in JWT payload
- [ ] At L3: JTI claim enables token revocation

## JWT Attack Patterns

### 1. Algorithm None Attack

The attacker modifies the JWT header to use `"alg": "none"`, removing the
signature. Vulnerable libraries accept unsigned tokens.

```
# Attack: modify header to alg:none, remove signature
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.
```

### 2. Algorithm Confusion (RS256 to HS256)

When a service uses RS256 (asymmetric), the attacker switches to HS256
(symmetric) and signs with the public key (which is often publicly available).

### 3. Weak HMAC Secret

Short or predictable HMAC secrets can be brute-forced offline using the
token's signature.

```bash
# Tools for JWT secret brute-forcing
hashcat -m 16500 jwt.txt wordlist.txt
jwt-cracker <token>
```

### 4. JWKS Spoofing / JKU Injection

The attacker injects a `jku` (JWK Set URL) header pointing to an
attacker-controlled server hosting a malicious key set.

### 5. Kid Injection

The `kid` (Key ID) header parameter may be vulnerable to injection
(SQL injection, path traversal) if used to look up keys.

### 6. Token Lifetime Abuse

Tokens with excessively long lifetimes (hours/days) remain valid long
after the user's permissions should have been revoked.

## Code Review Patterns

Use these search patterns to locate JWT-related code for review.

### JWT Library Usage

```bash
# Find JWT libraries and imports
grep -rn "jsonwebtoken\|jose\|jwt\|PyJWT\|pyjwt\|jjwt\|golang-jwt\|JWT\|JwtBearer" --include="*.{ts,js,py,java,rb,go}"

# Find JWT sign/verify calls
grep -rn "jwt.sign\|jwt.verify\|jwt.decode\|jwt.encode\|Jwts.parser\|JWT.decode\|JWT.encode" --include="*.{ts,js,py,java,rb,go}"
```

### Algorithm Vulnerabilities

```bash
# Find algorithm configuration
grep -rn "algorithm\|algorithms\|alg.*HS256\|alg.*RS256\|alg.*none\|alg.*HS384\|alg.*HS512" --include="*.{ts,js,py,java,rb,go}"

# Find jwt.decode WITHOUT verification (dangerous)
grep -rn "jwt.decode\|decode.*verify.*false\|decode.*options.*verify\|complete.*true" --include="*.{ts,js,py,java,rb,go}"

# Find alg:none vulnerability
grep -rn "none\|\"alg\".*\"none\"\|algorithms.*none" --include="*.{ts,js,py,java,rb,go}"
```

### Key Management

```bash
# Find hardcoded JWT secrets (critical vulnerability)
grep -rn "jwt.*secret\|JWT_SECRET\|signing.*key\|HMAC.*key\|token.*secret" --include="*.{ts,js,py,java,rb,go,env,yml,yaml,json}"

# Find weak/short secrets
grep -rn "secret.*=.*['\"].\{1,20\}['\"]" --include="*.{ts,js,py,java,rb,go}"

# Find JWKS configuration
grep -rn "jwks\|jwk.*uri\|\.well-known/jwks\|getSigningKey\|JwkProvider" --include="*.{ts,js,py,java,rb,go}"
```

### Claim Validation

```bash
# Find token verification options
grep -rn "verify\|audience\|issuer\|expiresIn\|exp\|nbf\|aud\|iss\|sub\|scope\|jti" --include="*.{ts,js,py,java,rb,go}"

# Find missing claim validation
grep -rn "jwt.verify\|jwt.decode" --include="*.{ts,js,py,java,rb,go}" -A 10 | grep -v "audience\|issuer"
```

### Sensitive Data in Tokens

```bash
# Find JWT payload construction with potentially sensitive data
grep -rn "jwt.sign\|jwt.encode\|Jwts.builder" --include="*.{ts,js,py,java,rb,go}" -A 10 | grep -i "password\|secret\|ssn\|credit\|card\|bank\|address\|phone"
```

## Remediation Guidance

### Secure JWT Verification (Node.js / jsonwebtoken)

```javascript
import jwt from 'jsonwebtoken';

// WRONG -- algorithm not restricted, no claim validation
const payload = jwt.verify(token, publicKey);

// CORRECT -- explicit algorithm, full claim validation
const payload = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],        // Explicitly restrict algorithm
  issuer: 'https://auth.example.com',
  audience: 'https://api.example.com',
  clockTolerance: 30,           // 30-second clock skew tolerance
  complete: false,              // Return payload only, not header
});
```

### Secure JWT Verification (Node.js / jose)

```javascript
import { jwtVerify } from 'jose';
import { createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://auth.example.com/.well-known/jwks.json')
);

const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'https://auth.example.com',
  audience: 'https://api.example.com',
  algorithms: ['RS256', 'ES256'],
  clockTolerance: 30,
  requiredClaims: ['sub', 'exp', 'aud', 'iss'],
});
```

### Secure JWT Verification (Python / PyJWT)

```python
import jwt
from jwt import PyJWKClient

# Fetch public keys from JWKS endpoint
jwks_client = PyJWKClient("https://auth.example.com/.well-known/jwks.json")
signing_key = jwks_client.get_signing_key_from_jwt(token)

payload = jwt.decode(
    token,
    signing_key.key,
    algorithms=["RS256"],           # Explicitly restrict
    audience="https://api.example.com",
    issuer="https://auth.example.com",
    options={
        "verify_exp": True,         # Verify expiration
        "verify_nbf": True,         # Verify not-before
        "verify_aud": True,         # Verify audience
        "verify_iss": True,         # Verify issuer
        "require": ["exp", "aud", "iss", "sub"],  # Required claims
    },
)
```

### Secure JWT Creation

```javascript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function createAccessToken(user, privateKey) {
  return jwt.sign(
    {
      sub: user.id,                    // User identifier
      scope: user.scopes.join(' '),    // Authorized scopes
      // DO NOT include: password, SSN, PII, secrets
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: '15m',               // Short-lived access token
      issuer: 'https://auth.example.com',
      audience: 'https://api.example.com',
      jwtid: crypto.randomUUID(),      // Unique token ID for revocation
      notBefore: 0,                    // Valid immediately
    }
  );
}

function createRefreshToken(user, privateKey) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: '7d',                // Longer-lived refresh token
      issuer: 'https://auth.example.com',
      audience: 'https://auth.example.com/token',
      jwtid: crypto.randomUUID(),
    }
  );
}
```

### Preventing Algorithm Confusion

```javascript
// WRONG -- reads algorithm from token header
const decoded = jwt.verify(token, key); // Library may use header's alg

// CORRECT -- algorithm hardcoded, never from token
const decoded = jwt.verify(token, rsaPublicKey, {
  algorithms: ['RS256'],  // Only accept RS256, reject everything else
});
```

### Strong Key Generation

```bash
# Generate RSA 2048-bit key pair for JWT signing
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Generate EC P-256 key pair (preferred for performance)
openssl ecparam -name prime256v1 -genkey -noout -out private-ec.pem
openssl ec -in private-ec.pem -pubout -out public-ec.pem

# For HMAC: generate a strong random secret (>= 256 bits)
openssl rand -base64 64
```

### Token Revocation with JTI

```javascript
import { createClient } from 'redis';

const redis = createClient();

async function revokeToken(jti, expiresAt) {
  // Add JTI to revocation list with auto-expiry
  const ttl = Math.ceil((expiresAt * 1000 - Date.now()) / 1000);
  if (ttl > 0) {
    await redis.set(`revoked:${jti}`, '1', { EX: ttl });
  }
}

async function isTokenRevoked(jti) {
  return await redis.exists(`revoked:${jti}`);
}

// In verification middleware
async function verifyToken(req, res, next) {
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

    if (payload.jti && await isTokenRevoked(payload.jti)) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## ASVS Level Reference

| Level | Description | Token Requirements |
|-------|-------------|-------------------|
| L1 | Baseline | Signature validation, algorithm restriction, expiration enforcement, issuer/audience validation, no sensitive data in payload |
| L2 | Standard | All L1 + JWKS for key distribution, key rotation, cross-service reuse prevention, scope validation |
| L3 | Advanced | All L2 + JTI-based revocation, token binding, hardware-backed key storage, replay prevention |

## Common Misconfigurations

| Misconfiguration | Risk | Fix |
|-----------------|------|-----|
| `jwt.decode()` without verification | Token forgery | Always use `jwt.verify()` |
| `algorithms: ['HS256']` with public key | Authentication bypass | Use asymmetric algorithms for public clients |
| No `exp` claim | Tokens valid forever | Always set short expiration |
| No `aud` claim validation | Cross-service token reuse | Validate audience per service |
| Secret in source code | Key compromise | Use environment variables or vault |
| Long-lived access tokens (hours/days) | Extended attack window | Access tokens <= 15 min |
| Reading `alg` from token header | Algorithm confusion | Hardcode algorithm in config |

## References

- [OWASP ASVS v5.0 -- V9 Self-Contained Tokens](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x17-V9-Self-Contained-Tokens.md)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 -- JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 7515 -- JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515)
- [RFC 7517 -- JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)
- [RFC 7518 -- JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518)
- [JWT.io -- JWT Debugger](https://jwt.io/)
- [Auth0 JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [PortSwigger JWT Attacks](https://portswigger.net/web-security/jwt)
