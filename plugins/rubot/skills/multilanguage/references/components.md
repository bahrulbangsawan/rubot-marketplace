# Multilanguage Component Reference

Full component implementations for the multilanguage system.

## Table of Contents

- [Language Configuration](#language-configuration)
- [Type-Safe Translation Types](#type-safe-translation-types)
- [Translation Hook](#translation-hook)
- [Language Context Provider](#language-context-provider)
- [Language Detection Utilities](#language-detection-utilities)
- [Route Mapping](#route-mapping)
- [Language Switcher — Dropdown](#language-switcher--dropdown)
- [Language Switcher — Inline Toggle](#language-switcher--inline-toggle)
- [Flag Icons (SVG)](#flag-icons-svg)
- [Hreflang Tags Component](#hreflang-tags-component)

## Language Configuration

### `src/i18n/index.ts`

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

To add more languages: add the code to `SUPPORTED_LANGUAGES`, add metadata to `LANGUAGE_META`, and create the corresponding locale JSON file.

## Type-Safe Translation Types

### `src/i18n/types.ts`

```typescript
import type idTranslations from './locales/id.json'

// Derive the translation key type from the source JSON structure
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

This derives a union type of all valid dotted key paths (e.g., `'nav.home' | 'nav.about' | 'common.submit' | ...`) directly from the JSON file. Missing/typo'd keys cause compile-time errors.

## Translation Hook

### `src/i18n/hooks/use-translation.ts`

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

### Usage

```tsx
const { t } = useTranslation()

// Simple key
<h1>{t('pages.contact.title')}</h1>

// With interpolation
<p>{t('footer.copyright', { year: 2026, brand: 'MyApp' })}</p>
```

## Language Context Provider

### `src/i18n/context.tsx`

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

The URL is the single source of truth. Translation files are lazy-loaded with dynamic `import()` so only the active language's bundle is fetched.

## Language Detection Utilities

### `src/i18n/utils/detection.ts`

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

## Route Mapping

### `src/i18n/utils/route-map.ts`

```typescript
import type { SupportedLanguage } from '../index'

const ROUTE_MAP: Record<string, Record<SupportedLanguage, string>> = {
  '/': { id: '/', en: '/en' },
  '/tentang': { id: '/tentang', en: '/en/about' },
  '/kontak': { id: '/kontak', en: '/en/contact' },
  '/fitur': { id: '/fitur', en: '/en/features' },
  '/harga': { id: '/harga', en: '/en/pricing' },
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
  return targetLang === 'id' ? '/' : `/${targetLang}`
}
```

Extend `ROUTE_MAP` as you add more pages. Each entry maps between all language variants of the same page.

## Language Switcher — Dropdown

```tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks/use-translation'
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type SupportedLanguage } from '@/i18n'
import { getLocalizedPath } from '@/i18n/utils/route-map'
import { FlagIcon } from './flag-icons'

export function LanguageSwitcher() {
  const { language, t } = useTranslation()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function switchTo(targetLang: SupportedLanguage) {
    if (targetLang === language) return
    const targetPath = getLocalizedPath(routerState.location.pathname, targetLang)
    document.cookie = `preferred-lang=${targetLang};path=/;max-age=31536000;SameSite=Lax`
    navigate({ to: targetPath })
    setIsOpen(false)
  }

  const currentMeta = LANGUAGE_META[language]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('a11y.switchLanguage')}
      >
        <FlagIcon code={currentMeta.flag} className="h-4 w-5" />
        <span>{language.toUpperCase()}</span>
        <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('a11y.switchLanguage')}
          className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const meta = LANGUAGE_META[lang]
            const isActive = lang === language
            return (
              <li
                key={lang}
                role="option"
                aria-selected={isActive}
                className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent ${isActive ? 'font-semibold' : ''}`}
                onClick={() => switchTo(lang)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    switchTo(lang)
                  }
                }}
                tabIndex={0}
              >
                <FlagIcon code={meta.flag} className="h-4 w-5" />
                <span>{meta.nativeName}</span>
                {isActive && (
                  <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
```

## Language Switcher — Inline Toggle

```tsx
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks/use-translation'
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type SupportedLanguage } from '@/i18n'
import { getLocalizedPath } from '@/i18n/utils/route-map'
import { FlagIcon } from './flag-icons'

export function LanguageSwitcherInline() {
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

## Flag Icons (SVG)

Inline SVGs ensure consistent rendering across all platforms (unlike emoji flags which differ per OS).

```tsx
// src/i18n/components/flag-icons.tsx

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
    us: (
      <svg viewBox="0 0 640 480" className={className} role="img" aria-label="American flag">
        <path fill="#bd3d44" d="M0 0h640v37h-640zm0 73.9h640v37h-640zm0 73.8h640v37h-640zm0 73.8h640v37h-640zm0 74h640v36.8h-640zm0 73.7h640v37h-640zm0 73.9h640v37h-640z" />
        <path fill="#fff" d="M0 37h640v36.9h-640zm0 73.8h640v36.9h-640zm0 73.8h640v37h-640zm0 73.9h640v37h-640zm0 73.8h640v37h-640zm0 73.8h640v37h-640z" />
        <path fill="#192f5d" d="M0 0h364.8v258.5H0z" />
      </svg>
    ),
    my: (
      <svg viewBox="0 0 640 480" className={className} role="img" aria-label="Malaysian flag">
        <path fill="#cc0001" d="M0 0h640v34.3H0zm0 68.6h640v34.3H0zm0 68.5h640v34.3H0zm0 68.6h640v34.3H0zm0 68.6h640v34.3H0zm0 68.5h640v34.3H0zm0 68.6h640v34.3H0z" />
        <path fill="#fff" d="M0 34.3h640v34.3H0zm0 68.5h640v34.3H0zm0 68.6h640v34.3H0zm0 68.6h640v34.3H0zm0 68.5h640v34.3H0zm0 68.6h640v34.3H0z" />
        <path fill="#010066" d="M0 0h320v274.3H0z" />
        <path fill="#fc0" d="M180.3 182.5a80 80 0 1 1 0-90.9 64 64 0 1 0 0 90.9z" />
        <path fill="#fc0" d="m209.4 106.2 18.1 25-28.6 11 28.6 11-18.1 25V141l28.7 11-17.7-25.4 17.7-25.4-28.7 11z" />
      </svg>
    ),
  }

  return flags[code] ?? <span className={className}>🏳</span>
}
```

## Hreflang Tags Component

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

Search engines use `hreflang="x-default"` to identify the fallback for users whose language doesn't match any listed variant.
