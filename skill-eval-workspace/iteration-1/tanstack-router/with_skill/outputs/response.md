# File-Based Routing for Property Management App

Here is the scaffolding for your property management routes using TanStack Router's file-based routing conventions. You need two route files: a listing page at `/properties` and a detail page at `/properties/$propertyId`.

## File Structure

```
src/routes/
├── properties/
│   ├── index.tsx          # /properties (listing page)
│   └── $propertyId.tsx    # /properties/:propertyId (detail page)
```

## `src/routes/properties/index.tsx`

This is the properties listing route. It uses a `loader` to fetch property data from your API before the component renders, avoiding `useEffect` waterfalls and layout shift.

```typescript
// src/routes/properties/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/properties/')({
  loader: async () => {
    const response = await fetch('/api/properties');

    if (!response.ok) {
      throw new Error('Failed to load properties');
    }

    const properties = await response.json();
    return properties;
  },
  pendingComponent: PropertiesListSkeleton,
  errorComponent: ({ error }) => (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-destructive">
        Error Loading Properties
      </h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
    </div>
  ),
  component: PropertiesPage,
});

function PropertiesListSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded" />
      ))}
    </div>
  );
}

function PropertiesPage() {
  const properties = Route.useLoaderData();

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Properties</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property: any) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: any }) {
  return (
    <Link
      to="/properties/$propertyId"
      params={{ propertyId: property.id }}
      className="block rounded-lg border p-4 hover:shadow-md transition-shadow"
    >
      <h2 className="font-semibold">{property.name}</h2>
      <p className="text-muted-foreground text-sm">{property.address}</p>
    </Link>
  );
}
```

Add the missing `Link` import at the top:

```typescript
import { createFileRoute, Link } from '@tanstack/react-router';
```

## `src/routes/properties/$propertyId.tsx`

This is the property detail route. It uses `params.propertyId` (fully typed) to fetch the property data and its tenant information in parallel. If the property doesn't exist, it throws `notFound()` to render the `notFoundComponent`. A `pendingComponent` shows a skeleton while the loader resolves.

```typescript
// src/routes/properties/$propertyId.tsx
import { createFileRoute, notFound, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/properties/$propertyId')({
  loader: async ({ params }) => {
    // params.propertyId is typed as string
    const [propertyResponse, tenantsResponse] = await Promise.all([
      fetch(`/api/properties/${params.propertyId}`),
      fetch(`/api/properties/${params.propertyId}/tenants`),
    ]);

    if (propertyResponse.status === 404 || !propertyResponse.ok) {
      throw notFound();
    }

    const property = await propertyResponse.json();
    const tenants = tenantsResponse.ok ? await tenantsResponse.json() : [];

    return { property, tenants };
  },
  pendingComponent: PropertyDetailSkeleton,
  notFoundComponent: PropertyNotFound,
  errorComponent: ({ error }) => (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-destructive">
        Error Loading Property
      </h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
    </div>
  ),
  component: PropertyDetailPage,
});

function PropertyDetailSkeleton() {
  return (
    <div className="container py-6 animate-pulse">
      <div className="h-8 w-64 bg-muted rounded mb-4" />
      <div className="h-4 w-48 bg-muted rounded mb-8" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 bg-muted rounded" />
        <div className="h-40 bg-muted rounded" />
      </div>
      <div className="mt-8">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

function PropertyNotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold">Property not found</h2>
      <p className="text-muted-foreground mt-2">
        The property you're looking for doesn't exist or has been removed.
      </p>
      <Link to="/properties" className="mt-4 inline-block text-primary hover:underline">
        Back to Properties
      </Link>
    </div>
  );
}

function PropertyDetailPage() {
  const { property, tenants } = Route.useLoaderData();

  return (
    <div className="container py-6">
      <Link to="/properties" className="text-sm text-muted-foreground hover:underline mb-4 block">
        &larr; Back to Properties
      </Link>

      <h1 className="text-2xl font-bold">{property.name}</h1>
      <p className="text-muted-foreground">{property.address}</p>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">Property Details</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Type</dt>
              <dd>{property.type}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>{property.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Units</dt>
              <dd>{property.units}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Tenants</h2>
          {tenants.length > 0 ? (
            <ul className="space-y-2">
              {tenants.map((tenant: any) => (
                <li key={tenant.id} className="rounded border p-3">
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">{tenant.email}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No tenants assigned.</p>
          )}
        </section>
      </div>
    </div>
  );
}
```

## Key Design Decisions

1. **Loaders over `useEffect`** -- Both routes fetch data in the `loader` function, which runs before the component renders. This eliminates loading waterfalls, race conditions, and layout shift.

2. **Parallel data fetching** -- The detail route uses `Promise.all` to fetch property data and tenant info simultaneously, cutting total load time.

3. **`notFound()` for missing properties** -- When the API returns a 404, the loader throws `notFound()` which renders the dedicated `notFoundComponent` instead of an error page. This is the correct TanStack Router pattern for handling missing resources.

4. **`pendingComponent` with skeleton** -- Both routes define a `pendingComponent` that shows a skeleton layout matching the final UI shape. This provides visual stability while data loads.

5. **Type-safe params** -- `params.propertyId` is fully typed as `string` by TanStack Router, inferred from the `$propertyId` file name. No manual type annotations needed.

6. **Type-safe navigation** -- The `Link` component to `/properties/$propertyId` requires a `params` prop with `propertyId`, enforced at compile time.

## After Scaffolding

Run the route tree generator to register the new routes:

```bash
bunx tsr generate
```

This updates `src/routeTree.gen.ts` automatically. Do not edit that file manually.
