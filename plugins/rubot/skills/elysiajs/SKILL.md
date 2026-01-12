---
name: elysiajs
description: |
  Implements ElysiaJS for high-performance, type-safe HTTP servers in Bun. Use when building APIs, handling routes, implementing middleware, setting up validation, or integrating with tRPC.

  Covers: routing, validation, plugins, lifecycle hooks, error handling, OpenAPI, and Eden integration.
---

# ElysiaJS Skill

You are an expert in ElysiaJS for building high-performance, type-safe HTTP servers with Bun.

## Core Principles

1. **Type Safety**: Leverage end-to-end type inference
2. **Performance**: Utilize Bun's speed and Elysia's optimizations
3. **Plugin Architecture**: Compose functionality through plugins
4. **Validation First**: Validate all inputs with schemas

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
  // Global state
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
      .input(z.object({
        email: z.string().email(),
        name: z.string(),
      }))
      .mutation(({ input }) => createUser(input)),
  }),
});

const app = new Elysia()
  .use(trpc(router))
  .listen(3000);

export type AppRouter = typeof router;
```

## Eden Client (Type-Safe Client)

```typescript
// Server
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

// Client
import { treaty } from '@elysiajs/eden';
import type { App } from './server';

const client = treaty<App>('http://localhost:3000');

// Fully typed!
const users = await client.users.get();
const newUser = await client.users.post({
  email: 'user@example.com',
  name: 'New User',
});
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

const app = new Elysia()
  .use(usersRoutes)
  .listen(3000);
```

### Type Export for Clients

```typescript
// Always export the app type for Eden clients
export type App = typeof app;
```

## When to Apply This Skill

- Building HTTP APIs with Bun
- Implementing type-safe route handlers
- Setting up request validation
- Creating reusable plugins
- Integrating with tRPC
- Building WebSocket servers
- Generating OpenAPI documentation
