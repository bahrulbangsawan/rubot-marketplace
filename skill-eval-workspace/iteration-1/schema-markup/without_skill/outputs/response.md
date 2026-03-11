# Organization + WebSite Schema for BuildStack Homepage

Here's how to add Organization and WebSite JSON-LD structured data to your BuildStack homepage.

## JSON-LD for Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BuildStack",
  "url": "https://buildstack.dev",
  "logo": "https://buildstack.dev/images/logo.svg",
  "sameAs": [
    "https://twitter.com/buildstackdev",
    "https://linkedin.com/company/buildstack",
    "https://github.com/buildstack"
  ]
}
```

## JSON-LD for WebSite with Search

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BuildStack",
  "url": "https://buildstack.dev",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://buildstack.dev/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

The WebSite schema with `potentialAction` enables a sitelinks search box in Google results.

## Where to Put It in TanStack Start

In TanStack Start, you'd place this in your root layout file. The root route typically lives at something like `src/routes/__root.tsx`. You can inject the JSON-LD as script tags in the head.

Here's a rough approach:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuildStack",
    url: "https://buildstack.dev",
    logo: "https://buildstack.dev/images/logo.svg",
    sameAs: [
      "https://twitter.com/buildstackdev",
      "https://linkedin.com/company/buildstack",
      "https://github.com/buildstack",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildStack",
    url: "https://buildstack.dev",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://buildstack.dev/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Use children prop to set script content safely
        children={JSON.stringify(organizationSchema)}
      />
      <script
        type="application/ld+json"
        children={JSON.stringify(websiteSchema)}
      />
      <Outlet />
    </>
  );
}
```

You could also use TanStack Start's `head()` export on your root route to inject these as meta scripts, but the exact API depends on your TanStack Start version. Check their docs for `head` or `meta` route options.

## Validation

After deploying, test your structured data:

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org

Make sure your logo URL is absolute (not `/images/logo.svg` but the full `https://buildstack.dev/images/logo.svg`).
