# WCAG 2.2 Level AA Success Criteria — Complete Reference

This file contains the full list of WCAG 2.2 Level AA success criteria with testing techniques and common failures. Use this as a lookup table during audits.

## Table of Contents

1. [Perceivable (1.x)](#perceivable)
2. [Operable (2.x)](#operable)
3. [Understandable (3.x)](#understandable)
4. [Robust (4.x)](#robust)

---

## Perceivable

### 1.1.1 Non-text Content (Level A)

**Requirement:** All non-text content has a text alternative that serves the equivalent purpose.

**Test:**
- Every `<img>` has an `alt` attribute
- Informative images have descriptive alt text
- Decorative images have `alt=""`
- Icon-only buttons have `aria-label`
- SVGs have `role="img"` and `aria-label`
- CSS background images that convey information have text alternatives

**Common failures:**
- Missing alt attribute entirely
- Generic alt like "image" or "photo"
- Alt text that repeats adjacent text
- Decorative images with non-empty alt

### 1.2.1 Audio-only and Video-only (Prerecorded) (Level A)

**Requirement:** Provide transcript for audio-only, or transcript/audio description for video-only.

**Test:** Check all `<audio>` and `<video>` elements for associated transcripts.

### 1.2.2 Captions (Prerecorded) (Level A)

**Requirement:** Captions for all prerecorded audio content in synchronized media.

**Test:** Check `<video>` elements for `<track kind="captions">`.

### 1.2.3 Audio Description or Media Alternative (Level A)

**Requirement:** Audio description or text alternative for prerecorded video.

### 1.2.4 Captions (Live) (Level AA)

**Requirement:** Captions for all live audio content in synchronized media.

### 1.2.5 Audio Description (Prerecorded) (Level AA)

**Requirement:** Audio description for all prerecorded video content.

### 1.3.1 Info and Relationships (Level A)

**Requirement:** Information, structure, and relationships conveyed through presentation can be programmatically determined.

**Test:**
- Headings use `<h1>`-`<h6>` (not styled `<div>` or `<span>`)
- Lists use `<ul>`, `<ol>`, `<dl>`
- Tables use `<th>`, `<caption>`, `scope`
- Form inputs have associated `<label>`
- Related form fields grouped with `<fieldset>` and `<legend>`
- Content regions use landmark elements

**Common failures:**
- Using `<b>` instead of `<strong>` for important text
- Using `<br>` for visual spacing instead of CSS
- Tables used for layout
- Heading levels chosen for visual size, not structure

### 1.3.2 Meaningful Sequence (Level A)

**Requirement:** When content sequence affects meaning, correct reading sequence can be programmatically determined.

**Test:** DOM order matches visual order. CSS `order`, `float`, or `position` doesn't rearrange meaningful content.

### 1.3.3 Sensory Characteristics (Level A)

**Requirement:** Instructions don't rely solely on shape, color, size, visual location, orientation, or sound.

**Common failures:**
- "Click the green button"
- "See the sidebar on the right"
- "The round icon"

### 1.3.4 Orientation (Level AA)

**Requirement:** Content not restricted to a single display orientation unless essential.

**Test:** No CSS or JS forces landscape/portrait only. Check for `orientation: portrait` in CSS.

### 1.3.5 Identify Input Purpose (Level AA)

**Requirement:** Input fields collecting user data have programmatically determined purpose.

**Test:** User data inputs (name, email, phone, address) have `autocomplete` attributes:
```
autocomplete="name"
autocomplete="email"
autocomplete="tel"
autocomplete="street-address"
autocomplete="postal-code"
autocomplete="cc-number"
autocomplete="username"
autocomplete="current-password"
autocomplete="new-password"
```

### 1.4.1 Use of Color (Level A)

**Requirement:** Color is not used as the only visual means of conveying information.

**Test:**
- Form errors indicated by more than red text
- Links distinguishable from surrounding text by more than color (underline, bold)
- Chart data has patterns/labels, not just colors
- Status indicators use icons + text + color

### 1.4.2 Audio Control (Level A)

**Requirement:** Auto-playing audio > 3 seconds can be paused, stopped, or volume controlled.

### 1.4.3 Contrast (Minimum) (Level AA)

**Requirement:**
- Normal text: 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): 3:1 contrast ratio

**Test:** Use Chrome DevTools contrast checker, or axe-core. Check text against its background.

**Common failures:**
- Placeholder text with insufficient contrast
- Light gray text on white background
- Text over images without overlay

### 1.4.4 Resize Text (Level AA)

**Requirement:** Text can be resized up to 200% without assistive technology, without loss of content or functionality.

**Test:** Zoom browser to 200%. No text truncated, no overlap, all functionality works.

### 1.4.5 Images of Text (Level AA)

**Requirement:** Use real text instead of images of text (except logos).

### 1.4.10 Reflow (Level AA)

**Requirement:** Content can be presented without loss at 320px width (for vertical scrolling) without horizontal scrolling.

**Test:** Set viewport to 320px width. No horizontal scrollbar, no content hidden.

**Common failures:**
- Fixed-width containers
- Wide tables without responsive handling
- Absolutely positioned elements overflowing

### 1.4.11 Non-text Contrast (Level AA)

**Requirement:** 3:1 contrast ratio for:
- UI component boundaries (input borders, button borders)
- Graphical objects (icons, chart elements)
- Focus indicators
- Custom checkboxes/radio buttons

### 1.4.12 Text Spacing (Level AA)

**Requirement:** No loss of content when user overrides:
- Line height to 1.5x font size
- Paragraph spacing to 2x font size
- Letter spacing to 0.12x font size
- Word spacing to 0.16x font size

**Test:** Apply text spacing overrides via bookmarklet or browser extension.

### 1.4.13 Content on Hover or Focus (Level AA)

**Requirement:** Hover/focus-triggered content is:
- **Dismissible** (Escape closes it)
- **Hoverable** (user can move pointer to it without it disappearing)
- **Persistent** (stays visible until user dismisses, or trigger loses hover/focus)

**Applies to:** Tooltips, dropdown menus, popovers.

---

## Operable

### 2.1.1 Keyboard (Level A)

**Requirement:** All functionality available via keyboard.

**Test:** Tab through entire page. Every interactive element reachable and operable with keyboard only.

**Common failures:**
- `onClick` on `<div>` without keyboard handler
- Custom dropdowns not operable with arrows
- Drag-and-drop without keyboard alternative

### 2.1.2 No Keyboard Trap (Level A)

**Requirement:** Focus can always be moved away from any component using keyboard.

**Test:** Tab through all components. Focus never gets stuck. Escape closes overlays.

### 2.1.4 Character Key Shortcuts (Level A)

**Requirement:** Single-character shortcuts can be turned off, remapped, or only active on focus.

### 2.2.1 Timing Adjustable (Level A)

**Requirement:** Time limits can be turned off, adjusted, or extended (20-second warning).

**Common failures:**
- Session timeout without warning
- Auto-advancing carousels without pause control

### 2.2.2 Pause, Stop, Hide (Level A)

**Requirement:** Moving, blinking, scrolling, or auto-updating content can be paused, stopped, or hidden.

**Applies to:** Carousels, news tickers, auto-refreshing content, animations.

### 2.3.1 Three Flashes or Below Threshold (Level A)

**Requirement:** Nothing flashes more than 3 times per second.

### 2.4.1 Bypass Blocks (Level A)

**Requirement:** Mechanism to skip repeated blocks of content.

**Test:** First Tab press reveals "Skip to main content" link that jumps to `#main-content`.

### 2.4.2 Page Titled (Level A)

**Requirement:** Pages have titles that describe topic or purpose.

**Test:** Each route has a unique, descriptive `<title>`. Format: "Page Name | Section | Site Name".

### 2.4.3 Focus Order (Level A)

**Requirement:** Focus order preserves meaning and operability.

**Test:** Tab order follows logical reading order. No `tabindex` > 0.

### 2.4.4 Link Purpose (In Context) (Level A)

**Requirement:** Purpose of each link determinable from link text alone or link text + context.

**Common failures:**
- "Click here", "Read more", "Learn more" without context
- Image links without alt text

### 2.4.5 Multiple Ways (Level AA)

**Requirement:** More than one way to locate a page (navigation, search, sitemap, table of contents).

### 2.4.6 Headings and Labels (Level AA)

**Requirement:** Headings and labels describe topic or purpose.

### 2.4.7 Focus Visible (Level AA)

**Requirement:** Keyboard focus indicator is visible on all interactive elements.

**Test:** Tab through page — every focused element has a clearly visible indicator (ring, outline, etc.).

**Common failures:**
- `outline: none` without replacement focus style
- Focus indicator only visible on some elements
- Low-contrast focus indicators

### 2.4.11 Focus Not Obscured (Minimum) (Level AA) — NEW in 2.2

**Requirement:** Focused element is not entirely hidden by other content (sticky headers, modals, banners).

**Test:** Tab through page with sticky header/footer. Focused element never fully behind sticky content.

### 2.5.1 Pointer Gestures (Level A)

**Requirement:** Multipoint or path-based gestures have single-pointer alternative.

**Applies to:** Pinch-zoom, swipe, multi-finger gestures.

### 2.5.2 Pointer Cancellation (Level A)

**Requirement:** Functions triggered by down-event can be aborted or undone. Prefer up-event triggers.

### 2.5.3 Label in Name (Level A)

**Requirement:** Visible label text is included in the accessible name.

**Common failures:**
- `aria-label="Submit form"` on a button that says "Submit"
- Icon button with `aria-label` that doesn't match tooltip text

### 2.5.4 Motion Actuation (Level A)

**Requirement:** Motion-triggered actions (shake, tilt) have conventional UI alternative and can be disabled.

### 2.5.7 Dragging Movements (Level AA) — NEW in 2.2

**Requirement:** Dragging operations have single-pointer alternative (click, tap).

**Applies to:** Drag-and-drop reordering, resizable panels, sliders.

### 2.5.8 Target Size (Minimum) (Level AA) — NEW in 2.2

**Requirement:** Interactive targets are at least 24x24 CSS pixels, unless:
- Spacing: undersized target has 24px offset from other targets
- Equivalent: another control on the page meets size requirement
- Inline: target is in a sentence or text block
- User agent: size determined by user agent, not modified

**Test:** Measure interactive element dimensions. Icon buttons, close buttons, small links are common failures.

---

## Understandable

### 3.1.1 Language of Page (Level A)

**Requirement:** Default human language of page is programmatically determinable.

**Test:** `<html lang="en">` (or appropriate language code) is present.

### 3.1.2 Language of Parts (Level AA)

**Requirement:** Language of each passage or phrase that differs from page language is programmatically determinable.

**Test:** Content in other languages has `lang` attribute: `<span lang="fr">Bonjour</span>`.

### 3.2.1 On Focus (Level A)

**Requirement:** Receiving focus does not trigger a change of context.

**Common failures:**
- Form submits when field receives focus
- Page navigates when element is focused
- New window opens on focus

### 3.2.2 On Input (Level A)

**Requirement:** Changing a form control setting does not automatically cause a change of context unless user is warned.

**Common failures:**
- Selecting a dropdown option navigates to new page
- Checking a checkbox submits the form

### 3.2.3 Consistent Navigation (Level AA)

**Requirement:** Navigation mechanisms repeated across pages occur in same relative order.

### 3.2.4 Consistent Identification (Level AA)

**Requirement:** Components with same functionality are identified consistently.

### 3.2.6 Consistent Help (Level AA) — NEW in 2.2

**Requirement:** Help mechanisms (contact info, chat, FAQ links) appear in same relative position across pages.

### 3.3.1 Error Identification (Level A)

**Requirement:** Input errors automatically detected are described to user in text.

**Test:**
- Error messages describe what went wrong
- Error messages identify the field
- Errors aren't communicated by color alone

### 3.3.2 Labels or Instructions (Level A)

**Requirement:** Labels or instructions provided when content requires user input.

**Test:**
- All inputs have visible labels
- Required fields indicated (visually + programmatically)
- Expected format described (e.g., "MM/DD/YYYY")

### 3.3.3 Error Suggestion (Level AA)

**Requirement:** If error is detected and suggestions are known, provide them.

**Example:** "Email address is invalid. Please enter an address like name@example.com."

### 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)

**Requirement:** For legal/financial submissions: reversible, checked, or confirmed.

**Test:** Delete actions have confirmation. Financial forms have review step.

### 3.3.7 Redundant Entry (Level A) — NEW in 2.2

**Requirement:** Information previously entered or provided is auto-populated or selectable, not re-entered.

**Test:** Multi-step forms don't ask for the same data twice (e.g., shipping and billing address).

### 3.3.8 Accessible Authentication (Minimum) (Level AA) — NEW in 2.2

**Requirement:** No cognitive function test (e.g., remembering a password, solving a puzzle) required for authentication, unless:
- Alternative method available
- Mechanism assists the user (password manager support, copy-paste allowed)

**Test:**
- Login form allows paste in password field
- CAPTCHA has accessible alternative
- 2FA doesn't require memorizing codes (allows paste)

---

## Robust

### 4.1.2 Name, Role, Value (Level A)

**Requirement:** All UI components have accessible name and role. States, properties, and values can be programmatically set and notified.

**Test:**
- Custom controls have ARIA roles
- All interactive elements have accessible names
- Toggle states exposed (`aria-expanded`, `aria-pressed`, `aria-checked`)
- Selected states exposed (`aria-selected`, `aria-current`)

### 4.1.3 Status Messages (Level AA)

**Requirement:** Status messages presented to user can be programmatically determined through role or properties, without receiving focus.

**Test:**
- Success/error messages use `role="status"` or `role="alert"`
- Search result counts announced via `aria-live`
- Loading states communicated (`aria-busy`, progress)
- Form submission confirmation announced

**Common failures:**
- Visual-only feedback (color change, icon swap) without ARIA
- Toast notifications without live region
- Shopping cart count updates silently
