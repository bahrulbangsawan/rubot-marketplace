# R2 Object Storage Reference

## R2 Operations

```typescript
interface Env {
  STORAGE: R2Bucket;
}

// Upload object
async function uploadFile(key: string, file: File, env: Env): Promise<R2Object> {
  return await env.STORAGE.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });
}

// Get object
async function getFile(key: string, env: Env): Promise<Response> {
  const object = await env.STORAGE.get(key);

  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': object.size.toString(),
      ETag: object.etag,
    },
  });
}

// Delete object
async function deleteFile(key: string, env: Env): Promise<void> {
  await env.STORAGE.delete(key);
}

// List objects
async function listFiles(prefix: string, env: Env): Promise<R2Object[]> {
  const list = await env.STORAGE.list({ prefix, limit: 100 });
  return list.objects;
}
```
