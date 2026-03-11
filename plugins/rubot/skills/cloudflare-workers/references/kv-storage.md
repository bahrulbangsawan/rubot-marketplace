# KV Storage Reference

## Basic KV Operations

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
