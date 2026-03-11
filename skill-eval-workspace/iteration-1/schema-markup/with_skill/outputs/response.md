# Organization + WebSite Schema for BuildStack Homepage

Here is the complete implementation for adding Organization and WebSite JSON-LD structured data to your BuildStack homepage in a TanStack Start project.

## 1. JSON-LD Schemas

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BuildStack",
  "url": "https://buildstack.dev",
  "logo": "https://buildstack.dev/images/logo.svg",
  "description": "Developer tools company",
  "sameAs": [
    "https://twitter.com/buildstackdev",
    "https://linkedin.com/company/buildstack",
    "https://github.com/buildstack"
  ]
}
```

### WebSite Schema with Sitelinks Search Box

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BuildStack",
  "url": "https://buildstack.dev",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://buildstack.dev/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Key notes:**
- The `logo` URL must be absolute (`https://buildstack.dev/images/logo.svg`), not relative (`/images/logo.svg`). Schema validators require absolute URLs.
- The `sameAs` array tells Google these are your official social profiles, feeding the Knowledge Graph.
- The `WebSite` schema with `SearchAction` makes you eligible for the **Sitelinks Search Box** in Google results -- the search bar that appears directly under your site in SERPs.
- The `target` uses the `EntryPoint` type with `urlTemplate`, which is the current recommended structure by Google.

## 2. Where to Put It -- TanStack Start Layout

There are two approaches. Both are valid; choose based on your project structure.

### Option A: Using the `head()` function in your root route (Recommended)

This is the cleanest approach because it keeps schema data colocated with route metadata and uses TanStack Start's built-in head management.

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BuildStack",
  url: "https://buildstack.dev",
  logo: "https://buildstack.dev/images/logo.svg",
  description: "Developer tools company",
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
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://buildstack.dev/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: "BuildStack - Developer Tools" },
      { name: "description", content: "Developer tools by BuildStack" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteSchema),
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}
```

### Option B: Using a `<JsonLd>` Component in the Layout

If you prefer a component-based approach, create a reusable `JsonLd` component and place it in your root layout.

**Step 1: Create the JsonLd component**

```tsx
// src/components/seo/JsonLd.tsx
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          {...{ children: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
```

**Step 2: Create schema generator utilities**

```tsx
// src/lib/seo/schema.ts
export function generateOrganizationSchema(config: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  socialProfiles?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.name,
    url: config.url,
    logo: config.logo,
    description: config.description,
    sameAs: config.socialProfiles,
  };
}

export function generateWebSiteSchema(config: {
  name: string;
  url: string;
  searchUrlTemplate?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    url: config.url,
    ...(config.searchUrlTemplate
      ? {
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: config.searchUrlTemplate,
            },
            "query-input": "required name=search_term_string",
          },
        }
      : {}),
  };
}
```

**Step 3: Use in your root layout**

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { JsonLd } from "~/components/seo/JsonLd";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "~/lib/seo/schema";

const orgSchema = generateOrganizationSchema({
  name: "BuildStack",
  url: "https://buildstack.dev",
  logo: "https://buildstack.dev/images/logo.svg",
  description: "Developer tools company",
  socialProfiles: [
    "https://twitter.com/buildstackdev",
    "https://linkedin.com/company/buildstack",
    "https://github.com/buildstack",
  ],
});

const siteSchema = generateWebSiteSchema({
  name: "BuildStack",
  url: "https://buildstack.dev",
  searchUrlTemplate:
    "https://buildstack.dev/search?q={search_term_string}",
});

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <JsonLd data={[orgSchema, siteSchema]} />
      <Outlet />
    </>
  );
}
```

## 3. What These Schemas Earn You

| Schema | Rich Result | What It Does |
|--------|-------------|--------------|
| Organization | Knowledge Panel | Helps Google identify your brand entity and link your social profiles. Feeds the Google Knowledge Graph. |
| WebSite + SearchAction | Sitelinks Search Box | Enables the search box that appears directly below your site listing in Google SERPs. |

**Important:** Neither Organization nor WebSite produce visual rich results like star ratings or FAQ accordions. They are "helps understanding" schemas that improve entity recognition, Knowledge Graph inclusion, and sitelinks behavior. They are still high priority because they establish your brand identity across Google's systems.

## 4. Validation

After deploying, validate your schemas using this workflow:

1. **JSON-LD Playground** (https://json-ld.org/playground/) -- paste the raw JSON to verify syntax and context resolution.
2. **Google Rich Results Test** (https://search.google.com/test/rich-results) -- enter your deployed URL to confirm Google can parse the schemas.
3. **Schema Markup Validator** (https://validator.schema.org) -- catches spec violations that Google's tool may miss.
4. **Google Search Console** (Search Console > Enhancements) -- monitor for crawl-time schema errors after Google indexes the page.

## 5. Verification Checklist

- [x] Both schemas have `@context` and `@type`
- [x] All URLs are absolute (`https://buildstack.dev/...`)
- [x] `logo` uses absolute URL, not relative `/images/logo.svg`
- [x] `sameAs` contains only official social profile URLs
- [x] `SearchAction` target uses `EntryPoint` type with `urlTemplate`
- [x] `query-input` uses the exact format `"required name=search_term_string"`
- [x] No duplicate schema types on the page
- [x] Schemas are placed in the root layout so they appear on every page (Organization + WebSite are site-wide schemas)
