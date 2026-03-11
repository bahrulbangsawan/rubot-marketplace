# Accessible Component Patterns Reference

## Focus Management Hooks

### useFocusTrap

Traps focus within a container (for custom modals without Radix):

```tsx
import { useEffect, useRef } from 'react';

function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    first?.focus();
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}
```

### useDialogFocus

Restores focus to trigger element when dialog closes:

```tsx
function useDialogFocus(isOpen: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);
}
```

### RouteAnnouncer

Announces route changes to screen readers in TanStack Start:

```tsx
import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export function RouteAnnouncer() {
  const routerState = useRouterState();
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = document.title;
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [routerState.location.pathname]);

  return (
    <div ref={announcerRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only" />
  );
}
```

### useFocusOnRouteChange

```tsx
import { useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';

export function useFocusOnRouteChange() {
  const routerState = useRouterState();
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: false });
  }, [routerState.location.pathname]);
}
```

---

Detailed accessible patterns for React + shadcn/ui + TanStack Start. Use these patterns when implementing or fixing components for WCAG 2.2 AA compliance.

## Table of Contents

1. [Navigation](#navigation)
2. [Dialog / Modal](#dialog--modal)
3. [Dropdown Menu](#dropdown-menu)
4. [Combobox / Autocomplete](#combobox--autocomplete)
5. [Accordion](#accordion)
6. [Alert / Notification](#alert--notification)
7. [Breadcrumb](#breadcrumb)
8. [Pagination](#pagination)
9. [Carousel / Slider](#carousel--slider)
10. [File Upload](#file-upload)
11. [Search](#search)
12. [Loading States](#loading-states)
13. [Data Table (Advanced)](#data-table-advanced)
14. [Disclosure / Collapsible](#disclosure--collapsible)

---

## Navigation

### Responsive Navigation with Mobile Menu

```tsx
function MainNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="Main">
      {/* Mobile menu button */}
      <button
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden min-h-11 min-w-11"
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {/* Desktop nav */}
      <ul className="hidden md:flex" role="list">
        <li><a href="/" aria-current={isHome ? 'page' : undefined}>Home</a></li>
        <li><a href="/about" aria-current={isAbout ? 'page' : undefined}>About</a></li>
        <li><a href="/contact" aria-current={isContact ? 'page' : undefined}>Contact</a></li>
      </ul>

      {/* Mobile nav */}
      <div
        id="mobile-menu"
        className={isOpen ? 'block' : 'hidden'}
        role="dialog"
        aria-label="Mobile navigation"
      >
        <ul role="list">
          <li><a href="/" aria-current={isHome ? 'page' : undefined}>Home</a></li>
          <li><a href="/about" aria-current={isAbout ? 'page' : undefined}>About</a></li>
          <li><a href="/contact" aria-current={isContact ? 'page' : undefined}>Contact</a></li>
        </ul>
      </div>
    </nav>
  );
}
```

Key points:
- `aria-current="page"` marks the current page in navigation
- `aria-expanded` communicates mobile menu state
- `aria-controls` links button to the menu it controls
- Touch target 44px minimum for mobile menu button

---

## Dialog / Modal

shadcn/ui Dialog is built on Radix and handles most accessibility automatically. Here's what it provides and what you need to verify:

**Automatic (via Radix):**
- Focus trap within dialog
- Focus restoration to trigger on close
- Escape to close
- `role="dialog"`, `aria-modal="true"`
- Background inert (pointer/keyboard blocked)

**You must verify:**
- Dialog has `aria-labelledby` (title) and optionally `aria-describedby` (description)
- Close button has accessible name
- Focus moves to first interactive element on open

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile. Click save when done.
      </DialogDescription>
    </DialogHeader>
    {/* First interactive element receives focus */}
    <input autoFocus aria-label="Display name" />
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Alert Dialog (Destructive Actions)

For irreversible actions, use AlertDialog which requires explicit user confirmation:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your
        account and remove your data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Yes, delete my account</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Dropdown Menu

shadcn/ui DropdownMenu handles keyboard navigation, focus management, and ARIA. Verify:

- Menu items are keyboard navigable (arrow keys)
- Enter/Space activates items
- Escape closes menu
- Submenu items accessible via ArrowRight
- Disabled items are `aria-disabled` (not removed from DOM)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="More options">
      <MoreVertical className="h-4 w-4" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem disabled>
      <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Combobox / Autocomplete

The combobox pattern combines a text input with a listbox. This is one of the most complex accessible patterns.

```tsx
function Combobox({ options, onSelect, label }: ComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = 'combobox-listbox';

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (activeIndex >= 0 && filtered[activeIndex]) {
          onSelect(filtered[activeIndex]);
          setIsOpen(false);
          setQuery(filtered[activeIndex].label);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  return (
    <div>
      <label htmlFor="combo-input">{label}</label>
      <input
        id="combo-input"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />

      {isOpen && filtered.length > 0 && (
        <ul id={listboxId} role="listbox" aria-label={label}>
          {filtered.map((option, index) => (
            <li
              key={option.value}
              id={`option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => {
                onSelect(option);
                setQuery(option.label);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className="sr-only">
        {isOpen && `${filtered.length} results available`}
      </div>
    </div>
  );
}
```

---

## Accordion

```tsx
function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id}>
          <h3>
            <button
              aria-expanded={openIndex === index}
              aria-controls={`panel-${item.id}`}
              id={`header-${item.id}`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left"
            >
              {item.title}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </h3>
          <div
            id={`panel-${item.id}`}
            role="region"
            aria-labelledby={`header-${item.id}`}
            hidden={openIndex !== index}
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Alert / Notification

### Inline Alert

```tsx
function Alert({ type, title, message }: AlertProps) {
  const icons = {
    error: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
    warning: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
    success: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
    info: <Info className="h-5 w-5" aria-hidden="true" />,
  };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={alertStyles[type]}
    >
      {icons[type]}
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
```

---

## Breadcrumb

```tsx
function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

---

## Pagination

```tsx
function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center gap-1">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={page === currentPage ? 'bg-primary text-primary-foreground' : ''}
            >
              {page}
            </button>
          </li>
        ))}

        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <div aria-live="polite" className="sr-only">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
}
```

---

## Carousel / Slider

```tsx
function Carousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section aria-roledescription="carousel" aria-label="Featured content">
      {/* Pause/play control for auto-advancing carousels */}
      {isPlaying !== undefined && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
      )}

      <div
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${current + 1} of ${slides.length}`}
      >
        {slides[current].content}
      </div>

      <button
        onClick={() => setCurrent(prev => (prev - 1 + slides.length) % slides.length)}
        aria-label="Previous slide"
        className="min-h-11 min-w-11"
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <button
        onClick={() => setCurrent(prev => (prev + 1) % slides.length)}
        aria-label="Next slide"
        className="min-h-11 min-w-11"
      >
        <ChevronRight aria-hidden="true" />
      </button>

      {/* Slide indicators */}
      <div role="tablist" aria-label="Slide controls">
        {slides.map((_, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === current}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrent(index)}
            className="min-h-6 min-w-6"
          />
        ))}
      </div>

      <div aria-live="polite" className="sr-only">
        Slide {current + 1} of {slides.length}: {slides[current].title}
      </div>
    </section>
  );
}
```

---

## File Upload

```tsx
function FileUpload({ label, accept, onUpload }: FileUploadProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label htmlFor="file-upload">{label}</label>

      {/* Styled button that triggers hidden file input */}
      <button
        onClick={() => inputRef.current?.click()}
        aria-describedby="file-upload-desc"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Choose file
      </button>

      <input
        ref={inputRef}
        id="file-upload"
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFileName(file.name);
            setStatus('uploading');
            onUpload(file)
              .then(() => setStatus('success'))
              .catch(() => setStatus('error'));
          }
        }}
        aria-describedby="file-upload-desc"
      />

      <p id="file-upload-desc" className="text-sm text-muted-foreground">
        Accepted formats: {accept}. Maximum size: 10MB.
      </p>

      <div role="status" aria-live="polite">
        {status === 'uploading' && `Uploading ${fileName}...`}
        {status === 'success' && `${fileName} uploaded successfully.`}
        {status === 'error' && `Failed to upload ${fileName}. Please try again.`}
      </div>
    </div>
  );
}
```

---

## Search

```tsx
function SearchField() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <search role="search" aria-label="Site search">
      <label htmlFor="site-search" className="sr-only">Search</label>
      <input
        id="site-search"
        type="search"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby="search-status"
      />

      <div id="search-status" role="status" aria-live="polite" className="sr-only">
        {isSearching
          ? 'Searching...'
          : results.length > 0
            ? `${results.length} results found`
            : query.length > 0
              ? 'No results found'
              : ''
        }
      </div>

      {results.length > 0 && (
        <ul aria-label="Search results">
          {results.map(result => (
            <li key={result.id}>
              <a href={result.url}>
                <strong>{result.title}</strong>
                <p>{result.excerpt}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </search>
  );
}
```

---

## Loading States

```tsx
{/* Skeleton loader — hide from screen readers, announce loading state */}
<div aria-busy="true" aria-label="Loading content">
  <div className="animate-pulse" aria-hidden="true">
    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
    <div className="h-4 bg-muted rounded w-1/2" />
  </div>
  <span className="sr-only">Loading...</span>
</div>

{/* Spinner */}
<div role="status">
  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
  <span className="sr-only">Loading...</span>
</div>

{/* Progress bar */}
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
>
  <div className="h-2 bg-primary" style={{ width: `${progress}%` }} />
  <span className="sr-only">{progress}% complete</span>
</div>
```

---

## Data Table (Advanced)

Full-featured accessible data table with sorting, filtering, and pagination:

```tsx
function DataTable({ columns, data, caption }: DataTableProps) {
  return (
    <div>
      {/* Table description for screen readers */}
      <table aria-describedby="table-summary">
        <caption id="table-summary" className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.id}
                scope="col"
                aria-sort={col.sorted ? (col.sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {col.sortable ? (
                  <button
                    onClick={col.onSort}
                    aria-label={`Sort by ${col.header}${col.sorted ? `, currently ${col.sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                  >
                    {col.header}
                    <ArrowUpDown className="h-4 w-4 ml-1" aria-hidden="true" />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              {columns.map(col => (
                <td key={col.id}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Row count announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Showing {data.length} rows
      </div>
    </div>
  );
}
```

---

## Disclosure / Collapsible

```tsx
function Disclosure({ title, children, defaultOpen = false }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `disclosure-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div>
      <button
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex items-center justify-between"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div id={contentId} hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}
```
