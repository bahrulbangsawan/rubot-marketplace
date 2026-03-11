---
name: owasp-secure-communication
version: 1.1.0
description: |
  Audits secure communication configurations against OWASP ASVS V12 requirements.
  MUST activate for: TLS audit, HTTPS review, secure communication, certificate check, ASVS V12, cipher suite review, HSTS, mTLS review, SSL configuration, transport security.
  Also activate when: user asks to check TLS setup, verify HTTPS enforcement, review SSL certificate expiry, audit database connection encryption, check for mixed content, review nginx/Apache TLS config, verify service-to-service encryption, check for plaintext protocols, review OCSP stapling.
  Do NOT activate for: application-layer encryption (use owasp-cryptography), API security logic (use owasp-api-security), WebRTC communication (use owasp-webrtc-security).
  Covers: TLS 1.2/1.3 configuration, deprecated protocol detection (SSL 2.0/3.0, TLS 1.0/1.1), cipher suite selection, forward secrecy (ECDHE/DHE), certificate management and renewal, wildcard certificate risks, OCSP stapling, HTTPS enforcement, HTTP-to-HTTPS redirects, HSTS with includeSubDomains and preload, mixed content prevention, mTLS for internal services, database connection TLS, message queue encryption, plaintext protocol elimination (FTP, telnet, unencrypted SMTP), TLS verification bypass detection, gRPC/GraphQL/WebSocket TLS.
agents:
  - debug-master
---

# OWASP ASVS V12 -- Secure Communication Verification

## Overview

This skill audits transport-layer security and communication channel configurations against OWASP ASVS V12 requirements. It ensures all data in transit is protected using properly configured TLS, verifies certificate management practices, and confirms service-to-service communications are encrypted.

Insecure transport configuration is one of the most exploitable vulnerability classes. Attackers on the network path can intercept, modify, or impersonate traffic when TLS is misconfigured, absent, or uses deprecated protocols and cipher suites.

## When to Use

- Reviewing TLS/SSL configuration files (nginx, Apache, HAProxy, Caddy, etc.)
- Auditing HTTPS enforcement and HSTS implementation
- Reviewing certificate management and pinning strategies
- Evaluating service-to-service communication security (mTLS)
- Checking database and message queue connection encryption
- Assessing cipher suite selection and protocol versions
- Conducting a full ASVS V12 compliance audit

## Verification Requirements

### V12.1 -- General TLS Security Guidance

| ID | Requirement | Level |
|---|---|---|
| V12.1.1 | TLS 1.2 is the minimum supported version; TLS 1.3 is preferred | L1 |
| V12.1.2 | SSL 2.0, SSL 3.0, TLS 1.0, and TLS 1.1 are disabled | L1 |
| V12.1.3 | Only strong cipher suites are enabled (no NULL, export, DES, RC4, or MD5-based suites) | L1 |
| V12.1.4 | Forward secrecy cipher suites (ECDHE, DHE) are prioritized | L1 |
| V12.1.5 | Certificate management processes include renewal, revocation checking, and expiry monitoring | L2 |
| V12.1.6 | Wildcard certificates are used only when justified and risks are documented | L2 |
| V12.1.7 | Server cipher order is enforced (server preference, not client) | L1 |
| V12.1.8 | Certificate revocation checking is implemented (OCSP stapling preferred) | L2 |

**Audit Steps:**
1. Test supported TLS versions using configuration review or scanning tools.
2. Enumerate enabled cipher suites and verify no weak suites are present.
3. Confirm forward secrecy is available and prioritized.
4. Check certificate expiry dates and renewal automation.
5. Verify OCSP stapling or CRL checking is enabled.

### V12.2 -- HTTPS Communication with External Facing Services

| ID | Requirement | Level |
|---|---|---|
| V12.2.1 | All external-facing endpoints use HTTPS exclusively | L1 |
| V12.2.2 | HTTP to HTTPS redirects are in place with 301 status codes | L1 |
| V12.2.3 | HSTS is enabled with a minimum max-age of 31536000 (1 year) | L1 |
| V12.2.4 | HSTS includes the includeSubDomains directive | L2 |
| V12.2.5 | The domain is submitted to the HSTS preload list | L2 |
| V12.2.6 | Publicly trusted certificates from a recognized CA are used | L1 |
| V12.2.7 | Certificate pinning is considered for high-security applications | L3 |
| V12.2.8 | Mixed content is prevented (no HTTP resources loaded on HTTPS pages) | L1 |

**Audit Steps:**
1. Verify all public endpoints respond on HTTPS and redirect HTTP.
2. Check Strict-Transport-Security header presence and value.
3. Confirm certificates are from trusted CAs (not self-signed for production).
4. Scan for mixed content issues in HTML, CSS, and JavaScript.
5. For L3: review certificate pinning implementation if applicable.

### V12.3 -- General Service to Service Communication Security

| ID | Requirement | Level |
|---|---|---|
| V12.3.1 | mTLS is used for internal service-to-service communication | L2 |
| V12.3.2 | Database connections use TLS encryption | L2 |
| V12.3.3 | Message queue and event bus connections use encryption | L2 |
| V12.3.4 | No plaintext protocols (HTTP, FTP, SMTP without STARTTLS, telnet) are used for sensitive data | L1 |
| V12.3.5 | Internal services validate certificates (no skip-TLS-verify in production) | L2 |
| V12.3.6 | Service mesh or similar infrastructure provides encryption for inter-service traffic | L2 |
| V12.3.7 | gRPC, GraphQL, and WebSocket connections use TLS | L1 |

**Audit Steps:**
1. Review service-to-service connection configurations for mTLS.
2. Check database connection strings for SSL/TLS parameters.
3. Verify message queue client configurations include TLS.
4. Search for plaintext protocol usage in code and configuration.
5. Check for TLS verification bypass flags in production code.

## Code Review Patterns

### Detecting Insecure TLS Configuration

```bash
# Search for disabled TLS verification
grep -rn "rejectUnauthorized.*false\|NODE_TLS_REJECT_UNAUTHORIZED.*0\|verify_ssl.*False\|InsecureSkipVerify.*true\|CURLOPT_SSL_VERIFYPEER.*false" --include="*.{js,ts,py,go,java,rb,yml,yaml}"

# Search for old TLS versions
grep -rn "TLSv1_method\|TLSv1\.0\|TLSv1\.1\|SSLv2\|SSLv3\|ssl_protocols.*TLSv1[^.23]" --include="*.{js,ts,py,go,java,conf,cfg,yml,yaml,ini}"

# Search for weak cipher suites
grep -rn "RC4\|DES-CBC\|NULL\|EXPORT\|anon\|MD5.*cipher\|cipher.*MD5\|aDH\|aECDH" --include="*.{conf,cfg,yml,yaml,js,ts,py,go}"
```

### Detecting Missing HTTPS/HSTS

```bash
# Search for HTTP URLs (non-HTTPS)
grep -rn "http://[^l][^o][^c][^a][^l]" --include="*.{js,ts,jsx,tsx,py,java,go,rb,html}"

# Search for HSTS header configuration
grep -rn "Strict-Transport-Security\|HSTS\|hsts" --include="*.{js,ts,py,conf,cfg,yml,yaml}"

# Search for mixed content
grep -rn "http://.*\.js\|http://.*\.css\|http://.*\.png\|http://.*\.jpg\|src=['\"]http://" --include="*.{html,jsx,tsx}"
```

### Detecting Plaintext Protocol Usage

```bash
# Search for plaintext database connections
grep -rn "mongodb://[^l]\|mysql://[^l]\|postgres://[^l]\|redis://[^l]" --include="*.{js,ts,py,java,go,rb,yml,yaml,env}"

# Search for FTP usage
grep -rn "ftp://\|ftplib\|FTPClient\|new Ftp" --include="*.{js,ts,py,java,go,rb}"

# Search for telnet usage
grep -rn "telnet://\|telnetlib\|TelnetClient" --include="*.{js,ts,py,java,go,rb}"

# Search for unencrypted SMTP
grep -rn "smtp://\|port.*25[^0-9]\|SMTP\(\|createTransport.*port.*25" --include="*.{js,ts,py,java,go,rb}"
```

### Detecting TLS Verification Bypass

```bash
# Node.js TLS bypass
grep -rn "rejectUnauthorized\s*:\s*false\|process\.env\.NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]0['\"]" --include="*.{js,ts}"

# Python TLS bypass
grep -rn "verify\s*=\s*False\|urllib3\.disable_warnings\|CERT_NONE" --include="*.py"

# Go TLS bypass
grep -rn "InsecureSkipVerify\s*:\s*true" --include="*.go"

# Java TLS bypass
grep -rn "TrustAllCerts\|X509TrustManager.*checkServerTrusted.*return\|ALLOW_ALL_HOSTNAME_VERIFIER" --include="*.java"

# cURL TLS bypass
grep -rn "curl.*-k\b\|curl.*--insecure\|CURLOPT_SSL_VERIFYPEER.*0\|CURLOPT_SSL_VERIFYHOST.*0" --include="*.{sh,bash,yml,yaml,py,php}"
```

### Detecting Database Connection Security

```bash
# Check for SSL parameters in connection strings
grep -rn "sslmode=disable\|ssl=false\|useSSL=false\|sslMode=DISABLED" --include="*.{js,ts,py,java,go,rb,yml,yaml,env,conf}"

# Check for SSL configuration in ORM configs
grep -rn "ssl.*false\|ssl.*disable\|tls.*false" --include="*.{js,ts,py,java,yml,yaml,json}"
```

## Remediation Guidance

### Nginx TLS Configuration

```nginx
# CORRECT: Secure TLS configuration
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers on;

    ssl_certificate /etc/ssl/certs/example.com.pem;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    ssl_stapling on;
    ssl_stapling_verify on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

### Node.js HTTPS Configuration

```javascript
// WRONG: Disabling TLS verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const agent = new https.Agent({ rejectUnauthorized: false });

// CORRECT: Proper TLS configuration
const https = require('https');
const tls = require('tls');

const server = https.createServer({
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  minVersion: 'TLSv1.2',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256'
  ].join(':'),
  honorCipherOrder: true
}, app);
```

### Database Connection with TLS

```javascript
// WRONG: No TLS for database
const pool = new Pool({
  connectionString: 'postgres://user:pass@db-host:5432/mydb'
});

// CORRECT: Database connection with TLS
const pool = new Pool({
  connectionString: 'postgres://user:pass@db-host:5432/mydb',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem'),
    cert: fs.readFileSync('/path/to/client-cert.pem'),  // for mTLS
    key: fs.readFileSync('/path/to/client-key.pem')      // for mTLS
  }
});
```

### HSTS Header Implementation

```javascript
// Express.js middleware
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});

// Or using helmet
const helmet = require('helmet');
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### mTLS Configuration for Internal Services

```javascript
// gRPC with mTLS
const grpc = require('@grpc/grpc-js');

const credentials = grpc.credentials.createSsl(
  fs.readFileSync('ca-cert.pem'),      // CA certificate
  fs.readFileSync('client-key.pem'),   // Client private key
  fs.readFileSync('client-cert.pem')   // Client certificate
);

const client = new ServiceClient('internal-service:443', credentials);
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V12.1 General TLS Security | Required | Required | Required |
| V12.2 HTTPS External Services | Required | Required | Required |
| V12.3 Service-to-Service | Partial | Required | Required |

## References

- [OWASP ASVS V12 -- Secure Communication](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
- [OWASP HTTP Strict Transport Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Mozilla Server Side TLS Guidelines](https://wiki.mozilla.org/Security/Server_Side_TLS)
- [NIST SP 800-52 Rev 2 -- TLS Guidelines](https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final)
