---
name: owasp-oauth-oidc
version: 1.1.0
description: |
  Audits OAuth 2.0 and OpenID Connect implementations against OWASP ASVS v5.0 Chapter V10.
  MUST activate for: OAuth audit, OIDC review, OAuth security, OpenID Connect security, ASVS V10, PKCE review, redirect URI validation, OAuth client security, authorization server review, resource server security, refresh token rotation, OAuth implicit flow, consent management, OAuth scope review, ID token validation, better-auth social providers, better-auth OAuth.
  Also activate when: user asks to review social login setup, check OAuth token storage, audit third-party login providers, verify PKCE implementation, review callback URL handling, assess OAuth consent flow, check for deprecated OAuth flows, review OpenID discovery configuration.
  Do NOT activate for: JWT/token format validation (use owasp-self-contained-tokens), general authentication (use owasp-authentication), session management (use owasp-session-management), general API security (use owasp-api-security).
  Covers: generic OAuth/OIDC security, OAuth client configuration, resource server token validation, authorization server hardening, OIDC relying party security, OpenID Provider security, consent management, PKCE with S256, state parameter CSRF protection, redirect URI exact-match validation, token binding (DPoP/mTLS), refresh token rotation and reuse detection, ID token signature and claims verification, implicit flow deprecation, scope least-privilege enforcement.
agents:
  - debug-master
---

# OWASP ASVS V10 -- OAuth 2.0 and OpenID Connect Audit

## Overview

This skill audits OAuth 2.0 and OpenID Connect (OIDC) implementations against
OWASP ASVS v5.0 Chapter V10. OAuth 2.0 is the industry-standard protocol for
authorization, and OIDC adds an identity layer on top of it. Misconfigurations
in OAuth/OIDC are a frequent source of critical vulnerabilities including
account takeover, token theft, and unauthorized access.

This skill covers seven sub-sections:

| Section | Topic |
|---------|-------|
| V10.1 | Generic OAuth and OIDC Security |
| V10.2 | OAuth Client |
| V10.3 | OAuth Resource Server |
| V10.4 | OAuth Authorization Server |
| V10.5 | OIDC Client (Relying Party) |
| V10.6 | OpenID Provider |
| V10.7 | Consent Management |

## When to Use

- Reviewing OAuth 2.0 client or server implementations
- Auditing OIDC Relying Party or OpenID Provider configurations
- Evaluating PKCE implementation and state parameter usage
- Reviewing redirect URI validation logic
- Assessing token storage and lifecycle management
- Evaluating consent flows and scope management
- Checking for deprecated flows (implicit, ROPC)

## Verification Requirements

### V10.1 -- Generic OAuth and OIDC Security

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.1.1 | Use a well-known, maintained authorization server (not custom) | X | X | X |
| 10.1.2 | Authorization server discovery via .well-known/openid-configuration | X | X | X |
| 10.1.3 | Tokens stored securely (not in localStorage for SPAs; use httpOnly cookies or in-memory) | X | X | X |
| 10.1.4 | All OAuth/OIDC communication over TLS | X | X | X |
| 10.1.5 | Follow current OAuth Security Best Current Practice (RFC 9700) | X | X | X |

**Checklist:**
- [ ] Using established AS (Auth0, Keycloak, Okta, Azure AD, etc.)
- [ ] Discovery endpoint available and used for configuration
- [ ] Tokens not stored in localStorage or sessionStorage (XSS risk)
- [ ] All endpoints use HTTPS
- [ ] Implementation follows OAuth 2.0 Security BCP (RFC 9700)

### V10.2 -- OAuth Client

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.2.1 | PKCE (RFC 7636) used for all authorization code flows | X | X | X |
| 10.2.2 | State parameter used for CSRF protection | X | X | X |
| 10.2.3 | Redirect URI validated (exact match, no open redirects) | X | X | X |
| 10.2.4 | Authorization code flow used (not implicit or ROPC) | X | X | X |
| 10.2.5 | Confidential clients use client authentication (client_secret, private_key_jwt) | X | X | X |
| 10.2.6 | Public clients use PKCE with S256 challenge method | X | X | X |
| 10.2.7 | Authorization code is single-use | X | X | X |
| 10.2.8 | Minimum scopes requested (principle of least privilege) | X | X | X |
| 10.2.9 | Client credentials stored securely (not in client-side code) | X | X | X |

**Checklist:**
- [ ] PKCE with S256 method used for all auth code flows
- [ ] State parameter generated, sent, and validated on callback
- [ ] Redirect URIs use exact match (no wildcards, no open patterns)
- [ ] No use of implicit grant (response_type=token)
- [ ] No use of Resource Owner Password Credentials (ROPC)
- [ ] Confidential clients authenticate with client_secret_post or private_key_jwt
- [ ] Public clients (SPA, mobile) use PKCE only (no client_secret)
- [ ] Authorization codes exchanged only once
- [ ] Minimal scopes: openid, profile, email (not blanket access)
- [ ] Client secrets not in frontend code or public repositories

### V10.3 -- OAuth Resource Server

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.3.1 | Access tokens validated on every request (signature, expiry, issuer) | X | X | X |
| 10.3.2 | Scopes in token enforced for the requested operation | X | X | X |
| 10.3.3 | Token introspection used for opaque tokens | | X | X |
| 10.3.4 | Token sender-constraining (DPoP, mTLS) at L3 | | | X |
| 10.3.5 | Bearer tokens not accepted in query parameters | X | X | X |
| 10.3.6 | Error responses do not leak token details | X | X | X |

**Checklist:**
- [ ] Every API endpoint validates access token before processing
- [ ] Token signature, exp, iss, aud verified
- [ ] Endpoint checks required scope (e.g., read:users, write:documents)
- [ ] Opaque tokens introspected via AS introspection endpoint
- [ ] At L3: DPoP or mTLS token binding in use
- [ ] Tokens only accepted in Authorization header (not query string)
- [ ] Error responses return 401/403 without exposing token internals

### V10.4 -- OAuth Authorization Server

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.4.1 | Client authentication enforced for confidential clients | X | X | X |
| 10.4.2 | Token binding to client (access tokens bound to client_id) | | X | X |
| 10.4.3 | Refresh token rotation on every use | X | X | X |
| 10.4.4 | Refresh token reuse detection (revoke family on reuse) | | X | X |
| 10.4.5 | PKCE enforced for all authorization code grants | X | X | X |
| 10.4.6 | Redirect URI exact match enforced (no substring/regex) | X | X | X |
| 10.4.7 | Authorization codes short-lived (<= 10 minutes) | X | X | X |
| 10.4.8 | Implicit grant and ROPC deprecated/disabled | X | X | X |
| 10.4.9 | Client registration secured (dynamic registration restricted) | | X | X |

**Checklist:**
- [ ] Confidential clients must authenticate on token endpoint
- [ ] Access tokens include client_id or bound to client
- [ ] Refresh tokens rotated: new refresh token issued, old one invalidated
- [ ] Reuse of old refresh token revokes entire token family
- [ ] PKCE required (not optional) for all auth code grants
- [ ] Redirect URIs compared with exact string match
- [ ] Authorization codes expire within 10 minutes
- [ ] Implicit grant (response_type=token) disabled
- [ ] ROPC (grant_type=password) disabled
- [ ] Dynamic client registration requires authentication

### V10.5 -- OIDC Client (Relying Party)

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.5.1 | ID token signature validated | X | X | X |
| 10.5.2 | ID token claims validated (iss, aud, exp, nonce) | X | X | X |
| 10.5.3 | Nonce parameter used and validated to prevent replay | X | X | X |
| 10.5.4 | ID token at_hash validated when received with access token | | X | X |
| 10.5.5 | UserInfo endpoint response validated and cross-referenced with ID token sub | | X | X |
| 10.5.6 | Hybrid flow not used unless necessary | X | X | X |

**Checklist:**
- [ ] ID token signature verified using provider's public key
- [ ] iss claim matches the expected OpenID Provider
- [ ] aud claim matches the client_id
- [ ] exp claim validated (token not expired)
- [ ] nonce parameter sent in auth request and validated in ID token
- [ ] at_hash claim validated when access token received alongside ID token
- [ ] UserInfo sub matches ID token sub
- [ ] Using authorization code flow (not hybrid)

### V10.6 -- OpenID Provider

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.6.1 | Claims reflect accurate, current user attributes | X | X | X |
| 10.6.2 | Session management endpoints available (check_session, end_session) | | X | X |
| 10.6.3 | Front-channel logout supported (RP receives logout notification) | | X | X |
| 10.6.4 | Back-channel logout supported (server-to-server logout) | | | X |
| 10.6.5 | Discovery document (.well-known/openid-configuration) complete and accurate | X | X | X |

**Checklist:**
- [ ] User claims (email, name, roles) are current and accurate
- [ ] check_session_iframe or end_session_endpoint available
- [ ] Front-channel logout URI registered for each RP
- [ ] At L3: back-channel logout tokens sent to RP logout endpoints
- [ ] Discovery document includes all required metadata

### V10.7 -- Consent Management

| # | Requirement | L1 | L2 | L3 |
|---|------------|----|----|-----|
| 10.7.1 | User consent obtained before sharing data with third-party clients | X | X | X |
| 10.7.2 | Requested scopes clearly displayed to user | X | X | X |
| 10.7.3 | Users can revoke previously granted consent | X | X | X |
| 10.7.4 | First-party clients may skip consent (pre-approved) | X | X | X |
| 10.7.5 | Consent changes trigger token revocation | | X | X |

**Checklist:**
- [ ] Consent screen shows readable scope descriptions
- [ ] User explicitly approves scope access
- [ ] Consent management UI allows viewing and revoking grants
- [ ] First-party apps configured as pre-approved (skip consent prompt)
- [ ] Revoking consent invalidates existing tokens for that client

## Code Review Patterns

Use these search patterns to locate OAuth/OIDC-related code for review.

### OAuth Client Configuration

```bash
# Find OAuth/OIDC client libraries
grep -rn "oauth\|openid\|oidc\|passport\|next-auth\|auth0\|@okta\|msal\|keycloak" --include="*.{ts,js,py,java,rb,go,json}"

# Find OAuth configuration
grep -rn "client_id\|clientId\|client_secret\|clientSecret\|OAUTH\|OIDC\|authorization_endpoint\|token_endpoint" --include="*.{ts,js,py,java,rb,go,env,yml,yaml}"

# Find redirect URI configuration
grep -rn "redirect_uri\|redirectUri\|callback.*url\|REDIRECT_URL\|callbackURL" --include="*.{ts,js,py,java,rb,go,env,yml,yaml}"
```

### PKCE Implementation

```bash
# Find PKCE-related code
grep -rn "code_challenge\|code_verifier\|codeChallenge\|codeVerifier\|S256\|pkce\|PKCE" --include="*.{ts,js,py,java,rb,go}"

# Find authorization requests without PKCE (anti-pattern)
grep -rn "response_type.*code\|authorize\?" --include="*.{ts,js,py,java,rb,go}" | grep -v "code_challenge"
```

### Implicit Flow (Deprecated)

```bash
# Find implicit grant usage (should be replaced)
grep -rn "response_type.*token\|response_type.*id_token\|implicit\|grant.*implicit" --include="*.{ts,js,py,java,rb,go,json,yml,yaml}"

# Find ROPC usage (should be replaced)
grep -rn "grant_type.*password\|resource.*owner\|ROPC" --include="*.{ts,js,py,java,rb,go}"
```

### Token Storage

```bash
# Find insecure token storage (localStorage/sessionStorage)
grep -rn "localStorage.*token\|sessionStorage.*token\|localStorage.setItem.*access\|localStorage.setItem.*refresh" --include="*.{ts,js,tsx,jsx}"

# Find token in URL/query parameters
grep -rn "access_token=\|token=.*query\|req.query.*token" --include="*.{ts,js,py,java,rb,go}"
```

### State Parameter

```bash
# Find state parameter usage
grep -rn "state.*param\|oauth.*state\|state.*random\|state.*csrf\|generateState" --include="*.{ts,js,py,java,rb,go}"

# Find authorization requests without state (anti-pattern)
grep -rn "authorize\?\|authorization_endpoint" --include="*.{ts,js,py,java,rb,go}" | grep -v "state"
```

### Scope Configuration

```bash
# Find scope definitions and requests
grep -rn "scope.*=\|scopes.*=\|SCOPE\|openid.*profile\|read:\|write:\|admin:" --include="*.{ts,js,py,java,rb,go,json,yml,yaml}"
```

### Refresh Token Handling

```bash
# Find refresh token logic
grep -rn "refresh_token\|refreshToken\|grant_type.*refresh\|token.*rotation\|token.*reuse" --include="*.{ts,js,py,java,rb,go}"
```

## Remediation Guidance

### OAuth Authorization Code Flow with PKCE (Node.js)

```javascript
import crypto from 'crypto';

// Step 1: Generate PKCE challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

// Step 2: Build authorization URL
function getAuthorizationURL(config) {
  const { verifier, challenge } = generatePKCE();
  const state = crypto.randomBytes(32).toString('base64url');

  // Store verifier and state in session (server-side)
  session.pkceVerifier = verifier;
  session.oauthState = state;

  const params = new URLSearchParams({
    response_type: 'code',            // Authorization code flow (NOT implicit)
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid profile email',    // Minimum required scopes
    state: state,                     // CSRF protection
    code_challenge: challenge,        // PKCE challenge
    code_challenge_method: 'S256',    // SHA-256 method
    nonce: crypto.randomUUID(),       // OIDC replay prevention
  });

  return `${config.authorizationEndpoint}?${params}`;
}
```

### OAuth Callback Handler with Validation

```javascript
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Check for errors from AS
  if (error) {
    return res.status(400).json({ error: req.query.error_description });
  }

  // Validate state parameter (CSRF protection)
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid state parameter' });
  }

  // Exchange authorization code for tokens
  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,  // Confidential client only
      code_verifier: req.session.pkceVerifier,  // PKCE verifier
    }),
  });

  const tokens = await tokenResponse.json();

  // Validate ID token (OIDC)
  const idToken = await validateIDToken(tokens.id_token);

  // Clean up session state
  delete req.session.oauthState;
  delete req.session.pkceVerifier;

  // Store tokens securely (httpOnly cookie or server-side)
  req.session.accessToken = tokens.access_token;
  req.session.refreshToken = tokens.refresh_token;

  res.redirect('/dashboard');
});
```

### ID Token Validation (OIDC)

```javascript
import { jwtVerify, createRemoteJWKSet } from 'jose';

async function validateIDToken(idToken, expectedNonce) {
  const JWKS = createRemoteJWKSet(
    new URL(`${config.issuer}/.well-known/jwks.json`)
  );

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: config.issuer,
    audience: config.clientId,
    algorithms: ['RS256'],
    clockTolerance: 30,
  });

  // Validate nonce (replay prevention)
  if (payload.nonce !== expectedNonce) {
    throw new Error('Invalid nonce -- possible replay attack');
  }

  // Validate at_hash if access token was received
  // (hash of access token must match at_hash claim)

  return payload;
}
```

### Resource Server Token Validation

```javascript
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL(`${config.issuer}/.well-known/jwks.json`)
);

async function validateAccessToken(req, res, next) {
  // Only accept tokens in Authorization header (not query string)
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.issuer,
      audience: config.resourceServerIdentifier,
      algorithms: ['RS256'],
    });

    req.user = payload;
    req.scopes = (payload.scope || '').split(' ');
    next();
  } catch (err) {
    // Do not leak token details in error response
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Scope enforcement middleware
function requireScope(...requiredScopes) {
  return (req, res, next) => {
    const hasAllScopes = requiredScopes.every(s => req.scopes.includes(s));
    if (!hasAllScopes) {
      return res.status(403).json({ error: 'Insufficient scope' });
    }
    next();
  };
}

// Usage
app.get('/api/users', validateAccessToken, requireScope('read:users'), listUsers);
app.post('/api/users', validateAccessToken, requireScope('write:users'), createUser);
```

### Refresh Token Rotation

```javascript
async function refreshAccessToken(refreshToken) {
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    // Refresh token may have been rotated and reused (stolen)
    // Log security event and force re-authentication
    throw new Error('Refresh token invalid -- possible token theft');
  }

  const tokens = await response.json();
  // tokens.refresh_token is a NEW refresh token (rotation)
  // Old refresh_token is now invalid
  return tokens;
}
```

### Redirect URI Validation (Authorization Server)

```javascript
function validateRedirectUri(clientId, requestedUri) {
  const client = await getClient(clientId);
  const registeredUris = client.redirect_uris;

  // EXACT string match -- no wildcards, no substring, no regex
  if (!registeredUris.includes(requestedUri)) {
    throw new Error('Invalid redirect_uri');
  }

  return true;
}

// WRONG -- substring match allows open redirect
// requestedUri.startsWith(registeredUri)  // VULNERABLE

// WRONG -- regex match allows bypass
// new RegExp(registeredPattern).test(requestedUri)  // VULNERABLE

// CORRECT -- exact match only
// registeredUris.includes(requestedUri)  // SAFE
```

### Secure Token Storage for SPAs

```javascript
// WRONG -- localStorage is accessible via XSS
localStorage.setItem('access_token', tokens.access_token);

// OPTION 1: Backend-for-Frontend (BFF) pattern (recommended)
// Tokens stay on server, client uses httpOnly session cookie
app.post('/api/bff/token', async (req, res) => {
  const tokens = await exchangeCode(req.body.code);
  req.session.accessToken = tokens.access_token;
  req.session.refreshToken = tokens.refresh_token;
  res.json({ authenticated: true });
});

// BFF proxies API calls with token injection
app.use('/api/proxy/*', async (req, res) => {
  const response = await fetch(`${apiBaseUrl}${req.path}`, {
    headers: {
      'Authorization': `Bearer ${req.session.accessToken}`,
    },
  });
  // Forward response to client
});

// OPTION 2: In-memory storage with service worker (advanced)
// Token stored only in JavaScript variable, not persisted
```

## ASVS Level Reference

| Level | Description | OAuth/OIDC Requirements |
|-------|-------------|------------------------|
| L1 | Baseline | PKCE, state parameter, code flow, redirect URI validation, TLS, token validation, no implicit/ROPC, consent |
| L2 | Standard | All L1 + refresh token rotation, reuse detection, token introspection, at_hash validation, consent revocation |
| L3 | Advanced | All L2 + DPoP/mTLS token binding, back-channel logout, sender-constrained tokens |

## Key RFCs and Standards

| RFC/Standard | Title | Relevance |
|-------------|-------|-----------|
| RFC 6749 | OAuth 2.0 Authorization Framework | Core OAuth 2.0 specification |
| RFC 6750 | Bearer Token Usage | How to send and validate bearer tokens |
| RFC 7636 | PKCE | Proof Key for Code Exchange |
| RFC 7662 | Token Introspection | Opaque token validation |
| RFC 8414 | AS Metadata | Discovery endpoint specification |
| RFC 9700 | OAuth 2.0 Security BCP | Current security best practices |
| RFC 9449 | DPoP | Demonstrating Proof of Possession |
| OpenID Connect Core | OIDC specification | ID token, UserInfo, claims |
| OpenID Connect Discovery | OIDC Discovery | .well-known/openid-configuration |
| OpenID Connect RP-Initiated Logout | OIDC Logout | End-session endpoint |
| OpenID Connect Back-Channel Logout | OIDC Back-Channel | Server-to-server logout |

## References

- [OWASP ASVS v5.0 -- V10 OAuth and OIDC](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x18-V10-OAuth-OIDC.md)
- [OWASP OAuth 2.0 Security Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/05-Testing_for_OAuth_Weaknesses)
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
- [OAuth 2.0 for Browser-Based Applications](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Auth0 OAuth 2.0 Documentation](https://auth0.com/docs/authenticate/protocols/oauth)
- [PortSwigger OAuth Vulnerabilities](https://portswigger.net/web-security/oauth)
