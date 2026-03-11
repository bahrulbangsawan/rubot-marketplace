# Caching Product Catalog API Responses in KV with 24-Hour TTL

Here's how to implement KV-based caching for your product catalog API with a 24-hour TTL.

## 1. Create the KV Namespace

```bash
bunx wrangler kv namespace create PRODUCT_CACHE
```

This will output a namespace ID. Copy it for the next step.

## 2. Add the KV Binding to `wrangler.toml`

```toml
[[kv_namespaces]]
binding = "PRODUCT_CACHE"
id = "<namespace-id-from-step-1>"
```

## 3. Update the `Env` Interface in `src/index.ts`

Add the `PRODUCT_CACHE` binding to your existing `Env` interface:

```typescript
export interface Env {
  // ... your existing bindings
  PRODUCT_CACHE: KVNamespace;
}
```

## 4. Implement the Cached Product Catalog Handler

```typescript
const CATALOG_CACHE_KEY = 'product-catalog';
const CATALOG_TTL = 86400; // 24 hours in seconds

async function getProductCatalog(request: Request, env: Env): Promise<Response> {
  // Check KV cache first
  const cached = await env.PRODUCT_CACHE.get(CATALOG_CACHE_KEY, 'json');

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
      },
    });
  }

  // Cache miss -- fetch from origin API
  const catalogData = await fetchCatalogFromOrigin();

  // Store in KV with 24-hour TTL and metadata
  await env.PRODUCT_CACHE.put(CATALOG_CACHE_KEY, JSON.stringify(catalogData), {
    expirationTtl: CATALOG_TTL,
    metadata: { type: 'json', createdAt: Date.now() },
  });

  return new Response(JSON.stringify(catalogData), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
    },
  });
}

async function fetchCatalogFromOrigin(): Promise<unknown> {
  // Replace with your actual origin API call
  const response = await fetch('https://your-api.example.com/catalog');
  if (!response.ok) {
    throw new Error(`Origin API error: ${response.status}`);
  }
  return response.json();
}
```

## 5. Wire the Handler into Your Worker's Fetch Router

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/catalog') {
      return getProductCatalog(request, env);
    }

    // ... your existing routes

    return new Response('Not Found', { status: 404 });
  },
};
```

## 6. (Optional) Add a Cache Invalidation Endpoint

Since the catalog only updates once a day, you may want a manual invalidation route for on-demand refreshes:

```typescript
async function invalidateCatalogCache(request: Request, env: Env): Promise<Response> {
  await env.PRODUCT_CACHE.delete(CATALOG_CACHE_KEY);
  return new Response(JSON.stringify({ message: 'Catalog cache invalidated' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Wire it to a route like `POST /api/catalog/invalidate` (protect it with authentication).

## Important Notes

- **Eventual consistency**: KV is eventually consistent. Writes may take up to 60 seconds to propagate globally. This is fine for a product catalog that updates once daily.
- **`expirationTtl`** is specified in **seconds** -- `86400` = 24 hours.
- **Env interface must match `wrangler.toml`**: Ensure the `PRODUCT_CACHE` binding name in your `Env` interface matches the `binding` value in `wrangler.toml` exactly.
- **Bundle size**: Caching the full catalog in KV keeps your worker lean since no heavy data-processing dependencies are needed.
- **`ctx.waitUntil()`**: If you want to avoid blocking the response while writing to KV, wrap the `put` call in `ctx.waitUntil()`:

```typescript
ctx.waitUntil(
  env.PRODUCT_CACHE.put(CATALOG_CACHE_KEY, JSON.stringify(catalogData), {
    expirationTtl: CATALOG_TTL,
    metadata: { type: 'json', createdAt: Date.now() },
  })
);
```

## Verification Checklist

- [ ] KV namespace created via `bunx wrangler kv namespace create PRODUCT_CACHE`
- [ ] `wrangler.toml` has the `[[kv_namespaces]]` entry with correct binding and ID
- [ ] `Env` interface includes `PRODUCT_CACHE: KVNamespace`
- [ ] Cache key and TTL constants are defined
- [ ] Handler checks cache before calling origin
- [ ] Error handling wraps the fetch handler with try/catch
- [ ] Local dev tested with `bunx wrangler dev`
