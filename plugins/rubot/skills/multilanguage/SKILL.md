---
name: multilanguage
version: 1.1.0
description: |
  Full multilingual (i18n) implementation for TanStack Start apps: translation JSON files, localized routing, language switcher components, hreflang SEO, and language detection.
  MUST activate for: i18n, multilanguage, language switcher, hreflang tags, useTranslation hook, TranslationKey, ROUTE_MAP, SUPPORTED_LANGUAGES, LANGUAGE_META, locale JSON files, id.json, en.json, LanguageSwitcherInline, Accept-Language, locale prefix routing (/en/, /ja/), xhtml:link alternates, language cookie.
  Also activate when: adding multi-language support, internationalization, language switching, translated routes, localized content, bilingual or multilingual pages, language detection, localized sitemaps, "translated content", "localized routes", "bilingual", "multilingual", "bahasa", "TranslationKey type resolves to never", "html lang attribute not updating", "flag icons for language toggle", "add a third language", "404 on language switch".
  Do NOT activate for: Zod i18n, react-intl, Crowdin config, date-fns locale formatting, currency formatting by region, single lang attribute on a span, or translating API/chatbot responses.
  Covers: translation JSON file structure, type-safe translation keys, useTranslation hook, localized routing with URL prefixes, TanStack Router file structure, route mapping between languages, language detection and persistence, language switcher components (dropdown and inline), hreflang SEO tags, localized meta tags, HTML lang attribute, localized sitemaps, SVG flag icons, natural context-aware translations, troubleshooting.
agents:
  - shadcn-ui-designer
  - seo-master
  - responsive-master
  - tanstack
---

# Multilanguage Skill — Full i18n for TanStack Start

> Complete multilingual support: translations, routing, detection, switcher, SEO

## When to Use

- Adding multilingual support to any project
- Creating a language switcher component (dropdown or inline toggle)
- Setting up localized routing with URL prefixes
- Implementing language detection and preference persistence
- Translating UI content for Indonesian, English, or other languages
- Adding hreflang tags and localized SEO metadata
- Structuring translation files for a TanStack Start project
- Generating localized sitemaps with `xhtml:link` alternates

## Quick Reference

| Concept | Description |
|---------|-------------|
| **SupportedLanguage** | Union type derived from `SUPPORTED_LANGUAGES` constant |
| **useTranslation()** | Hook returning `t()` function and current `language` |
| **t('key.path')** | Resolves dotted key path against current locale JSON |
| **TranslationKey** | Recursive type extracting every valid dotted path from locale JSON |
| **ROUTE_MAP** | Bidirectional map connecting equivalent pages across languages |
| **getLocalizedPath()** | Resolves the target-language URL for the current page |
| **LanguageSwitcher** | Dropdown component with flag icons and keyboard accessibility |
| **LanguageSwitcherInline** | Side-by-side flag toggle for 2-3 language setups |
| **hreflang tags** | `<link rel="alternate">` tags telling search engines about language variants |
| **x-default** | Hreflang value identifying the fallback page for unmatched languages |

## Core Principles

1. **URL-Driven Language** -- The URL prefix determines the active language, making every page shareable, bookmarkable, and independently crawlable. Search engines index each language version as a distinct page, which is essential for international SEO. Never rely on cookies or JavaScript alone to set language.

2. **Type-Safe Translations** -- Translation keys are derived from the JSON structure using recursive TypeScript types. A missing or misspelled key produces a compile-time error, so you catch gaps before users see broken UI. This eliminates the "silent empty string" problem common in untyped i18n libraries.

3. **Hreflang for Search Engines** -- Every page must include `<link rel="alternate" hreflang="...">` tags pointing to all language variants plus an `x-default` fallback. Without these, Google may serve the wrong language version in search results, or treat translations as duplicate content and penalize rankings.

4. **Natural, Context-Aware Translations** -- Translations must read naturally in the target language, not as literal word-for-word conversions. "Get Started" is "Mulai Sekarang" (Start Now), not "Dapatkan Dimulai". Poor translations damage credibility and conversion rates.

5. **Progressive Detection with User Override** -- Auto-detection (browser language, Accept-Language header) suggests the right language on first visit, but the URL is always the source of truth. Once a user manually switches, their preference is persisted in a cookie and never overridden by detection.

## File Organization

```
src/i18n/
├── index.ts                # Language config, supported languages, helpers
├── types.ts                # TypeScript types for translation keys
├── context.tsx             # React context provider for current language
├── locales/
│   ├── id.json             # Indonesian translations
│   ├── en.json             # English translations
│   └── [lang].json         # Additional languages
├── hooks/
│   └── use-translation.ts  # useTranslation() hook
├── utils/
│   ├── detection.ts        # Language detection logic
│   ├── preference.ts       # Preference persistence (cookie/localStorage)
│   └── route-map.ts        # Route mapping between languages
└── components/
    ├── language-switcher.tsx    # Language switcher UI
    └── flag-icons.tsx           # SVG flag icon components
```

## Language Config Pattern

```typescript
// src/i18n/index.ts
export const SUPPORTED_LANGUAGES = ['id', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: SupportedLanguage = 'id'

export const LANGUAGE_META: Record<SupportedLanguage, {
  name: string; nativeName: string; flag: string; dir: 'ltr' | 'rtl'
}> = {
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: 'id', dir: 'ltr' },
  en: { name: 'English', nativeName: 'English', flag: 'gb', dir: 'ltr' },
}

export function isSupported(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}
```

To add a language: add its code to `SUPPORTED_LANGUAGES`, add metadata to `LANGUAGE_META`, create the locale JSON file. Everything else iterates over these constants automatically.

## Translation System

### Type Safety

Derive the key type from the JSON structure so typos are caught at compile time:

```typescript
// src/i18n/types.ts
import type idTranslations from './locales/id.json'

type NestedKeys<T, Prefix extends string = ''> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object ? NestedKeys<T[K], `${Prefix}${K}.`> : `${Prefix}${K}`
      : never }[keyof T]
  : never

export type TranslationKey = NestedKeys<typeof idTranslations>
export type TranslationParams = Record<string, string | number>
```

### Translation Hook

```typescript
const { t, language } = useTranslation()

t('pages.contact.title')                                    // → "Hubungi Kami"
t('footer.copyright', { year: 2026, brand: 'MyApp' })     // → "© 2026 MyApp. Hak cipta dilindungi."
```

The hook navigates the nested JSON using dotted key paths and replaces `{variable}` placeholders with provided params.

> **Full implementation**: Read `references/components.md` for the complete `useTranslation` hook, context provider, and all component code.

### Translation File Structure

Keys are organized by domain:

| Prefix | Purpose |
|--------|---------|
| `nav.*` | Navigation labels |
| `common.*` | Shared UI (buttons, actions, states) |
| `pages.<page>.*` | Page-specific headings, body, CTAs |
| `forms.*` | Form labels, placeholders, validation |
| `footer.*` | Footer content |
| `meta.*` | SEO titles and descriptions |
| `errors.*` | Error pages, messages, empty states |
| `a11y.*` | Screen reader labels, ARIA text |

> **Full templates**: Read `references/translation-templates.md` for complete `id.json` and `en.json` files with all keys.

## Localized Routing

### Prefix-Based (Recommended)

Default language uses root paths; other languages are prefixed:

| Page | Indonesian (default) | English |
|------|---------------------|---------|
| Home | `/` | `/en` |
| About | `/tentang` | `/en/about` |
| Contact | `/kontak` | `/en/contact` |
| Pricing | `/harga` | `/en/pricing` |

### TanStack Router File Structure

```
app/routes/
├── __root.tsx              # Root layout (wraps LanguageProvider)
├── index.tsx               # / → Indonesian homepage
├── tentang.tsx             # /tentang → Indonesian about
├── en/
│   ├── index.tsx           # /en → English homepage
│   └── about.tsx           # /en/about → English about
```

Route files are thin wrappers -- they share the same page component, which uses `useTranslation()`:

```tsx
// app/routes/tentang.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/pages/about'
export const Route = createFileRoute('/tentang')({ component: AboutPage })

// app/routes/en/about.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/pages/about'
export const Route = createFileRoute('/en/about')({ component: AboutPage })
```

### Route Mapping

The route map connects equivalent pages across languages for the language switcher:

```typescript
const ROUTE_MAP: Record<string, Record<SupportedLanguage, string>> = {
  '/': { id: '/', en: '/en' },
  '/tentang': { id: '/tentang', en: '/en/about' },
  '/kontak': { id: '/kontak', en: '/en/contact' },
}

export function getLocalizedPath(currentPath: string, targetLang: SupportedLanguage): string {
  for (const [, paths] of Object.entries(ROUTE_MAP)) {
    if (Object.values(paths).includes(currentPath)) return paths[targetLang]
  }
  return targetLang === DEFAULT_LANGUAGE ? '/' : `/${targetLang}` // Fallback to homepage
}
```

## Language Detection & Persistence

### Detection Priority

1. **Stored preference** (cookie) -- user already chose
2. **Browser language** (`navigator.languages` / `Accept-Language` header)
3. **Default language** -- fallback

### Rules

- Only auto-redirect on first visit to `/` with no stored preference
- Never redirect if the user arrived via a specific language URL (e.g., `/en/about`)
- After manual switch, store preference in a cookie (survives sessions, readable server-side for SSR)
- Manual choice always overrides detection

> **Full implementation**: Read `references/components.md` for `detectLanguage()` and `detectLanguageFromHeader()` utilities.

## Language Switcher

Two styles are provided. Both:
- Display SVG flag icons (not emoji -- inconsistent cross-platform rendering)
- Show the active language with a visual indicator (checkmark/bold, not color-only)
- Are keyboard accessible (`aria-expanded`, `role="listbox"`, `tabIndex`)
- Navigate to the equivalent page in the target language
- Persist the preference in a cookie

**Dropdown** -- Button shows current flag + code, expands to a list. Best for navbars with limited space.

**Inline toggle** -- Side-by-side flag buttons (e.g., `ID | EN` with flags). Best when there are 2-3 languages.

> **Full components**: Read `references/components.md` for `LanguageSwitcher`, `LanguageSwitcherInline`, and `FlagIcon` implementations.

### Navbar Integration

Place the language switcher in the Navbar, typically on the right side:

```tsx
<nav className="container mx-auto flex h-16 items-center justify-between px-4">
  <Link to="/">Brand</Link>
  <div className="flex items-center gap-4">
    <ul className="hidden items-center gap-6 md:flex">{/* nav links */}</ul>
    <LanguageSwitcher />
  </div>
</nav>
```

## SEO Localization

### Hreflang Tags

Add to the `<head>` of every page -- tells search engines about language variants:

```html
<link rel="alternate" hreflang="id" href="https://example.com/tentang" />
<link rel="alternate" hreflang="en" href="https://example.com/en/about" />
<link rel="alternate" hreflang="x-default" href="https://example.com/tentang" />
```

`x-default` identifies the fallback for users whose language doesn't match any variant.

### Localized Meta Tags

Each language version needs its own `<title>` and `<meta name="description">`:

```tsx
<title>{t('meta.aboutTitle', { brand: 'MyApp' })}</title>
<meta name="description" content={t('meta.aboutDescription', { brand: 'MyApp' })} />
```

### HTML Lang Attribute

The `<html lang>` attribute must update to match the current language:

```tsx
// In the LanguageProvider:
useEffect(() => { document.documentElement.lang = language }, [language])
```

### Localized Sitemap

Each URL entry includes `xhtml:link` alternates pointing to all language variants:

```xml
<url>
  <loc>https://example.com/tentang</loc>
  <xhtml:link rel="alternate" hreflang="id" href="https://example.com/tentang" />
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/about" />
</url>
```

## Quick Translation Reference (ID <> EN)

| English | Indonesian | Notes |
|---------|-----------|-------|
| Home | Beranda | Not "Rumah" |
| About | Tentang Kami | -- |
| Log In | Masuk | Not "Log masuk" |
| Sign Up | Daftar | -- |
| Submit | Kirim | "Send" |
| Get Started | Mulai Sekarang | "Start Now" |
| Learn More | Pelajari Lebih Lanjut | -- |
| Search | Cari | -- |
| Settings | Pengaturan | -- |

> **Full reference table**: Read `references/translation-templates.md` for the complete Indonesian translation reference.

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Wrong language displayed on page load | URL prefix not parsed correctly; language context defaults to wrong locale | Verify `__root.tsx` extracts the language prefix from the URL before rendering `LanguageProvider`. Check that `isSupported()` matches the prefix against `SUPPORTED_LANGUAGES`. |
| Translations not updating after editing JSON | Translation files cached by bundler or import not re-evaluated | Restart the dev server. If using dynamic `import()`, ensure the locale path is not statically resolved. For Vite, JSON imports are hot-reloaded by default. |
| Hreflang tags not picked up by Google | URLs are relative, or reciprocal tags are missing on the alternate page | Use absolute URLs (include `https://domain.com`). Every page in the hreflang set must point to every other page in the set, including itself. Validate with Google Search Console's International Targeting report. |
| Language switcher navigates to 404 | Current route missing from `ROUTE_MAP` | Add the route pair to `ROUTE_MAP`. Every routable page needs an entry mapping all language variants. |
| Cookie preference ignored on SSR | Cookie not read server-side during initial render | Read the `lang` cookie in the server function or middleware and pass it to `LanguageProvider` as the initial value. Do not rely on `document.cookie` during SSR. |
| `TranslationKey` type shows `never` | Locale JSON file is empty or not imported with `import type` correctly | Ensure the primary locale JSON (`id.json`) has at least one key. Verify the import uses `import type idTranslations from './locales/id.json'` and `tsconfig.json` has `resolveJsonModule: true`. |
| Mixed languages on a single page | Some strings hardcoded instead of using `t()` | Grep the codebase for quoted Indonesian or English text outside of JSON files. Every user-visible string must go through `t()`. |

## Constraints

- **No emoji flags** -- Use SVG flag components. Emoji flags render differently across OS and browser combinations, breaking visual consistency.
- **No client-side-only language detection** -- The URL prefix is the single source of truth. Detection only suggests; it never overrides the URL.
- **No automatic redirects after manual switch** -- Once a user selects a language, their preference is stored and respected on all future visits. Never auto-redirect them back.
- **Default language has no prefix** -- Indonesian (the default) uses root paths (`/`, `/tentang`). Only non-default languages get prefixed (`/en`, `/en/about`). This avoids duplicate content at `/` and `/id/`.
- **All hreflang URLs must be absolute** -- Relative URLs in hreflang tags are ignored by search engines. Always include the full `https://domain.com/path`.
- **Reciprocal hreflang is mandatory** -- If page A declares page B as an alternate, page B must also declare page A. One-directional hreflang is ignored by Google.
- **Translation JSON must stay flat-nested (max 2 levels)** -- Deeply nested keys like `pages.home.hero.cta.button.label` become unmanageable. Keep it to `pages.home.ctaLabel`.
- **Do not use `min-h-screen`** -- Use `min-h-dvh` for mobile browser compatibility (consistent with global-layout skill).

## Verification Checklist

Before considering multilanguage implementation complete:

- [ ] Every user-visible string uses `t()` -- no hardcoded text in components
- [ ] `TranslationKey` type resolves correctly (no `never` type errors)
- [ ] All locale JSON files have identical key structures (no missing keys in any language)
- [ ] URL prefix correctly sets language context (`/en/about` renders English, `/tentang` renders Indonesian)
- [ ] Default language routes have no prefix (`/`, not `/id/`)
- [ ] Language switcher navigates to the equivalent page in the target language
- [ ] Language preference persists in a cookie across sessions
- [ ] Manual language choice is never overridden by auto-detection
- [ ] `<html lang>` attribute updates to match the active language
- [ ] Every page includes hreflang tags for all language variants plus `x-default`
- [ ] All hreflang URLs are absolute (include full domain)
- [ ] Hreflang tags are reciprocal (every page in the set links to every other page)
- [ ] `<title>` and `<meta description>` are translated per language
- [ ] Sitemap includes `xhtml:link` alternates for every URL
- [ ] Language switcher is keyboard accessible (`aria-expanded`, `role="listbox"`)
- [ ] SVG flags used instead of emoji flags
- [ ] Translation copy reads naturally in each language (not literal word-for-word)

## References

- `references/components.md` -- Full component implementations (context provider, hooks, switcher, flags, hreflang)
- `references/translation-templates.md` -- Complete translation JSON templates and Indonesian reference table
