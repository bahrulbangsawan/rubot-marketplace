# Fix: Hero Section Overflow on iPhone

The horizontal overflow on your hero section is caused by two things: `h-screen` not working correctly on mobile Safari, and fixed `px` padding values that create elements wider than the viewport.

## Problem 1: `h-screen` on Mobile

`h-screen` translates to `100vh`, but on iOS Safari, `100vh` includes the area behind the browser's address bar and bottom toolbar. This means your hero is taller than the visible area, which can push content (like your CTA button) out of view.

**Fix:** Replace `h-screen` with `min-h-[100dvh]` or Tailwind's `min-h-dvh` (if using Tailwind v3.4+). The `dvh` unit (dynamic viewport height) adjusts for the browser chrome on mobile.

```tsx
// Before
<section className="h-screen ...">

// After
<section className="min-h-dvh ...">
```

Using `min-h-` instead of `h-` also allows content to expand beyond the viewport height if it needs to, preventing clipping.

## Problem 2: Fixed px Padding

If your hero has padding like `p-[60px]` or `px-[80px]`, those fixed pixel values eat into the available width. On an iPhone (375px wide), `padding: 0 60px` leaves only 255px for content. The headline and button cannot fit and overflow.

**Fix:** Replace px-based padding with responsive Tailwind spacing classes:

```tsx
// Before
<section className="h-screen px-[60px] py-[80px]">

// After
<section className="min-h-dvh px-4 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16 lg:px-16 lg:py-20">
```

This uses small padding on mobile and progressively increases it for larger screens.

## Problem 3: Headline Font Size

If the headline is using a large fixed font size, it may not wrap properly on narrow screens. Use responsive font sizing:

```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center">
  Your Headline
</h1>
```

## Problem 4: CTA Button Width

The CTA button might have a fixed width or padding that exceeds the screen. Make it full-width on mobile:

```tsx
<div className="flex flex-col gap-3 w-full sm:flex-row sm:w-auto">
  <Button className="w-full sm:w-auto">Get Started</Button>
</div>
```

## Full Example

```tsx
<section className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16">
  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center">
    Your Headline
  </h1>
  <p className="mt-4 text-base sm:text-lg text-center max-w-2xl">
    Description text
  </p>
  <div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:w-auto">
    <Button className="w-full sm:w-auto">Get Started</Button>
  </div>
</section>
```

## Testing

After making these changes, test on:
- iPhone Safari (or use Chrome DevTools responsive mode set to 375px width)
- Verify there is no horizontal scrollbar
- Verify the CTA button is fully visible without sideways scrolling
- Verify the hero fills the visible screen area correctly
