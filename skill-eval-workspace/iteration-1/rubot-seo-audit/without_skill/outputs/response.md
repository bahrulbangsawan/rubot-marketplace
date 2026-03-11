# SEO Audit for https://acmecorp.io/pricing

Sure, I can help you look into why organic traffic dropped after the redesign. Here is what I would check:

## Meta Tags

First, I would look at the basic meta tags on the page:

- **Title tag**: Make sure it is still present and descriptive. It should be around 50-60 characters and include your target keyword (e.g., "Pricing" or your product name). After a redesign, titles sometimes get reset to something generic.
- **Meta description**: Should be around 150-160 characters and compelling. Check if it was accidentally removed or replaced with placeholder text.
- **Canonical tag**: Verify there is a `<link rel="canonical">` pointing to the correct URL. Sometimes redesigns introduce incorrect canonicals.
- **Robots meta tag**: Check for `<meta name="robots" content="noindex">` which might have been left from a staging environment. This would completely explain the traffic drop.

## Structured Data

Check if you had any structured data (JSON-LD) before the redesign that got removed. For a pricing page, you might have had:

- Product or SoftwareApplication schema
- Offer schema with pricing information
- Organization or WebPage schema

You can test this using Google's Rich Results Test at https://search.google.com/test/rich-results. Paste your URL and see if any structured data is detected.

## Indexing Issues

A few things to check:

- **robots.txt**: Visit https://acmecorp.io/robots.txt and make sure the pricing page is not being blocked.
- **Sitemap**: Check if the pricing page is included in your sitemap.xml.
- **Google Search Console**: Look at the Coverage report to see if Google is reporting any crawl errors for the pricing page. Check if it shows as "Discovered - currently not indexed" or "Crawled - currently not indexed."
- **HTTPS**: Make sure HTTP properly redirects to HTTPS with a 301.

## Core Web Vitals

With the new hero video, Core Web Vitals are definitely a concern:

- **LCP (Largest Contentful Paint)**: Should be under 2.5 seconds. A large hero video could slow this down significantly. Consider using a poster image and lazy loading the video.
- **CLS (Cumulative Layout Shift)**: Should be under 0.1. If the video does not have set dimensions, it could cause layout shifts as it loads. Make sure you set width and height attributes on the video element.
- **INP (Interaction to Next Paint)**: Should be under 200ms. Heavy video scripts could affect this.

You can check these metrics using:
- Google PageSpeed Insights (https://pagespeed.web.dev/)
- Chrome DevTools Lighthouse tab
- Google Search Console Core Web Vitals report

## Quick Checklist

Here is a quick list of things to verify:

1. Title tag is present and descriptive
2. Meta description exists and is not placeholder text
3. No `noindex` tag accidentally present
4. Canonical URL is correct
5. robots.txt is not blocking the page
6. Page is in the sitemap
7. Structured data (JSON-LD) is still present and valid
8. Open Graph tags (og:title, og:description, og:image) are set
9. Hero video has a poster attribute for faster perceived loading
10. Video element has explicit width/height to prevent CLS
11. Page loads under 2.5 seconds for LCP

## Recommendations

If I had to guess the most likely causes based on what you described:

1. A `noindex` tag was left in from development/staging -- this is the number one cause of post-redesign traffic drops.
2. The canonical URL is pointing somewhere wrong (staging domain, homepage, etc.).
3. Structured data was removed during the rebuild, causing loss of rich snippets.
4. The hero video is hurting LCP, potentially pushing you out of "good" Core Web Vitals territory.

I would recommend checking Google Search Console first to see what Google is reporting for this specific URL, then systematically going through the checklist above.

Would you like me to help with any specific part of this audit?
