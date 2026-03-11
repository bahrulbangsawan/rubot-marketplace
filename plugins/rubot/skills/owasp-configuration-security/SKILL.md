---
name: owasp-configuration-security
version: 1.1.0
description: |
  Audits application configuration security against OWASP ASVS V13 requirements.
  MUST activate for: configuration audit, secret management review, hardcoded secrets, ASVS V13, information leakage, server hardening, debug mode check, environment variable security, .env review, key rotation audit, vault configuration.
  Also activate when: user asks to scan for leaked API keys, check if debug mode is off in production, review error page information disclosure, audit server headers, check .gitignore for secret files, review HashiCorp Vault setup, verify default credentials are changed, check for stack trace exposure, review source map accessibility.
  Do NOT activate for: cryptographic algorithm selection (use owasp-cryptography), authentication configuration (use owasp-authentication), TLS/certificate config (use owasp-secure-communication).
  Covers: configuration documentation, service communication architecture, backend communication security, database connection least privilege, internal service authentication, secret management (hardcoded secrets, vault/KMS integration, key rotation, .env handling), environment variable security, default credential detection, unintended information leakage, server version header removal, stack trace suppression, directory listing prevention, debug mode detection, source map exposure, HTTP response header hardening, error handling for information disclosure.
agents:
  - debug-master
---

# OWASP ASVS V13 -- Configuration Security Verification

## Overview

This skill audits application configuration practices against OWASP ASVS V13 requirements. It covers the documentation of service configurations, secure backend communication setup, secret management practices, and prevention of unintended information leakage through error messages, headers, or debug endpoints.

Configuration errors and exposed secrets are among the most common root causes of data breaches. Hardcoded credentials, debug mode left enabled in production, verbose error pages, and missing key rotation collectively represent a large and easily exploitable attack surface.

## When to Use

- Reviewing application configuration files for security
- Auditing secret management and key rotation practices
- Checking for hardcoded credentials, API keys, or tokens in source code
- Reviewing error handling to prevent information disclosure
- Verifying production deployments have debug features disabled
- Assessing .env file handling and environment variable security
- Evaluating server header and version disclosure
- Conducting a full ASVS V13 compliance audit

## Verification Requirements

### V13.1 -- Configuration Documentation

| ID | Requirement | Level |
|---|---|---|
| V13.1.1 | Service communication architecture is documented (what talks to what, over which protocols) | L2 |
| V13.1.2 | Availability controls are documented (rate limiting, circuit breakers, failover) | L2 |
| V13.1.3 | All secrets, keys, and credentials are documented in an inventory (not their values, but their existence and purpose) | L2 |
| V13.1.4 | Configuration change management processes are documented | L2 |
| V13.1.5 | Environment-specific configuration differences are documented (dev vs staging vs production) | L2 |

**Audit Steps:**
1. Request or locate architecture documentation for service communication.
2. Verify a secrets inventory exists listing all credentials by purpose.
3. Review change management processes for configuration updates.
4. Confirm environment differences are documented.

### V13.2 -- Backend Communication Configuration

| ID | Requirement | Level |
|---|---|---|
| V13.2.1 | API interactions with external services use authentication and encryption | L1 |
| V13.2.2 | Database connections use dedicated service accounts with least privilege | L1 |
| V13.2.3 | Internal service authentication is implemented (API keys, mTLS, JWT) | L2 |
| V13.2.4 | Connection timeouts and retry limits are configured to prevent resource exhaustion | L2 |
| V13.2.5 | Backend services validate and sanitize responses from external dependencies | L2 |

**Audit Steps:**
1. Review how the application authenticates to external APIs and databases.
2. Verify database accounts follow least privilege principles.
3. Check internal service authentication mechanisms.
4. Review timeout and retry configurations.

### V13.3 -- Secret Management

| ID | Requirement | Level |
|---|---|---|
| V13.3.1 | No secrets are hardcoded in source code | L1 |
| V13.3.2 | A secrets management solution (vault, KMS, managed secrets) is used in production | L2 |
| V13.3.3 | Key and credential rotation is automated on a defined schedule | L2 |
| V13.3.4 | Environment variables are used instead of configuration files for secrets in containers | L1 |
| V13.3.5 | .env files are excluded from version control (.gitignore) | L1 |
| V13.3.6 | Secrets are not logged, output to console, or included in error messages | L1 |
| V13.3.7 | Default credentials are changed before deployment | L1 |
| V13.3.8 | API keys and tokens have appropriate scoping and expiry | L2 |
| V13.3.9 | Secrets are encrypted at rest in configuration stores | L2 |

**Audit Steps:**
1. Scan source code for hardcoded secrets, API keys, and credentials.
2. Verify .env and secret files are in .gitignore.
3. Check for secret management solution integration (HashiCorp Vault, AWS Secrets Manager, etc.).
4. Review key rotation policies and automation.
5. Verify secrets are not present in logs or error output.
6. Check for default credentials in configuration files.

### V13.4 -- Unintended Information Leakage

| ID | Requirement | Level |
|---|---|---|
| V13.4.1 | Server version headers (Server, X-Powered-By) are removed or anonymized | L1 |
| V13.4.2 | Error pages do not reveal stack traces, framework details, or internal paths | L1 |
| V13.4.3 | Directory listing is disabled on all web servers | L1 |
| V13.4.4 | Debug mode and debug endpoints are disabled in production | L1 |
| V13.4.5 | Application does not expose detailed technical error messages to users | L1 |
| V13.4.6 | HTTP response headers do not reveal internal infrastructure details | L1 |
| V13.4.7 | Source maps are not publicly accessible in production | L1 |
| V13.4.8 | Internal IP addresses and hostnames are not exposed to clients | L2 |
| V13.4.9 | Stack traces are suppressed and replaced with generic error identifiers | L1 |

**Audit Steps:**
1. Check HTTP response headers for version disclosure.
2. Trigger error conditions and verify stack traces are not shown.
3. Check web server configuration for directory listing.
4. Verify debug mode is disabled in production configuration.
5. Check for publicly accessible source maps.
6. Review error handling middleware for information leakage.

## Code Review Patterns

### Detecting Hardcoded Secrets

```bash
# API keys and tokens
grep -rn "api[_-]key\s*[:=]\s*['\"].\+['\"]\|api[_-]secret\s*[:=]\s*['\"].\+['\"]" --include="*.{js,ts,py,java,go,rb,cs}"

# AWS credentials
grep -rn "AKIA[0-9A-Z]\{16\}\|aws_secret_access_key\s*=\s*['\"].\+['\"]" --include="*.{js,ts,py,java,go,rb,yml,yaml,conf,env}"

# Private keys
grep -rn "-----BEGIN.*PRIVATE KEY-----\|-----BEGIN RSA PRIVATE KEY-----" --include="*.{js,ts,py,java,go,rb,pem,key,conf}"

# Database credentials
grep -rn "password\s*[:=]\s*['\"][^'\"]\{4,\}['\"]\|passwd\s*[:=]\s*['\"][^'\"]\{4,\}['\"]" --include="*.{js,ts,py,java,go,rb,yml,yaml,conf,json}"

# JWT secrets
grep -rn "jwt[_-]secret\s*[:=]\s*['\"].\+['\"]\|JWT_SECRET\s*=\s*['\"].\+['\"]" --include="*.{js,ts,py,java,go,rb,env}"

# Generic secret patterns
grep -rn "secret\s*[:=]\s*['\"][^'\"]\{8,\}['\"]\|token\s*[:=]\s*['\"][^'\"]\{8,\}['\"]" --include="*.{js,ts,py,java,go,rb}"

# Stripe, Twilio, SendGrid keys
grep -rn "sk_live_\|sk_test_\|SG\.\|AC[0-9a-f]\{32\}\|rk_live_\|pk_live_" --include="*.{js,ts,py,java,go,rb,env}"
```

### Detecting .env Exposure

```bash
# Check if .env is in .gitignore
grep -rn "\.env" .gitignore

# Search for .env files committed to repo
find . -name ".env" -o -name ".env.local" -o -name ".env.production" | head -20

# Check for dotenv loading patterns without protection
grep -rn "dotenv\|load_dotenv\|config()\|require.*dotenv" --include="*.{js,ts,py,rb}"
```

### Detecting Debug Mode and Information Leakage

```bash
# Debug mode enabled
grep -rn "DEBUG\s*=\s*True\|debug\s*:\s*true\|NODE_ENV.*development\|app\.debug\s*=\s*True" --include="*.{js,ts,py,java,go,rb,yml,yaml,conf,json,env}"

# Stack trace exposure
grep -rn "stack\|stackTrace\|traceback\|printStackTrace\|console\.error.*err\b" --include="*.{js,ts,py,java,go,rb}"

# Server version headers
grep -rn "X-Powered-By\|server_tokens\|ServerSignature\|expose_php" --include="*.{conf,yml,yaml,js,ts,py}"

# Source map files
find . -name "*.map" -path "*/public/*" -o -name "*.map" -path "*/dist/*" -o -name "*.map" -path "*/build/*" | head -20

# Directory listing
grep -rn "autoIndex\|Options.*Indexes\|directory_listing.*true\|autoindex.*on" --include="*.{conf,yml,yaml}"
```

### Detecting Default Credentials

```bash
# Common default passwords
grep -rn "password.*admin\|password.*123\|password.*default\|password.*test\|password.*changeme\|password.*root" --include="*.{js,ts,py,java,go,rb,yml,yaml,conf,json,env}"

# Default database credentials
grep -rn "root:root\|admin:admin\|sa:sa\|postgres:postgres\|user:password" --include="*.{js,ts,py,java,go,rb,yml,yaml,conf,env}"
```

### Detecting Logging of Sensitive Data

```bash
# Logging passwords or secrets
grep -rn "log.*password\|log.*secret\|log.*token\|log.*apiKey\|console\.log.*password\|console\.log.*secret\|console\.log.*token" --include="*.{js,ts,py,java,go,rb}"

# Debug logging in production paths
grep -rn "console\.log\|console\.debug\|print(\|puts\s" --include="*.{js,ts,py,rb}" -l
```

## Remediation Guidance

### Remove Server Version Headers

```nginx
# Nginx: hide server version
server_tokens off;
# Also add to http block:
more_clear_headers Server;
```

```javascript
// Express.js: disable X-Powered-By
app.disable('x-powered-by');

// Or using helmet
const helmet = require('helmet');
app.use(helmet.hidePoweredBy());
```

```python
# Django: custom middleware to strip headers
class RemoveServerHeaderMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        del response['Server']
        del response['X-Powered-By']
        return response
```

### Secure Error Handling

```javascript
// WRONG: Exposing stack trace
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    path: req.path
  });
});

// CORRECT: Generic error with correlation ID
const { v4: uuidv4 } = require('uuid');

app.use((err, req, res, next) => {
  const errorId = uuidv4();
  // Log full error internally
  logger.error({ errorId, err, path: req.path });
  // Return generic error to user
  res.status(500).json({
    error: 'An internal error occurred',
    errorId: errorId,
    message: 'Please contact support with this error ID'
  });
});
```

### Secret Management with Vault

```javascript
// WRONG: Hardcoded secrets
const DB_PASSWORD = 'super_secret_password_123';

// CORRECT: Using HashiCorp Vault
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getDbPassword() {
  const result = await vault.read('secret/data/database');
  return result.data.data.password;
}
```

```python
# CORRECT: Using AWS Secrets Manager
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

db_credentials = get_secret('prod/database/credentials')
```

### Proper .env Handling

```gitignore
# .gitignore - ALWAYS include these
.env
.env.local
.env.production
.env.*.local
*.key
*.pem
```

```javascript
// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// In production, use actual environment variables or secrets manager
```

### Disable Debug Mode in Production

```python
# Django settings.py
import os

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# NEVER set DEBUG = True in production
if not DEBUG:
    ALLOWED_HOSTS = ['yourdomain.com']
    SECURE_BROWSER_XSS_FILTER = True
    SESSION_COOKIE_SECURE = True
```

```javascript
// Express.js - environment-aware configuration
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Disable debug endpoints
  // Enable security middleware
  app.use(helmet());
} else {
  // Development-only routes
  app.use('/debug', debugRouter);
}
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V13.1 Configuration Documentation | -- | Required | Required |
| V13.2 Backend Communication Config | Required | Required | Required |
| V13.3 Secret Management | Required | Required | Required |
| V13.4 Information Leakage | Required | Required | Required |

## References

- [OWASP ASVS V13 -- Configuration](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
