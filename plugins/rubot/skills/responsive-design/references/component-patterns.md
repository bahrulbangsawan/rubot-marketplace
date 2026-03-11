# Responsive Component Patterns

Detailed code examples for responsive components. Referenced from the main responsive-design SKILL.md.

## Table of Contents

- Hero Section
- Mobile Drawer / Hamburger Menu
- Card Radius Consistency
- Gallery & Bulletin Carousel
- Responsive Navbar
- Responsive Footer

### 1. Hero Section (Mobile Priority)

The hero must fill the full viewport on mobile and remain balanced on larger screens.

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
    Hero Title
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

**Key rules:**
- Use `min-h-dvh` (not `min-h-screen`) on mobile — `dvh` accounts for mobile browser chrome
- Center content with flexbox, not absolute positioning
- CTAs stack vertically on mobile, row on `sm`+
- Prevent overflow — no fixed widths that exceed viewport

### 2. Mobile Drawer / Hamburger Menu

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger — visible only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-[2.5rem] w-[2.5rem]"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-[1.5rem] w-[1.5rem]" />
      </Button>

      <SheetContent side="left" className="w-[80%] max-w-[20rem] p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
            {/* Explicit close button */}
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-[2.5rem] w-[2.5rem]">
                <X className="h-[1.25rem] w-[1.25rem]" />
                <span className="sr-only">Close menu</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <nav className="flex flex-col py-2">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="
                px-4 py-3 text-base font-medium
                text-foreground/80
                hover:bg-accent hover:text-accent-foreground
                focus-visible:bg-accent focus-visible:outline-none
                active:bg-accent/80
                transition-colors
              "
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

**Key rules:**
- Always include a visible close button (X icon) inside the drawer
- Use `rem` for all sizing — drawer width, padding, icon sizes
- Interaction states: `hover:`, `focus-visible:`, `active:` on every menu item
- Font size `text-base` (1rem) minimum for touch readability
- Touch target minimum: `2.75rem` (44px equivalent) height per item

### 3. Card Radius Consistency

Standardize all cards to `10%` corner radius:

```tsx
{/* Consistent card component */}
<Card className="rounded-[10%] overflow-hidden">
  <CardHeader className="p-4 sm:p-6">
    <CardTitle className="text-lg sm:text-xl">Title</CardTitle>
  </CardHeader>
  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
    Content
  </CardContent>
</Card>
```

**To enforce globally**, add to your CSS:

```css
/* Global card radius — applies to all Card variants */
.card,
[data-slot="card"] {
  border-radius: 10%;
  overflow: hidden; /* prevent child content from escaping rounded corners */
}
```

If using shadcn/ui's CSS variables approach:

```css
:root {
  --radius-card: 10%;
}

.card,
[data-slot="card"] {
  border-radius: var(--radius-card);
}
```

### 4. Gallery & Bulletin Carousel (1 Card Per Slide on Mobile)

On mobile, carousels must show exactly 1 full card per slide — no cut-off cards.

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-4 sm:-ml-6">
        {items.map((item) => (
          <CarouselItem
            key={item.id}
            className="
              pl-4 sm:pl-6
              basis-full
              sm:basis-1/2
              lg:basis-1/3
            "
          >
            <Card className="rounded-[10%] overflow-hidden">
              <img
                src={item.image}
                alt={item.alt}
                className="w-full aspect-[4/3] object-cover"
              />
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base font-semibold sm:text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
```

**Key rules:**
- `basis-full` on mobile = 1 card per slide, no cut-off
- `sm:basis-1/2` for 2 cards on small screens
- `lg:basis-1/3` for 3 cards on desktop
- Match negative margin on `CarouselContent` with padding on `CarouselItem`
- Hide prev/next buttons on mobile (use swipe); show on `sm`+
- Card images use `aspect-[4/3]` with `object-cover` — prevents layout shift

### 5. Responsive Navbar

```tsx
<header className="
  sticky top-0 z-50 w-full
  border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
">
  <div className="
    container flex items-center justify-between
    h-[3.5rem] sm:h-[4rem]
    px-4 sm:px-6 lg:px-8
  ">
    {/* Logo */}
    <a href="/" className="text-lg font-bold sm:text-xl">Brand</a>

    {/* Desktop nav — hidden on mobile */}
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => (
        <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          {item.label}
        </a>
      ))}
    </nav>

    {/* Mobile hamburger — visible below md */}
    <MobileNav items={navItems} />
  </div>
</header>
```

### 6. Responsive Footer

```tsx
<footer className="border-t bg-muted/40">
  <div className="
    container
    px-4 py-8
    sm:px-6 sm:py-10
    md:px-8 md:py-12
    lg:px-12
  ">
    <div className="
      grid gap-8
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-4
    ">
      {footerSections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold uppercase tracking-wider">{section.title}</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {section.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
</footer>
```
