---
name: rubot-multilanguage
description: Implement full multilingual support with language switcher, localized routing, auto-detection, and bilingual copywriting. Use when the user wants to add multi-language support, i18n, internationalization, language switcher, translated content, localized routes, or bilingual/multilingual pages.
argument-hint: <optional: language codes e.g. "id,en">
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
  - WebFetch
---

# Multilanguage — Full i18n Implementation Command

Implement complete multilingual support across the entire application: localized routing, language detection, persistent preference, language switcher UI, and professionally translated copywriting for all user-facing content.

## Prerequisites

Before running this command:
1. Load the `multilanguage` skill for i18n patterns, translation file structure, and component examples
2. Verify the project framework (check `package.json`)
3. Identify existing routes and pages

## Execution Steps

### Step 1: Detect Project Structure

Scan the project to understand the current architecture:

```bash
# Detect framework
cat package.json 2>/dev/null | grep -E "(tanstack|react|next|vue|svelte|remix|astro)" | head -10

# Find existing routes
find . -maxdepth 4 -path "*/routes/*" -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null

# Find root layout
find . -maxdepth 4 \( -name "__root.tsx" -o -name "layout.tsx" -o -name "_app.tsx" \) -not -path "*/node_modules/*" 2>/dev/null

# Check for existing i18n setup
find . -maxdepth 4 \( -iname "*i18n*" -o -iname "*locale*" -o -iname "*lang*" -o -iname "*translation*" \) -not -path "*/node_modules/*" 2>/dev/null

# Check for existing language-related packages
cat package.json 2>/dev/null | grep -E "(i18n|intl|locale|react-i18next|next-intl|paraglide)" | head -10
```

### Step 2: Gather Language Requirements

Use AskUserQuestion to understand the user's multilingual needs. This is critical — the entire implementation depends on these answers.

```
questions:
  - question: "What is the default language for your website?"
    header: "Default Language"
    options:
      - label: "Bahasa Indonesia (ID)"
        description: "Indonesian as the primary/default language — root routes stay as-is (/, /tentang, /kontak)"
      - label: "English (EN)"
        description: "English as the primary/default language — root routes in English (/, /about, /contact)"
      - label: "Other"
        description: "A different language — I'll specify"
    multiSelect: false
  - question: "Which languages should the website support?"
    header: "Supported Languages"
    options:
      - label: "Bahasa Indonesia (ID) + English (EN)"
        description: "Two languages: Indonesian and English"
      - label: "English (EN) + Bahasa Indonesia (ID) + Bahasa Melayu (MS)"
        description: "Three languages including Malay"
      - label: "Custom set"
        description: "I'll specify the exact languages I need"
    multiSelect: false
  - question: "How should localized routes be structured?"
    header: "Routing Strategy"
    options:
      - label: "Prefix-based (Recommended)"
        description: "Default language at root (/), others under prefix (/en/about, /ms/about). Best for SEO."
      - label: "All prefixed"
        description: "Every language gets a prefix (/id/tentang, /en/about). More explicit but adds prefix to default language."
      - label: "Subdomain-based"
        description: "Each language on a subdomain (id.site.com, en.site.com). Requires DNS setup."
    multiSelect: false
```

### Step 3: Gather UX & Detection Preferences

```
questions:
  - question: "How should the language switcher look?"
    header: "Language Switcher Style"
    options:
      - label: "Dropdown with flags"
        description: "A dropdown button showing the current language flag + label, expandable to show all options"
      - label: "Inline toggle with flags"
        description: "Visible flag buttons side by side in the navbar (e.g., 🇮🇩 ID | 🇬🇧 EN)"
      - label: "Footer language selector"
        description: "Language options in the footer instead of the navbar"
      - label: "Both navbar + footer"
        description: "Switcher in the navbar AND language links in the footer"
    multiSelect: false
  - question: "Should the site auto-detect the user's preferred language?"
    header: "Language Detection"
    options:
      - label: "Yes — detect from browser (Recommended)"
        description: "Use the browser's Accept-Language header to suggest the right language on first visit"
      - label: "Yes — detect from IP/geo-location"
        description: "Use IP-based geolocation to determine language (requires server-side logic)"
      - label: "No — always start with default language"
        description: "Every visitor starts on the default language; they switch manually if needed"
    multiSelect: false
  - question: "How should the user's language preference be saved?"
    header: "Preference Persistence"
    options:
      - label: "Cookie (Recommended)"
        description: "Save preference in a cookie — works across sessions and can be read server-side for SSR"
      - label: "LocalStorage"
        description: "Save in browser localStorage — client-side only, may flash wrong language on load"
      - label: "URL only"
        description: "No persistence — the URL prefix determines the language on each visit"
    multiSelect: false
```

### Step 4: Gather Content & SEO Preferences

```
questions:
  - question: "Do you already have translated content, or should we create translation files for you to fill in?"
    header: "Translation Content"
    options:
      - label: "Create complete translations (ID + EN)"
        description: "Generate professional, natural translations for all existing UI copy in both languages"
      - label: "Create translation file structure only"
        description: "Set up the translation JSON files with keys and placeholders — I'll fill in the translations myself"
      - label: "I already have translation files"
        description: "I have existing translations — just help me integrate them"
    multiSelect: false
  - question: "Should we add SEO localization (hreflang tags, localized meta, separate sitemaps)?"
    header: "SEO Localization"
    options:
      - label: "Yes — full SEO localization (Recommended)"
        description: "Add hreflang link tags, localized page titles/descriptions, and language-specific sitemap entries"
      - label: "Basic — hreflang tags only"
        description: "Just add hreflang alternate link tags to help search engines find language variants"
      - label: "No — skip SEO for now"
        description: "Focus on the user-facing multilingual experience first"
    multiSelect: false
```

### Step 5: Set Up Translation Infrastructure

Based on the user's answers, set up the i18n infrastructure:

1. **Create the translation directory structure:**
   ```
   src/i18n/
   ├── index.ts              # i18n setup, language config, helper functions
   ├── types.ts              # TypeScript types for translation keys (type-safe)
   ├── locales/
   │   ├── id.json           # Indonesian translations
   │   ├── en.json           # English translations
   │   └── [lang].json       # Additional languages
   ├── hooks/
   │   └── use-translation.ts  # React hook: useTranslation()
   └── components/
       └── language-switcher.tsx  # Language switcher UI component
   ```

2. **Create the i18n configuration** (`src/i18n/index.ts`):
   - Export supported languages list with metadata (code, name, flag, direction)
   - Export the default language
   - Export a `getTranslations(lang)` loader function
   - Export route mapping between languages

3. **Create translation JSON files** for each supported language with keys covering:
   - `nav.*` — Navigation labels
   - `common.*` — Shared UI (buttons, actions, states)
   - `pages.<pageName>.*` — Page-specific headings, body text, CTAs
   - `forms.*` — Form labels, placeholders, validation messages
   - `footer.*` — Footer content
   - `meta.*` — SEO meta titles and descriptions
   - `errors.*` — Error messages, empty states
   - `a11y.*` — Accessibility labels (aria-labels, alt text)

### Step 6: Implement Routing

Set up localized routing based on the user's chosen strategy:

**For prefix-based routing (recommended):**
- Default language routes stay at root: `/`, `/tentang`, `/kontak`
- Non-default language routes under prefix: `/en`, `/en/about`, `/en/contact`
- Create a route parameter or layout wrapper that extracts the language from the URL
- Map equivalent routes between languages for the language switcher

**Key routing requirements:**
- The language switcher must navigate to the equivalent page in the other language
- If no equivalent page exists, fall back to the target language's homepage
- Preserve query parameters and hash fragments during language switching
- The `lang` attribute on `<html>` must update to match the current language

### Step 7: Implement Language Detection

Based on the user's detection preference:

**Browser detection (recommended):**
- Read `navigator.language` or `navigator.languages` on the client
- On the server (SSR), read the `Accept-Language` header
- Map detected language to the closest supported language
- Only auto-redirect on the first visit (no stored preference yet)
- Never auto-redirect if the user arrived via a direct language-specific URL

**Preference persistence:**
- After detection or manual switch, store the preference (cookie/localStorage)
- On subsequent visits, use the stored preference instead of re-detecting
- The manual switch always overrides auto-detection

### Step 8: Build the Language Switcher Component

Create the language switcher component based on the user's chosen style:

**Requirements for all styles:**
- Display country flag icon next to each language option
- Use SVG flag icons (not emoji — they render inconsistently across platforms)
- Show the currently active language clearly (not just color — use a checkmark, underline, or bold)
- Keyboard accessible: focusable, navigable with arrow keys, activatable with Enter/Space
- Proper `aria-label` on the switcher and `aria-current` on the active language
- On click/select, navigate to the equivalent page in the chosen language
- Responsive — works on all breakpoints

**Flag icons approach:**
- Use inline SVGs for the 2-3 flags needed (smallest bundle size, no external dependency)
- Include proper `aria-label` or `role="img"` with `aria-label` on each flag
- Keep flags at a consistent size (e.g., 20x15 or 24x18) with proper aspect ratio

### Step 9: Translate All User-Facing Content

If the user chose to generate translations:

1. **Scan all existing pages and components** for hardcoded text:
   ```
   Grep pattern: ">[^<{]+<" glob: "*.tsx"  # Text between JSX tags
   Grep pattern: "placeholder=\"" glob: "*.tsx"  # Form placeholders
   Grep pattern: "aria-label=\"" glob: "*.tsx"  # ARIA labels
   ```

2. **Extract all text** into translation keys organized by page/feature

3. **Write natural, professional translations:**
   - Not literal word-for-word translations
   - Context-aware: a "Submit" button might be "Kirim" not "Menyerahkan"
   - Consistent terminology across all pages
   - Appropriate formality level for the target audience
   - Account for text length differences (Indonesian is often longer than English)

4. **Replace all hardcoded text** with translation function calls: `t('key')`

### Step 10: Add SEO Localization

If the user chose SEO localization:

1. **Add `hreflang` link tags** to the `<head>` of every page:
   ```html
   <link rel="alternate" hreflang="id" href="https://example.com/tentang" />
   <link rel="alternate" hreflang="en" href="https://example.com/en/about" />
   <link rel="alternate" hreflang="x-default" href="https://example.com/tentang" />
   ```

2. **Localize meta tags** (title, description) per language using translation keys

3. **Set the `lang` attribute** on the `<html>` element to match the current language

4. **Add `dir` attribute** if any supported language is RTL (right-to-left)

5. **Update sitemap.xml** to include all language variants with `xhtml:link` alternates

### Step 11: Verify Implementation

Run verification checks:

```bash
# TypeScript compilation
bunx tsc --noEmit 2>&1 | head -20

# Build check
bun run build 2>&1 | tail -10
```

Then scan for issues:

```
# Check for any remaining hardcoded text that should be translated
Grep pattern: ">[A-Z][a-z]+" glob: "src/**/*.tsx"

# Verify all translation keys are used
# Verify no translation keys are missing
```

### Step 12: Present Results

```
questions:
  - question: "Multilingual implementation complete! How would you like to verify?"
    header: "Verification"
    options:
      - label: "Start dev server and test language switching"
        description: "Run bun run dev and manually test switching between languages"
      - label: "Run full validation (/rubot-check)"
        description: "Run build, lint, and type checking"
      - label: "Run SEO audit on both language versions"
        description: "Use /rubot-seo-audit to verify hreflang tags and localized meta"
      - label: "Done — looks good"
        description: "All set, no further action needed"
    multiSelect: false
```

## Enforcement Rules

- Do NOT leave mixed-language content on the same page (unless intentionally specified)
- Do NOT use literal/awkward translations — all copy must be natural and context-aware
- Do NOT use emoji flags — use SVG flag icons for cross-platform consistency
- Do NOT auto-redirect after the user has manually selected a language
- Do NOT break existing routes — default language routes must stay at their current paths
- The `lang` attribute on `<html>` MUST match the current language
- Every user-facing string MUST go through the translation system — no hardcoded text
- The language switcher MUST be keyboard accessible with proper ARIA attributes
- Hreflang tags MUST include `x-default` pointing to the default language version
- Translation keys MUST be type-safe — missing keys should cause TypeScript errors

## QA Checklist

After implementation, verify:

- [ ] Route correctness: default language at root, others under prefix
- [ ] Language switching navigates to the equivalent page
- [ ] Language detection works on first visit
- [ ] Manual language choice persists across navigation and revisits
- [ ] No mixed-language content on any page
- [ ] All navigation labels, headings, body text, buttons, forms translated
- [ ] Footer content translated
- [ ] Error messages and empty states translated
- [ ] Language switcher is visible, accessible, and shows flags
- [ ] Active language is clearly indicated (not color-only)
- [ ] Flag icons have proper alt text / aria-labels
- [ ] Layouts remain clean with both shorter and longer translations
- [ ] `<html lang>` attribute updates correctly
- [ ] Hreflang tags present on all pages (if SEO was enabled)
- [ ] Meta titles and descriptions are localized
- [ ] Build and type-check pass without errors

## Related Commands

- `/rubot-check` — Validate the implementation
- `/rubot-seo-audit` — Audit SEO including hreflang tags
- `/rubot-responsive-audit` — Verify layouts hold with different text lengths
- `/rubot-wcag-audit` — Check accessibility of the language switcher

## Related Skills

- `multilanguage` — i18n patterns, translation structure, language switcher components
- `global-layout` — Navbar and Footer integration for the language switcher
- `schema-markup` — Structured data localization
- `social-sharing` — Localized Open Graph tags
