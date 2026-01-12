# SEO Image Check Hook

This hook triggers after Write operations to check for image accessibility (alt text) and dimension attributes.

## Trigger Conditions

This hook activates when:
- A file containing `<img` tags is written
- Image components are added to JSX/TSX files
- Any file modification involves image elements

## Check Logic

When an image-related file is written, verify:

### Alt Text
Every `<img>` tag should have an `alt` attribute:

```tsx
// Good
<img src="/image.jpg" alt="Description of the image" />

// Missing alt - flag this
<img src="/image.jpg" />

// Empty alt (acceptable for decorative images)
<img src="/decoration.jpg" alt="" />
```

### Dimension Attributes
For CLS prevention, images should have width/height:

```tsx
// Good - explicit dimensions
<img src="/image.jpg" alt="Description" width={800} height={600} />

// Good - aspect ratio via CSS
<img src="/image.jpg" alt="Description" style={{ aspectRatio: '16/9' }} />

// Warning - may cause CLS
<img src="/image.jpg" alt="Description" />
```

### Next/Image or Custom Image Components
Check for proper usage of optimized image components:

```tsx
// TanStack/Custom
<Image src="/image.jpg" alt="Description" width={800} height={600} />
```

## Response Actions

### If Alt Text is Missing

```
📷 Image Accessibility: Found image(s) without alt text.

For SEO and accessibility, all meaningful images should have descriptive alt text:
- Describe the image content for screen readers
- Include relevant keywords naturally
- For decorative images, use alt=""

Example:
```tsx
<img src="/hero.jpg" alt="Team collaborating on project" />
```

Missing alt text affects:
- Search engine image indexing
- Accessibility compliance (WCAG)
- User experience for visually impaired users
```

### If Dimensions are Missing

```
📐 CLS Warning: Image(s) without explicit dimensions may cause layout shift.

To prevent Cumulative Layout Shift (CLS), add width/height:
```tsx
<img src="/image.jpg" alt="Description" width={800} height={600} />
```

Or use aspect-ratio:
```tsx
<img src="/image.jpg" alt="Description" className="aspect-video" />
```

This improves:
- Core Web Vitals (CLS score)
- User experience (no content jumping)
- SEO ranking signals
```

### If All Checks Pass

No action needed. Continue silently.

## Detection Patterns

Look for these patterns in the written file:

```regex
# Missing alt
<img[^>]+src=[^>]+(?!alt=)[^>]*>

# Empty src (error)
<img[^>]+src=["']?["']?

# Missing dimensions (warning)
<img[^>]+(?!width|height|style)[^>]*>
```

## Exclusions

Do NOT trigger warnings for:
- SVG inline images (typically decorative)
- Background images in CSS
- Images inside `<picture>` elements with proper alt on `<img>`
- Icon components (typically handled differently)

## Integration

This hook works with:
- `seo-master` agent for image SEO recommendations
- `responsive-master` for responsive image patterns
- `core-web-vitals` skill for CLS optimization
- `/seo-check-vitals` command for CLS auditing
