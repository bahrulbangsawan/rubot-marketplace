---
name: rubot-setup-localdb
description: Set up local PostgreSQL Docker database with Drizzle ORM integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - TodoWrite
  - Task
  - AskUserQuestion
---

You are setting up a local PostgreSQL database with Docker and Drizzle ORM for development.

## Prerequisites Check

Before starting, verify the environment:

```bash
# Check Docker is available
docker --version

# Check Bun is available
bun --version

# Check if port 5432 is free
lsof -i :5432 2>/dev/null || echo "Port 5432 is available"
```

If Docker is not installed, inform the user and stop.

## Setup Process

Use TodoWrite to track progress through all steps.

### Step 1: Detect Existing Configuration

Scan for existing database configuration:

```bash
# Check for existing Docker Compose
ls -la docker-compose.yml docker-compose.yaml 2>/dev/null

# Check for existing Drizzle config
ls -la drizzle.config.ts drizzle.config.json 2>/dev/null

# Check for existing schema directory
ls -la src/db 2>/dev/null

# Check for existing env files
ls -la .env .env.local 2>/dev/null

# Check package.json for existing db scripts
cat package.json 2>/dev/null | grep -E '"db:|drizzle|postgres"' | head -10
```

If existing configuration is detected, use AskUserQuestion:

```
AskUserQuestion({
  questions: [{
    question: "Existing database configuration detected. How would you like to proceed?",
    header: "Config Exists",
    options: [
      { label: "Overwrite all (Recommended)", description: "Replace existing configuration files with fresh setup" },
      { label: "Skip existing", description: "Only create missing files, keep existing ones" },
      { label: "Cancel setup", description: "Stop setup to preserve existing configuration" }
    ],
    multiSelect: false
  }]
})
```

Based on user response:
- **Overwrite all**: Continue with full setup, replacing existing files
- **Skip existing**: Only create files that don't exist, skip existing ones
- **Cancel setup**: Stop execution and inform user how to proceed manually

### Step 2: Create Docker Compose Configuration

Create `docker-compose.yml` in project root:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ${COMPOSE_PROJECT_NAME:-project}-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-rubot}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-rubot_dev_password}
      POSTGRES_DB: ${POSTGRES_DB:-rubot_dev}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-rubot} -d ${POSTGRES_DB:-rubot_dev}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### Step 3: Create Environment Configuration

Create `.env.local` file (add to .gitignore if not present):

```env
# Database Configuration (Local Docker)
DATABASE_URL=postgresql://rubot:rubot_dev_password@localhost:5432/rubot_dev
POSTGRES_USER=rubot
POSTGRES_PASSWORD=rubot_dev_password
POSTGRES_DB=rubot_dev
POSTGRES_PORT=5432
```

Ensure `.env.local` is in `.gitignore`:

```bash
# Check if .gitignore exists and has .env.local
grep -q ".env.local" .gitignore 2>/dev/null || echo ".env.local" >> .gitignore
```

### Step 4: Create Drizzle Configuration

Create `drizzle.config.ts` in project root:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Step 5: Create Database Schema Structure

Create the directory structure:

```bash
mkdir -p src/db/schema
```

Create `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for transactions
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export type Database = typeof db;
```

Create `src/db/schema/index.ts`:

```typescript
export * from './users';
export * from './sessions';
export * from './relations';
```

Create `src/db/schema/users.ts`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

Create `src/db/schema/sessions.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

Create `src/db/schema/relations.ts`:

```typescript
import { relations } from 'drizzle-orm';
import { users } from './users';
import { sessions } from './sessions';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
```

### Step 6: Add Package.json Scripts

Read current package.json and add database scripts:

```bash
cat package.json
```

Add these scripts to the "scripts" section:

```json
{
  "db:start": "docker compose up -d postgres",
  "db:stop": "docker compose down",
  "db:reset": "docker compose down -v && docker compose up -d postgres && sleep 3 && bun run db:push",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

Use Edit tool to add these scripts to package.json.

### Step 7: Install Dependencies

Install required packages:

```bash
# Install Drizzle ORM and PostgreSQL driver
bun add drizzle-orm postgres

# Install Drizzle Kit as dev dependency
bun add -d drizzle-kit
```

### Step 8: Start Docker Container

Start the PostgreSQL container:

```bash
docker compose up -d postgres
```

Wait for container to be healthy:

```bash
# Wait for PostgreSQL to be ready (max 30 seconds)
timeout=30
elapsed=0
while ! docker exec $(docker ps -qf "name=postgres") pg_isready -U rubot -d rubot_dev 2>/dev/null; do
  sleep 1
  elapsed=$((elapsed + 1))
  if [ $elapsed -ge $timeout ]; then
    echo "Timeout waiting for PostgreSQL"
    break
  fi
done
echo "PostgreSQL is ready"
```

### Step 9: Push Schema to Database

Push the schema to create tables:

```bash
bun run db:push
```

### Step 10: Verify Setup

Run verification checks:

```bash
# Verify Docker container is running
docker ps | grep postgres

# List created tables
docker exec $(docker ps -qf "name=postgres") psql -U rubot -d rubot_dev -c '\dt'
```

## Completion Summary

After successful setup, report:

1. **Files Created**:
   - `docker-compose.yml` - Docker PostgreSQL configuration
   - `.env.local` - Environment variables
   - `drizzle.config.ts` - Drizzle Kit configuration
   - `src/db/index.ts` - Database client
   - `src/db/schema/index.ts` - Schema barrel export
   - `src/db/schema/users.ts` - Users table
   - `src/db/schema/sessions.ts` - Sessions table
   - `src/db/schema/relations.ts` - Table relations

2. **Scripts Added**:
   - `bun run db:start` - Start PostgreSQL
   - `bun run db:stop` - Stop PostgreSQL
   - `bun run db:reset` - Reset database
   - `bun run db:push` - Push schema changes
   - `bun run db:studio` - Open Drizzle Studio

3. **Next Steps**:
   - Run `bun run db:studio` to view tables in browser
   - Add more schemas in `src/db/schema/`
   - Update relations as needed
   - Run `bun run validate` to ensure type safety

## Error Handling

If any step fails:

1. **Docker not available**: Inform user to install Docker Desktop
2. **Port 5432 in use**: Suggest changing POSTGRES_PORT in .env.local
3. **Dependencies fail**: Check network connection, try `bun install` manually
4. **Schema push fails**: Check DATABASE_URL, verify container is running

## Cleanup Commands

If user needs to start over:

```bash
# Stop and remove container with data
docker compose down -v

# Remove generated files
rm -rf docker-compose.yml .env.local drizzle.config.ts src/db drizzle/
```
