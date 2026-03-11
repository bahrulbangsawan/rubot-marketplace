# Caching Product Catalog API Responses in KV with 24-Hour TTL

Here's how to set up KV caching for your product catalog with a 24-hour TTL in your existing Cloudflare Worker.

## 1. Create the KV Namespace

```bash
npx wrangler kv:namespace create "PRODUCT_CACHE"
```

Take note of the namespace ID from the output.

## 2. Update `wrangler.toml`

Add the KV namespace binding:

```toml
kv_namespaces = [
  { binding = "PRODUCT_CACHE", id = "your-namespace-id-here" }
]
```

## 3. Update the Env Interface in `src/index.ts`

```typescript
export interface Env {
  // ... existing bindings
  PRODUCT_CACHE: KVNamespace;
}
```

## 4. Implement the Caching Logic

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/catalog') {
      const cacheKey = 'product-catalog';

      // Try to get from KV first
      const cached = await env.PRODUCT_CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Fetch from origin
      const response = await fetch('https://your-api.example.com/catalog');
      const data = await response.text();

      // Store in KV with 24h TTL (in seconds)
      await env.PRODUCT_CACHE.put(cacheKey, data, {
        expirationTtl: 86400,
      });

      return new Response(data, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

## 5. Cache Invalidation

If you need to manually invalidate the cache before the TTL expires:

```typescript
await env.PRODUCT_CACHE.delete('product-catalog');
```

## Notes

- The TTL is set to 86400 seconds (24 hours).
- KV is eventually consistent, so there may be a brief delay after writing before the value is available in all regions.
- Test locally with `npx wrangler dev`.
