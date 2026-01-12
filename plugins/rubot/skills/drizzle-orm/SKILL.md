---
name: drizzle-orm
description: |
  Implements Drizzle ORM for type-safe database operations in TypeScript applications. Use when designing database schemas, writing migrations, implementing queries, managing relations, or optimizing database performance with Drizzle.

  Covers: schema definition, migrations, queries, relations, transactions, indexes, and NeonDB/PostgreSQL integration.
---

# Drizzle ORM Skill

You are an expert in Drizzle ORM for type-safe database operations in TypeScript applications.

## Core Principles

1. **Type Safety First**: Leverage Drizzle's full TypeScript inference
2. **Schema as Code**: Define schemas in TypeScript, not raw SQL
3. **Performance Aware**: Use proper indexes and query optimization
4. **Migration Discipline**: Always use migrations for schema changes

## Schema Definition Patterns

### Basic Table Schema

```typescript
import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
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
import { pgTable, serial, text, index, uniqueIndex } from 'drizzle-orm/pg-core';

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

### Basic Queries

```typescript
import { db } from './db';
import { users, posts } from './schema';
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm';

// Select all
const allUsers = await db.select().from(users);

// Select with conditions
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.isActive, true));

// Select specific columns
const userEmails = await db
  .select({ id: users.id, email: users.email })
  .from(users);

// Complex conditions
const filteredUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.isActive, true),
      or(
        like(users.email, '%@company.com'),
        like(users.name, 'Admin%')
      )
    )
  );

// Ordering and pagination
const paginatedUsers = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt))
  .limit(10)
  .offset(20);
```

### Joins with Relations

```typescript
// Using query API with relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

// Manual join
const postsWithAuthors = await db
  .select({
    post: posts,
    author: users,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));

// Left join
const usersWithOptionalPosts = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));
```

### Insert Operations

```typescript
// Single insert
const newUser = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    name: 'New User',
  })
  .returning();

// Batch insert
const newUsers = await db
  .insert(users)
  .values([
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
  ])
  .returning();

// Upsert (insert or update)
const upsertedUser = await db
  .insert(users)
  .values({ email: 'user@example.com', name: 'User' })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: 'Updated User' },
  })
  .returning();
```

### Update Operations

```typescript
// Update with condition
const updatedUser = await db
  .update(users)
  .set({ isActive: false })
  .where(eq(users.id, 1))
  .returning();

// Update multiple fields
const updated = await db
  .update(users)
  .set({
    name: 'New Name',
    updatedAt: new Date(),
  })
  .where(eq(users.email, 'user@example.com'))
  .returning();
```

### Delete Operations

```typescript
// Delete with condition
const deletedUser = await db
  .delete(users)
  .where(eq(users.id, 1))
  .returning();

// Soft delete pattern
const softDeleted = await db
  .update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, 1))
  .returning();
```

## Transactions

```typescript
import { db } from './db';

// Basic transaction
const result = await db.transaction(async (tx) => {
  const user = await tx
    .insert(users)
    .values({ email: 'user@example.com', name: 'User' })
    .returning();

  await tx
    .insert(posts)
    .values({ title: 'First Post', authorId: user[0].id });

  return user[0];
});

// Transaction with rollback
const result = await db.transaction(async (tx) => {
  try {
    const user = await tx.insert(users).values({ ... }).returning();

    // This will rollback if it fails
    await tx.insert(posts).values({ ... });

    return user[0];
  } catch (error) {
    tx.rollback();
    throw error;
  }
});
```

## NeonDB Integration

### Connection Setup

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Serverless Pool Setup

```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

## Migrations

### Generate Migration

```bash
bunx drizzle-kit generate
```

### Apply Migration

```bash
bunx drizzle-kit migrate
```

### Push Schema (Development)

```bash
bunx drizzle-kit push
```

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

## Type Inference

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './schema';

// Infer types from schema
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Use in functions
async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}
```

## Best Practices

### Schema Organization

```
src/
  db/
    schema/
      users.ts
      posts.ts
      comments.ts
      index.ts      # Re-exports all schemas
    relations.ts    # All relation definitions
    index.ts        # DB client export
```

### Query Optimization

1. **Select Only Needed Columns**:
   ```typescript
   // Good - select specific columns
   db.select({ id: users.id, name: users.name }).from(users);

   // Avoid - selecting all when not needed
   db.select().from(users);
   ```

2. **Use Indexes Strategically**:
   - Add indexes for frequently queried columns
   - Add composite indexes for multi-column filters
   - Avoid over-indexing (impacts write performance)

3. **Batch Operations**:
   ```typescript
   // Good - batch insert
   await db.insert(users).values(arrayOfUsers);

   // Avoid - individual inserts in loop
   for (const user of users) {
     await db.insert(users).values(user);
   }
   ```

### Error Handling

```typescript
import { DatabaseError } from 'drizzle-orm';

try {
  await db.insert(users).values({ email: 'existing@email.com', name: 'User' });
} catch (error) {
  if (error instanceof DatabaseError) {
    if (error.message.includes('unique constraint')) {
      throw new Error('Email already exists');
    }
  }
  throw error;
}
```

## When to Apply This Skill

- Designing new database schemas
- Writing type-safe database queries
- Setting up migrations
- Optimizing database performance
- Integrating with NeonDB or PostgreSQL
- Implementing complex relations
- Building type-safe data access layers
