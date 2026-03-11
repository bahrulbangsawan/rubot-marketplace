# Durable Objects Reference

## Durable Object Class

```typescript
export class Counter implements DurableObject {
  private state: DurableObjectState;
  private value: number = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    // Load persisted value
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<number>('value');
      this.value = stored || 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/increment':
        this.value++;
        await this.state.storage.put('value', this.value);
        return new Response(this.value.toString());

      case '/decrement':
        this.value--;
        await this.state.storage.put('value', this.value);
        return new Response(this.value.toString());

      case '/value':
        return new Response(this.value.toString());

      default:
        return new Response('Not Found', { status: 404 });
    }
  }
}
```

## Using Durable Objects

```typescript
interface Env {
  COUNTER: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Get Durable Object stub by name
    const id = env.COUNTER.idFromName('global-counter');
    const stub = env.COUNTER.get(id);

    // Forward request to Durable Object
    return stub.fetch(request);
  },
};
```
