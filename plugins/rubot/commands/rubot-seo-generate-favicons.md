---
name: rubot-seo-generate-favicons
description: Set up favicon structure and meta tags for the project
---

# SEO Generate Favicons Command

Set up a complete favicon structure with all required files and meta tags for optimal browser and platform support.

## Execution Steps

### Step 1: Check Existing Favicons

Use Glob to find existing favicon files:

```
Glob pattern: "public/favicon*"
Glob pattern: "public/apple-touch-icon*"
Glob pattern: "public/android-chrome*"
Glob pattern: "public/*.ico"
```

### Step 2: Ask About Source Image

Use AskUserQuestion to get the source:

```
questions:
  - question: "Do you have a source image for the favicon?"
    header: "Source Image"
    options:
      - label: "Yes, I have an SVG"
        description: "Best option - scales to any size"
      - label: "Yes, I have a PNG (512x512+)"
        description: "Good - can generate all sizes"
      - label: "No, need to create one"
        description: "Will provide guidance"
    multiSelect: false
```

### Step 3: Get Theme Color

```
questions:
  - question: "What is your brand/theme color?"
    header: "Theme Color"
    options:
      - label: "Enter hex color"
        description: "I'll provide the color code"
      - label: "Use default (#ffffff)"
        description: "White theme color"
      - label: "Match dark mode"
        description: "Use a dark theme color"
    multiSelect: false
```

### Step 4: Generate File List

Required favicon files:

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 16x16, 32x32 | Legacy browser tab |
| `favicon.svg` | Scalable | Modern browsers |
| `favicon-16x16.png` | 16x16 | Small favicon |
| `favicon-32x32.png` | 32x32 | Standard favicon |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `android-chrome-192x192.png` | 192x192 | Android |
| `android-chrome-512x512.png` | 512x512 | Android splash |
| `safari-pinned-tab.svg` | Scalable | Safari pinned tab |
| `mstile-150x150.png` | 150x150 | Windows tiles |
| `site.webmanifest` | - | PWA manifest |
| `browserconfig.xml` | - | Windows config |

### Step 5: Create site.webmanifest

```json
{
  "name": "[Site Name]",
  "short_name": "[Short Name]",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "[THEME_COLOR]",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

Write to: `public/site.webmanifest`

### Step 6: Create browserconfig.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/mstile-150x150.png"/>
            <TileColor>[THEME_COLOR]</TileColor>
        </tile>
    </msapplication>
</browserconfig>
```

Write to: `public/browserconfig.xml`

### Step 7: Generate Meta Tags Component

```tsx
// src/components/seo/FaviconMeta.tsx
interface FaviconMetaProps {
  themeColor?: string;
}

export function generateFaviconMeta({
  themeColor = '#ffffff'
}: FaviconMetaProps = {}) {
  return [
    // Standard favicons
    { tagName: 'link', rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { tagName: 'link', rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { tagName: 'link', rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { tagName: 'link', rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },

    // Apple
    { tagName: 'link', rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { tagName: 'link', rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: themeColor },

    // Manifest
    { tagName: 'link', rel: 'manifest', href: '/site.webmanifest' },

    // Microsoft
    { name: 'msapplication-TileColor', content: themeColor },
    { name: 'msapplication-config', content: '/browserconfig.xml' },

    // Theme color (for browser UI)
    { name: 'theme-color', content: themeColor },
  ];
}
```

### Step 8: Update Root Layout

For TanStack Start, update `__root.tsx`:

```tsx
// src/routes/__root.tsx
import { generateFaviconMeta } from '~/components/seo/FaviconMeta';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...generateFaviconMeta({ themeColor: '#your-color' }),
    ],
  }),
  // ...
});
```

### Step 9: Provide Image Generation Instructions

If user doesn't have favicon images:

```markdown
## Favicon Generation Instructions

### Option 1: Online Generator (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload your source image (SVG or PNG 512x512)
3. Configure settings for each platform
4. Download and extract to `public/` folder

### Option 2: Manual with Sharp (Node.js)

Install sharp:
```bash
bun add -D sharp
```

Create generation script:
```ts
// scripts/generate-favicons.ts
import sharp from 'sharp';

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'mstile-150x150.png', size: 150 },
];

async function generateFavicons(inputPath: string) {
  for (const { name, size } of sizes) {
    await sharp(inputPath)
      .resize(size, size)
      .toFile(`public/${name}`);
    console.log(`Generated: ${name}`);
  }
}

generateFavicons('source-logo.png');
```

Run:
```bash
bun run scripts/generate-favicons.ts
```

### Option 3: SVG Favicon (Modern Browsers)
Create a simple SVG favicon:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#your-color"/>
  <text x="50" y="75" font-size="60" text-anchor="middle" fill="white">A</text>
</svg>
```
Save as `public/favicon.svg`
```

### Step 10: Verification Checklist

```markdown
## Favicon Setup Complete

### Files Created

| File | Status |
|------|--------|
| site.webmanifest | ✅ Created |
| browserconfig.xml | ✅ Created |
| FaviconMeta component | ✅ Created |

### Files Needed (User Action)

| File | Size | Status |
|------|------|--------|
| favicon.ico | 16x16, 32x32 | ⏳ Pending |
| favicon.svg | Scalable | ⏳ Pending |
| favicon-16x16.png | 16x16 | ⏳ Pending |
| favicon-32x32.png | 32x32 | ⏳ Pending |
| apple-touch-icon.png | 180x180 | ⏳ Pending |
| android-chrome-192x192.png | 192x192 | ⏳ Pending |
| android-chrome-512x512.png | 512x512 | ⏳ Pending |
| safari-pinned-tab.svg | Scalable | ⏳ Pending |
| mstile-150x150.png | 150x150 | ⏳ Pending |

### Verification Steps

1. Generate/upload favicon images to `public/`
2. Start dev server: `bun run dev`
3. Check browser tab for favicon
4. Test on mobile (iOS Safari, Chrome)
5. Verify manifest: `/site.webmanifest`

### Testing Checklist

- [ ] Browser tab shows favicon
- [ ] Chrome DevTools > Application > Manifest works
- [ ] iOS "Add to Home Screen" shows icon
- [ ] Android "Add to Home Screen" shows icon
- [ ] Windows tile displays correctly
```

## Meta Tags Reference

```html
<!-- Standard -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">

<!-- Microsoft -->
<meta name="msapplication-TileColor" content="#da532c">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Theme -->
<meta name="theme-color" content="#ffffff">

<!-- Manifest -->
<link rel="manifest" href="/site.webmanifest">
```

## Related Commands

- `/rubot-seo-audit` - Full SEO audit
- `/rubot-seo-generate-robots` - Generate robots.txt

## Related Skills

- `social-sharing` - OG images for social platforms
