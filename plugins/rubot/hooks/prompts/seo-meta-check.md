# SEO Meta Check Hook

This hook triggers after Write operations on page/route files to validate SEO meta tags are present.

## Trigger Conditions

This hook activates when:
- A new page/route file is created (`.tsx` in `routes/` directory)
- An existing route file is modified
- Layout files are updated

## Check Logic

When a route file is written, verify it includes:

### Required Meta Tags
- `title` - Page title (required)
- `description` - Meta description (recommended)

### TanStack Start Pattern

For TanStack Start routes, check for `head` function in route definition:

```tsx
export const Route = createFileRoute('/page')({
  head: () => ({
    meta: [
      { title: 'Page Title' },
      { name: 'description', content: 'Page description' },
    ],
  }),
});
```

## Response Actions

### If SEO Meta is Missing

Provide a gentle reminder:

```
📋 SEO Check: The page you created/modified may be missing SEO meta tags.

For public-facing pages, consider adding:
- title: Descriptive page title (< 60 chars)
- description: Compelling meta description (< 160 chars)

Example for TanStack Start:
```tsx
head: () => ({
  meta: [
    { title: 'Your Page Title' },
    { name: 'description', content: 'Your page description' },
  ],
}),
```

Run `/rubot-seo-audit` to perform a comprehensive SEO check.
```

### If SEO Meta is Present

No action needed. Continue silently.

## Exclusions

Do NOT trigger warnings for:
- API routes (`*.ts` files, not `.tsx`)
- Layout files (`__root.tsx`, `_layout.tsx`)
- Component files (not in `routes/` directory)
- Internal/admin pages (containing `/admin/`, `/dashboard/`, `/settings/`)

## Integration

This hook works with:
- `seo-master` agent for detailed recommendations
- `/rubot-seo-audit` command for comprehensive audits
- `schema-markup` skill for structured data guidance
