---
name: cloudflare-workers
description: |
  Implements Cloudflare Workers for serverless edge computing. Use when deploying applications to Cloudflare, configuring Wrangler, setting up KV/D1/R2 storage, implementing edge logic, or optimizing for global distribution.

  Covers: Wrangler configuration, Workers API, KV storage, D1 database, R2 object storage, Durable Objects, and deployment.
---

# Cloudflare Workers Skill

You are an expert in Cloudflare Workers for serverless edge computing and global application deployment.

## Core Principles

1. **Edge-First**: Code runs at 300+ locations globally
2. **Minimal Cold Starts**: Workers start in milliseconds
3. **V8 Isolates**: Lightweight, secure execution environment
4. **Integrated Storage**: KV, D1, R2, and Durable Objects

## Project Setup

### Initialize with Wrangler

```bash
# Create new project
bunx wrangler init my-worker

# Or with a template
bunx wrangler init my-worker --template typescript
```

### Project Structure

```
my-worker/
  src/
    index.ts        # Main worker entry
    handlers/       # Route handlers
    utils/          # Utilities
  wrangler.toml     # Configuration
  package.json
  tsconfig.json
```

## Wrangler Configuration (wrangler.toml)

### Basic Configuration

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
```

### Full Configuration

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Account and zone (optional for custom domains)
# account_id = "your-account-id"
# zone_id = "your-zone-id"

# Environment variables
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

# Secrets (set via wrangler secret put)
# DATABASE_URL, API_KEY, etc.

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[[kv_namespaces]]
binding = "SESSIONS"
id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"

# R2 Buckets
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-bucket"

# Durable Objects
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"

[[migrations]]
tag = "v1"
new_classes = ["Counter"]

# Routes and custom domains
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]

# Development environment
[env.dev]
vars = { ENVIRONMENT = "development" }

# Staging environment
[env.staging]
vars = { ENVIRONMENT = "staging" }
```

## Basic Worker

```typescript
export interface Env {
  ENVIRONMENT: string;
  CACHE: KVNamespace;
  DB: D1Database;
  STORAGE: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route handling
    if (url.pathname === '/') {
      return new Response('Hello from the Edge!');
    }

    if (url.pathname === '/api/data') {
      return handleApiData(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

## Request Handling

### URL and Method Routing

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Method-based routing
    if (pathname === '/api/users') {
      switch (method) {
        case 'GET':
          return getUsers(env);
        case 'POST':
          return createUser(request, env);
        default:
          return new Response('Method Not Allowed', { status: 405 });
      }
    }

    // Path parameter extraction
    const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
    if (userMatch) {
      const userId = userMatch[1];
      switch (method) {
        case 'GET':
          return getUser(userId, env);
        case 'PUT':
          return updateUser(userId, request, env);
        case 'DELETE':
          return deleteUser(userId, env);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

### Query Parameters and Headers

```typescript
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  // Headers
  const authHeader = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type');

  // Response with headers
  return new Response(JSON.stringify({ page, limit }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'X-Custom-Header': 'value',
    },
  });
}
```

### Request Body Parsing

```typescript
async function handlePost(request: Request): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    const json = await request.json();
    return processJson(json);
  }

  if (contentType.includes('form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    return processFile(file);
  }

  if (contentType.includes('text/plain')) {
    const text = await request.text();
    return processText(text);
  }

  return new Response('Unsupported Content-Type', { status: 415 });
}
```

## KV Storage

### Basic KV Operations

```typescript
interface Env {
  CACHE: KVNamespace;
}

// Get value
async function getValue(key: string, env: Env): Promise<string | null> {
  return await env.CACHE.get(key);
}

// Get with type
async function getJsonValue<T>(key: string, env: Env): Promise<T | null> {
  return await env.CACHE.get(key, 'json');
}

// Put value
async function setValue(key: string, value: string, env: Env): Promise<void> {
  await env.CACHE.put(key, value, {
    expirationTtl: 3600, // 1 hour
  });
}

// Put JSON
async function setJsonValue(key: string, value: object, env: Env): Promise<void> {
  await env.CACHE.put(key, JSON.stringify(value), {
    expirationTtl: 86400, // 24 hours
    metadata: { type: 'json', createdAt: Date.now() },
  });
}

// Delete
async function deleteValue(key: string, env: Env): Promise<void> {
  await env.CACHE.delete(key);
}

// List keys
async function listKeys(prefix: string, env: Env): Promise<string[]> {
  const list = await env.CACHE.list({ prefix, limit: 100 });
  return list.keys.map((k) => k.name);
}
```

## D1 Database

### D1 Operations

```typescript
interface Env {
  DB: D1Database;
}

// Query all
async function getUsers(env: Env): Promise<User[]> {
  const { results } = await env.DB.prepare('SELECT * FROM users').all<User>();
  return results;
}

// Query with parameters
async function getUserById(id: number, env: Env): Promise<User | null> {
  const result = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return result;
}

// Insert
async function createUser(user: NewUser, env: Env): Promise<D1Result> {
  return await env.DB.prepare('INSERT INTO users (email, name) VALUES (?, ?)')
    .bind(user.email, user.name)
    .run();
}

// Update
async function updateUser(id: number, data: Partial<User>, env: Env): Promise<D1Result> {
  return await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?')
    .bind(data.name, id)
    .run();
}

// Delete
async function deleteUser(id: number, env: Env): Promise<D1Result> {
  return await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
}

// Batch operations
async function batchInsert(users: NewUser[], env: Env): Promise<D1Result[]> {
  const statements = users.map((user) =>
    env.DB.prepare('INSERT INTO users (email, name) VALUES (?, ?)').bind(user.email, user.name)
  );
  return await env.DB.batch(statements);
}
```

### D1 Migrations

```bash
# Create migration
bunx wrangler d1 migrations create my-database create-users-table

# Apply migrations
bunx wrangler d1 migrations apply my-database

# Apply to production
bunx wrangler d1 migrations apply my-database --remote
```

```sql
-- migrations/0001_create-users-table.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## R2 Object Storage

### R2 Operations

```typescript
interface Env {
  STORAGE: R2Bucket;
}

// Upload object
async function uploadFile(key: string, file: File, env: Env): Promise<R2Object> {
  return await env.STORAGE.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });
}

// Get object
async function getFile(key: string, env: Env): Promise<Response> {
  const object = await env.STORAGE.get(key);

  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': object.size.toString(),
      ETag: object.etag,
    },
  });
}

// Delete object
async function deleteFile(key: string, env: Env): Promise<void> {
  await env.STORAGE.delete(key);
}

// List objects
async function listFiles(prefix: string, env: Env): Promise<R2Object[]> {
  const list = await env.STORAGE.list({ prefix, limit: 100 });
  return list.objects;
}
```

## Durable Objects

### Durable Object Class

```typescript
export class Counter implements DurableObject {
  private state: DurableObjectState;
  private value: number = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    // Load persisted value
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<number>('value');
      this.value = stored || 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/increment':
        this.value++;
        await this.state.storage.put('value', this.value);
        return new Response(this.value.toString());

      case '/decrement':
        this.value--;
        await this.state.storage.put('value', this.value);
        return new Response(this.value.toString());

      case '/value':
        return new Response(this.value.toString());

      default:
        return new Response('Not Found', { status: 404 });
    }
  }
}
```

### Using Durable Objects

```typescript
interface Env {
  COUNTER: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Get Durable Object stub by name
    const id = env.COUNTER.idFromName('global-counter');
    const stub = env.COUNTER.get(id);

    // Forward request to Durable Object
    return stub.fetch(request);
  },
};
```

## Caching

### Cache API

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cacheKey = new Request(request.url, request);
    const cache = caches.default;

    // Check cache
    let response = await cache.match(cacheKey);

    if (!response) {
      // Generate response
      response = await generateResponse(request, env);

      // Clone and cache
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=3600');

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};
```

## Scheduled Workers (Cron)

```typescript
export default {
  // HTTP handler
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response('OK');
  },

  // Scheduled handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    switch (event.cron) {
      case '0 * * * *': // Every hour
        await hourlyTask(env);
        break;
      case '0 0 * * *': // Daily at midnight
        await dailyTask(env);
        break;
    }
  },
};
```

```toml
# wrangler.toml
[triggers]
crons = ["0 * * * *", "0 0 * * *"]
```

## CLI Commands

```bash
# Development
bunx wrangler dev                    # Start local dev server
bunx wrangler dev --remote           # Dev with remote resources

# Deployment
bunx wrangler deploy                 # Deploy to production
bunx wrangler deploy --env staging   # Deploy to staging

# Secrets
bunx wrangler secret put API_KEY     # Set secret
bunx wrangler secret list            # List secrets
bunx wrangler secret delete API_KEY  # Delete secret

# KV
bunx wrangler kv namespace create CACHE
bunx wrangler kv key put --namespace-id=xxx key value
bunx wrangler kv key get --namespace-id=xxx key

# D1
bunx wrangler d1 create my-database
bunx wrangler d1 execute my-database --command "SELECT * FROM users"
bunx wrangler d1 migrations apply my-database

# R2
bunx wrangler r2 bucket create my-bucket
bunx wrangler r2 object put my-bucket/key --file=./file.txt

# Tail logs
bunx wrangler tail                   # Stream live logs
```

## Best Practices

### Error Handling

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Worker error:', error);

      if (error instanceof ValidationError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
```

### CORS Handling

```typescript
function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '*';

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const response = await handleRequest(request, env);

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
```

## When to Apply This Skill

- Deploying applications to Cloudflare Workers
- Configuring Wrangler for projects
- Setting up KV, D1, or R2 storage
- Implementing edge-side logic
- Creating scheduled/cron workers
- Optimizing for global distribution
- Managing secrets and environment variables
