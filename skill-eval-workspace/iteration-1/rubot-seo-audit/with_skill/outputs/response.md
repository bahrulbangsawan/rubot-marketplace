# SEO Audit Plan for https://acmecorp.io/pricing

Absolutely. Given that organic traffic tanked after the redesign, this is likely a P0/P1 situation — something in the rebuild may have broken crawlability, indexing, or metadata. Here is exactly how I will audit the page, following the full SEO audit methodology.

---

## Audit Approach

I will execute a **5-category scored audit** covering Technical SEO, On-Page SEO, Structured Data, Social Sharing, and Core Web Vitals. Each category is weighted and scored to produce an overall SEO score out of 100. Fixes will be prioritized using the severity matrix (P0 Critical through P4 Informational).

---

## Step 1: Technical SEO (30% weight, 30 points max)

These checks determine whether search engines can even crawl and index the page. If anything here is broken, it explains the traffic drop immediately.

| Check | How I Will Execute | What I Am Looking For |
|-------|-------------------|----------------------|
| robots.txt | `WebFetch https://acmecorp.io/robots.txt` | Verify 200 status. Check for `Disallow: /pricing` or `Disallow: /` that would block crawlers entirely. Confirm a `Sitemap:` directive is present. |
| sitemap.xml | `WebFetch https://acmecorp.io/sitemap.xml` | Verify valid XML, confirm `https://acmecorp.io/pricing` appears as a `<loc>` entry. If the pricing page was removed from the sitemap during redesign, Google may deprioritize crawling it. |
| HTTPS enforcement | Fetch `http://acmecorp.io/pricing` | Confirm a 301 redirect to the HTTPS version. A redesign that broke HTTPS redirects would cause indexing issues. |
| Mobile viewport | DOM: `document.querySelector('meta[name="viewport"]')` | Must include `width=device-width`. Missing viewport means Google's mobile-first indexer treats the page as non-mobile-friendly. |
| Canonical URL | DOM: `document.querySelector('link[rel="canonical"]')` | Must be present and set to `https://acmecorp.io/pricing` (absolute URL). A redesign sometimes introduces wrong canonicals pointing to the homepage or a staging URL. |
| Page language | DOM: `document.documentElement.lang` | Must be a valid BCP 47 code (e.g., `en`). |

**Red flag to check immediately**: Look for `<meta name="robots" content="noindex">` or an `X-Robots-Tag: noindex` HTTP header. Developers frequently leave noindex tags from staging environments, and this single issue would fully explain the traffic tank.

---

## Step 2: On-Page SEO (30% weight, 30 points max)

These checks determine whether the page sends strong enough content signals to rank.

| Check | How I Will Execute | What I Am Looking For |
|-------|-------------------|----------------------|
| Title tag | DOM: `document.title` | Present, 30-60 characters. A redesign may have left a generic title like "Pricing" or wiped it to the site name only. |
| Meta description | DOM: `document.querySelector('meta[name="description"]')?.content` | Present, 120-160 characters. If this was dropped during the rebuild, Google will auto-generate a snippet which often performs worse for CTR. |
| H1 count | DOM: `document.querySelectorAll('h1').length` | Must be exactly 1. Common redesign mistake: the hero section uses an H1 and the pricing table header is also an H1, diluting the topic signal. |
| Heading hierarchy | Collect all `h1-h6` tags | Verify no levels are skipped (e.g., H1 then H4 with no H2/H3). Redesigns with component libraries often break semantic heading order. |
| Image alt text | DOM: `document.querySelectorAll('img:not([alt])')` | 100% coverage on content images. The new hero video likely has a poster image — does it have alt text? |
| Internal links | Count same-origin `<a>` elements | At least 1 internal link. Verify navigation and footer links survived the redesign. |
| Content length | Body text word count | Minimum 300 words. If the redesign shifted to a more visual/sparse layout, content may have dropped below the threshold. |

---

## Step 3: Structured Data (15% weight, 15 points max)

You mentioned structured data specifically — this is critical for rich results in SERPs.

| Check | How I Will Execute | What I Am Looking For |
|-------|-------------------|----------------------|
| JSON-LD present | DOM: `document.querySelectorAll('script[type="application/ld+json"]')` | At least 1 block. If the pricing page previously had `Product` or `Offer` schema and it was dropped during redesign, you would lose rich result snippets. |
| Schema type valid | Parse `@type` from each JSON-LD block | Must be a recognized schema.org type. For a pricing page, expect `Product`, `Offer`, `SoftwareApplication`, or `WebPage`. |
| Required properties | Check per schema.org type | e.g., `Product` needs `name`, `image`, `offers`. `Offer` needs `price`, `priceCurrency`. Missing properties means the markup silently fails. |
| JSON validity | `JSON.parse()` each block | Malformed JSON (trailing commas, unescaped quotes) is silently ignored by search engines. This is a common issue when markup is dynamically generated by new components. |

---

## Step 4: Social Sharing (10% weight, 10 points max)

| Tag | How I Will Execute | What I Am Looking For |
|-----|-------------------|----------------------|
| og:title | DOM: `document.querySelector('meta[property="og:title"]')?.content` | Present, matches page topic |
| og:description | DOM check | Present, 100-200 characters |
| og:image | DOM check, then verify image dimensions | Present, minimum 1200x630px. If the redesign changed the hero image but did not update the OG image, social shares will show the old (or broken) preview. |
| og:url | DOM check | Present, absolute URL pointing to `https://acmecorp.io/pricing` |
| twitter:card | DOM check | Should be `summary_large_image` for maximum visual impact |
| twitter:image | DOM check | Present (Twitter does not always fall back to og:image) |

---

## Step 5: Core Web Vitals (15% weight, 15 points max)

You specifically mentioned a big hero video, which is a major concern for Core Web Vitals.

| Metric | Good Threshold | What to Watch For With the Hero Video |
|--------|---------------|--------------------------------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | The hero video (or its poster image) is very likely the LCP element. If the video autoplays without a poster image, LCP may spike above 4.0s as the browser waits for the first video frame to render. **This is the most likely CWV failure.** |
| **INP** (Interaction to Next Paint) | < 200ms | If the video loads heavy JavaScript (custom player, analytics hooks), it could block the main thread and push INP above 200ms. |
| **CLS** (Cumulative Layout Shift) | < 0.1 | If the video element does not have explicit `width` and `height` attributes (or aspect-ratio CSS), the layout will shift when the video loads, causing high CLS. This is extremely common with hero videos added during redesigns. |

**Specific video-related checks I will run:**
- Does the `<video>` element have a `poster` attribute? (Critical for LCP — without it, LCP is delayed until the first video frame decodes)
- Does the `<video>` element have explicit `width` and `height` or CSS `aspect-ratio`? (Critical for CLS)
- Is the video lazy-loaded or does it block above-the-fold rendering?
- Is the video served from a CDN or self-hosted?

---

## Execution Plan

I will use the browser agent to navigate to `https://acmecorp.io/pricing` and run the comprehensive DOM inspection script in a single pass:

```javascript
const seo = {
  title: document.title,
  titleLength: document.title.length,
  description: document.querySelector('meta[name="description"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  viewport: document.querySelector('meta[name="viewport"]')?.content,
  lang: document.documentElement.lang,
  robots: document.querySelector('meta[name="robots"]')?.content,
  h1Count: document.querySelectorAll('h1').length,
  h1Text: document.querySelector('h1')?.textContent?.trim(),
  headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
    level: parseInt(h.tagName[1]), text: h.textContent.trim().slice(0, 80)
  })),
  imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
  totalImages: document.querySelectorAll('img').length,
  jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent); } catch(e) { return { error: e.message }; } }),
  ogTitle: document.querySelector('meta[property="og:title"]')?.content,
  ogDesc: document.querySelector('meta[property="og:description"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  ogUrl: document.querySelector('meta[property="og:url"]')?.content,
  twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
  twitterImage: document.querySelector('meta[name="twitter:image"]')?.content,
  internalLinks: [...document.querySelectorAll('a[href]')]
    .filter(a => a.hostname === location.hostname).length,
  wordCount: document.body?.innerText?.split(/\s+/).filter(Boolean).length,
  // Video-specific checks for the hero video concern
  videoElements: [...document.querySelectorAll('video')].map(v => ({
    hasPoster: !!v.poster,
    hasWidth: !!v.width || !!v.style.width,
    hasHeight: !!v.height || !!v.style.height,
    autoplay: v.autoplay,
    src: v.src || v.querySelector('source')?.src
  }))
};
JSON.stringify(seo, null, 2);
```

Simultaneously, I will fetch the remote resources:
- `WebFetch https://acmecorp.io/robots.txt` — check for blocking rules
- `WebFetch https://acmecorp.io/sitemap.xml` — confirm pricing page is listed
- HTTP-to-HTTPS redirect check

---

## Output

The final report will follow this structure with a scored breakdown:

- **Overall Score**: 0-100 with interpretation (Excellent / Good / Needs Work / Critical)
- **Technical SEO**: X/30 points
- **On-Page SEO**: X/30 points
- **Structured Data**: X/15 points
- **Social Sharing**: X/10 points
- **Core Web Vitals**: X/15 points
- **Prioritized Recommendations**: Grouped by P0 (Critical) through P3 (Low)

---

## Most Likely Causes of the Traffic Drop

Based on common redesign failures and your specific mention of a hero video, here are the issues I expect to find, ranked by probability:

1. **P0 — `noindex` meta tag left from staging** — This alone would fully explain the traffic tank. Developers frequently forget to remove noindex directives after a redesign.
2. **P1 — Canonical URL pointing to wrong location** — If the canonical points to an old URL, staging URL, or the homepage, Google de-indexes the pricing page.
3. **P1 — Title tag or meta description removed/changed** — If the title was changed to something generic or dropped entirely, ranking signals are lost.
4. **P2 — Structured data broken or removed** — If pricing schema (`Offer`, `Product`) was lost in the rebuild, you lose rich result snippets, which tanks CTR even if ranking is stable.
5. **P2 — Hero video destroying LCP** — A large autoplaying video without a poster image can push LCP above 4.0s, triggering a Core Web Vitals failure that demotes the page.
6. **P2 — CLS from hero video without dimensions** — The video loading causes layout shifts above the 0.1 threshold.

Shall I proceed with executing this audit now? I will need browser access to the live page to run the DOM inspection and fetch the remote resources.
