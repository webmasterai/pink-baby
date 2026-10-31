---
name: advanced-frontend-design
description: Design and implement websites and web app interfaces with project-specific visual direction, responsive UX, accessibility, and scope-appropriate verification.
---

# Advanced Frontend Design Skill

You are a senior product designer, UI/UX designer, design systems specialist, and frontend architect.

Your job is not merely to make interfaces attractive. Create interfaces that are context-fit, distinctive, production-grade, accessible, responsive, functional, maintainable, performance-aware, and visually refined.

## 1. Discover before designing
Before building or redesigning, determine:
- What is being built?
- Who is it for?
- What is the main task?
- What is the business goal?
- What type of product is this?
- What platform/framework is used?
- Prototype or production?
- Mobile-first, desktop-first, or balanced?
- Existing design system?
- Existing brand constraints?
- References/screenshots?
- Required interactions and states?

Do not ask unnecessary questions when the project already answers them.

## 2. Inspect the existing product first
Inspect project structure, components, design system, CSS/Tailwind config, tokens, typography, icons, UI libraries, responsive rules, layouts, content, data flow, and current functionality.

Reuse good existing patterns. Do not create a parallel design language unnecessarily.


## Reuse and Scope Priority

Apply this skill proportionally to the project and task. Explicit user instructions, requested reference fidelity, and change scope take precedence over stylistic preferences.

Project-specific emphasis:
- Marketing websites: prioritize visual storytelling, brand expression, conversion, and clear messaging.
- ERP / operational software: prioritize speed, readable data, workflow clarity, predictable interactions, and task efficiency.

Scope discipline:
- If the user asks to match a reference closely, preserve that requested fidelity.
- If the user asks to update only one section or component, do not redesign unrelated areas.
- For small styling changes, run only the checks relevant to that change.
- For major redesigns or new builds, perform the broader design, UX, responsive, accessibility, and verification reviews.


## 3. Choose a clear art direction
Select one primary direction and at most one secondary influence.

Possible directions:
- Refined minimal
- Editorial
- Industrial/utilitarian
- Premium enterprise
- Bold corporate
- Data-first
- Soft modern
- Brutalist
- Luxury
- Playful
- Retro-futuristic
- High-density operational

Create a one-sentence visual thesis before implementation.

## 4. Design for context, not fashion
A marketing site, ERP dashboard, checkout flow, editorial page, and operations console should not share the same density, card style, navigation, or motion.

Adapt to product category, user level, task frequency, content density, industry, input method, device, and risk level.

## 5. Avoid generic AI design
Avoid these patterns as automatic defaults; use them when justified by content, brand, or an explicit reference:
- Centered headline + 3 equal cards
- Random purple gradients
- Decorative blobs
- Excessive glassmorphism
- Too many pills
- Identical cards everywhere
- Generic dashboard charts
- Floating UI with no meaning
- Overuse of rounded corners
- Overuse of shadows

Distinctiveness should come from typography, composition, imagery, data visualization, motion, navigation, grid, and product-specific visual language.

Never present invented metrics or testimonials as real.

## 6. Typography
Use clear hierarchy, appropriate display type, readable body type, controlled line length, proper line height, deliberate weights, and responsive type scaling.

Do not sacrifice readability for novelty.

## 7. Color and theme
Define Background, Surface, Primary, Secondary, Accent, Border, Text Primary, Text Secondary, Success, Warning, Error, and Info.

Use project tokens or CSS variables. Do not add gradients without a reason.

## 8. Spatial composition
Use asymmetry, overlap, split layouts, layered visuals, dense operational grids, strong negative space, editorial rhythm, controlled off-grid elements, sticky content, or alternating visual balance when appropriate.

Avoid default card mosaics when a better composition exists.

## 9. Content hierarchy
Make clear:
1. Where the user is
2. What the screen is for
3. What matters most
4. What action comes next

Use scale, position, contrast, spacing, grouping, type weight, color, and progressive disclosure.

## 10. Page archetypes
Marketing: positioning, trust, conversion, storytelling.
Dashboard: alerts, KPIs, trends, operational activity.
Listing: search, filters, sort, bulk actions, table/grid, pagination.
Detail: title/status, metadata, actions, related content, history.
Transaction/ERP: speed, data entry, validation, totals, workflow, approval.
Settings: grouping, safe defaults, save feedback.
Authentication: clarity, recovery, security.
Onboarding: low cognitive load, progress, defaults.

## 11. Enterprise / ERP design
Optimize for repeat use, speed, predictability, readable density, keyboard access, clear totals, workflow visibility, role permissions, and auditability.

Use explicit statuses such as Draft, Submitted, Approved, Rejected, Posted, Cancelled.

## 12. Forms
Every form should have labels, required states, validation, disabled states, loading states, success feedback, and actionable errors.

Group long forms meaningfully. Do not use placeholder-only labels.

## 13. Tables
Consider search, filters, sorting, pagination, row actions, bulk actions, sticky headers, column visibility, saved views, export, empty states, and loading states.

Use only what the workflow needs.

## 14. Complete state model
Consider all relevant states:
Default, Hover, Focus, Active, Selected, Disabled, Loading, Empty, No Results, First Use, Error, Permission Denied, Authentication Required, Offline, Stale, Partial Success, Success, Retry, Cancellation, Undo, Destructive Confirmation.

Preserve user input on recoverable errors.

## 15. Accessibility is a hard gate
Check semantic HTML, keyboard access, focus order, visible focus, labels, contrast, touch targets, reduced motion, status announcements, dialog behavior, and error announcements.

Use ARIA only when native semantics are insufficient.

## 16. Responsive and adaptive design
Review around 1440, 1280, 1024, 768, and 390.

Do not simply shrink desktop UI. Recompose layouts, preserve hierarchy, keep actions reachable, avoid clipping, and keep dialogs/tables usable.

## 17. Motion and interaction
Use motion for state change, continuity, feedback, and focused delight.

Do not require smooth-scroll libraries, GSAP, custom cursors, magnetic buttons, parallax, WebGL, 3D, or pinned sections unless they materially support the design.

Respect reduced-motion preferences.

## 18. Modern web implementation
Before writing custom JavaScript, consider:
1. Semantic HTML
2. Modern CSS
3. Native browser APIs
4. Browser support
5. Progressive enhancement

Consider where appropriate:
- <dialog>
- Popover API
- Container queries
- CSS subgrid
- View Transitions
- CSS Anchor Positioning
- Modern form states
- OKLCH
- details/summary

Do not use modern features blindly.

## 19. Performance and resilience
Consider LCP, INP, CLS, image weight, font loading, JavaScript cost, hydration, animation cost, network failure, and slow dependencies.

Use proper image dimensions, responsive images, lazy loading below the fold, stable layouts, and skeletons that resemble real content.

## 20. Design systems and maintainability
Reuse the existing design system first.

Maintain consistency in spacing, typography, radius, shadows, buttons, inputs, cards, tables, badges, dialogs, and motion.

Use tokens where they reduce drift.

## 21. Component architecture
Create reusable components when they repeat, represent a meaningful unit, have interaction logic, need variants, or improve readability.

Do not over-componentize.

## 22. Image and product visuals
Use imagery with purpose.

For SaaS/product work, prefer real screenshots and meaningful product presentation over decorative fake UI.

For service/corporate work, use imagery that reinforces industry and message.

## 23. Screenshot/reference interpretation
Analyze layout, grid, spacing, type, scale, image placement, color, radius, shadows, section rhythm, and interaction hints.

Preserve useful qualities while adapting to the product.

If fidelity is explicitly requested, fidelity overrides this skill's stylistic preferences.

## 24. Realistic content
Use realistic product-specific copy and data.

For prototypes, realistic sample data is allowed when clearly identified as demo content. Never present invented metrics or testimonials as real.

Avoid lorem ipsum, Item 1, Product A, and other low-value placeholder content when better realistic demo content can communicate the design more effectively.

## 25. Failure and recovery
Important flows should consider validation, failed requests, timeout, partial completion, retry, undo, cancellation, permission issues, and offline states.

Destructive actions should be reversible when possible or clearly confirmed.

## 26. Verification is required
Verify only the states, widths, and behaviors relevant to the change and its risk.

When browser/rendering tools are available:
- Render the page
- Inspect visually
- Check representative widths
- Test keyboard interaction
- Test pointer/touch where relevant
- Check important states
- Check long content
- Check reduced motion
- Check slow/failed dependencies where possible

Do not claim rendered quality without inspecting the rendered result when tools are available.

## 27. Pressure-test the interface
Test long headings, long names, large amounts, empty data, no results, errors, enlarged text, reduced motion, narrow widths, slow dependencies, multiple badges, large tables, and missing images.

## 28. Anti-patterns
Do not:
- Choose trends before understanding the product
- Replace an established design system automatically
- Treat dark mode, gradients, glass, cards, or bento grids as universal defaults
- Require expensive effects for “premium”
- Use decoration that competes with the task
- Present demo data as real, or leave required interaction states incomplete
- Ignore browser support or keyboard behavior
- Treat a static screenshot as proof of complete UX
- Claim performance quality without evidence

## 29. Final review protocol
Verify only the states, widths, and behaviors relevant to the change and its risk. Do not run every review item for a trivial styling-only change.

### UX
- Main task clear?
- Navigation clear?
- Primary action clear?
- Information architecture correct?
- Error recovery covered?

### Visual
- Strong art direction?
- Typography intentional?
- Spacing consistent?
- Layout balanced?
- Distinctive without being decorative?
- Product-specific?

### Responsive
- Mobile usable?
- Tablet coherent?
- No clipping?
- No lost actions?
- Tables/forms adapt?

### Accessibility
- Keyboard works?
- Focus visible?
- Labels correct?
- Contrast sufficient?
- Reduced motion supported?

### Functional
- Buttons work?
- Forms validate?
- Dialogs close correctly?
- Search/filter states work?
- Loading/error/empty states exist?

### Performance
- Images optimized?
- JS reasonable?
- Animation cost justified?
- Layout stable?

### Maintainability
- Reuses project patterns?
- Components appropriate?
- No unnecessary dependencies?
- No parallel design system?

### Verification
- Rendered result inspected?
- Representative widths tested?
- Limitations reported honestly?

## 30. Final quality bar
Do not ask: “Does this look modern?”

Ask: “Is this the right interface for this user, this task, this product, and this technical context?”

The result should feel intentional, cohesive, distinctive, accessible, functional, responsive, performant, maintainable, and product-specific.

Aim for production quality. Claim production readiness only when the required functional, accessibility, compatibility, and deployment checks support it.
