---
name: elysiajs
version: 1.1.0
description: |
  Build high-performance, type-safe HTTP servers and REST APIs with ElysiaJS on Bun. ACTIVATE THIS SKILL when the user wants to: create Elysia routes with Typebox validation (t.Object, t.Numeric, t.File), build auth plugins using derive/macro, add @elysiajs/swagger for OpenAPI docs, wire up Eden treaty client for end-to-end type-safe API calls, implement WebSocket with pub/sub channels, handle file uploads with t.File validation, fix plugin ordering issues (.use(authPlugin) before routes), set up route groups and guards for API versioning, add custom error handling with onError hooks, configure CORS, fix t.Numeric() param coercion, fix type inference breaking with intermediate variables, or set up lifecycle hooks (onRequest, onBeforeHandle, onAfterHandle).

  Trigger on: "Elysia", "ElysiaJS", "Eden treaty", "Eden client", "Typebox validation", "@elysiajs/swagger", "Bun HTTP server", "Elysia plugin", "Elysia WebSocket", "Elysia route", "Elysia error handling", "Elysia guard", "Elysia derive", "Elysia macro".

  DO NOT trigger for: Express.js, Fastify, Hono.js, tRPC with Next.js, Apollo GraphQL, Drizzle ORM schema, AWS Lambda, or generic Node.js HTTP servers.
agents:
  - backend-master
---

# ElysiaJS Skill

> High-performance, type-safe Bun HTTP server and REST API framework

## When to Use

- Building a new REST API or HTTP server with Bun
- Creating type-safe API endpoints with request/response validation
- Setting up middleware, CORS, JWT auth, or lifecycle hooks
- Implementing route validation with Typebox schemas
- Connecting frontend to backend with Eden client for end-to-end type safety
- Designing plugin architecture for composable, reusable server features
- Adding WebSocket support to an existing Elysia server
- Generating OpenAPI/Swagger documentation from route definitions

## Quick Reference

| Concept | Description |
|---------|-------------|
| **Elysia** | Core server class, entry point for all routes and plugins |
| **Route** | HTTP method handler bound to a path pattern |
| **Plugin** | Reusable Elysia instance composed via `.use()` |
| **Guard** | Shared validation/hooks applied to a group of routes |
| **Lifecycle Hook** | Request/response interception at defined stages |
| **Derive** | Compute and inject new context properties per request |
| **State** | Global mutable store shared across all handlers |
| **Decorate** | Immutable values/functions injected into handler context |
| **t (Typebox)** | Schema builder for validation and type inference |
| **Eden** | Type-safe HTTP client generated from server types |

## Core Principles

1. **Type Safety First**: Leverage end-to-end type inference from route definition to client consumption. WHY: catches bugs at compile time rather than runtime, eliminating entire categories of API contract mismatches.
2. **Bun-Native Performance**: Build on Bun rather than Node.js for the server runtime. WHY: native TypeScript execution, faster startup, better throughput, and built-in APIs for files, hashing, and networking.
3. **Plugin Architecture**: Compose functionality through isolated, reusable plugins. WHY: plugins are independently testable, lazily loaded, and enforce separation of concerns across your API surface.
4. **Validation First**: Validate all inputs and outputs with Typebox schemas. WHY: schema validation doubles as documentation and ensures runtime data matches TypeScript types.
5. **Method Chaining**: Always chain methods on the same Elysia instance. WHY: Elysia tracks types through the chain; breaking it loses type inference.

## Basic Server Setup

```typescript
import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => 'Hello World')
  .listen(3000);

console.log(`Server running at ${app.server?.hostname}:${app.server?.port}`);
```

## Routing Patterns

### Basic Routes

```typescript
const app = new Elysia()
  .get('/users', () => getUsers())
  .post('/users', ({ body }) => createUser(body))
  .put('/users/:id', ({ params, body }) => updateUser(params.id, body))
  .delete('/users/:id', ({ params }) => deleteUser(params.id))
  .patch('/users/:id', ({ params, body }) => patchUser(params.id, body));
```

### Route Parameters

```typescript
const app = new Elysia()
  // Path parameters
  .get('/users/:id', ({ params }) => {
    return getUserById(params.id);
  })
  // Query parameters
  .get('/search', ({ query }) => {
    return search(query.q, query.limit);
  })
  // Wildcards
  .get('/files/*', ({ params }) => {
    return getFile(params['*']);
  });
```

### Route Groups

```typescript
const app = new Elysia()
  .group('/api', (app) =>
    app
      .group('/v1', (app) =>
        app
          .get('/users', () => 'v1 users')
          .get('/posts', () => 'v1 posts')
      )
      .group('/v2', (app) =>
        app
          .get('/users', () => 'v2 users')
      )
  );
```

### Guards (Shared Validation)

```typescript
const app = new Elysia()
  .guard({
    headers: t.Object({
      authorization: t.String(),
    }),
  }, (app) =>
    app
      .get('/profile', ({ headers }) => getProfile(headers.authorization))
      .get('/settings', ({ headers }) => getSettings(headers.authorization))
  );
```

## Validation with Typebox

```typescript
import { Elysia, t } from 'elysia';

const app = new Elysia()
  .post('/users', ({ body }) => createUser(body), {
    body: t.Object({
      email: t.String({ format: 'email' }),
      name: t.String({ minLength: 1, maxLength: 100 }),
      age: t.Optional(t.Number({ minimum: 0, maximum: 150 })),
    }),
    response: {
      200: t.Object({
        id: t.Number(),
        email: t.String(),
        name: t.String(),
      }),
      400: t.Object({
        error: t.String(),
      }),
    },
  })
  .get('/users/:id', ({ params }) => getUser(params.id), {
    params: t.Object({
      id: t.Numeric(),
    }),
  })
  .get('/search', ({ query }) => search(query), {
    query: t.Object({
      q: t.String(),
      limit: t.Optional(t.Numeric({ default: 10 })),
      offset: t.Optional(t.Numeric({ default: 0 })),
    }),
  });
```

## Lifecycle Hooks

```typescript
const app = new Elysia()
  // Before request handling
  .onRequest(({ request }) => {
    console.log(`${request.method} ${request.url}`);
  })
  // Transform context before handler
  .onTransform(({ body }) => {
    // Modify body before validation
  })
  // Before response is sent
  .onBeforeHandle(({ set }) => {
    // Can short-circuit by returning a value
  })
  // After handler, before response
  .onAfterHandle(({ response }) => {
    // Modify response
    return response;
  })
  // After response is sent
  .onAfterResponse(({ response }) => {
    // Logging, cleanup
  })
  // Error handling
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: error.message };
    }
  });
```

## Plugin System

### Creating Plugins

```typescript
import { Elysia } from 'elysia';

const authPlugin = new Elysia({ name: 'auth' })
  .derive(({ headers }) => {
    const token = headers.authorization?.replace('Bearer ', '');
    return {
      user: token ? verifyToken(token) : null,
    };
  })
  .macro(({ onBeforeHandle }) => ({
    requireAuth(enabled: boolean) {
      if (enabled) {
        onBeforeHandle(({ user, set }) => {
          if (!user) {
            set.status = 401;
            return { error: 'Unauthorized' };
          }
        });
      }
    },
  }));

// Using the plugin
const app = new Elysia()
  .use(authPlugin)
  .get('/public', () => 'Anyone can access')
  .get('/private', ({ user }) => `Hello ${user.name}`, {
    requireAuth: true,
  });
```

### Common Plugins

```typescript
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';

const app = new Elysia()
  .use(cors({
    origin: ['https://example.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'My API',
        version: '1.0.0',
      },
    },
  }))
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!,
  }));
```

## State and Decorators

```typescript
const app = new Elysia()
  // Global state (mutable, tracked via store)
  .state('version', '1.0.0')
  // Decorators (functions/values on context)
  .decorate('db', database)
  .decorate('logger', logger)
  // Using state and decorators
  .get('/version', ({ store }) => store.version)
  .get('/users', ({ db }) => db.query.users.findMany());
```

## Error Handling

```typescript
import { Elysia, NotFoundError } from 'elysia';

// Custom error class
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
  }
}

const app = new Elysia()
  .error({
    VALIDATION_ERROR: ValidationError,
  })
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return { error: 'Validation failed', details: error.all };
      case 'NOT_FOUND':
        set.status = 404;
        return { error: 'Not found' };
      case 'VALIDATION_ERROR':
        set.status = 400;
        return { error: error.message, field: error.field };
      default:
        set.status = 500;
        return { error: 'Internal server error' };
    }
  })
  .get('/users/:id', ({ params }) => {
    const user = getUserById(params.id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  });
```

## Eden Client (Type-Safe Client)

```typescript
// Server (server.ts)
import { Elysia, t } from 'elysia';

const app = new Elysia()
  .get('/users', () => getUsers())
  .post('/users', ({ body }) => createUser(body), {
    body: t.Object({
      email: t.String(),
      name: t.String(),
    }),
  });

export type App = typeof app;

// Client (client.ts)
import { treaty } from '@elysiajs/eden';
import type { App } from './server';

const client = treaty<App>('http://localhost:3000');

// Fully typed - errors caught at compile time
const users = await client.users.get();
const newUser = await client.users.post({
  email: 'user@example.com',
  name: 'New User',
});
```

## tRPC Integration

```typescript
import { Elysia } from 'elysia';
import { trpc } from '@elysiajs/trpc';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();
const router = t.router({
  users: t.router({
    list: t.procedure.query(() => getUsers()),
    get: t.procedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getUserById(input.id)),
    create: t.procedure
      .input(z.object({ email: z.string().email(), name: z.string() }))
      .mutation(({ input }) => createUser(input)),
  }),
});

const app = new Elysia()
  .use(trpc(router))
  .listen(3000);

export type AppRouter = typeof router;
```

## File Handling

```typescript
import { Elysia, t } from 'elysia';

const app = new Elysia()
  .post('/upload', async ({ body }) => {
    const file = body.file;
    const buffer = await file.arrayBuffer();
    await Bun.write(`./uploads/${file.name}`, buffer);
    return { filename: file.name, size: file.size };
  }, {
    body: t.Object({
      file: t.File({
        type: ['image/jpeg', 'image/png'],
        maxSize: '5m',
      }),
    }),
  })
  .get('/files/:name', ({ params }) => {
    return Bun.file(`./uploads/${params.name}`);
  });
```

## WebSocket Support

```typescript
import { Elysia, t } from 'elysia';

const app = new Elysia()
  .ws('/chat', {
    body: t.Object({
      message: t.String(),
    }),
    open(ws) {
      ws.subscribe('chat');
    },
    message(ws, { message }) {
      ws.publish('chat', { user: ws.id, message });
    },
    close(ws) {
      ws.unsubscribe('chat');
    },
  });
```

## Best Practices

### Project Structure

```
src/
  routes/
    users.ts
    posts.ts
    index.ts
  plugins/
    auth.ts
    logging.ts
  middleware/
    validation.ts
  index.ts
```

### Route Module Pattern

```typescript
// src/routes/users.ts
import { Elysia, t } from 'elysia';
import { db } from '../db';

export const usersRoutes = new Elysia({ prefix: '/users' })
  .get('/', () => db.query.users.findMany())
  .get('/:id', ({ params }) => db.query.users.findFirst({
    where: eq(users.id, params.id),
  }), {
    params: t.Object({ id: t.Numeric() }),
  })
  .post('/', ({ body }) => db.insert(users).values(body).returning(), {
    body: t.Object({
      email: t.String({ format: 'email' }),
      name: t.String(),
    }),
  });

// src/index.ts
import { Elysia } from 'elysia';
import { usersRoutes } from './routes/users';
import { postsRoutes } from './routes/posts';

const app = new Elysia()
  .use(usersRoutes)
  .use(postsRoutes)
  .listen(3000);

// Always export the app type for Eden clients
export type App = typeof app;
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Type inference broken | Method chain interrupted by variable reassignment or conditional logic | Keep all `.get()`, `.post()`, `.use()` calls chained on the same instance without breaking the chain |
| Plugin not working | `.use()` called after routes that depend on it | Move `.use(plugin)` BEFORE any routes that consume the plugin's context, derive, or macro |
| CORS errors in browser | Missing or misconfigured `@elysiajs/cors` plugin | Add `.use(cors({ origin: ['your-domain'] }))` before route definitions |
| `params.id` is string not number | Path params are always strings by default | Use `t.Object({ id: t.Numeric() })` in params validation to coerce to number |
| Eden client types stale | Server type export not updated after route changes | Re-export `type App = typeof app` and ensure client imports the latest type |
| `store` property missing | Accessing state before `.state()` declaration | Declare `.state('key', value)` before any handler that reads `store.key` |
| Handler returns undefined | Async handler missing return statement | Ensure all code paths return a value; Elysia does not auto-serialize undefined |
| Validation error on valid data | Schema mismatch between `t.Number()` and string input | Use `t.Numeric()` for query/path params that arrive as strings but should be numbers |

## Constraints

- **Bun Only**: ElysiaJS requires Bun runtime. It does not run on Node.js or Deno.
- **Method Chaining Required**: Breaking the method chain (e.g., storing intermediate results in variables) breaks type inference. Always chain.
- **Plugin Order Matters**: Plugins registered with `.use()` must appear before routes that depend on them. Order of `.use()` calls defines the execution order.
- **No Express Middleware**: Express/Connect middleware is not compatible. Use Elysia's native plugin and hook system instead.
- **Schema Serialization**: Typebox schemas must be serializable. Do not use functions or class instances inside schema definitions.
- **Single Listen Call**: Only call `.listen()` once per Elysia instance. Multiple `.listen()` calls will throw.
- **Eden Requires Type Export**: The Eden client only works if the server exports its app type via `export type App = typeof app`.

## Verification Checklist

- [ ] Server starts without errors on `bun run dev`
- [ ] All routes have Typebox validation for body, params, and query where applicable
- [ ] Response schemas defined for all routes (enables OpenAPI generation)
- [ ] Plugins are `.use()`-d before routes that depend on them
- [ ] Method chain is unbroken from `new Elysia()` through `.listen()`
- [ ] Error handler covers VALIDATION, NOT_FOUND, and default cases
- [ ] CORS plugin configured if API is consumed from browser
- [ ] App type exported for Eden client consumers: `export type App = typeof app`
- [ ] Route modules use `new Elysia({ prefix: '/resource' })` pattern
- [ ] No Express/Connect middleware used (Elysia-native plugins only)

## References

- [ElysiaJS Docs](https://elysiajs.com) | [Eden Client](https://elysiajs.com/eden/overview) | [Plugins](https://elysiajs.com/plugins/overview)
- [Typebox Schemas](https://github.com/sinclairzx81/typebox) | [Bun Runtime](https://bun.sh)
