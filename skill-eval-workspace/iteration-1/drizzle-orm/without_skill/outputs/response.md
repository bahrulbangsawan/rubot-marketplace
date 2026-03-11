# Multi-Tenant Invoice Management Schema with Drizzle ORM

Here's a Drizzle schema for your multi-tenant invoice management SaaS.

## Install Dependencies

```bash
npm install drizzle-orm
npm install -D drizzle-kit
npm install pg        # or your preferred PostgreSQL driver
```

## Schema Definition

Create a schema file (e.g., `src/schema.ts`):

```typescript
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue']);

// Organizations table
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  orgIdIdx: index('users_org_id_idx').on(table.orgId),
}));

// Invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  number: text('number').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  amountCents: integer('amount_cents').notNull(),
  dueDate: timestamp('due_date').notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('invoices_org_id_idx').on(table.orgId),
  orgNumberIdx: uniqueIndex('invoices_org_number_idx').on(table.orgId, table.number),
}));

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invoices: many(invoices),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
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

## Database Connection

```typescript
// src/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

## Drizzle Config

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## Example Queries

```typescript
// Get users with their organization
const usersWithOrg = await db.query.users.findMany({
  with: {
    organization: true,
  },
});

// Get invoices with creator info
const invoicesWithCreator = await db.query.invoices.findMany({
  with: {
    creator: true,
  },
});

// Get org with everything
const org = await db.query.organizations.findFirst({
  where: (orgs, { eq }) => eq(orgs.slug, 'my-company'),
  with: {
    users: true,
    invoices: {
      with: {
        creator: true,
      },
    },
  },
});
```

## Migrations

```bash
npx drizzle-kit generate:pg    # Generate migration
npx drizzle-kit push:pg        # Push to database (dev)
```

## Type Inference

```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type Organization = InferSelectModel<typeof organizations>;
type NewOrganization = InferInsertModel<typeof organizations>;

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

type Invoice = InferSelectModel<typeof invoices>;
type NewInvoice = InferInsertModel<typeof invoices>;
```
