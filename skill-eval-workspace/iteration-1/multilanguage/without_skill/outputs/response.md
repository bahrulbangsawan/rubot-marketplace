Here's how to set up i18n in your TanStack Start app with English and Indonesian support, with Indonesian as the default language.

## Approach

We'll build a lightweight, custom i18n system without external libraries. The approach uses:

- JSON translation files for each language
- A React context to hold the current language and translations
- A `useTranslation` hook that returns a `t()` function
- URL-prefix-based routing (`/` for Indonesian, `/en/` for English)

## 1. Install Nothing Extra

No additional packages are required. We'll use TypeScript, React context, and TanStack Router's built-in features.

## 2. Translation Files

### `src/i18n/locales/id.json`

```json
{
  "nav": {
    "home": "Beranda",
    "about": "Tentang",
    "contact": "Kontak"
  },
  "home": {
    "title": "Selamat Datang",
    "description": "Deskripsi produk Anda di sini",
    "cta": "Mulai Sekarang"
  },
  "about": {
    "title": "Tentang Kami",
    "description": "Informasi tentang perusahaan kami"
  },
  "contact": {
    "title": "Hubungi Kami",
    "description": "Silakan hubungi kami",
    "form": {
      "name": "Nama",
      "email": "Email",
      "message": "Pesan",
      "submit": "Kirim"
    }
  },
  "footer": {
    "copyright": "© {year} {brand}. Hak cipta dilindungi."
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
  "home": {
    "title": "Welcome",
    "description": "Your product description here",
    "cta": "Get Started"
  },
  "about": {
    "title": "About Us",
    "description": "Information about our company"
  },
  "contact": {
    "title": "Contact Us",
    "description": "Get in touch with us",
    "form": {
      "name": "Name",
      "email": "Email",
      "message": "Message",
      "submit": "Submit"
    }
  },
  "footer": {
    "copyright": "© {year} {brand}. All rights reserved."
  }
}
```

## 3. Language Config — `src/i18n/config.ts`

```typescript
export const languages = ['id', 'en'] as const
export type Language = (typeof languages)[number]
export const defaultLanguage: Language = 'id'

export const languageNames: Record<Language, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}
```

## 4. i18n Context — `src/i18n/context.tsx`

```tsx
import { createContext, useState, useEffect, type ReactNode } from 'react'
import { defaultLanguage, type Language } from './config'
import idTranslations from './locales/id.json'
import enTranslations from './locales/en.json'

type Translations = typeof idTranslations

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  translations: Translations
}

const translationMap: Record<Language, Translations> = {
  id: idTranslations,
  en: enTranslations,
}

export const I18nContext = createContext<I18nContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  translations: idTranslations,
})

export function I18nProvider({
  children,
  initialLanguage = defaultLanguage,
}: {
  children: ReactNode
  initialLanguage?: Language
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        translations: translationMap[language],
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}
```

## 5. useTranslation Hook — `src/i18n/useTranslation.ts`

```typescript
import { useContext } from 'react'
import { I18nContext } from './context'

export function useTranslation() {
  const { language, translations, setLanguage } = useContext(I18nContext)

  function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation missing: ${key}`)
        return key
      }
    }

    if (typeof value !== 'string') return key

    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, name) =>
        params[name] !== undefined ? String(params[name]) : `{${name}}`
      )
    }

    return value
  }

  return { t, language, setLanguage }
}
```

## 6. Route Setup

Since Indonesian is the default, its routes live at the root. English routes go under `/en/`.

### File Structure

```
app/routes/
├── __root.tsx
├── index.tsx          # / (Indonesian home)
├── tentang.tsx        # /tentang (Indonesian about)
├── kontak.tsx         # /kontak (Indonesian contact)
└── en/
    ├── index.tsx      # /en (English home)
    ├── about.tsx      # /en/about
    └── contact.tsx    # /en/contact
```

### `app/routes/__root.tsx`

```tsx
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { I18nProvider } from '@/i18n/context'
import type { Language } from '@/i18n/config'

function RootComponent() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const lang: Language = pathname.startsWith('/en') ? 'en' : 'id'

  return (
    <I18nProvider initialLanguage={lang}>
      <Outlet />
    </I18nProvider>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
```

### Example Route Files

```tsx
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
export const Route = createFileRoute('/')({ component: HomePage })

// app/routes/en/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
export const Route = createFileRoute('/en/')({ component: HomePage })
```

Do the same pattern for about/tentang and contact/kontak pages.

## 7. Page Component Example — `src/pages/home.tsx`

```tsx
import { useTranslation } from '@/i18n/useTranslation'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.description')}</p>
      <button>{t('home.cta')}</button>
    </div>
  )
}
```

## 8. Language Switcher Component

```tsx
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/useTranslation'
import { languages, languageNames, type Language } from '@/i18n/config'

// Map routes between languages
const routeMap: Record<string, Record<Language, string>> = {
  home: { id: '/', en: '/en' },
  about: { id: '/tentang', en: '/en/about' },
  contact: { id: '/kontak', en: '/en/contact' },
}

function getTargetPath(currentPath: string, targetLang: Language): string {
  for (const routes of Object.values(routeMap)) {
    if (Object.values(routes).includes(currentPath)) {
      return routes[targetLang]
    }
  }
  return targetLang === 'id' ? '/' : '/en'
}

export function LanguageSwitcher() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const routerState = useRouterState()

  function switchLanguage(targetLang: Language) {
    if (targetLang === language) return
    const path = getTargetPath(routerState.location.pathname, targetLang)
    navigate({ to: path })
  }

  return (
    <div>
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLanguage(lang)}
          style={{ fontWeight: lang === language ? 'bold' : 'normal' }}
        >
          {languageNames[lang]}
        </button>
      ))}
    </div>
  )
}
```

## 9. Barrel Export — `src/i18n/index.ts`

```typescript
export { I18nProvider } from './context'
export { useTranslation } from './useTranslation'
export { languages, defaultLanguage, languageNames, type Language } from './config'
```

## Summary

| URL | Language | Page |
|-----|----------|------|
| `/` | Indonesian | Home |
| `/tentang` | Indonesian | About |
| `/kontak` | Indonesian | Contact |
| `/en` | English | Home |
| `/en/about` | English | About |
| `/en/contact` | English | Contact |

The system works by detecting the language from the URL prefix in `__root.tsx`, passing it to the context provider, and then each page component uses `useTranslation()` to get translated strings. The language switcher navigates to the equivalent route in the target language.

To add a new language later, you would:
1. Add the language code to the `languages` array in `config.ts`
2. Create a new translation JSON file
3. Import it and add it to `translationMap` in `context.tsx`
4. Add route files under a new prefix directory (e.g., `/ja/`)
5. Update the route map in the language switcher
