---
name: owasp-api-security
version: 1.0.0
description: |
  Audits application APIs for OWASP ASVS V4 compliance covering generic web service security,
  HTTP message structure validation, GraphQL security, and WebSocket security. Provides
  verification checklists, API testing patterns, and remediation guidance for request smuggling
  prevention, content type enforcement, GraphQL depth limiting, WebSocket authentication,
  and API-level access control.

  Trigger on: "API security audit", "ASVS V4", "web service security", "GraphQL security",
  "WebSocket security", "request smuggling", "HTTP desync", "API access control",
  "GraphQL introspection", "query depth limit", "GraphQL complexity", "WebSocket authentication",
  "API content type", "response splitting", "header injection", "API DoS", "batching attack"

  DO NOT trigger for: frontend browser security (use owasp-web-frontend-security),
  authentication mechanisms (use owasp-authentication), OAuth/OIDC flows (use owasp-oauth-oidc),
  input validation logic (use owasp-validation-logic), file upload endpoints (use owasp-file-handling)
agents:
  - debug-master
---

# OWASP ASVS V4 -- API and Web Service Security Audit

## Overview

ASVS V4 addresses security concerns specific to web services and APIs, including REST, GraphQL,
and WebSocket interfaces. Modern applications expose significant functionality through APIs,
making them prime attack targets. This skill covers HTTP protocol-level attacks (request
smuggling, response splitting), content type enforcement, GraphQL-specific threats (depth
attacks, introspection leaks, batching abuse), and WebSocket security (authentication,
origin validation, message integrity).

## When to Use

- Auditing REST API security architecture and configuration
- Reviewing GraphQL API for depth attacks, introspection exposure, and complexity abuse
- Assessing WebSocket implementations for authentication and authorization
- Checking HTTP message handling for request smuggling vulnerabilities
- Evaluating API-level access control and content type enforcement
- Performing a targeted ASVS V4 compliance check

## Verification Requirements

### V4.1 -- Generic Web Service Security

| ID | Requirement | Level |
|----|-------------|-------|
| V4.1.1 | The same security mechanisms (encoding, validation, auth) are applied regardless of API type (REST, GraphQL, SOAP, WebSocket) | L1 |
| V4.1.2 | Explicit Content-Type is set on all API responses and validated on requests | L1 |
| V4.1.3 | Access control decisions are made in a trusted service layer, not at the API gateway alone | L1 |
| V4.1.4 | API versioning is implemented and older insecure versions are deprecated | L2 |
| V4.1.5 | Error responses do not expose stack traces, internal paths, or sensitive system details | L1 |
| V4.1.6 | API documentation is secured and not publicly accessible in production | L2 |
| V4.1.7 | Administrative API endpoints require stronger authentication and are network-restricted | L2 |

**Audit steps:**

1. Verify all API endpoints enforce authentication and authorization.
2. Check that Content-Type headers are set explicitly on responses and validated on requests.
3. Send requests with incorrect Content-Type and verify the server rejects them.
4. Test error responses for information leakage (stack traces, file paths, SQL errors).
5. Check for exposed API documentation endpoints (/swagger, /api-docs, /graphql playground).
6. Verify admin APIs are network-restricted or require elevated authentication.

### V4.2 -- HTTP Message Structure Validation

| ID | Requirement | Level |
|----|-------------|-------|
| V4.2.1 | The application prevents HTTP request smuggling by properly handling Content-Length and Transfer-Encoding | L1 |
| V4.2.2 | HTTP response splitting / header injection is prevented by validating header values | L1 |
| V4.2.3 | Maximum request sizes and header lengths are enforced to prevent DoS | L1 |
| V4.2.4 | HTTP methods are restricted to expected verbs (e.g., only GET and POST, not TRACE or OPTIONS in production) | L1 |
| V4.2.5 | The Host header is validated against a known allowlist | L2 |
| V4.2.6 | Requests with duplicate or conflicting headers are rejected | L2 |
| V4.2.7 | HTTP/2 downgrade attacks are prevented | L3 |

**Audit steps:**

1. Test for request smuggling by sending ambiguous Content-Length/Transfer-Encoding combinations.
2. Inject CRLF characters in header values to test for response splitting.
3. Send oversized headers and bodies to test size limits.
4. Send unexpected HTTP methods (TRACE, TRACK, CONNECT) and verify they are rejected.
5. Test with spoofed Host headers for host header attacks.
6. Check reverse proxy and application server configuration for consistent header parsing.

### V4.3 -- GraphQL Security

| ID | Requirement | Level |
|----|-------------|-------|
| V4.3.1 | Query depth limiting is enforced to prevent deeply nested query attacks | L1 |
| V4.3.2 | Introspection is disabled in production environments | L1 |
| V4.3.3 | Query complexity analysis limits resource-intensive queries | L2 |
| V4.3.4 | Batching limits prevent sending excessive operations in a single request | L2 |
| V4.3.5 | Field-level authorization is enforced (not just type-level) | L1 |
| V4.3.6 | Circular fragment references and recursive queries are detected and blocked | L2 |
| V4.3.7 | Query allowlisting (persisted queries) is used in production | L3 |
| V4.3.8 | Error messages do not reveal schema details beyond what introspection would expose | L1 |

**Audit steps:**

1. Send deeply nested queries (10+ levels) and verify they are rejected.
2. Send an introspection query (`{ __schema { types { name } } }`) in production and verify it fails.
3. Send a query requesting many fields and aliases to test complexity limits.
4. Send batched queries (array of operations) and verify limits are enforced.
5. Test field-level access by querying fields that should be restricted based on the user's role.
6. Test with circular fragments to verify the parser handles them safely.

### V4.4 -- WebSocket Security

| ID | Requirement | Level |
|----|-------------|-------|
| V4.4.1 | WebSocket connections require authentication before exchanging application data | L1 |
| V4.4.2 | Origin header is validated during WebSocket handshake | L1 |
| V4.4.3 | Rate limiting is applied to WebSocket messages | L2 |
| V4.4.4 | Maximum message size is enforced for WebSocket frames | L1 |
| V4.4.5 | WebSocket messages are validated and sanitized like any other input | L1 |
| V4.4.6 | Authorization is checked for each WebSocket message, not just at connection time | L2 |
| V4.4.7 | Idle WebSocket connections are timed out | L2 |
| V4.4.8 | WSS (WebSocket Secure) is used for all WebSocket connections | L1 |

**Audit steps:**

1. Attempt to open a WebSocket connection without authentication tokens.
2. Open a connection with a forged Origin header and verify it is rejected.
3. Send rapid bursts of messages to test rate limiting.
4. Send oversized WebSocket frames to test size limits.
5. Send malicious payloads (XSS, injection) through WebSocket messages.
6. After authentication, attempt to access resources belonging to another user via WebSocket.
7. Open a connection and leave it idle to test timeout behavior.

## Code Review Patterns

### API Content Type and Error Handling

```bash
# Missing Content-Type on responses
grep -rn "res\.send\|res\.json\|res\.end" --include="*.ts" --include="*.js" | grep -v "Content-Type\|json()\|send("

# Error handlers exposing stack traces
grep -rn "stack\|stackTrace\|err\.message\|error\.message" --include="*.ts" --include="*.js" | grep -v "test\|spec"
grep -rn "traceback\|exc_info\|DEBUG.*True" --include="*.py"

# Exposed API documentation
grep -rn "swagger\|api-docs\|graphiql\|playground\|altair" --include="*.ts" --include="*.js" --include="*.py"
```

### Request Smuggling and Header Injection

```bash
# Custom header setting without validation
grep -rn "setHeader\|set(\|res\.header\|add_header" --include="*.ts" --include="*.js" --include="*.conf"

# Transfer-Encoding / Content-Length handling
grep -rn "transfer-encoding\|content-length\|Transfer-Encoding\|Content-Length" --include="*.conf" --include="*.yaml" --include="*.yml"

# Proxy configuration (potential smuggling vector)
grep -rn "proxy_pass\|ProxyPass\|upstream\|reverse_proxy" --include="*.conf" --include="*.yaml"

# Request size limits
grep -rn "maxBodySize\|body-parser\|bodyLimit\|MAX_CONTENT_LENGTH\|client_max_body_size" --include="*.ts" --include="*.js" --include="*.py" --include="*.conf"
```

### GraphQL Security

```bash
# GraphQL server setup
grep -rn "graphql\|GraphQL\|ApolloServer\|Yoga\|Mercurius" --include="*.ts" --include="*.js"

# Introspection configuration
grep -rn "introspection\|IntrospectionQuery\|__schema" --include="*.ts" --include="*.js"

# Depth and complexity limiting
grep -rn "depthLimit\|depth-limit\|complexityLimit\|complexity\|maxDepth\|queryComplexity" --include="*.ts" --include="*.js"

# Batching configuration
grep -rn "batch\|allowBatchedHttpRequests\|maxBatchSize" --include="*.ts" --include="*.js"

# Field-level authorization
grep -rn "@auth\|@authorized\|@hasRole\|authDirective\|fieldAuthorization" --include="*.ts" --include="*.js"
```

### WebSocket Security

```bash
# WebSocket server setup
grep -rn "WebSocket\|ws(\|socket\.io\|Socket\|wss\:\/\/" --include="*.ts" --include="*.js"

# WebSocket authentication
grep -rn "ws.*auth\|socket.*auth\|connection.*token\|upgrade.*auth" --include="*.ts" --include="*.js"

# WebSocket origin validation
grep -rn "origin\|verifyClient\|allowRequest\|handleUpgrade" --include="*.ts" --include="*.js"

# WebSocket message size limits
grep -rn "maxPayload\|maxMessageSize\|maxReceivedMessageSize" --include="*.ts" --include="*.js"
```

## Remediation Guidance

### Content Type Enforcement

```typescript
import express from 'express';

const app = express();

// Enforce JSON Content-Type on request bodies
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type. Content-Type must be application/json',
      });
    }
  }
  next();
});

// Set explicit Content-Type on all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
```

### Request Size Limits

```typescript
// Express body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Header size limits (set at server level)
const server = app.listen(3000, {
  maxHeaderSize: 8192, // 8KB max header size
});
```

```nginx
# Nginx request size and header limits
client_max_body_size 1m;
large_client_header_buffers 4 8k;

# Prevent request smuggling
proxy_http_version 1.1;
proxy_set_header Connection "";
```

### Secure Error Handling

```typescript
// VULNERABLE -- exposes internal details
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,       // Exposes code paths
    query: err.sql,         // Exposes SQL queries
  });
});

// SAFE -- generic error response
app.use((err, req, res, next) => {
  // Log full error internally
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
  });

  // Return generic response
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id,     // For support correlation only
  });
});
```

### GraphQL Security Configuration (Apollo Server)

```typescript
import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,

  // Disable introspection in production
  introspection: process.env.NODE_ENV !== 'production',

  // Query validation rules
  validationRules: [
    depthLimit(5),                          // Max query depth
    createComplexityLimitRule(1000, {       // Max complexity score
      scalarCost: 1,
      objectCost: 10,
      listFactor: 20,
    }),
  ],

  // Disable batching or limit it
  allowBatchedHttpRequests: false,

  // Do not expose detailed errors in production
  formatError: (formattedError, error) => {
    if (process.env.NODE_ENV === 'production') {
      return { message: 'An error occurred' };
    }
    return formattedError;
  },
});
```

### GraphQL Field-Level Authorization

```typescript
// Using a custom directive or middleware for field-level auth
const resolvers = {
  User: {
    email: (parent, args, context) => {
      // Only allow users to see their own email, or admins
      if (context.user.id !== parent.id && !context.user.isAdmin) {
        throw new ForbiddenError('Not authorized to view this field');
      }
      return parent.email;
    },
    ssn: (parent, args, context) => {
      // Highly sensitive field -- admin only
      if (!context.user.isAdmin) {
        throw new ForbiddenError('Not authorized');
      }
      return parent.ssn;
    },
  },
};
```

### WebSocket Security

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({
  server: httpsServer,     // Use WSS (TLS)
  maxPayload: 65536,       // 64KB max message size

  // Validate origin and authenticate
  verifyClient: async (info, callback) => {
    // 1. Validate origin
    const origin = info.origin;
    const allowedOrigins = ['https://app.example.com'];
    if (!allowedOrigins.includes(origin)) {
      callback(false, 403, 'Origin not allowed');
      return;
    }

    // 2. Authenticate via token in query string or cookie
    const url = new URL(info.req.url, 'https://localhost');
    const token = url.searchParams.get('token');
    try {
      const user = await verifyToken(token);
      info.req.user = user;
      callback(true);
    } catch (err) {
      callback(false, 401, 'Unauthorized');
    }
  },
});

// Rate limiting per connection
const messageRates = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.user.id;
  messageRates.set(userId, { count: 0, resetTime: Date.now() + 60000 });

  // Idle timeout
  let idleTimer = setTimeout(() => ws.close(1000, 'Idle timeout'), 300000);

  ws.on('message', (data) => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => ws.close(1000, 'Idle timeout'), 300000);

    // Rate limiting
    const rate = messageRates.get(userId);
    if (Date.now() > rate.resetTime) {
      rate.count = 0;
      rate.resetTime = Date.now() + 60000;
    }
    rate.count++;
    if (rate.count > 100) { // 100 messages per minute
      ws.close(1008, 'Rate limit exceeded');
      return;
    }

    // Validate and sanitize message content
    try {
      const message = JSON.parse(data.toString());
      const validated = messageSchema.parse(message); // Zod validation
      handleMessage(validated, req.user);
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
});
```

## ASVS Level Reference

| Section | L1 (Minimum) | L2 (Standard) | L3 (Advanced) |
|---------|-------------|---------------|---------------|
| V4.1 Generic Web Service | Content-Type enforcement, trusted service auth, safe error handling | API versioning, secured docs, admin endpoint restriction | Full API threat model |
| V4.2 HTTP Message Structure | Request size limits, method restriction, smuggling prevention | Host validation, duplicate header rejection | HTTP/2 downgrade prevention |
| V4.3 GraphQL | Depth limiting, introspection disabled, field-level auth | Complexity analysis, batching limits, circular reference detection | Persisted queries / allowlist |
| V4.4 WebSocket | WSS required, authentication, origin validation, message size limits | Rate limiting, per-message authorization, idle timeout | Full WebSocket penetration test |

## References

- [OWASP ASVS v5.0 -- V4: API and Web Service](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x15-V4-API.md)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [PortSwigger HTTP Request Smuggling](https://portswigger.net/web-security/request-smuggling)
- [GraphQL Depth Limit](https://www.npmjs.com/package/graphql-depth-limit)
- [graphql-validation-complexity](https://www.npmjs.com/package/graphql-validation-complexity)
- [Apollo Server Security Best Practices](https://www.apollographql.com/docs/apollo-server/security/)
- [OWASP WebSocket Security](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/10-Testing_WebSockets)
