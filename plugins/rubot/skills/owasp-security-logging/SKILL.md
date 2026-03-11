---
name: owasp-security-logging
version: 1.1.0
description: |
  Audits security logging and error handling practices against OWASP ASVS V16 requirements.
  MUST activate for: security logging audit, logging review, error handling review, ASVS V16, audit trail check, log integrity, structured logging, security events, error handling security, log protection, sensitive data in logs.
  Also activate when: user asks to check if login failures are logged, review error responses for stack trace leaks, audit log storage for tampering protection, verify PII is not written to logs, review centralized error handling, check if security alerts are configured, assess log injection risks, review correlation ID implementation, verify fail-secure error behavior.
  Do NOT activate for: application performance monitoring (APM), business analytics logging, general debugging without security context, configuration security (use owasp-configuration-security).
  Covers: logging architecture documentation, structured logging (JSON format), log metadata (timestamp, source, severity, event type, user/session ID), UTC timestamps, sensitive data redaction in logs, log injection prevention, log level management, correlation IDs, log volume management, security event capture (authentication, authorization, validation failures, admin actions, data access, session events, API abuse), log integrity protection (append-only, checksums, signing), immutable log storage, log access control, secure log transmission (TLS), log isolation, NTP synchronization, error handling (fail-secure, stack trace suppression, generic error messages, centralized exception handling, consistent error format, third-party error tracking data safety).
agents:
  - debug-master
---

# OWASP ASVS V16 -- Security Logging and Error Handling Verification

## Overview

This skill audits security logging and error handling practices against OWASP ASVS V16 requirements. It covers the documentation of logging architecture, implementation of structured logging, capture of security-relevant events, protection of log integrity, and secure error handling that prevents information leakage.

Insufficient logging and monitoring is a persistent security weakness. Without proper security event logging, breaches go undetected for months. Conversely, logging sensitive data creates new attack vectors. Error handling that exposes internal details helps attackers map the application's internals.

## When to Use

- Reviewing logging implementation for security event coverage
- Auditing log content for sensitive data exposure
- Checking error handling for information leakage
- Evaluating log storage, transmission, and integrity protections
- Reviewing audit trail completeness for compliance
- Assessing structured logging implementation
- Verifying security event alerting and monitoring integration
- Conducting a full ASVS V16 compliance audit

## Verification Requirements

### V16.1 -- Security Logging Documentation

| ID | Requirement | Level |
|---|---|---|
| V16.1.1 | A logging inventory documents all log sources, formats, and destinations | L2 |
| V16.1.2 | Log architecture is documented including collection, aggregation, and retention | L2 |
| V16.1.3 | Security events that must be logged are defined and categorized | L2 |
| V16.1.4 | Log retention periods are defined based on compliance and operational needs | L2 |
| V16.1.5 | Roles and responsibilities for log review and incident response are documented | L2 |

**Audit Steps:**
1. Request or locate logging architecture documentation.
2. Verify a security events catalog exists.
3. Check log retention policies against compliance requirements.
4. Review log review and escalation procedures.

### V16.2 -- General Logging

| ID | Requirement | Level |
|---|---|---|
| V16.2.1 | Logs use structured format (JSON) for machine parsing | L1 |
| V16.2.2 | Log entries include essential metadata: timestamp, source, severity, event type, user/session ID | L1 |
| V16.2.3 | Timestamps use consistent timezone (UTC preferred) with sufficient precision | L1 |
| V16.2.4 | Log entries are machine-readable and can be ingested by SIEM/log aggregation tools | L1 |
| V16.2.5 | Sensitive data (passwords, tokens, PII, credit cards) is never included in log entries | L1 |
| V16.2.6 | Log injection is prevented (user input is sanitized before inclusion in logs) | L1 |
| V16.2.7 | Log levels are used appropriately (ERROR, WARN, INFO, DEBUG) and DEBUG is disabled in production | L1 |
| V16.2.8 | Correlation IDs are used to trace requests across services | L2 |
| V16.2.9 | Log volume is managed to prevent storage exhaustion (rate limiting, sampling for high-volume events) | L2 |

**Audit Steps:**
1. Review log output format for structured data.
2. Check log entries for required metadata fields.
3. Search logs for sensitive data patterns.
4. Verify log level configuration for production.
5. Check for log injection vulnerabilities.
6. Review correlation ID implementation in distributed systems.

### V16.3 -- Security Events

| ID | Requirement | Level |
|---|---|---|
| V16.3.1 | Authentication events are logged (login success, failure, lockout, password change, MFA events) | L1 |
| V16.3.2 | Authorization failures are logged (access denied, privilege escalation attempts) | L1 |
| V16.3.3 | Input validation failures are logged (rejected requests, malformed data, injection attempts) | L1 |
| V16.3.4 | Security control bypass attempts are logged (CSRF failures, rate limit hits, WAF blocks) | L2 |
| V16.3.5 | Administrative actions are logged (user creation/deletion, permission changes, config changes) | L1 |
| V16.3.6 | Data access events are logged for sensitive resources (PII access, financial data queries) | L2 |
| V16.3.7 | Session events are logged (creation, destruction, timeout, concurrent session detection) | L2 |
| V16.3.8 | API abuse indicators are logged (excessive requests, unusual patterns, token misuse) | L2 |
| V16.3.9 | Security events trigger alerts for real-time incident response | L2 |

**Audit Steps:**
1. Verify authentication event logging at all entry points.
2. Check authorization middleware for failure logging.
3. Review input validation handlers for logging.
4. Verify administrative action audit trails.
5. Check for alert/notification integration on critical events.

### V16.4 -- Log Protection

| ID | Requirement | Level |
|---|---|---|
| V16.4.1 | Log integrity is protected against tampering (append-only storage, checksums, or signing) | L2 |
| V16.4.2 | Logs are stored in immutable or write-once storage in production | L2 |
| V16.4.3 | Access to logs is restricted to authorized personnel only | L1 |
| V16.4.4 | Logs are transmitted securely (TLS) to aggregation systems | L2 |
| V16.4.5 | Log storage is isolated from the application (separate system, service, or cloud storage) | L2 |
| V16.4.6 | Log deletion requires elevated privileges and is itself logged | L2 |
| V16.4.7 | Backup copies of logs are maintained | L2 |
| V16.4.8 | Log timestamps are synchronized across all systems (NTP) | L2 |

**Audit Steps:**
1. Check log storage configuration for immutability.
2. Review access controls on log files and logging systems.
3. Verify log transmission uses encryption.
4. Confirm logs are stored separately from the application.
5. Check NTP configuration for time synchronization.

### V16.5 -- Error Handling

| ID | Requirement | Level |
|---|---|---|
| V16.5.1 | The application fails securely (deny by default on error) | L1 |
| V16.5.2 | Stack traces are never exposed to end users | L1 |
| V16.5.3 | Error messages shown to users are generic and do not reveal technical details | L1 |
| V16.5.4 | Centralized error handling is implemented (global exception handler) | L1 |
| V16.5.5 | Errors are logged with full technical detail internally while showing generic messages externally | L1 |
| V16.5.6 | Unhandled exceptions are caught by a global handler and do not crash the application | L1 |
| V16.5.7 | Error responses use consistent format and appropriate HTTP status codes | L1 |
| V16.5.8 | Error handling does not introduce security vulnerabilities (no error-based SQL injection, no path disclosure) | L1 |
| V16.5.9 | Third-party error tracking services do not receive sensitive data | L2 |

**Audit Steps:**
1. Trigger various error conditions and check responses for information leakage.
2. Review global error handler implementation.
3. Verify stack traces are suppressed in production responses.
4. Check error response format consistency.
5. Verify fail-secure behavior (access denied on error, not access granted).

## Code Review Patterns

### Detecting Sensitive Data in Logs

```bash
# Logging passwords
grep -rn "log.*password\|logger.*password\|console\.log.*password\|logging.*password\|print.*password" --include="*.{js,ts,py,java,go,rb}"

# Logging tokens and secrets
grep -rn "log.*token\|logger.*token\|console\.log.*token\|log.*secret\|logger.*secret\|log.*apiKey\|logger.*apiKey" --include="*.{js,ts,py,java,go,rb}"

# Logging credit card data
grep -rn "log.*card\|logger.*cardNumber\|console\.log.*credit\|log.*cvv\|logger.*cvv" --include="*.{js,ts,py,java,go,rb}"

# Logging PII
grep -rn "log.*ssn\|logger.*socialSecurity\|console\.log.*email.*user\|log.*phoneNumber" --include="*.{js,ts,py,java,go,rb}"

# Full request body logging (may contain sensitive data)
grep -rn "log.*req\.body\|logger.*request\.body\|console\.log.*req\.body\|logging.*request\.data" --include="*.{js,ts,py,java,go,rb}"
```

### Detecting Missing Security Event Logging

```bash
# Check for login/auth event logging
grep -rn "login\|authenticate\|signIn\|sign_in" --include="*.{js,ts,py,java,go,rb}" -l

# Check if authorization failures are logged
grep -rn "unauthorized\|forbidden\|access.*denied\|permission.*denied" --include="*.{js,ts,py,java,go,rb}"

# Check for admin action logging
grep -rn "createUser\|deleteUser\|updateRole\|changePermission\|addAdmin\|removeAdmin" --include="*.{js,ts,py,java,go,rb}" -l
```

### Detecting Stack Trace Exposure

```bash
# Stack trace in response
grep -rn "err\.stack\|error\.stack\|stackTrace\|stack_trace\|traceback\.format" --include="*.{js,ts,py,java,go,rb}"

# Stack trace sent to client
grep -rn "res\.json.*stack\|res\.send.*stack\|response.*stack\|render.*error.*stack" --include="*.{js,ts,py,java,go,rb}"

# Exception details in response
grep -rn "res\.json.*err\.\|res\.send.*error\.message\|res\.status.*\.json.*err\b" --include="*.{js,ts,py,java,go,rb}"

# printStackTrace in Java
grep -rn "printStackTrace\(\)" --include="*.java"
```

### Detecting Missing Error Handling

```bash
# Empty catch blocks
grep -rn "catch.*{\s*}" --include="*.{js,ts,java}"

# Catch and ignore
grep -rn "catch\s*(\s*_\s*)\|catch\s*(\s*e\s*)\s*{\s*//\s*}\|except:\s*pass" --include="*.{js,ts,py,java}"

# Missing error handler in Express
grep -rn "app\.use\|router\.\(get\|post\|put\|delete\)" --include="*.{js,ts}" -l

# Unhandled promise rejection
grep -rn "\.then\(\|async\s" --include="*.{js,ts}" -l
```

### Detecting Log Injection Vulnerabilities

```bash
# Direct user input in log messages
grep -rn "log\(.*req\.\(params\|query\|body\|headers\)\|logger\.info.*req\.\(params\|query\|body\)" --include="*.{js,ts,py,java,go,rb}"

# String concatenation in log messages
grep -rn "log\(.*\+.*req\.\|logger\..*\+.*request\.\|console\.log\(.*\+.*user" --include="*.{js,ts,py,java,go,rb}"

# Template literals with user input in logs
grep -rn "log\(\`.*\${.*req\.\|logger\.\`.*\${.*request\." --include="*.{js,ts}"
```

### Detecting Unstructured Logging

```bash
# Console.log usage (unstructured)
grep -rn "console\.log\|console\.error\|console\.warn\|console\.info\|console\.debug" --include="*.{js,ts,jsx,tsx}" -l

# Print statements (Python)
grep -rn "^[^#]*print(" --include="*.py" -l

# System.out (Java)
grep -rn "System\.out\.print\|System\.err\.print" --include="*.java"

# Check for structured logging library usage
grep -rn "winston\|pino\|bunyan\|log4js\|structlog\|loguru\|log4j\|slf4j\|zap\|zerolog" --include="*.{js,ts,py,java,go}"
```

## Remediation Guidance

### Structured Logging with Pino (Node.js)

```javascript
// WRONG: Unstructured console logging
console.log('User ' + userId + ' logged in from ' + ip);

// CORRECT: Structured logging with pino
const pino = require('pino');
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label })
  },
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', 'creditCard', 'ssn'],
    censor: '[REDACTED]'
  }
});

// Usage with security event context
logger.info({
  event: 'authentication.success',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  correlationId: req.correlationId
}, 'User authenticated successfully');
```

### Security Event Logging

```javascript
// Authentication event logging
class SecurityLogger {
  constructor(logger) {
    this.logger = logger;
  }

  loginSuccess(userId, ip, userAgent) {
    this.logger.info({
      event: 'auth.login.success',
      userId, ip, userAgent,
      timestamp: new Date().toISOString()
    }, 'Login successful');
  }

  loginFailure(username, ip, reason) {
    this.logger.warn({
      event: 'auth.login.failure',
      username, ip, reason,
      timestamp: new Date().toISOString()
    }, 'Login failed');
  }

  authorizationFailure(userId, resource, action, ip) {
    this.logger.warn({
      event: 'authz.denied',
      userId, resource, action, ip,
      timestamp: new Date().toISOString()
    }, 'Authorization denied');
  }

  adminAction(adminId, action, target, details) {
    this.logger.info({
      event: 'admin.action',
      adminId, action, target, details,
      timestamp: new Date().toISOString()
    }, 'Administrative action performed');
  }

  inputValidationFailure(ip, endpoint, errors) {
    this.logger.warn({
      event: 'validation.failure',
      ip, endpoint, errorCount: errors.length,
      timestamp: new Date().toISOString()
    }, 'Input validation failed');
  }
}
```

### Secure Error Handling

```javascript
// WRONG: Exposing internal details
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    query: err.sql,
    path: __dirname
  });
});

// CORRECT: Centralized secure error handler
const { v4: uuidv4 } = require('uuid');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

// Global error handler
app.use((err, req, res, next) => {
  const errorId = uuidv4();

  // Log full error internally
  logger.error({
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    correlationId: req.correlationId,
    statusCode: err.statusCode || 500
  }, 'Request error');

  // Return generic error to user
  const statusCode = err.isOperational ? err.statusCode : 500;
  res.status(statusCode).json({
    status: 'error',
    errorId,
    message: err.isOperational
      ? err.message
      : 'An unexpected error occurred. Please try again later.'
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason) => {
  logger.fatal({ event: 'unhandled_rejection', reason }, 'Unhandled promise rejection');
  // Graceful shutdown
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.fatal({ event: 'uncaught_exception', err }, 'Uncaught exception');
  // Graceful shutdown
  process.exit(1);
});
```

### Prevent Log Injection

```javascript
// WRONG: Direct user input in logs
logger.info(`User searched for: ${req.query.search}`);
// Attacker sends: search=test\n[ERROR] admin password changed

// CORRECT: Use structured logging (automatic sanitization)
logger.info({ event: 'search', query: req.query.search }, 'User performed search');

// CORRECT: Sanitize if using string format
function sanitizeLogInput(input) {
  if (typeof input !== 'string') return String(input);
  return input.replace(/[\n\r\t]/g, ' ').substring(0, 500);
}

logger.info({ event: 'search', query: sanitizeLogInput(req.query.search) }, 'Search performed');
```

### Sensitive Data Redaction

```javascript
// Automatic PII redaction in logs
const pino = require('pino');

const logger = pino({
  redact: {
    paths: [
      'password',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'creditCard',
      'cardNumber',
      'cvv',
      'ssn',
      'socialSecurityNumber',
      '*.password',
      '*.token',
      '*.creditCard',
      'req.headers.authorization',
      'req.headers.cookie'
    ],
    censor: '[REDACTED]'
  }
});

// Custom redaction for complex scenarios
function redactSensitiveFields(obj) {
  const sensitiveKeys = /password|secret|token|key|authorization|cookie|credit|card|cvv|ssn/i;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.test(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
```

### Fail-Secure Error Handling

```javascript
// WRONG: Fail-open on error
async function checkPermission(userId, resource) {
  try {
    const result = await db.query('SELECT * FROM permissions WHERE user_id = $1', [userId]);
    return result.rows.some(r => r.resource === resource);
  } catch (err) {
    console.error(err);
    return true; // DANGEROUS: grants access on error
  }
}

// CORRECT: Fail-secure (deny on error)
async function checkPermission(userId, resource) {
  try {
    const result = await db.query('SELECT * FROM permissions WHERE user_id = $1', [userId]);
    return result.rows.some(r => r.resource === resource);
  } catch (err) {
    logger.error({
      event: 'authz.error',
      userId,
      resource,
      error: err.message
    }, 'Permission check failed, denying access');
    return false; // SAFE: denies access on error
  }
}
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V16.1 Logging Documentation | -- | Required | Required |
| V16.2 General Logging | Required | Required | Required |
| V16.3 Security Events | Required | Required | Required |
| V16.4 Log Protection | Partial | Required | Required |
| V16.5 Error Handling | Required | Required | Required |

## References

- [OWASP ASVS V16 -- Security Logging and Error Handling](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [OWASP Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)
- [CWE-778: Insufficient Logging](https://cwe.mitre.org/data/definitions/778.html)
- [CWE-209: Generation of Error Message Containing Sensitive Information](https://cwe.mitre.org/data/definitions/209.html)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
