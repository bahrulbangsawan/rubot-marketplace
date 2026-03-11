# Multi-Tenant Invoice Management Schema with Drizzle ORM

Below is the complete Drizzle schema for your multi-tenant SaaS invoice management system, following Drizzle ORM best practices.

## Required Packages

```bash
# Core ORM + migration CLI
bun add drizzle-orm
bun add -D drizzle-kit

# NeonDB adapter (pick one based on runtime)
bun add @neondatabase/serverless          # for serverless/edge
# OR standard PostgreSQL
bun add postgres                          # for drizzle-orm/postgres-js
```

## File Structure

```
src/db/
  schema/
    organizations.ts   # Organizations table + plan enum
    users.ts           # Users table + role enum
    invoices.ts        # Invoices table + status enum
    relations.ts       # All relation definitions
    index.ts           # Re-exports all schemas
  index.ts             # DB client export
  migrate.ts           # Programmatic migration runner
drizzle/               # Generated migration files
drizzle.config.ts      # Drizzle Kit configuration
```

## Schema Definition

### `src/db/schema/organizations.ts`

```typescript
import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'starter', 'pro', 'enterprise']);

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### `src/db/schema/users.ts`

```typescript
import { pgTable, serial, text, integer, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  role: roleEnum('role').default('member').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  orgIdIdx: index('users_org_id_idx').on(table.orgId),
}));
```

### `src/db/schema/invoices.ts`

```typescript
import { pgTable, serial, text, integer, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue']);

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  number: text('number').notNull(),            // e.g. "INV-0001"
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  amountCents: integer('amount_cents').notNull(),
  dueDate: timestamp('due_date').notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('invoices_org_id_idx').on(table.orgId),
  orgNumberUniqueIdx: uniqueIndex('invoices_org_id_number_idx').on(table.orgId, table.number),
}));
```

### `src/db/schema/relations.ts`

```typescript
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { invoices } from './invoices';

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invoices: many(invoices),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  createdInvoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoices.orgId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
}));
```

### `src/db/schema/index.ts`

```typescript
export * from './organizations';
export * from './users';
export * from './invoices';
export * from './relations';
```

## Type Inference

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { organizations, users, invoices } from './schema';

// Organization types
export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Invoice types
export type Invoice = InferSelectModel<typeof invoices>;
export type NewInvoice = InferInsertModel<typeof invoices>;
```

## Database Client Setup

```typescript
// src/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Example Relational Queries

With the relations defined above, you can use Drizzle's relational query API:

```typescript
// Get users with their organization
const usersWithOrg = await db.query.users.findMany({
  with: { organization: true },
});

// Get invoices with their creator
const invoicesWithCreator = await db.query.invoices.findMany({
  with: { creator: true },
  where: (invoices, { eq }) => eq(invoices.status, 'draft'),
});

// Get an organization with all its users and invoices
const orgWithDetails = await db.query.organizations.findFirst({
  where: (orgs, { eq }) => eq(orgs.slug, 'acme-corp'),
  with: {
    users: true,
    invoices: {
      with: { creator: true },
    },
  },
});
```

## Prepared Statements for Hot Paths

```typescript
import { eq, sql } from 'drizzle-orm';

// Reusable query for fetching invoices by org (multi-tenant filtering)
const getInvoicesByOrg = db
  .select()
  .from(invoices)
  .where(eq(invoices.orgId, sql.placeholder('orgId')))
  .prepare('get_invoices_by_org');

const orgInvoices = await getInvoicesByOrg.execute({ orgId: 1 });
```

## Migration Commands

```bash
bunx drizzle-kit generate  # Create SQL migration from schema changes
bunx drizzle-kit migrate   # Apply pending migrations
bunx drizzle-kit push      # Dev only -- sync schema without migration file
bunx drizzle-kit studio    # Open browser-based database GUI
```

## Key Design Decisions

1. **`serial` primary keys** -- Auto-incrementing integers for simplicity. Switch to `uuid('id').defaultRandom()` if you need globally unique IDs (e.g., for public-facing URLs).

2. **`amountCents` as integer** -- Store monetary values in cents to avoid floating-point precision issues. Divide by 100 in the presentation layer.

3. **Composite unique index `(org_id, number)`** -- Ensures invoice numbers like `INV-0001` are unique within each organization but can repeat across orgs.

4. **`.references()` on FK columns** -- Creates actual database-level foreign key constraints. Relations in `relations.ts` are metadata-only for the query API and do not create FK constraints by themselves.

5. **Indexes on `org_id`** -- Critical for multi-tenant performance. Every query in your SaaS will filter by `org_id`, so these indexes prevent full table scans.

## Verification Checklist

- [x] `drizzle.config.ts` exists with correct `schema` path and `dialect`
- [x] All tables use `pgTable` with explicit column names matching snake_case convention
- [x] Every table has a primary key defined
- [x] Foreign key columns use `.references(() => parentTable.id)` for database-level constraints
- [x] Relations are defined for all foreign key relationships (both sides)
- [x] `InferSelectModel` and `InferInsertModel` types are exported for each table
- [x] Indexes exist for columns used in `WHERE`, `ORDER BY`, and `JOIN` clauses
- [x] Unique constraints exist for business-unique fields (slug, email, org+number)
- [x] `DATABASE_URL` is loaded from environment variables, not hardcoded
- [x] Schema is passed to the `drizzle()` constructor: `drizzle(client, { schema })`
