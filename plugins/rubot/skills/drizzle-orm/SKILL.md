---
name: drizzle-orm
version: 1.1.0
description: |
  Drizzle ORM for type-safe PostgreSQL schema definition, query building, migrations, and NeonDB integration. MUST activate for: pgTable, pgEnum, serial, text, varchar, integer, boolean, timestamp, jsonb, uuid, InferSelectModel, InferInsertModel, drizzle-kit generate, drizzle-kit migrate, drizzle-kit push, drizzle-kit studio, drizzle.config.ts, drizzle-orm imports (eq, and, or, like, desc, sql, count), relations(), onConflictDoUpdate, sql.placeholder, db.query.*, db.transaction, db.select, db.insert, db.update, db.delete, .returning(), .references(), .prepare(), neon-http, neon-serverless, drizzle-orm/pg-core, and @neondatabase/serverless. Also activate when: creating database tables/schemas, adding columns to existing tables, writing upsert queries, defining one-to-many or many-to-many relations, adding indexes (composite, unique), setting up drizzle.config.ts, connecting to Neon serverless PostgreSQL, "db.query.users is undefined", wrapping writes in transactions with rollback, running migrations that produce empty files, migration fails with connection/syntax error, or setting up the Neon HTTP vs WebSocket pool connection for Cloudflare Workers. Do NOT activate for: Prisma (prisma generate), raw SQL materialized views, Supabase client setup, MongoDB, Redis caching, tRPC procedure implementation, useQuery hooks, row-level security policies, or general RBAC permission table design (use rbac-auth).

  Covers: schema definition (pgTable), migrations (drizzle-kit), queries, relations, transactions, indexes, prepared statements, NeonDB/PostgreSQL integration, type inference (InferSelectModel/InferInsertModel), upserts, and query optimization.
agents:
  - neon-master
  - backend-master
---

# Drizzle ORM Skill

> Type-safe database operations that feel like writing SQL, with full TypeScript inference and zero runtime overhead

## When to Use

- **Defining database schemas** — creating tables, columns, constraints, indexes, and enums with `pgTable`
- **Running migrations** — generating, applying, or pushing schema changes with `drizzle-kit`
- **Writing type-safe queries** — select, insert, update, delete, joins, and aggregations using Drizzle's SQL-like API
- **Modeling relations** — setting up one-to-many, many-to-many, and self-referencing relations for the query API
- **Integrating NeonDB** — connecting to Neon serverless PostgreSQL via HTTP or WebSocket pool
- **Inferring TypeScript types** — deriving `InferSelectModel` / `InferInsertModel` types from schemas
- **Optimizing performance** — prepared statements, selective column queries, batch operations, and strategic indexing
- **Managing transactions** — wrapping multi-table writes in atomic transactions with rollback support

## Quick Reference

| Task | Command / API | Notes |
|------|---------------|-------|
| Generate migration | `bunx drizzle-kit generate` | Creates SQL migration files in `./drizzle` |
| Apply migrations | `bunx drizzle-kit migrate` | Runs pending migrations against the database |
| Push schema (dev) | `bunx drizzle-kit push` | Syncs schema directly without migration files |
| Open Drizzle Studio | `bunx drizzle-kit studio` | Browser-based database GUI |
| Define a table | `pgTable('name', { ... })` | Import from `drizzle-orm/pg-core` |
| Infer select type | `InferSelectModel<typeof table>` | Full row type with all columns |
| Infer insert type | `InferInsertModel<typeof table>` | Omits auto-generated columns |
| Define relations | `relations(table, ({ one, many }) => ...)` | Required for `db.query` relational API |
| Prepared statement | `db.select().from(t).where(eq(t.id, sql.placeholder('id'))).prepare('name')` | Reusable parameterized query |

## Core Principles

1. **Schema as Code** — Define schemas in TypeScript, not raw SQL. WHY: TypeScript schemas are version-controlled, produce compile-time type errors when misused, and auto-generate migration SQL. Raw SQL files get out of sync, lack type safety, and require manual type definitions that drift from reality.

2. **Drizzle over Prisma for edge and performance** — Choose Drizzle when the project runs on Cloudflare Workers, Bun, or any edge runtime. WHY: Drizzle has zero runtime overhead (no query engine binary), produces SQL you can read and predict, and works natively in edge environments where Prisma's Rust engine cannot run. The SQL-like API also means less abstraction to debug.

3. **Type Safety End-to-End** — Always derive types from the schema using `InferSelectModel` / `InferInsertModel` instead of writing interfaces by hand. WHY: Hand-written types silently diverge from the actual database schema after migrations. Inferred types are always in sync because they are computed from the single source of truth.

4. **Migration Discipline** — Use `drizzle-kit generate` + `drizzle-kit migrate` for production; use `drizzle-kit push` only in local development. WHY: `push` applies changes directly without creating migration files, making production rollbacks impossible and team collaboration chaotic. Generated migration files provide an auditable, reviewable history of every schema change.

## Required Packages

```bash
# Core ORM + migration CLI
bun add drizzle-orm
bun add -D drizzle-kit

# NeonDB adapter (pick one based on runtime)
bun add @neondatabase/serverless          # for both neon-http and neon-serverless

# Standard PostgreSQL (non-Neon)
bun add postgres                          # for drizzle-orm/postgres-js
```

## Common Column Types

| Drizzle Type | PostgreSQL Type | Usage |
|-------------|----------------|-------|
| `serial('col')` | `SERIAL` | Auto-incrementing integer PK |
| `text('col')` | `TEXT` | Variable-length string |
| `varchar('col', { length: 255 })` | `VARCHAR(255)` | Length-limited string |
| `integer('col')` | `INTEGER` | 32-bit integer |
| `boolean('col')` | `BOOLEAN` | True/false |
| `timestamp('col')` | `TIMESTAMP` | Date and time |
| `timestamp('col', { withTimezone: true })` | `TIMESTAMPTZ` | Timezone-aware datetime |
| `json('col')` | `JSON` | JSON data (not queryable) |
| `jsonb('col')` | `JSONB` | Binary JSON (queryable, indexable) |
| `pgEnum('name', [...])` | `ENUM` | Custom enum type |
| `uuid('col').defaultRandom()` | `UUID DEFAULT gen_random_uuid()` | UUID primary key |

## Schema Definition Patterns

### Basic Table Schema

```typescript
import { pgTable, serial, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

// Define enums before tables that reference them
export const statusEnum = pgEnum('status', ['active', 'inactive', 'suspended']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  status: statusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});
```

### Relations

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));
```

### Indexes

```typescript
import { pgTable, serial, text, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  authorId: integer('author_id').notNull(),
  status: text('status').notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),
  authorStatusIdx: index('posts_author_status_idx').on(table.authorId, table.status),
}));
```

## Query Patterns

### Select Queries

```typescript
import { db } from './db';
import { users, posts } from './schema';
import { eq, and, or, like, desc, sql, count } from 'drizzle-orm';

// Select specific columns (preferred for performance)
const userEmails = await db
  .select({ id: users.id, email: users.email })
  .from(users);

// Complex conditions with ordering and pagination
const filteredUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      or(like(users.email, '%@company.com'), like(users.name, 'Admin%'))
    )
  )
  .orderBy(desc(users.createdAt))
  .limit(10)
  .offset(20);

// Aggregations
const userCount = await db.select({ total: count() }).from(users);
```

### Joins and Relations

```typescript
// Relational query API (requires relations to be defined)
const usersWithPosts = await db.query.users.findMany({
  with: { posts: { with: { comments: true } } },
});

// Manual inner join
const postsWithAuthors = await db
  .select({ post: posts, author: users })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));
```

### Insert, Update, Delete

```typescript
// Single insert with returning
const [newUser] = await db
  .insert(users)
  .values({ email: 'user@example.com', name: 'New User' })
  .returning();

// Batch insert
await db.insert(users).values([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
]);

// Upsert (insert or update on conflict)
const [upserted] = await db
  .insert(users)
  .values({ email: 'user@example.com', name: 'User' })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: 'Updated User', updatedAt: new Date() },
  })
  .returning();

// Update
await db.update(users).set({ isActive: false }).where(eq(users.id, 1));

// Soft delete (preferred over hard delete)
await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, 1));

// Hard delete
await db.delete(users).where(eq(users.id, 1));
```

## Prepared Statements

Pre-compile query plans for reuse, reducing parsing overhead on hot paths like auth checks and session lookups.

```typescript
import { sql } from 'drizzle-orm';

const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('get_user_by_id');

// Execute with different parameters — reuses the compiled plan
const user = await getUserById.execute({ id: 1 });
const other = await getUserById.execute({ id: 42 });
```

## Transactions

```typescript
// All queries succeed or all rollback
const result = await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(users)
    .values({ email: 'user@example.com', name: 'User' })
    .returning();

  await tx.insert(posts).values({ title: 'First Post', authorId: user.id });
  return user;
});

// Explicit rollback on business logic failure
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ email: 'a@b.com', name: 'A' }).returning();
  const existing = await tx.select().from(posts).where(eq(posts.authorId, user.id));
  if (existing.length > 0) tx.rollback();
  await tx.insert(posts).values({ title: 'Post', authorId: user.id });
});
```

## NeonDB Integration

### HTTP Connection (serverless, per-request)

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### WebSocket Pool Connection (long-lived, connection reuse)

```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

**When to use which:** Use HTTP (`neon-http`) for Cloudflare Workers and short-lived serverless functions. Use WebSocket pool (`neon-serverless`) for Bun/Node servers that benefit from connection reuse.

## Migrations

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Migration Commands

```bash
bunx drizzle-kit generate  # Create SQL migration from schema changes
bunx drizzle-kit migrate   # Apply pending migrations
bunx drizzle-kit push      # Dev only — sync schema without migration file
bunx drizzle-kit studio    # Open browser-based database GUI
```

### Programmatic Migration (deployment scripts)

```typescript
import { migrate } from 'drizzle-orm/neon-http/migrator';
await migrate(db, { migrationsFolder: './drizzle' });
```

## Type Inference

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './schema';

export type User = InferSelectModel<typeof users>;     // full row type
export type NewUser = InferInsertModel<typeof users>;   // omits auto-generated cols

async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}
```

## Best Practices

### Schema Organization

```
src/db/
  schema/
    users.ts        # User table + enums
    posts.ts        # Posts table
    relations.ts    # All relation definitions
    index.ts        # Re-exports all schemas
  index.ts          # DB client export
  migrate.ts        # Programmatic migration runner
drizzle/            # Generated migration files
drizzle.config.ts   # Drizzle Kit configuration
```

### Query Optimization

1. **Select only needed columns** — `db.select({ id: users.id }).from(users)` over `db.select().from(users)`
2. **Index strategically** — add indexes for `WHERE`, `ORDER BY`, `JOIN` columns; avoid over-indexing
3. **Batch operations** — `db.insert(users).values(array)` instead of looping individual inserts
4. **Prepared statements for hot paths** — auth checks, session lookups, frequent filters

### Error Handling

```typescript
try {
  await db.insert(users).values({ email: 'existing@email.com', name: 'User' });
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('unique constraint')) throw new Error('Email already exists');
    if (error.message.includes('foreign key constraint')) throw new Error('Referenced record does not exist');
  }
  throw error;
}
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `drizzle-kit generate` produces empty migration | No schema changes detected vs last snapshot | Check that `schema` path in `drizzle.config.ts` points to the correct file; delete `drizzle/meta` to regenerate from scratch |
| Migration fails with syntax error | Invalid schema definition or unsupported column type | Review the generated SQL in `drizzle/` folder; check Drizzle docs for correct column type API |
| Migration fails with connection error | `DATABASE_URL` missing or incorrect | Verify `.env` / `.env.local` has a valid `DATABASE_URL`; test connection with `psql $DATABASE_URL` |
| TypeScript types not matching database | Schema changed but types not regenerated | Run `bunx drizzle-kit generate` then restart TypeScript server; types are inferred live from schema so check imports |
| `db.query.users` is undefined | Schema not passed to `drizzle()` constructor | Pass `{ schema }` as second argument: `drizzle(client, { schema })` |
| Relational query returns empty array | Relation not defined or defined incorrectly | Verify `relations()` call exists for both sides; check `fields` and `references` arrays match the correct columns |
| `onConflictDoUpdate` not working | Wrong conflict target column | `target` must be a column (or columns) with a `UNIQUE` constraint or primary key |
| Prepared statement returns stale data | Connection pooling serving cached plans | Recreate the prepared statement after schema changes; ensure pool is not caching across schema migrations |
| `Cannot find module 'drizzle-orm/neon-http'` | Wrong drizzle adapter package installed | Install the correct adapter: `bun add drizzle-orm @neondatabase/serverless` |
| `relation "table_name" does not exist` | Migration not applied or wrong database | Run `bunx drizzle-kit migrate`; verify `DATABASE_URL` points to the correct database |

## Constraints

- **Always use `drizzle-kit generate` + `migrate` for production** — never use `push` outside local development
- **Never store `DATABASE_URL` in code** — always load from environment variables
- **Schema files must be importable by `drizzle-kit`** — avoid side effects (API calls, server startup) in schema files
- **Relations are metadata only** — they do not create foreign keys in the database; use `.references()` on columns for actual FK constraints
- **Drizzle does not auto-run migrations** — you must explicitly run migrations in deployment scripts or application startup
- **One schema directory per database** — do not mix schemas for different databases in the same `drizzle.config.ts`
- **`returning()` is PostgreSQL-specific** — does not work with MySQL or SQLite adapters
- **Soft deletes require manual filtering** — Drizzle has no built-in soft delete; add `.where(isNull(table.deletedAt))` to every query or use a wrapper

## Verification Checklist

Before marking database integration as complete, confirm every item:

- [ ] `drizzle.config.ts` exists with correct `schema` path and `dialect`
- [ ] All tables use `pgTable` with explicit column names matching snake_case convention
- [ ] Every table has a primary key defined
- [ ] Foreign key columns use `.references(() => parentTable.id)` for database-level constraints
- [ ] Relations are defined for all foreign key relationships (both sides)
- [ ] `InferSelectModel` and `InferInsertModel` types are exported for each table
- [ ] `bunx drizzle-kit generate` produces a valid migration file
- [ ] `bunx drizzle-kit migrate` applies without errors against the target database
- [ ] Indexes exist for columns used in `WHERE`, `ORDER BY`, and `JOIN` clauses
- [ ] Unique constraints exist for business-unique fields (email, slug, etc.)
- [ ] `DATABASE_URL` is loaded from environment variables, not hardcoded
- [ ] Schema is passed to the `drizzle()` constructor: `drizzle(client, { schema })`
- [ ] Transactions wrap any multi-table write operations
- [ ] Error handling covers unique constraint violations and foreign key failures
- [ ] Prepared statements are used for high-frequency queries

## References

- Drizzle ORM documentation: https://orm.drizzle.team/docs/overview
- Drizzle Kit (migrations CLI): https://orm.drizzle.team/kit-docs/overview
- Drizzle with Neon: https://orm.drizzle.team/docs/get-started-postgresql#neon
- Drizzle relations: https://orm.drizzle.team/docs/rqb
- Drizzle prepared statements: https://orm.drizzle.team/docs/perf-queries
- NeonDB serverless driver: https://neon.tech/docs/serverless/serverless-driver
- PostgreSQL index best practices: https://www.postgresql.org/docs/current/indexes.html
