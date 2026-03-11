Implement this design section by section (in order), based on the Figma references below.
Use Figma MCP to read and extract design context from each Figma node link.

Critical rules (non-negotiable):
1. The implementation MUST follow the Figma design 100% — pixel-perfect accuracy for layout, spacing, typography, colors, and component structure.
2. Create a complete design system FIRST before building any page sections:
   - font families and typography scale
   - color tokens (primary, secondary, neutral, semantic, etc.)
   - spacing scale
   - border radius, shadows, and elevation tokens
   - reusable component library (buttons, cards, badges, section headers, etc.)
3. Use proper folder structure and file organization following best practices:
   - separate folders for components, tokens/theme, layouts, sections, pages, assets, and utilities
   - co-locate related files (component + styles + types together)
   - use clear, scalable naming conventions
4. NO HARDCODED VALUES — all sizes, colors, fonts, spacing, and radii must use design tokens or theme variables. Zero exceptions.
5. MUST be fully responsive across all 4 breakpoints (xs, sm, md, lg).
6. MUST support SSR (Server-Side Rendering) — ensure all components and pages render correctly on the server.
7. MUST follow SEO best practices:
   - semantic HTML structure
   - proper heading hierarchy
   - meta tags, Open Graph tags, and structured data where applicable
   - accessible, crawlable content
8. Use Figma MCP tools to extract design context, screenshots, tokens, and component structure from each Figma node.

Core requirements:
1. Build each section one by one, following the provided Figma node link.
2. Keep the original copywriting/text content exactly as shown in the design.
3. For all images/illustrations, use placeholders (do not use final assets yet).
4. Maintain consistent spacing, typography, and component styling across sections.
5. Make sure each section is responsive and integrates cleanly with the others.

Responsive requirements (must follow 4 breakpoints):
1. Extra Small (xs): 0px - 575px
2. Small (sm): 576px - 767px
3. Medium (md): 768px - 991px
4. Large (lg): 992px and above
5. Ensure layouts, typography, spacing, and components adapt correctly across all 4 breakpoints.
6. Avoid overflow, cut-off content, broken alignment, or inconsistent spacing at any breakpoint.

Design system requirements:
1. Use color tokens only (no hardcoded colors in components/sections).
2. Create and use reusable components for repeated UI patterns (buttons, cards, section headers, badges, etc.).
3. Keep component variants and states consistent (default, hover, active, focus, disabled where applicable).
4. Use scalable naming conventions for tokens and reusable components.

Sections to implement:
1. Navbar:
[FIGMA LINK HERE]

2. Hero:
[FIGMA LINK HERE]

3. Stats:
[FIGMA LINK HERE]

4. Features:
[FIGMA LINK HERE]

5. Products:
[FIGMA LINK HERE]

6. Testimonial:
[FIGMA LINK HERE]

7. CTA:
[FIGMA LINK HERE]

8. Footer:
[FIGMA LINK HERE]

Implementation order:
1. Extract design context from all Figma nodes using Figma MCP.
2. Set up design system (tokens, theme, typography, color palette, spacing scale).
3. Set up folder structure and base project scaffolding.
4. Build reusable components identified from the design.
5. Implement each section in sequence (Navbar → Hero → Stats → Features → Products → Testimonial → CTA → Footer).
6. Verify responsive behavior across all 4 breakpoints after each section.
7. Final integration and full-page QA.

Output expectation:
1. Complete design system (tokens, typography, colors, spacing, components).
2. Well-organized folder structure following best practices.
3. Each section implemented in sequence with 100% Figma design fidelity.
4. Fully responsive across xs/sm/md/lg.
5. SSR-compatible and SEO-ready.
6. Reusable components/tokens ready for future section/page reuse.
