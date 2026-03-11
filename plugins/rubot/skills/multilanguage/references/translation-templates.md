# Translation File Templates

Complete translation JSON templates for Indonesian and English.

## Table of Contents

- [Indonesian (id.json)](#indonesian-idjson)
- [English (en.json)](#english-enjoson)
- [Key Naming Conventions](#key-naming-conventions)
- [Dynamic Values (Interpolation)](#dynamic-values-interpolation)
- [Indonesian Translation Reference](#indonesian-translation-reference)
- [Translation Best Practices](#translation-best-practices)

## Indonesian (`id.json`)

```json
{
  "nav": {
    "home": "Beranda",
    "about": "Tentang Kami",
    "features": "Fitur",
    "pricing": "Harga",
    "contact": "Kontak",
    "login": "Masuk",
    "register": "Daftar",
    "dashboard": "Dasbor"
  },
  "common": {
    "submit": "Kirim",
    "cancel": "Batal",
    "save": "Simpan",
    "delete": "Hapus",
    "edit": "Ubah",
    "back": "Kembali",
    "next": "Selanjutnya",
    "previous": "Sebelumnya",
    "loading": "Memuat...",
    "search": "Cari",
    "noResults": "Tidak ada hasil",
    "viewAll": "Lihat Semua",
    "learnMore": "Pelajari Lebih Lanjut",
    "getStarted": "Mulai Sekarang",
    "tryFree": "Coba Gratis"
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
    "password": "Kata Sandi",
    "passwordPlaceholder": "Masukkan kata sandi",
    "message": "Pesan",
    "messagePlaceholder": "Tulis pesan Anda di sini...",
    "required": "Wajib diisi",
    "invalidEmail": "Alamat email tidak valid",
    "minLength": "Minimal {min} karakter",
    "maxLength": "Maksimal {max} karakter"
  },
  "footer": {
    "copyright": "© {year} {brand}. Hak cipta dilindungi.",
    "privacy": "Kebijakan Privasi",
    "terms": "Syarat & Ketentuan",
    "about": "Tentang",
    "contact": "Kontak",
    "followUs": "Ikuti Kami"
  },
  "errors": {
    "notFound": "Halaman Tidak Ditemukan",
    "notFoundDescription": "Maaf, halaman yang Anda cari tidak ada.",
    "serverError": "Terjadi Kesalahan",
    "serverErrorDescription": "Maaf, terjadi kesalahan pada server. Silakan coba lagi.",
    "goHome": "Kembali ke Beranda",
    "tryAgain": "Coba Lagi"
  },
  "meta": {
    "homeTitle": "Beranda — {brand}",
    "homeDescription": "Deskripsi meta halaman beranda dalam Bahasa Indonesia",
    "aboutTitle": "Tentang Kami — {brand}",
    "aboutDescription": "Deskripsi meta halaman tentang dalam Bahasa Indonesia"
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

## English (`en.json`)

```json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "features": "Features",
    "pricing": "Pricing",
    "contact": "Contact",
    "login": "Log In",
    "register": "Sign Up",
    "dashboard": "Dashboard"
  },
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "loading": "Loading...",
    "search": "Search",
    "noResults": "No results found",
    "viewAll": "View All",
    "learnMore": "Learn More",
    "getStarted": "Get Started",
    "tryFree": "Try Free"
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
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "message": "Message",
    "messagePlaceholder": "Write your message here...",
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "minLength": "Must be at least {min} characters",
    "maxLength": "Must be at most {max} characters"
  },
  "footer": {
    "copyright": "© {year} {brand}. All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service",
    "about": "About",
    "contact": "Contact",
    "followUs": "Follow Us"
  },
  "errors": {
    "notFound": "Page Not Found",
    "notFoundDescription": "Sorry, the page you're looking for doesn't exist.",
    "serverError": "Something Went Wrong",
    "serverErrorDescription": "Sorry, something went wrong on our end. Please try again.",
    "goHome": "Go Home",
    "tryAgain": "Try Again"
  },
  "meta": {
    "homeTitle": "Home — {brand}",
    "homeDescription": "Meta description for the home page in English",
    "aboutTitle": "About Us — {brand}",
    "aboutDescription": "Meta description for the about page in English"
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

## Key Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `nav.*` | Navigation labels | `nav.about` → "About" |
| `common.*` | Shared UI buttons, actions, states | `common.submit` → "Submit" |
| `pages.<page>.*` | Page-specific content | `pages.home.title` → "Welcome" |
| `forms.*` | Form labels, placeholders, validation | `forms.email` → "Email" |
| `footer.*` | Footer content | `footer.privacy` → "Privacy Policy" |
| `meta.*` | SEO titles and descriptions | `meta.homeTitle` → "Home — Brand" |
| `errors.*` | Error pages, messages, empty states | `errors.notFound` → "Page Not Found" |
| `a11y.*` | Screen reader labels, ARIA text | `a11y.openMenu` → "Open menu" |

## Dynamic Values (Interpolation)

Use `{variable}` placeholders in translation strings:

```json
{
  "footer": {
    "copyright": "© {year} {brand}. All rights reserved."
  },
  "forms": {
    "minLength": "Must be at least {min} characters"
  }
}
```

The `t()` function handles interpolation:

```typescript
t('footer.copyright', { year: new Date().getFullYear(), brand: 'MyApp' })
// → "© 2026 MyApp. All rights reserved."
```

## Indonesian Translation Reference

Common English-to-Indonesian translations for web UIs. These are context-aware, natural translations — not literal word-for-word.

| English | Indonesian | Notes |
|---------|-----------|-------|
| Home | Beranda | Not "Rumah" (literal) |
| About | Tentang Kami | "About Us" |
| Features | Fitur | Direct loanword |
| Pricing | Harga | "Price" |
| Contact | Kontak | Direct loanword |
| Log In | Masuk | "Enter" |
| Sign Up | Daftar | "Register" |
| Submit | Kirim | "Send" |
| Cancel | Batal | — |
| Save | Simpan | — |
| Delete | Hapus | — |
| Search | Cari | — |
| Settings | Pengaturan | — |
| Privacy Policy | Kebijakan Privasi | — |
| Terms of Service | Syarat & Ketentuan | — |
| Learn More | Pelajari Lebih Lanjut | — |
| Get Started | Mulai Sekarang | "Start Now" |
| Dashboard | Dasbor | Accepted loanword |
| Profile | Profil | Direct loanword |
| Notifications | Notifikasi | Direct loanword |
| Loading | Memuat | — |
| Error | Kesalahan | — |
| Success | Berhasil | — |
| Warning | Peringatan | — |

## Translation Best Practices

### Do's

- **Use native speakers or high-quality AI translation** reviewed by a human
- **Keep terminology consistent** — create a glossary for key terms (e.g., "Dashboard" = "Dasbor" everywhere, not sometimes "Panel")
- **Account for text length** — Indonesian text is often 20-30% longer than English. Design layouts with sufficient space.
- **Use interpolation** for dynamic values (`{year}`, `{count}`) — never concatenate translated strings
- **Translate alt text and ARIA labels** — accessibility must be multilingual too

### Don'ts

- **Don't mix languages on a page** — if a page is in Indonesian, all visible text should be Indonesian
- **Don't translate brand names, product names, or proper nouns** — "Google", "WhatsApp", "TanStack" stay as-is
- **Don't use literal translations** — "Get started" is "Mulai Sekarang" (Start Now), not "Dapatkan dimulai"
- **Don't hardcode text in components** — every user-visible string goes through `t()`
- **Don't forget pluralization** — handle cases where languages pluralize differently
