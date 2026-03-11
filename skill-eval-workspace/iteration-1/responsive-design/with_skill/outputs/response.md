# Fix: Hero Section Overflow on iPhone

Your hero section has two distinct problems causing horizontal overflow on mobile: **`h-screen` not accounting for mobile browser chrome**, and **`px` values creating fixed-width elements that exceed the viewport**. Here is how to fix both.

## Root Causes

1. **`h-screen` on mobile**: `h-screen` maps to `100vh`, which on iOS Safari does **not** subtract the address bar and toolbar. This causes the hero to extend behind browser chrome, pushing the CTA button out of the visible area. The fix is `min-h-dvh` -- dynamic viewport height accounts for mobile browser chrome automatically.

2. **Fixed `px` padding values**: Any `px`-based padding (e.g., `px-[60px]`, `py-[80px]`) creates rigid spacing that cannot adapt to narrow viewports. On an iPhone SE (375px wide), even `padding: 0 60px` eats 120px, leaving only 255px for content. If the headline font is also set in `px`, it will not wrap early enough and overflows.

## Fix for `src/components/hero.tsx`

Replace the current hero with this mobile-first pattern:

```tsx
<section className="
  min-h-dvh flex flex-col items-center justify-center
  px-4 py-8
  sm:px-6 sm:py-12
  md:min-h-[80vh] md:px-8 md:py-16
  lg:min-h-[90vh] lg:px-12 lg:py-20
">
  <h1 className="
    text-3xl font-bold text-center leading-tight
    sm:text-4xl
    md:text-5xl
    lg:text-6xl
  ">
    Your Headline Here
  </h1>
  <p className="
    mt-4 text-base text-muted-foreground text-center max-w-prose
    sm:text-lg sm:mt-5
    md:text-xl md:mt-6
  ">
    Hero description text that remains readable on all screen sizes.
  </p>
  <div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:w-auto sm:gap-4 md:mt-8">
    <Button size="lg" className="w-full sm:w-auto">Primary CTA</Button>
    <Button size="lg" variant="outline" className="w-full sm:w-auto">Secondary CTA</Button>
  </div>
</section>
```

## Step-by-Step Changes

### 1. Replace `h-screen` with `min-h-dvh`

| Before | After | Why |
|--------|-------|-----|
| `h-screen` | `min-h-dvh` | `dvh` uses dynamic viewport height that accounts for iOS Safari's collapsing address bar. `min-h-` instead of `h-` allows content to grow beyond the viewport if needed (prevents clipping). |

### 2. Convert all `px` padding to Tailwind rem spacing

Use the px-to-rem conversion table to find the right Tailwind class:

| px value | rem equivalent | Tailwind class |
|----------|---------------|----------------|
| 20px | 1.25rem | `p-5` |
| 24px | 1.5rem | `p-6` |
| 32px | 2rem | `p-8` |
| 40px | 2.5rem | `p-10` |
| 48px | 3rem | `p-12` |
| 60px | 3.75rem | `p-[3.75rem]` |
| 80px | 5rem | `p-20` |

Then make padding **responsive** so it scales down on mobile:

```
px-4 sm:px-6 md:px-8 lg:px-12
py-8 sm:py-12 md:py-16 lg:py-20
```

### 3. Make the headline responsive

Replace any fixed `px` font size with Tailwind's rem-based scale that steps up per breakpoint:

```
text-3xl sm:text-4xl md:text-5xl lg:text-6xl
```

This starts at 1.875rem (30px equivalent) on iPhone and scales up to 3.75rem (60px equivalent) on desktop.

### 4. Make the CTA button full-width on mobile

On narrow screens, buttons should stack vertically and span the full width for easy tapping (minimum touch target: 2.75rem / 44px height). On `sm`+ screens, they can sit side-by-side at auto width:

```
<div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:w-auto sm:gap-4">
  <Button size="lg" className="w-full sm:w-auto">CTA</Button>
</div>
```

### 5. Use flexbox centering, not absolute positioning

If your current hero uses `absolute` + `top/left` + `transform` for centering, replace it with:

```
flex flex-col items-center justify-center
```

Flexbox centering does not risk overflow and works reliably across all viewport sizes.

## Global Check: Root Font Size

Verify your global CSS has the correct base font size so all `rem` values scale properly:

```css
html {
  font-size: 100%; /* DO NOT set a fixed px value like 14px */
}
```

If this is set to a fixed `px` value, `rem` units will not scale when users change their browser font size, which violates WCAG 1.4.4.

## Anti-Patterns to Avoid

| Anti-Pattern | Correct |
|-------------|---------|
| `h-screen` on mobile | `min-h-dvh` |
| `p-[20px]` or `px-[60px]` | `p-5` or `px-4 sm:px-6 md:px-8 lg:px-12` |
| `text-[48px]` fixed font | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` |
| `w-[400px]` fixed width | `w-full max-w-[25rem]` |
| Absolute positioning for centering | `flex items-center justify-center` |
| `overflow-hidden` on body to hide the symptom | Fix the actual overflow source |

## Verification Checklist

After applying the fix, test on an actual iPhone (or Safari responsive mode):

- [ ] No horizontal scroll on any breakpoint
- [ ] Hero fills the visible viewport on iPhone (no content hidden behind browser chrome)
- [ ] Headline does not overflow -- it wraps naturally within the padded area
- [ ] CTA button is fully visible and tappable without scrolling sideways
- [ ] CTA touch target is at least 2.75rem (44px) tall
- [ ] Padding feels balanced on iPhone SE (375px), iPhone 14 (390px), and iPad
- [ ] Zero `px` values remain in font-size, margin, padding, gap, or component dimensions
