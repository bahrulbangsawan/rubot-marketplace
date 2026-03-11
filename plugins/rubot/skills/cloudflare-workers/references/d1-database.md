# D1 Database Reference

## D1 Operations

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

## D1 Migrations

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
