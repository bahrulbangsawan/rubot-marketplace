---
name: cloudflare-workers
version: 1.1.0
description: |
  Implements Cloudflare Workers for serverless edge computing, APIs, and storage.
  MUST activate for: deploying to Cloudflare Workers, configuring wrangler.toml, setting up KV namespace bindings, D1 database (migrations, SQL, bindings), R2 object storage (file uploads, buckets), implementing Workers secrets with wrangler secret, creating cron trigger schedules, or deploying to staging/production environments.
  Also activate when: working with Durable Objects, Cache API, environment bindings, CORS middleware for Workers, V8 runtime errors like "Buffer is not defined", bundle size limits, Worker bundle optimization, tree-shaking dependencies, "wrangler deploy --env", multipart form data handling in Workers, WebSocket connections via Durable Objects, or edge-served sitemaps from KV.
  Do NOT activate for: Cloudflare Pages static sites, Cloudflare DNS records, Cloudflare CDN page rules, Cloudflare WAF firewall rules, Vercel/Next.js edge runtime, Nginx reverse proxy, Node.js WebSocket servers, or browser service workers for PWA offline caching.
  Covers: Cloudflare Workers deployment, wrangler.toml configuration, KV storage, D1 database, R2 object storage, Durable Objects, Cache API, cron triggers, secrets management, CORS handling, bundle optimization, and environment-based deploys.
agents:
  - cloudflare
---

# Cloudflare Workers Skill

> Serverless edge computing and global application deployment on Cloudflare's network

## When to Use

- Setting up a new Cloudflare Workers project with Wrangler
- Configuring `wrangler.toml` for environments, routes, or bindings
- Implementing edge API handlers with routing and middleware
- Working with KV store, D1 database, or R2 object storage bindings
- Creating scheduled cron trigger workers for background tasks
- Managing Workers secrets and environment variables
- Deploying workers to staging or production environments
- Implementing caching strategies with the Cache API or KV

## Quick Reference

| Task                      | Command / API                                      |
| ------------------------- | -------------------------------------------------- |
| Create project            | `bunx wrangler init my-worker`                     |
| Local dev server          | `bunx wrangler dev`                                |
| Deploy to production      | `bunx wrangler deploy`                             |
| Deploy to environment     | `bunx wrangler deploy --env staging`               |
| Set secret                | `bunx wrangler secret put SECRET_NAME`             |
| Create KV namespace       | `bunx wrangler kv namespace create CACHE`          |
| Create D1 database        | `bunx wrangler d1 create my-database`              |
| Run D1 migration          | `bunx wrangler d1 migrations apply my-database`    |
| Create R2 bucket          | `bunx wrangler r2 bucket create my-bucket`         |
| Stream live logs          | `bunx wrangler tail`                               |

## Core Principles

1. **Edge-First Architecture** -- Code runs at 300+ PoPs globally. WHY: sub-50ms latency for users worldwide by running compute physically close to them, eliminating round-trips to a centralized origin server.
2. **V8 Isolates Over Containers** -- Workers use V8 isolates, not Docker containers or VMs. WHY: isolates spin up in under 5ms with near-zero cold starts, compared to 200-500ms for containers, delivering consistently fast response times.
3. **Integrated Storage** -- Use KV, D1, R2, and Durable Objects as first-class bindings. WHY: co-located storage on Cloudflare's network eliminates cross-network latency that external databases and storage services introduce.
4. **Minimal Bundle Size** -- Keep worker bundles lean and tree-shaken. WHY: smaller bundles deploy faster, start faster, and stay within the 1MB (free) or 10MB (paid) size limits.

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

[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-bucket"

[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"

[[migrations]]
tag = "v1"
new_classes = ["Counter"]

routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]

[env.dev]
vars = { ENVIRONMENT = "development" }

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

### Query Parameters, Headers, and Body Parsing

```typescript
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  // Headers
  const authHeader = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type') || '';

  // Body parsing by content type
  if (contentType.includes('application/json')) {
    const json = await request.json();
  } else if (contentType.includes('form-data')) {
    const formData = await request.formData();
  } else if (contentType.includes('text/plain')) {
    const text = await request.text();
  }

  // Response with headers
  return new Response(JSON.stringify({ page, limit }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

## KV Storage

Key-value storage for caching and session management. Supports TTL expiration and metadata. Reads are eventually consistent.

For detailed KV operations (get, put, delete, list), see [references/kv-storage.md](references/kv-storage.md).

## D1 Database

SQLite-based relational database at the edge. Supports prepared statements, parameter binding, and batch operations. Uses SQLite syntax, not PostgreSQL.

For detailed D1 operations (CRUD, batch, migrations), see [references/d1-database.md](references/d1-database.md).

## R2 Object Storage

S3-compatible object storage for files, images, and large assets. Supports streaming uploads and custom metadata.

For detailed R2 operations (upload, get, delete, list), see [references/r2-storage.md](references/r2-storage.md).

## Durable Objects

Strongly consistent, stateful objects for coordination, counters, and real-time collaboration. Each object has its own persistent storage and single-threaded execution.

For Durable Object class implementation and usage patterns, see [references/durable-objects.md](references/durable-objects.md).

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

## Troubleshooting

| Problem                          | Cause                                          | Solution                                                                                      |
| -------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Worker too large                 | Bundle exceeds size limit                      | Check bundle size: 1MB limit on free plan, 10MB on paid. Tree-shake dependencies, lazy-load.  |
| KV read returns null             | Eventual consistency delay                     | KV is eventually consistent. Writes may take up to 60s to propagate globally. Retry or cache. |
| D1 query fails                   | Invalid SQL syntax                             | D1 uses SQLite, not PostgreSQL. Check SQLite-compatible syntax (e.g., no `ILIKE`, use `LIKE`).|
| `ReferenceError: X is not defined` | Using Node.js built-in module                | Workers use V8, not Node.js. Enable `nodejs_compat` flag or use polyfills.                    |
| `wrangler dev` port conflict     | Port 8787 already in use                       | Use `--port <number>` flag or stop the conflicting process.                                   |
| Secret not found in env          | Secret not set for the environment             | Run `bunx wrangler secret put NAME --env <env>` for each target environment.                  |
| CORS preflight fails             | Missing OPTIONS handler                        | Add an explicit OPTIONS route returning CORS headers before other routes.                     |
| R2 upload fails                  | Body stream already consumed                   | Clone the request before reading the body: `request.clone()`.                                 |
| Durable Object not found         | Missing migration in wrangler.toml             | Add `[[migrations]]` entry with `new_classes` for the Durable Object class.                   |

## Constraints

- **Bundle Size**: 1MB compressed (free plan), 10MB compressed (paid plan) -- includes all dependencies
- **Memory Limit**: 128MB per worker invocation -- no large in-memory datasets
- **CPU Time**: 10ms CPU time (free), 30s CPU time (paid) per invocation -- offload heavy compute
- **Execution Wall Time**: 30s maximum wall-clock time per request
- **No Native Node.js APIs**: `fs`, `path`, `child_process`, `net`, `crypto` (partial) are unavailable unless `nodejs_compat` is enabled
- **No Raw TCP/UDP**: Workers handle HTTP only -- use Durable Objects WebSockets for persistent connections
- **KV Consistency**: Eventually consistent reads (up to 60s propagation) -- not suitable for strong consistency needs
- **Subrequest Limit**: Maximum 1,000 `fetch()` subrequests per invocation (50 on free plan)
- **R2 Object Size**: Maximum 5GB per object via single PUT, use multipart for larger uploads
- **Environment Variables**: Use `wrangler secret` for sensitive values -- never commit secrets to `wrangler.toml`

## Verification Checklist

Before deploying a Cloudflare Worker, verify:

- [ ] `wrangler.toml` has correct `name`, `main`, and `compatibility_date`
- [ ] All KV, D1, R2, and Durable Object bindings are declared in `wrangler.toml`
- [ ] Secrets are set via `wrangler secret put` for each deployment environment
- [ ] `Env` interface in TypeScript matches all bindings and variables in `wrangler.toml`
- [ ] Error handling wraps the main `fetch` handler with try/catch
- [ ] CORS headers are applied if the worker serves cross-origin requests
- [ ] Bundle size is within limits (`bunx wrangler deploy --dry-run` to check)
- [ ] D1 migrations are applied before deploying code that depends on schema changes
- [ ] Scheduled cron triggers are defined under `[triggers]` in `wrangler.toml`
- [ ] `ctx.waitUntil()` is used for background tasks to avoid blocking responses
- [ ] Local dev tested with `bunx wrangler dev` before deploying

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/) | [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/)
- [KV](https://developers.cloudflare.com/kv/) | [D1](https://developers.cloudflare.com/d1/) | [R2](https://developers.cloudflare.com/r2/) | [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Workers Platform Limits](https://developers.cloudflare.com/workers/platform/limits/)
