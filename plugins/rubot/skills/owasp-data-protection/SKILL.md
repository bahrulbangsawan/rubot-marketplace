---
name: owasp-data-protection
version: 1.1.0
description: |
  Audits data protection practices against OWASP ASVS V14 requirements.
  MUST activate for: data protection audit, PII handling review, data classification, ASVS V14, GDPR compliance check, localStorage security, cache control review, data minimization, sensitive data exposure, client-side storage audit, data retention review.
  Also activate when: user asks to check if PII is stored securely, review browser storage for sensitive data, verify cache-control headers on sensitive endpoints, audit data retention policies, check for sensitive data in URLs, review cookie security attributes, assess CCPA/HIPAA data handling, check autocomplete on sensitive form fields, review Clear-Site-Data on logout.
  Do NOT activate for: cryptographic implementation details (use owasp-cryptography), transport-layer security (use owasp-secure-communication), file upload handling (use owasp-file-handling), input validation (use owasp-validation-logic).
  Covers: data classification and sensitivity documentation, data flow mapping, encryption at rest, data minimization, data retention and automated deletion, PII handling (GDPR/CCPA/HIPAA), data masking in non-production environments, field-level encryption and tokenization, backup encryption, right to deletion, client-side data protection, localStorage/sessionStorage/IndexedDB security, cache-control headers, Clear-Site-Data on logout, autocomplete for sensitive fields, sensitive data in URL parameters, cookie Secure/HttpOnly/SameSite attributes, service worker cache protection, clipboard access control.
agents:
  - debug-master
---

# OWASP ASVS V14 -- Data Protection Verification

## Overview

This skill audits data protection practices against OWASP ASVS V14 requirements. It covers data classification, sensitivity documentation, encryption at rest, data minimization, retention policies, PII handling, and client-side data protection including browser storage, caching, and URL parameter security.

Inadequate data protection leads to data breaches, regulatory violations (GDPR, CCPA, HIPAA), and loss of user trust. Even when authentication and authorization are solid, improper data handling -- such as storing sensitive data in localStorage, including PII in URLs, or missing encryption at rest -- can expose information to attackers.

## When to Use

- Reviewing how the application classifies and handles sensitive data
- Auditing encryption at rest implementations
- Checking data minimization and retention practices
- Reviewing client-side storage for sensitive data exposure
- Verifying cache control headers prevent sensitive data caching
- Checking for PII in URL parameters or query strings
- Assessing GDPR/CCPA/privacy compliance from a technical perspective
- Conducting a full ASVS V14 compliance audit

## Verification Requirements

### V14.1 -- Data Protection Documentation

| ID | Requirement | Level |
|---|---|---|
| V14.1.1 | A data classification scheme exists defining sensitivity levels (public, internal, confidential, restricted) | L2 |
| V14.1.2 | Protection controls are defined for each data classification level | L2 |
| V14.1.3 | Data flows are documented showing where sensitive data is stored, processed, and transmitted | L2 |
| V14.1.4 | Data retention and disposal policies are documented and enforced | L2 |
| V14.1.5 | Privacy impact assessments are conducted for new features handling personal data | L2 |
| V14.1.6 | A data inventory lists all personal and sensitive data elements collected | L2 |

**Audit Steps:**
1. Request or locate data classification documentation.
2. Verify protection controls map to classification levels.
3. Review data flow diagrams for sensitive data paths.
4. Check that retention policies exist and are automated.
5. Verify privacy impact assessment processes.

### V14.2 -- General Data Protection

| ID | Requirement | Level |
|---|---|---|
| V14.2.1 | Sensitive data is encrypted at rest using approved algorithms | L1 |
| V14.2.2 | Data minimization is practiced: only necessary data is collected and stored | L1 |
| V14.2.3 | Data retention policies are implemented with automated deletion | L2 |
| V14.2.4 | PII is handled according to applicable privacy regulations (GDPR, CCPA) | L1 |
| V14.2.5 | Sensitive data is masked or redacted in non-production environments | L2 |
| V14.2.6 | Database fields containing sensitive data are identified and encrypted or tokenized | L2 |
| V14.2.7 | Backups containing sensitive data are encrypted | L2 |
| V14.2.8 | Data export and portability mechanisms protect data integrity | L2 |
| V14.2.9 | Sensitive data is not duplicated unnecessarily across systems | L2 |
| V14.2.10 | Right to deletion (right to be forgotten) is technically implementable | L2 |

**Audit Steps:**
1. Identify all storage locations for sensitive data and verify encryption.
2. Review data collection forms and APIs for unnecessary data fields.
3. Check for automated data deletion based on retention policies.
4. Verify production data is not used as-is in development/staging.
5. Review database schema for sensitive field identification.
6. Check backup encryption configuration.

### V14.3 -- Client-side Data Protection

| ID | Requirement | Level |
|---|---|---|
| V14.3.1 | Sensitive data is not stored in localStorage or sessionStorage | L1 |
| V14.3.2 | Cache-Control headers prevent caching of sensitive responses (no-store, no-cache, must-revalidate) | L1 |
| V14.3.3 | Clear-Site-Data header is sent on logout | L2 |
| V14.3.4 | Autocomplete is disabled for sensitive form fields (credit cards, SSN, passwords) | L1 |
| V14.3.5 | Sensitive data is not included in URL parameters or query strings | L1 |
| V14.3.6 | Sensitive data is not exposed in browser history through URL encoding | L1 |
| V14.3.7 | IndexedDB and Web SQL are not used to store sensitive data unencrypted | L1 |
| V14.3.8 | Cookies containing sensitive data have Secure, HttpOnly, and SameSite attributes | L1 |
| V14.3.9 | Service workers and progressive web app caches do not store sensitive data | L2 |
| V14.3.10 | Clipboard access for sensitive data is controlled and cleared appropriately | L2 |

**Audit Steps:**
1. Search for localStorage and sessionStorage usage with sensitive data.
2. Review HTTP response headers for cache control on sensitive endpoints.
3. Check logout flow for Clear-Site-Data header.
4. Review HTML forms for autocomplete attributes on sensitive fields.
5. Check URL construction for sensitive parameter inclusion.
6. Review cookie attributes for security flags.

## Code Review Patterns

### Detecting Sensitive Data in Client-Side Storage

```bash
# localStorage usage with sensitive data
grep -rn "localStorage\.setItem\|localStorage\.set\|localStorage\[" --include="*.{js,ts,jsx,tsx}"

# sessionStorage usage with sensitive data
grep -rn "sessionStorage\.setItem\|sessionStorage\.set\|sessionStorage\[" --include="*.{js,ts,jsx,tsx}"

# IndexedDB usage
grep -rn "indexedDB\.open\|createObjectStore\|IDBDatabase" --include="*.{js,ts,jsx,tsx}"

# Check what is stored (look for token, password, ssn, credit card patterns)
grep -rn "localStorage.*token\|localStorage.*password\|localStorage.*ssn\|localStorage.*credit\|localStorage.*card\|localStorage.*secret" --include="*.{js,ts,jsx,tsx}"

# Cookie creation without security flags
grep -rn "document\.cookie\s*=\|setCookie\|res\.cookie(" --include="*.{js,ts,jsx,tsx}"
```

### Detecting Missing Cache Control Headers

```bash
# Check for Cache-Control headers in responses
grep -rn "Cache-Control\|cache-control\|no-store\|no-cache\|must-revalidate" --include="*.{js,ts,py,java,go,rb,conf}"

# Check for Clear-Site-Data on logout
grep -rn "Clear-Site-Data\|clear-site-data" --include="*.{js,ts,py,java,go,rb}"

# Check for Pragma no-cache
grep -rn "Pragma.*no-cache" --include="*.{js,ts,py,java,go,rb,conf}"
```

### Detecting Sensitive Data in URLs

```bash
# Sensitive data in URL parameters
grep -rn "password=\|token=\|secret=\|api_key=\|apiKey=\|ssn=\|credit_card=\|cardNumber=" --include="*.{js,ts,jsx,tsx,py,java,go,rb,html}"

# GET requests with sensitive parameters
grep -rn "fetch.*\?.*password\|fetch.*\?.*token\|axios\.get.*password\|axios\.get.*token\|GET.*password\|GET.*token" --include="*.{js,ts,jsx,tsx}"

# Query string construction with sensitive data
grep -rn "URLSearchParams.*password\|URLSearchParams.*token\|URLSearchParams.*secret\|encodeURIComponent.*password" --include="*.{js,ts,jsx,tsx}"
```

### Detecting Missing Autocomplete Attributes

```bash
# Password fields without autocomplete off
grep -rn "type=['\"]password['\"]" --include="*.{html,jsx,tsx,vue}"

# Credit card fields
grep -rn "type=['\"]text['\"].*credit\|type=['\"]text['\"].*card\|type=['\"]text['\"].*cvv\|type=['\"]text['\"].*ssn" --include="*.{html,jsx,tsx,vue}"

# Check for autocomplete attributes
grep -rn "autocomplete=['\"]off['\"]\|autocomplete=['\"]new-password['\"]\|autoComplete=['\"]off['\"]" --include="*.{html,jsx,tsx,vue}"
```

### Detecting PII Handling Issues

```bash
# Logging of PII
grep -rn "log.*email\|log.*phone\|log.*address\|log.*ssn\|log.*creditCard\|console\.log.*email\|console\.log.*phone" --include="*.{js,ts,py,java,go,rb}"

# PII in error messages
grep -rn "throw.*email\|throw.*phone\|Error.*email\|Error.*phone\|error.*ssn" --include="*.{js,ts,py,java,go,rb}"

# Unencrypted PII storage patterns
grep -rn "\.save.*email\|\.save.*phone\|\.save.*ssn\|\.insert.*email\|\.create.*ssn" --include="*.{js,ts,py,java,go,rb}"
```

### Detecting Encryption at Rest Gaps

```bash
# Database column definitions for sensitive data
grep -rn "VARCHAR.*password\|VARCHAR.*ssn\|VARCHAR.*credit_card\|TEXT.*secret\|COLUMN.*token" --include="*.{sql,js,ts,py,java}"

# ORM field definitions for sensitive data
grep -rn "StringField.*password\|CharField.*ssn\|Column.*credit_card" --include="*.{py,java,js,ts}"

# Check for field-level encryption libraries
grep -rn "encrypt.*field\|EncryptedField\|@Encrypted\|encrypted_type\|vault_encrypt" --include="*.{js,ts,py,java,go,rb}"
```

## Remediation Guidance

### Secure Cache Control Headers

```javascript
// Express.js middleware for sensitive endpoints
function noCacheHeaders(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
}

// Apply to sensitive routes
app.use('/api/account', noCacheHeaders);
app.use('/api/payments', noCacheHeaders);
```

### Clear-Site-Data on Logout

```javascript
// Express.js logout route
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.set('Clear-Site-Data', '"cache", "cookies", "storage"');
  res.status(200).json({ message: 'Logged out' });
});
```

### Avoid localStorage for Sensitive Data

```javascript
// WRONG: Storing tokens in localStorage
localStorage.setItem('authToken', token);
localStorage.setItem('refreshToken', refreshToken);

// CORRECT: Use HttpOnly cookies for tokens (set by server)
// Server-side:
res.cookie('authToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',
  maxAge: 3600000,
  path: '/'
});

// If client-side storage is absolutely needed, use session-scoped memory
class AuthStore {
  #token = null;  // Private field, not persisted

  setToken(token) { this.#token = token; }
  getToken() { return this.#token; }
  clear() { this.#token = null; }
}
```

### Prevent Sensitive Data in URLs

```javascript
// WRONG: Sensitive data in GET parameters
fetch(`/api/auth?password=${password}&token=${token}`);

// CORRECT: Use POST body for sensitive data
fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password, token })
});
```

### Autocomplete for Sensitive Fields

```html
<!-- WRONG: No autocomplete control -->
<input type="text" name="creditCard" />
<input type="text" name="ssn" />

<!-- CORRECT: Disable autocomplete for sensitive fields -->
<input type="text" name="creditCard" autocomplete="cc-number" />
<input type="text" name="cvv" autocomplete="off" />
<input type="text" name="ssn" autocomplete="off" />
<input type="password" name="newPassword" autocomplete="new-password" />
```

### Field-Level Encryption for PII

```javascript
// Using a field-level encryption approach
const crypto = require('crypto');

class EncryptedField {
  constructor(key) {
    this.key = Buffer.from(key, 'hex');
  }

  encrypt(plaintext) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(ciphertext) {
    const data = Buffer.from(ciphertext, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
  }
}

// Usage in model
const ssnField = new EncryptedField(process.env.FIELD_ENCRYPTION_KEY);
user.ssn_encrypted = ssnField.encrypt(ssn);
```

### Data Retention Automation

```javascript
// Automated data cleanup job
const cron = require('node-cron');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const retentionDays = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Delete expired user data
  await db.query(
    'DELETE FROM user_activity_logs WHERE created_at < $1',
    [cutoffDate]
  );

  // Anonymize old accounts
  await db.query(
    `UPDATE users SET email = 'deleted@anonymized.local',
     name = 'Deleted User', phone = NULL
     WHERE deleted_at < $1 AND anonymized = false`,
    [cutoffDate]
  );

  logger.info({ cutoffDate, task: 'data-retention' }, 'Retention cleanup completed');
});
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V14.1 Data Protection Documentation | -- | Required | Required |
| V14.2 General Data Protection | Required | Required | Required |
| V14.3 Client-side Data Protection | Required | Required | Required |

## References

- [OWASP ASVS V14 -- Data Protection](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Sensitive Data Exposure](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP Data Privacy](https://owasp.org/www-project-top-10-privacy-risks/)
- [GDPR Article 25 -- Data Protection by Design](https://gdpr-info.eu/art-25-gdpr/)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
