---
name: owasp-session-management
version: 1.0.0
description: |
  Audits session management implementations against OWASP ASVS v5.0
  Chapter V7. Covers session token generation, timeout policies,
  session termination, session abuse defenses, and federated
  re-authentication. Produces verification checklists, identifies
  insecure patterns, and provides remediation guidance.

  Trigger on: "session management audit", "session security review",
  "session timeout review", "cookie security", "session fixation",
  "session hijacking", "ASVS V7", "logout security", "session token",
  "idle timeout", "absolute timeout", "concurrent sessions",
  "federated logout", "SSO session"

  DO NOT trigger for: authentication mechanisms (use owasp-authentication),
  OAuth/OIDC token flows (use owasp-oauth-oidc), JWT validation
  (use owasp-self-contained-tokens), authorization checks
  (use owasp-authorization)
agents:
  - debug-master
---

# OWASP ASVS V7 -- Session Management Audit

## Overview

This skill audits session management implementations against OWASP ASVS v5.0
Chapter V7. Session management is the mechanism by which a server maintains
state with a user across multiple requests. Poor session management can lead
to session hijacking, fixation, replay attacks, and unauthorized access.

This skill covers six sub-sections:

| Section | Topic |
|---------|-------|
| V7.1 | Session Management Documentation |
| V7.2 | Fundamental Session Management Security |
| V7.3 | Session Timeout |
| V7.4 | Session Termination |
| V7.5 | Defenses Against Session Abuse |
| V7.6 | Federated Re-authentication |

## When to Use

- Reviewing session token generation and storage
- Auditing session timeout and expiration policies
- Evaluating logout and session invalidation flows
- Testing for session fixation vulnerabilities
- Reviewing cookie security attributes
- Assessing concurrent session controls
- Evaluating SSO / federated session management

## Verification Requirements

### V7.1 -- Session Management Documentation

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 7.1.1 | Document session timeout policies (idle, absolute) | | X | X |
| 7.1.2 | Document token types used and their storage mechanisms | | X | X |
| 7.1.3 | Document SSO interaction and session propagation | | X | X |
| 7.1.4 | Document session invalidation triggers | | X | X |

**Checklist:**
- [ ] Session timeout values are documented
- [ ] Token storage strategy (cookie vs. header vs. localStorage) documented
- [ ] SSO session lifecycle documented
- [ ] Session revocation events documented (password change, MFA change, etc.)

### V7.2 -- Fundamental Session Management Security

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 7.2.1 | Session tokens generated using a CSPRNG with >= 128 bits of entropy | X | X | X |
| 7.2.2 | Session tokens validated on every request (server-side) | X | X | X |
| 7.2.3 | Sessions are unique per user (no shared sessions) | X | X | X |
| 7.2.4 | Session tokens stored securely (HttpOnly, Secure, SameSite cookies) | X | X | X |
| 7.2.5 | Session tokens not exposed in URLs | X | X | X |
| 7.2.6 | New session token issued on authentication (prevent fixation) | X | X | X |

**Checklist:**
- [ ] Token generation uses crypto.randomBytes / secrets.token_hex or equivalent
- [ ] Server-side session store validates tokens on each request
- [ ] Each authenticated user gets a unique session ID
- [ ] Cookies set with HttpOnly, Secure, SameSite=Lax (or Strict)
- [ ] Session ID never appears in query strings or URL paths
- [ ] Session regenerated after login (req.session.regenerate or equivalent)

### V7.3 -- Session Timeout

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 7.3.1 | Idle timeout terminates session after period of inactivity | X | X | X |
| 7.3.2 | Absolute timeout terminates session regardless of activity | X | X | X |
| 7.3.3 | Re-authentication required for sensitive actions even within active session | | X | X |
| 7.3.4 | Timeout values appropriate for application risk level | X | X | X |

**Recommended timeout values:**

| Risk Level | Idle Timeout | Absolute Timeout |
|------------|-------------|------------------|
| Low (public content) | 30 minutes | 24 hours |
| Medium (standard app) | 15 minutes | 8 hours |
| High (financial, medical) | 5 minutes | 1 hour |

**Checklist:**
- [ ] Idle timeout configured and enforced server-side
- [ ] Absolute timeout configured and enforced server-side
- [ ] Sensitive operations (password change, payment) require re-authentication
- [ ] Timeout values documented and appropriate for risk level

### V7.4 -- Session Termination

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 7.4.1 | Logout invalidates session on the server (not just client-side) | X | X | X |
| 7.4.2 | Backend session store deletes or marks session as invalid | X | X | X |
| 7.4.3 | Logout clears session cookie on client | X | X | X |
| 7.4.4 | Federated logout propagates to all connected services | | X | X |
| 7.4.5 | Password change / MFA change invalidates other active sessions | | X | X |

**Checklist:**
- [ ] Logout endpoint calls session.destroy() / session.invalidate()
- [ ] Session removed from server-side store (Redis, DB, etc.)
- [ ] Response sets cookie with Max-Age=0 or expired date
- [ ] SSO logout triggers back-channel or front-channel logout
- [ ] Password change triggers invalidation of all other sessions for user

### V7.5 -- Defenses Against Session Abuse

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 7.5.1 | Session fixation prevented (new token on auth state change) | X | X | X |
| 7.5.2 | Concurrent session limits enforced | | X | X |
| 7.5.3 | Session bound to client fingerprint (IP, User-Agent) at L3 | | | X |
| 7.5.4 | Session token rotation on privilege escalation | X | X | X |
| 7.5.5 | Active sessions viewable and revocable by user | | X | X |

**Checklist:**
- [ ] Session regenerated on login, role change, privilege escalation
- [ ] Maximum concurrent sessions enforced (e.g., 3-5 per user)
- [ ] At L3: session bound to user-agent and/or IP
- [ ] User can view active sessions in account settings
- [ ] User can revoke individual sessions

### V7.6 -- Federated Re-authentication

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 7.6.1 | RP can request re-authentication from IdP for sensitive actions | | X | X |
| 7.6.2 | IdP supports prompt=login or equivalent re-auth mechanism | | X | X |
| 7.6.3 | RP validates auth_time claim to ensure fresh authentication | | X | X |

**Checklist:**
- [ ] Sensitive actions send prompt=login to IdP
- [ ] auth_time or acr claim checked to ensure recent authentication
- [ ] Max age parameter used to enforce fresh auth within time window

## better-auth Session Security

Since the project tech stack uses `better-auth`, verify its session configuration against ASVS V7.

### better-auth Session Architecture

better-auth uses **database-backed sessions** by default — each session is stored server-side with a random token sent to the client as an HttpOnly cookie. This is inherently more secure than self-contained tokens (JWTs) for session management because sessions can be immediately revoked server-side.

### better-auth Session Configuration Audit

```typescript
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  session: {
    // V7.3 — Absolute session timeout
    expiresIn: 60 * 60 * 24,           // 24h max session lifetime ✅
    // V7.3 — Sliding window for idle timeout behavior
    updateAge: 60 * 60,                 // Refresh token every 1h ✅
    // Cookie caching (reduces DB lookups, NOT session duration)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                   // 5 min cache ✅
    },
    // V7.2.4 — Cookie security attributes
    // better-auth sets HttpOnly, Secure (in prod), SameSite=Lax by default ✅
    // To override:
    cookieOptions: {
      httpOnly: true,                    // ✅ V7.2.4
      secure: process.env.NODE_ENV === 'production', // ✅
      sameSite: 'lax',                   // ✅ V3.5 CSRF defense
      path: '/',
    },
  },
});
```

### better-auth Session ASVS Verification Matrix

| ASVS Req | better-auth Behavior | Status |
|----------|---------------------|--------|
| V7.2.1 | Session tokens are CSPRNG-generated (crypto.randomBytes) | Compliant |
| V7.2.2 | Server-side validation on every request via DB lookup | Compliant |
| V7.2.3 | Unique session per user per device | Compliant |
| V7.2.4 | HttpOnly, Secure, SameSite cookies by default | Compliant |
| V7.3.1 | `expiresIn` controls absolute timeout | Configure |
| V7.3.2 | `updateAge` provides sliding window for idle detection | Configure |
| V7.4.1 | `signOut()` deletes session from DB | Compliant |
| V7.4.2 | `revokeSession()` / `revokeSessions()` for backend invalidation | Compliant |
| V7.5.1 | New session created on login (no fixation) | Compliant |
| V7.5.2 | `listSessions()` enables concurrent session visibility | Available |

### better-auth Session Termination

```typescript
// Client-side logout (V7.4.1)
import { authClient } from './auth-client';
await authClient.signOut();

// Server-side session revocation (V7.4.2)
// Revoke a specific session
await auth.api.revokeSession({ sessionId: 'session-to-revoke' });

// Revoke ALL sessions for a user (e.g., on password change)
await auth.api.revokeSessions({ userId: user.id });

// List active sessions for concurrent session management (V7.5.2)
const sessions = await authClient.listSessions();
```

### better-auth Session Grep Patterns

```bash
# Find better-auth session config
grep -rn "session.*expiresIn\|session.*updateAge\|cookieCache\|cookieOptions" --include="*.{ts,js}"

# Check for session revocation on sensitive actions
grep -rn "revokeSessions\|revokeSession\|signOut" --include="*.{ts,js}"

# Verify cookie security attributes
grep -rn "httpOnly\|sameSite\|secure" --include="*.{ts,js}" | grep -i "cookie\|session\|auth"

# Check for session listing (concurrent session control)
grep -rn "listSessions\|activeSessions" --include="*.{ts,js,tsx}"
```

## Code Review Patterns

Use these search patterns to locate session management code for review.

### Session Configuration

```bash
# Find session middleware configuration
grep -rn "session\(\|express-session\|cookie-session\|SessionMiddleware\|SESSION_ENGINE" --include="*.{ts,js,py,java,rb,go}"

# Find session timeout configuration
grep -rn "maxAge\|max_age\|SESSION_COOKIE_AGE\|session.*timeout\|idle.*timeout\|SESSION_TIMEOUT\|session.*expir" --include="*.{ts,js,py,java,rb,go,yml,yaml,json}"

# Find cookie security attributes
grep -rn "httpOnly\|HttpOnly\|secure.*true\|SameSite\|sameSite\|SESSION_COOKIE_SECURE\|SESSION_COOKIE_HTTPONLY" --include="*.{ts,js,py,java,rb,go}"
```

### Session Token Generation

```bash
# Find custom session ID generation (potential weakness)
grep -rn "genid\|generateId\|session.*id.*=\|sessionId\|session_id" --include="*.{ts,js,py,java,rb,go}"

# Find insecure random generation for tokens
grep -rn "Math.random\|uuid.*v1\|random.randint\|Random()\|rand()" --include="*.{ts,js,py,java,rb,go}"
```

### Session Termination

```bash
# Find logout / session destruction
grep -rn "session.destroy\|session.invalidate\|logout\|signOut\|sign_out\|clearSession\|removeSession" --include="*.{ts,js,py,java,rb,go}"

# Find cookie clearing
grep -rn "clearCookie\|delete_cookie\|remove_cookie\|Max-Age=0\|expires.*1970" --include="*.{ts,js,py,java,rb,go}"
```

### Session Fixation

```bash
# Find session regeneration
grep -rn "regenerate\|regenerateId\|cycle_session\|rotate.*session\|new.*session" --include="*.{ts,js,py,java,rb,go}"

# Find login flows without regeneration (potential fixation)
grep -rn "req.session\.\|session\[" --include="*.{ts,js,py,java,rb,go}" | grep -i "login\|auth\|signin"
```

### Session in URLs

```bash
# Find session tokens in URLs (anti-pattern)
grep -rn "sessionid=\|session_id=\|sid=\|JSESSIONID.*url\|token.*query" --include="*.{ts,js,py,java,rb,go,html}"
```

## Remediation Guidance

### Secure Session Configuration (Express.js)

```javascript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  name: '__Host-sid',           // Cookie name with __Host- prefix
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,             // Prevent XSS access
    secure: true,               // HTTPS only
    sameSite: 'lax',            // CSRF protection
    maxAge: 15 * 60 * 1000,     // 15-minute idle timeout
    path: '/',
    domain: undefined,          // Default to current domain
  },
  rolling: true,                // Reset maxAge on each request (idle timeout)
}));
```

### Session Regeneration on Login

```javascript
app.post('/api/auth/login', async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // Regenerate session to prevent fixation
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    req.session.userId = user.id;
    req.session.loginTime = Date.now(); // Track absolute timeout
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session error' });
      res.json({ success: true });
    });
  });
});
```

### Absolute Timeout Enforcement

```javascript
function enforceAbsoluteTimeout(maxLifetime = 8 * 60 * 60 * 1000) {
  return (req, res, next) => {
    if (req.session && req.session.loginTime) {
      const elapsed = Date.now() - req.session.loginTime;
      if (elapsed > maxLifetime) {
        return req.session.destroy(() => {
          res.status(401).json({ error: 'Session expired' });
        });
      }
    }
    next();
  };
}

app.use(enforceAbsoluteTimeout(8 * 60 * 60 * 1000)); // 8 hours
```

### Secure Logout

```javascript
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction failed:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    // Clear cookie on client
    res.clearCookie('__Host-sid', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    res.json({ success: true });
  });
});
```

### Concurrent Session Limiting

```javascript
async function enforceConcurrentSessions(userId, maxSessions = 3) {
  const sessions = await redis.smembers(`user:${userId}:sessions`);

  if (sessions.length >= maxSessions) {
    // Remove oldest session
    const oldest = sessions[0];
    await redis.del(`sess:${oldest}`);
    await redis.srem(`user:${userId}:sessions`, oldest);
  }
}

// On login, track session
await redis.sadd(`user:${user.id}:sessions`, req.sessionID);
```

### Secure Session Configuration (Django)

```python
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 900          # 15 minutes idle timeout
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_NAME = '__Host-sessionid'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
```

## ASVS Level Reference

| Level | Description | Session Management Requirements |
|-------|-------------|--------------------------------|
| L1 | Baseline | CSPRNG tokens, HttpOnly/Secure cookies, idle timeout, server-side logout, fixation prevention |
| L2 | Standard | All L1 + absolute timeout, concurrent limits, re-auth for sensitive ops, federated logout |
| L3 | Advanced | All L2 + session binding (IP/UA), active session management UI, hardware token binding |

## References

- [OWASP ASVS v5.0 -- V7 Session Management](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x15-V7-Session-Management.md)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Testing Guide -- Session Management](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/)
- [RFC 6265 -- HTTP State Management Mechanism](https://tools.ietf.org/html/rfc6265)
- [Cookie Prefixes (__Host-, __Secure-)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes)
