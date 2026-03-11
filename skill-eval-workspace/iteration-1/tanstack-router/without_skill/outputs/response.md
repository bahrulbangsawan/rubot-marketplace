# File-Based Routing for Property Management App

Here's how to set up file-based routing with TanStack Router for your property management app.

## File Structure

```
src/routes/
├── properties/
│   ├── index.tsx          # /properties
│   └── $propertyId.tsx    # /properties/:propertyId
```

## `src/routes/properties/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/properties/')({
  loader: async () => {
    const res = await fetch('/api/properties');
    return res.json();
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const properties = Route.useLoaderData();

  return (
    <div>
      <h1>Properties</h1>
      <ul>
        {properties.map((property: any) => (
          <li key={property.id}>
            <a href={`/properties/${property.id}`}>{property.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## `src/routes/properties/$propertyId.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/properties/$propertyId')({
  loader: async ({ params }) => {
    const propertyRes = await fetch(`/api/properties/${params.propertyId}`);
    const property = await propertyRes.json();

    if (!property) {
      throw new Error('Property not found');
    }

    const tenantsRes = await fetch(`/api/properties/${params.propertyId}/tenants`);
    const tenants = await tenantsRes.json();

    return { property, tenants };
  },
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { property, tenants } = Route.useLoaderData();

  return (
    <div>
      <h1>{property.name}</h1>
      <p>{property.address}</p>

      <h2>Tenants</h2>
      {tenants.length > 0 ? (
        <ul>
          {tenants.map((tenant: any) => (
            <li key={tenant.id}>{tenant.name} - {tenant.email}</li>
          ))}
        </ul>
      ) : (
        <p>No tenants</p>
      )}
    </div>
  );
}
```

For the loading skeleton, you can add a loading state in the component:

```tsx
function PropertyDetailPage() {
  const { property, tenants } = Route.useLoaderData();

  if (!property) {
    return <div>Loading...</div>;
  }

  // ... rest of component
}
```

And for the "Property not found" case, the error thrown in the loader will be caught by whatever error boundary you have set up in your app.

## Notes

- The `$propertyId` in the filename creates a dynamic route parameter
- `Route.useLoaderData()` gives you the data returned by the loader
- You should set up an error boundary component to catch the "not found" errors
- Make sure to run the TanStack Router code generator after adding new route files so the route tree is updated
