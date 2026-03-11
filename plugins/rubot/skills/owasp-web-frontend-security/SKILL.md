---
name: owasp-web-frontend-security
version: 1.1.0
description: |
  Audits web applications for OWASP ASVS V3 compliance covering browser security mechanisms, cookie configuration, content security policy, CORS, subresource integrity, and frontend security best practices.
  MUST activate for: frontend security audit, CSP review, Content-Security-Policy, cookie security, ASVS V3, CORS audit, CSRF protection, SameSite cookie, HSTS, X-Frame-Options, clickjacking, subresource integrity, SRI, browser security headers, DOM clobbering, Trusted Types, Permissions-Policy, MIME sniffing, X-Content-Type-Options.
  Also activate when: user asks to check HTTP response headers for security, review cookie flags on session cookies, audit CORS configuration for overly permissive origins, verify clickjacking defenses, check if CDN scripts have integrity hashes, review Helmet.js configuration, find sensitive data in localStorage, or assess CSRF token implementation.
  Do NOT activate for: server-side encoding/sanitization (use owasp-encoding-sanitization), API-level security (use owasp-api-security), authentication flows (use owasp-authentication), session token management (use owasp-session-management), general WCAG accessibility.
  Covers: Content-Type with charset, X-Content-Type-Options nosniff, SVG/HTML upload isolation, cookie Secure/HttpOnly/SameSite flags, __Host- prefix cookies, cookie Path and Domain scoping, cookie expiration, Content-Security-Policy directives, CSP nonces and hashes, unsafe-inline/unsafe-eval detection, X-Frame-Options and frame-ancestors, HSTS with includeSubDomains, Permissions-Policy, Referrer-Policy, CORS origin allowlists, CORS with credentials, CSRF tokens and SameSite defense-in-depth, Origin/Referer validation, Subresource Integrity for scripts and stylesheets, DOM clobbering prevention, Trusted Types, sensitive data in localStorage/sessionStorage, service worker scope.
agents:
  - debug-master
---

# OWASP ASVS V3 -- Web Frontend Security Audit

## Overview

ASVS V3 focuses on browser-side security mechanisms that protect users from client-side
attacks including cross-site scripting (XSS), clickjacking, cross-site request forgery
(CSRF), MIME type confusion, and supply chain attacks via compromised CDN resources. This
skill covers HTTP security headers, cookie hardening, Content Security Policy, CORS
configuration, Subresource Integrity, and modern browser security features like Trusted Types.

## When to Use

- Auditing HTTP response headers for security best practices
- Reviewing cookie configuration for authentication and session cookies
- Evaluating Content Security Policy effectiveness
- Checking CORS configuration for overly permissive access
- Assessing CSRF protection mechanisms
- Verifying CDN resource integrity via SRI
- Performing a targeted ASVS V3 compliance check

## Verification Requirements

### V3.1 -- Web Frontend Security Documentation

| ID | Requirement | Level |
|----|-------------|-------|
| V3.1.1 | Browser security features used by the application are documented | L2 |
| V3.1.2 | CSP policy is documented with rationale for each directive | L2 |
| V3.1.3 | Expected CORS origins are documented and justified | L2 |

**Audit steps:**

1. Check for security header documentation in project docs or infrastructure configs.
2. Verify CSP policy comments explain why each source is allowed.
3. Review CORS origin allowlists for documentation and justification.

### V3.2 -- Unintended Content Interpretation

| ID | Requirement | Level |
|----|-------------|-------|
| V3.2.1 | All responses include a correct Content-Type header with charset | L1 |
| V3.2.2 | X-Content-Type-Options: nosniff is set on all responses | L1 |
| V3.2.3 | Content-Type is validated on file uploads and API responses | L1 |
| V3.2.4 | SVG and HTML file uploads are served with Content-Disposition: attachment or from a separate domain | L2 |

**Audit steps:**

1. Check response headers for Content-Type with charset specification.
2. Verify X-Content-Type-Options: nosniff is set globally (middleware or server config).
3. Test file upload endpoints for MIME type validation.
4. Confirm user-uploaded HTML/SVG files cannot execute in the application's origin.

### V3.3 -- Cookie Setup

| ID | Requirement | Level |
|----|-------------|-------|
| V3.3.1 | Session cookies have the Secure flag set | L1 |
| V3.3.2 | Session cookies have the HttpOnly flag set | L1 |
| V3.3.3 | Session cookies use SameSite=Lax or SameSite=Strict | L1 |
| V3.3.4 | Sensitive cookies use the __Host- prefix (requires Secure, no Domain, Path=/) | L2 |
| V3.3.5 | Cookie Path attribute is set to the most restrictive path possible | L2 |
| V3.3.6 | Cookie Domain attribute is not set unnecessarily broad | L2 |
| V3.3.7 | Cookie expiration is set appropriately (session cookies vs persistent) | L1 |

**Audit steps:**

1. Inspect Set-Cookie headers for Secure, HttpOnly, and SameSite flags.
2. Check session cookie configuration in framework settings.
3. Verify __Host- prefix is used for sensitive cookies.
4. Ensure Domain is not set to a parent domain unnecessarily.
5. Review cookie expiration values for appropriate lifetimes.

### V3.4 -- Browser Security Mechanism Headers

| ID | Requirement | Level |
|----|-------------|-------|
| V3.4.1 | Content-Security-Policy header is present and appropriately restrictive | L1 |
| V3.4.2 | CSP does not use unsafe-inline or unsafe-eval for script-src | L2 |
| V3.4.3 | CSP uses nonces or hashes for inline scripts when necessary | L2 |
| V3.4.4 | X-Frame-Options: DENY or CSP frame-ancestors 'none' prevents clickjacking | L1 |
| V3.4.5 | Strict-Transport-Security (HSTS) is set with appropriate max-age (min 1 year) | L1 |
| V3.4.6 | HSTS includes includeSubDomains directive | L2 |
| V3.4.7 | Permissions-Policy restricts unnecessary browser features (camera, microphone, geolocation) | L2 |
| V3.4.8 | Referrer-Policy is set to strict-origin-when-cross-origin or more restrictive | L2 |

**Audit steps:**

1. Capture and analyze all HTTP response headers.
2. Parse CSP policy for unsafe directives (unsafe-inline, unsafe-eval, wildcards).
3. Verify HSTS max-age is at least 31536000 (1 year).
4. Check for frame-ancestors or X-Frame-Options on all pages.
5. Review Permissions-Policy for unnecessary feature access.
6. Test Referrer-Policy by navigating to external sites.

### V3.5 -- Browser Origin Separation

| ID | Requirement | Level |
|----|-------------|-------|
| V3.5.1 | CORS Access-Control-Allow-Origin does not use wildcard (*) with credentials | L1 |
| V3.5.2 | CORS allowed origins are validated against a strict allowlist | L1 |
| V3.5.3 | CORS preflight responses are cached appropriately | L2 |
| V3.5.4 | CSRF protection is implemented for state-changing operations | L1 |
| V3.5.5 | SameSite cookie attribute provides CSRF defense-in-depth | L1 |
| V3.5.6 | Origin and Referer headers are validated for CSRF protection | L2 |
| V3.5.7 | Cross-origin resource sharing does not expose sensitive data to unauthorized origins | L1 |

**Audit steps:**

1. Test CORS headers by sending requests with various Origin values.
2. Check for `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`.
3. Verify CORS origin validation does not use substring matching (e.g., evil.example.com matching example.com).
4. Check CSRF token implementation on all state-changing endpoints.
5. Verify CSRF tokens are bound to the user session.

### V3.6 -- External Resource Integrity

| ID | Requirement | Level |
|----|-------------|-------|
| V3.6.1 | Scripts loaded from CDNs or external origins include integrity attributes (SRI) | L1 |
| V3.6.2 | Stylesheets loaded from external origins include integrity attributes | L2 |
| V3.6.3 | A fallback mechanism exists if SRI validation fails | L3 |

**Audit steps:**

1. Search HTML for `<script src=` and `<link href=` pointing to external domains.
2. Verify each external resource has an `integrity` attribute with a valid hash.
3. Check that `crossorigin="anonymous"` is set alongside integrity attributes.

### V3.7 -- Other Browser Security Considerations

| ID | Requirement | Level |
|----|-------------|-------|
| V3.7.1 | DOM clobbering is prevented by avoiding named access on document/window | L2 |
| V3.7.2 | Trusted Types are enforced via CSP to prevent DOM XSS | L3 |
| V3.7.3 | Sensitive data is not stored in client-side storage (localStorage, sessionStorage) accessible to XSS | L1 |
| V3.7.4 | Service workers are scoped appropriately and do not intercept unintended requests | L2 |

**Audit steps:**

1. Search for `document.getElementById` patterns that could conflict with named elements.
2. Check CSP for `require-trusted-types-for 'script'` directive.
3. Audit localStorage/sessionStorage for tokens, PII, or sensitive data.
4. Review service worker scope and registration.

## Code Review Patterns

### Cookie Configuration

```bash
# Cookie settings in code
grep -rn "Set-Cookie\|setCookie\|cookie(" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "httpOnly\|HttpOnly\|http_only" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "sameSite\|SameSite\|same_site" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "secure.*true\|Secure" --include="*.ts" --include="*.js" --include="*.py"

# Session configuration (Express.js)
grep -rn "session(\|cookie:" --include="*.ts" --include="*.js"

# Missing __Host- prefix on sensitive cookies
grep -rn "Set-Cookie\|res\.cookie\|setCookie" --include="*.ts" --include="*.js" | grep -v "__Host-"
```

### Security Headers

```bash
# CSP header configuration
grep -rn "Content-Security-Policy\|contentSecurityPolicy\|csp" --include="*.ts" --include="*.js" --include="*.py" --include="*.conf"
grep -rn "unsafe-inline\|unsafe-eval" --include="*.ts" --include="*.js" --include="*.py" --include="*.conf"

# HSTS configuration
grep -rn "Strict-Transport-Security\|hsts\|strictTransportSecurity" --include="*.ts" --include="*.js" --include="*.conf"

# Clickjacking protection
grep -rn "X-Frame-Options\|frame-ancestors\|frameguard" --include="*.ts" --include="*.js" --include="*.conf"

# Helmet.js or similar header middleware
grep -rn "helmet\|helmetjs\|secure-headers" --include="*.ts" --include="*.js" --include="*.json"

# MIME sniffing protection
grep -rn "X-Content-Type-Options\|nosniff\|contentTypeOptions" --include="*.ts" --include="*.js" --include="*.conf"
```

### CORS Configuration

```bash
# CORS setup
grep -rn "Access-Control-Allow-Origin\|cors(\|CORS(" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "origin.*\*\|allowAllOrigins\|allow_all_origins" --include="*.ts" --include="*.js" --include="*.py"

# CORS with credentials
grep -rn "credentials.*true\|Access-Control-Allow-Credentials" --include="*.ts" --include="*.js"
```

### CSRF Protection

```bash
# CSRF middleware and tokens
grep -rn "csrf\|CSRF\|csrfToken\|_csrf\|xsrf\|XSRF" --include="*.ts" --include="*.js" --include="*.py"

# Missing CSRF on state-changing routes
grep -rn "app\.post\|app\.put\|app\.patch\|app\.delete" --include="*.ts" --include="*.js" | grep -v "csrf"
```

### SRI and External Resources

```bash
# External scripts without integrity
grep -rn "<script.*src=.*http" --include="*.html" --include="*.tsx" --include="*.jsx" | grep -v "integrity="

# External stylesheets without integrity
grep -rn "<link.*href=.*http" --include="*.html" --include="*.tsx" --include="*.jsx" | grep -v "integrity="
```

### Client-Side Storage

```bash
# Sensitive data in client storage
grep -rn "localStorage\.\|sessionStorage\.\|window\.localStorage\|window\.sessionStorage" --include="*.ts" --include="*.js" --include="*.tsx"
grep -rn "localStorage\.setItem\|sessionStorage\.setItem" --include="*.ts" --include="*.js"
```

## Remediation Guidance

### Comprehensive Security Headers (Express.js with Helmet)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{RANDOM}'"], // Use nonces, not unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],    // Inline styles often needed
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],                  // Clickjacking prevention
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      requireTrustedTypesFor: ["'script'"],        // Trusted Types (L3)
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000,          // 1 year minimum
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'self'"],
    },
  },
}));
```

### Secure Cookie Configuration

```typescript
// Session cookie with all security flags
app.use(session({
  name: '__Host-session',  // __Host- prefix for maximum security
  cookie: {
    secure: true,          // Only sent over HTTPS
    httpOnly: true,        // Not accessible via JavaScript
    sameSite: 'lax',       // CSRF protection
    path: '/',             // Required for __Host- prefix
    maxAge: 3600000,       // 1 hour
    // Do NOT set domain for __Host- prefix cookies
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
```

### CORS Configuration

```typescript
import cors from 'cors';

// VULNERABLE -- allows all origins with credentials
app.use(cors({ origin: '*', credentials: true }));

// SAFE -- strict allowlist
const allowedOrigins = [
  'https://app.example.com',
  'https://admin.example.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,  // Cache preflight for 24 hours
}));
```

### Subresource Integrity

```html
<!-- VULNERABLE -- no integrity check -->
<script src="https://cdn.example.com/lib.js"></script>

<!-- SAFE -- SRI hash validates content -->
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxAh6VgnNMONQ0gmpJSIm0R4Bzmknh"
  crossorigin="anonymous"
></script>

<!-- Generate SRI hash: -->
<!-- openssl dgst -sha384 -binary lib.js | openssl base64 -A -->
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// CSRF middleware
const csrfProtection = csrf({ cookie: true });

// Apply to state-changing routes
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/process', csrfProtection, (req, res) => {
  // CSRF token validated automatically
  processForm(req.body);
});
```

### Preventing Sensitive Data in Client Storage

```typescript
// VULNERABLE -- storing token in localStorage (accessible to XSS)
localStorage.setItem('authToken', token);

// SAFE -- use httpOnly cookies for auth tokens
// Server sets the cookie; client JS never touches the token
res.cookie('__Host-token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
});
```

## ASVS Level Reference

| Section | L1 (Minimum) | L2 (Standard) | L3 (Advanced) |
|---------|-------------|---------------|---------------|
| V3.1 Documentation | -- | Document browser security features, CSP, CORS | Full frontend threat model |
| V3.2 Content Interpretation | Content-Type with charset, X-Content-Type-Options | SVG/HTML upload isolation | All upload types sandboxed |
| V3.3 Cookie Setup | Secure, HttpOnly, SameSite flags | __Host- prefix, restrictive Path/Domain | Full cookie audit |
| V3.4 Security Headers | CSP present, X-Frame-Options, HSTS | No unsafe-inline/eval, nonces/hashes, Permissions-Policy | Trusted Types enforcement |
| V3.5 Origin Separation | No CORS wildcard with credentials, CSRF tokens | Origin/Referer validation, strict CORS allowlist | Full origin isolation |
| V3.6 External Resource Integrity | SRI for external scripts | SRI for stylesheets | SRI fallback mechanisms |
| V3.7 Other Considerations | No sensitive data in localStorage | DOM clobbering prevention, service worker scope | Trusted Types |

## References

- [OWASP ASVS v5.0 -- V3: Web Frontend Security](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x14-V3-Web-Frontend.md)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [MDN Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmet.js](https://helmetjs.github.io/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
