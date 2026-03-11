Here's the complete i18n setup for your TanStack Start app with Indonesian (default) and English support.

## File Structure

```
src/i18n/
├── index.ts                # Language config, supported languages, helpers
├── types.ts                # TypeScript types for translation keys
├── context.tsx             # React context provider for current language
├── locales/
│   ├── id.json             # Indonesian translations
│   └── en.json             # English translations
├── hooks/
│   └── use-translation.ts  # useTranslation() hook
├── utils/
│   ├── detection.ts        # Language detection logic
│   └── route-map.ts        # Route mapping between languages
└── components/
    ├── language-switcher.tsx
    └── flag-icons.tsx
```

## 1. Language Config — `src/i18n/index.ts`

```typescript
export const SUPPORTED_LANGUAGES = ['id', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'id'

export const LANGUAGE_META: Record<
  SupportedLanguage,
  { name: string; nativeName: string; flag: string; dir: 'ltr' | 'rtl' }
> = {
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: 'id', dir: 'ltr' },
  en: { name: 'English', nativeName: 'English', flag: 'gb', dir: 'ltr' },
}

export function isSupported(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}
```

Indonesian is the default, so it uses root paths with no prefix. English routes get the `/en` prefix.

## 2. Type-Safe Translation Types — `src/i18n/types.ts`

```typescript
import type idTranslations from './locales/id.json'

type NestedKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? NestedKeys<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never
    }[keyof T]
  : never

export type TranslationKey = NestedKeys<typeof idTranslations>
export type TranslationParams = Record<string, string | number>
```

This derives a union type of all valid dotted key paths directly from `id.json`. A typo'd or missing key causes a compile-time error. Make sure your `tsconfig.json` has `"resolveJsonModule": true`.

## 3. Translation Files

### `src/i18n/locales/id.json`

```json
{
  "nav": {
    "home": "Beranda",
    "about": "Tentang Kami",
    "contact": "Kontak"
  },
  "common": {
    "submit": "Kirim",
    "cancel": "Batal",
    "save": "Simpan",
    "back": "Kembali",
    "loading": "Memuat...",
    "learnMore": "Pelajari Lebih Lanjut",
    "getStarted": "Mulai Sekarang"
  },
  "pages": {
    "home": {
      "title": "Selamat Datang",
      "subtitle": "Deskripsi singkat tentang produk Anda",
      "ctaPrimary": "Mulai Sekarang",
      "ctaSecondary": "Pelajari Lebih Lanjut"
    },
    "about": {
      "title": "Tentang Kami",
      "description": "Cerita dan misi perusahaan Anda"
    },
    "contact": {
      "title": "Hubungi Kami",
      "description": "Kami senang mendengar dari Anda"
    }
  },
  "forms": {
    "name": "Nama",
    "namePlaceholder": "Masukkan nama Anda",
    "email": "Email",
    "emailPlaceholder": "nama@contoh.com",
    "message": "Pesan",
    "messagePlaceholder": "Tulis pesan Anda di sini...",
    "required": "Wajib diisi",
    "invalidEmail": "Alamat email tidak valid"
  },
  "footer": {
    "copyright": "© {year} {brand}. Hak cipta dilindungi.",
    "privacy": "Kebijakan Privasi",
    "terms": "Syarat & Ketentuan"
  },
  "meta": {
    "homeTitle": "Beranda — {brand}",
    "homeDescription": "Deskripsi meta halaman beranda dalam Bahasa Indonesia",
    "aboutTitle": "Tentang Kami — {brand}",
    "aboutDescription": "Deskripsi meta halaman tentang dalam Bahasa Indonesia",
    "contactTitle": "Hubungi Kami — {brand}",
    "contactDescription": "Hubungi kami untuk pertanyaan dan informasi lebih lanjut"
  },
  "errors": {
    "notFound": "Halaman Tidak Ditemukan",
    "notFoundDescription": "Maaf, halaman yang Anda cari tidak ada.",
    "goHome": "Kembali ke Beranda"
  },
  "a11y": {
    "mainNavigation": "Navigasi utama",
    "skipToContent": "Langsung ke konten",
    "openMenu": "Buka menu",
    "closeMenu": "Tutup menu",
    "switchLanguage": "Ganti bahasa",
    "currentLanguage": "Bahasa saat ini: Bahasa Indonesia",
    "footerNavigation": "Navigasi footer"
  }
}
```

### `src/i18n/locales/en.json`

```json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "back": "Back",
    "loading": "Loading...",
    "learnMore": "Learn More",
    "getStarted": "Get Started"
  },
  "pages": {
    "home": {
      "title": "Welcome",
      "subtitle": "A short description of your product",
      "ctaPrimary": "Get Started",
      "ctaSecondary": "Learn More"
    },
    "about": {
      "title": "About Us",
      "description": "Your company story and mission"
    },
    "contact": {
      "title": "Contact Us",
      "description": "We'd love to hear from you"
    }
  },
  "forms": {
    "name": "Name",
    "namePlaceholder": "Enter your name",
    "email": "Email",
    "emailPlaceholder": "name@example.com",
    "message": "Message",
    "messagePlaceholder": "Write your message here...",
    "required": "This field is required",
    "invalidEmail": "Invalid email address"
  },
  "footer": {
    "copyright": "© {year} {brand}. All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  },
  "meta": {
    "homeTitle": "Home — {brand}",
    "homeDescription": "Meta description for the home page in English",
    "aboutTitle": "About Us — {brand}",
    "aboutDescription": "Meta description for the about page in English",
    "contactTitle": "Contact Us — {brand}",
    "contactDescription": "Get in touch with us for questions and more information"
  },
  "errors": {
    "notFound": "Page Not Found",
    "notFoundDescription": "Sorry, the page you're looking for doesn't exist.",
    "goHome": "Go Home"
  },
  "a11y": {
    "mainNavigation": "Main navigation",
    "skipToContent": "Skip to content",
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "switchLanguage": "Switch language",
    "currentLanguage": "Current language: English",
    "footerNavigation": "Footer navigation"
  }
}
```

Both JSON files have identical key structures. The Indonesian translations use natural, context-aware phrasing -- "Beranda" (not "Rumah"), "Mulai Sekarang" (not "Dapatkan dimulai"), "Hubungi Kami" (not "Kontak Kami").

## 4. Language Context Provider — `src/i18n/context.tsx`

```tsx
import { createContext, useState, useEffect, type ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import {
  DEFAULT_LANGUAGE,
  isSupported,
  type SupportedLanguage,
} from './index'

interface LanguageContextType {
  language: SupportedLanguage
  translations: Record<string, unknown>
  setLanguage: (lang: SupportedLanguage) => void
}

export const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  translations: {},
  setLanguage: () => {},
})

const translationLoaders: Record<
  SupportedLanguage,
  () => Promise<Record<string, unknown>>
> = {
  id: () => import('./locales/id.json').then((m) => m.default),
  en: () => import('./locales/en.json').then((m) => m.default),
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  // Derive language from URL prefix
  const urlLang = pathname.split('/')[1]
  const detectedLang =
    isSupported(urlLang) && urlLang !== DEFAULT_LANGUAGE
      ? urlLang
      : DEFAULT_LANGUAGE

  const [language, setLanguageState] = useState<SupportedLanguage>(detectedLang)
  const [translations, setTranslations] = useState<Record<string, unknown>>({})

  useEffect(() => {
    setLanguageState(detectedLang)
  }, [detectedLang])

  useEffect(() => {
    translationLoaders[language]().then(setTranslations)
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(lang: SupportedLanguage) {
    setLanguageState(lang)
    document.cookie = `preferred-lang=${lang};path=/;max-age=31536000;SameSite=Lax`
  }

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
```

The URL is the single source of truth. Since Indonesian is the default, any path that does not start with `/en` is treated as Indonesian. Translation files are lazy-loaded so only the active language's bundle is fetched.

## 5. Translation Hook — `src/i18n/hooks/use-translation.ts`

```typescript
import { useContext } from 'react'
import { LanguageContext } from '../context'
import type { TranslationKey, TranslationParams } from '../types'

export function useTranslation() {
  const { language, translations } = useContext(LanguageContext)

  function t(key: TranslationKey, params?: TranslationParams): string {
    const value = key.split('.').reduce<unknown>(
      (obj, k) => (obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[k] : undefined),
      translations,
    )

    if (typeof value !== 'string') {
      console.warn(`Missing translation: ${key} for language: ${language}`)
      return key
    }

    if (!params) return value

    return value.replace(/\{(\w+)\}/g, (_, name) =>
      params[name] !== undefined ? String(params[name]) : `{${name}}`,
    )
  }

  return { t, language }
}
```

Usage:

```tsx
const { t, language } = useTranslation()

t('pages.contact.title')                                    // "Hubungi Kami"
t('footer.copyright', { year: 2026, brand: 'MyApp' })      // "© 2026 MyApp. Hak cipta dilindungi."
```

## 6. Route Mapping — `src/i18n/utils/route-map.ts`

```typescript
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '../index'

const ROUTE_MAP: Record<string, Record<SupportedLanguage, string>> = {
  '/': { id: '/', en: '/en' },
  '/tentang': { id: '/tentang', en: '/en/about' },
  '/kontak': { id: '/kontak', en: '/en/contact' },
}

export function getLocalizedPath(
  currentPath: string,
  targetLang: SupportedLanguage,
): string {
  for (const [, paths] of Object.entries(ROUTE_MAP)) {
    const match = Object.entries(paths).find(([, p]) => p === currentPath)
    if (match) {
      return paths[targetLang]
    }
  }
  // Fallback: target language homepage
  return targetLang === DEFAULT_LANGUAGE ? '/' : `/${targetLang}`
}
```

## 7. Route Files

The default language (Indonesian) uses root paths with no prefix. English gets the `/en` prefix.

```
app/routes/
├── __root.tsx              # Root layout (wraps LanguageProvider)
├── index.tsx               # / → Indonesian homepage
├── tentang.tsx             # /tentang → Indonesian about
├── kontak.tsx              # /kontak → Indonesian contact
├── en/
│   ├── index.tsx           # /en → English homepage
│   ├── about.tsx           # /en/about → English about
│   └── contact.tsx         # /en/contact → English contact
```

### `app/routes/__root.tsx`

Wrap the entire app in `LanguageProvider`:

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { LanguageProvider } from '@/i18n/context'

export const Route = createRootRoute({
  component: () => (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  ),
})
```

### Shared Page Components

Each route file is a thin wrapper pointing to a shared page component:

```tsx
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
export const Route = createFileRoute('/')({ component: HomePage })

// app/routes/en/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
export const Route = createFileRoute('/en/')({ component: HomePage })

// app/routes/tentang.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/pages/about'
export const Route = createFileRoute('/tentang')({ component: AboutPage })

// app/routes/en/about.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/pages/about'
export const Route = createFileRoute('/en/about')({ component: AboutPage })

// app/routes/kontak.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '@/pages/contact'
export const Route = createFileRoute('/kontak')({ component: ContactPage })

// app/routes/en/contact.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '@/pages/contact'
export const Route = createFileRoute('/en/contact')({ component: ContactPage })
```

### Example Page Component — `src/pages/home.tsx`

```tsx
import { useTranslation } from '@/i18n/hooks/use-translation'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold">{t('pages.home.title')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t('pages.home.subtitle')}</p>
      <div className="mt-8 flex gap-4">
        <button className="rounded-md bg-primary px-6 py-3 text-primary-foreground">
          {t('pages.home.ctaPrimary')}
        </button>
        <button className="rounded-md border px-6 py-3">
          {t('pages.home.ctaSecondary')}
        </button>
      </div>
    </main>
  )
}
```

## 8. Language Detection — `src/i18n/utils/detection.ts`

```typescript
import { DEFAULT_LANGUAGE, isSupported, type SupportedLanguage } from '../index'

/**
 * Detect the user's preferred language.
 * Priority: stored preference > browser language > default.
 */
export function detectLanguage(): SupportedLanguage {
  const stored = getStoredPreference()
  if (stored && isSupported(stored)) return stored

  if (typeof navigator !== 'undefined') {
    for (const lang of navigator.languages) {
      const code = lang.split('-')[0].toLowerCase()
      if (isSupported(code)) return code
    }
  }

  return DEFAULT_LANGUAGE
}

function getStoredPreference(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/preferred-lang=(\w+)/)
  return match?.[1] ?? null
}

/**
 * Server-side detection from Accept-Language header.
 */
export function detectLanguageFromHeader(
  acceptLanguage: string | null | undefined,
): SupportedLanguage {
  if (!acceptLanguage) return DEFAULT_LANGUAGE

  const languages = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=')
      return { code: lang.split('-')[0].toLowerCase(), quality: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { code } of languages) {
    if (isSupported(code)) return code
  }

  return DEFAULT_LANGUAGE
}
```

Detection only runs on first visit to `/` with no stored preference. It suggests a redirect but never overrides a URL the user navigated to directly. Once the user manually switches language, their preference is persisted in a cookie and never overridden.

## 9. Language Switcher — `src/i18n/components/language-switcher.tsx`

Since you have 2 languages, the inline toggle style works well:

```tsx
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks/use-translation'
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type SupportedLanguage } from '@/i18n'
import { getLocalizedPath } from '@/i18n/utils/route-map'
import { FlagIcon } from './flag-icons'

export function LanguageSwitcher() {
  const { language, t } = useTranslation()
  const navigate = useNavigate()
  const routerState = useRouterState()

  function switchTo(targetLang: SupportedLanguage) {
    if (targetLang === language) return
    const targetPath = getLocalizedPath(routerState.location.pathname, targetLang)
    document.cookie = `preferred-lang=${targetLang};path=/;max-age=31536000;SameSite=Lax`
    navigate({ to: targetPath })
  }

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={t('a11y.switchLanguage')}>
      {SUPPORTED_LANGUAGES.map((lang, i) => {
        const meta = LANGUAGE_META[lang]
        const isActive = lang === language
        return (
          <>
            {i > 0 && <span className="text-muted-foreground/40">|</span>}
            <button
              key={lang}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${meta.nativeName}${isActive ? ` (${t('a11y.currentLanguage')})` : ''}`}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              onClick={() => switchTo(lang)}
            >
              <FlagIcon code={meta.flag} className="h-3.5 w-5" />
              <span>{lang.toUpperCase()}</span>
            </button>
          </>
        )
      })}
    </div>
  )
}
```

## 10. SVG Flag Icons — `src/i18n/components/flag-icons.tsx`

SVG flags, not emoji, for consistent cross-platform rendering:

```tsx
interface FlagIconProps {
  code: string
  className?: string
}

export function FlagIcon({ code, className = 'h-4 w-5' }: FlagIconProps) {
  const flags: Record<string, JSX.Element> = {
    id: (
      <svg viewBox="0 0 640 480" className={className} role="img" aria-label="Indonesian flag">
        <path fill="#e70011" d="M0 0h640v240H0z" />
        <path fill="#fff" d="M0 240h640v240H0z" />
      </svg>
    ),
    gb: (
      <svg viewBox="0 0 640 480" className={className} role="img" aria-label="British flag">
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z" />
        <path fill="#C8102E" d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z" />
        <path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z" />
        <path fill="#C8102E" d="M0 193v96h640v-96zM273 0v480h96V0z" />
      </svg>
    ),
  }

  return flags[code] ?? <span className={className}>🏳</span>
}
```

## 11. SEO — Hreflang Tags

Add to each page's `<head>` via TanStack Start's `Meta` or a custom component:

```tsx
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/i18n'
import { getLocalizedPath } from '@/i18n/utils/route-map'

function HreflangTags({ currentPath, baseUrl }: { currentPath: string; baseUrl: string }) {
  return (
    <>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${baseUrl}${getLocalizedPath(currentPath, lang)}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}${getLocalizedPath(currentPath, DEFAULT_LANGUAGE)}`}
      />
    </>
  )
}
```

This outputs for the about page:

```html
<link rel="alternate" hreflang="id" href="https://yoursite.com/tentang" />
<link rel="alternate" hreflang="en" href="https://yoursite.com/en/about" />
<link rel="alternate" hreflang="x-default" href="https://yoursite.com/tentang" />
```

## URL Mapping Summary

| Page | Indonesian (default) | English |
|------|---------------------|---------|
| Home | `/` | `/en` |
| About | `/tentang` | `/en/about` |
| Contact | `/kontak` | `/en/contact` |

## Verification Checklist

- [ ] Every user-visible string uses `t()` -- no hardcoded text in components
- [ ] `TranslationKey` type resolves correctly (no `never` type errors)
- [ ] Both `id.json` and `en.json` have identical key structures
- [ ] `/tentang` renders Indonesian, `/en/about` renders English
- [ ] Default language routes have no prefix (`/`, not `/id/`)
- [ ] Language switcher navigates to the equivalent page in the target language
- [ ] Language preference persists in a cookie across sessions
- [ ] `<html lang>` attribute updates to match the active language
- [ ] Every page includes hreflang tags for all language variants plus `x-default`
- [ ] All hreflang URLs are absolute (include full domain)
- [ ] Hreflang tags are reciprocal across all pages
- [ ] `<title>` and `<meta description>` are translated per language
- [ ] SVG flags used instead of emoji flags
