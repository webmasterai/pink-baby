---
name: modern-web-guidance-wrapper
description: Apply modern web platform guidance to frontend work by respecting project constraints first, preferring modern HTML/CSS/browser APIs where appropriate, preserving working components, testing only relevant behavior, and reporting verification evidence honestly.
version: 3.0
---

# Modern Web Guidance Wrapper Skill

Use this skill together with the official Google Chrome Modern Web Guidance package.

This wrapper does not replace Google's guide library. Its role is to help the agent apply modern-web practices consistently while respecting the project's actual requirements, compatibility targets, existing architecture, and risk level.

---

# 1. Project Constraints Come First

Before implementation or modernization, inspect the project.

Understand:
- Framework and version
- Routing/rendering model
- Existing components
- Existing design system
- UI libraries
- CSS/Tailwind setup
- Current dependencies
- Existing accessibility patterns
- Browser support requirements
- Baseline target if defined
- Existing test tools
- Production vs prototype vs legacy context

Project requirements and browser targets are the controlling constraints.

Official Chrome/web.dev guidance, MDN, standards documentation, and project documentation should guide implementation within those constraints.

Do not choose a modern feature in isolation from the actual project.

---

# 2. Prefer the Simplest Modern Solution

Before adding custom JavaScript or a new dependency, check whether the problem can be solved with:

1. Semantic HTML
2. Modern CSS
3. Native browser APIs
4. Progressive enhancement
5. JavaScript only when necessary

Also ask:
- Does the existing component already solve this well?
- Is a replacement worth the regression risk?
- Is a dependency already available?
- Is the bundle/maintenance cost justified?

Modern does not automatically mean better.

Prefer the simplest solution that is accessible, compatible, maintainable, and appropriate for the project.

---

# 3. Use Official Guidance When Relevant

When the official Modern Web Guidance CLI is available, search before implementing unfamiliar, browser-sensitive, or modern-platform patterns.

```bash
npx modern-web-guidance@latest search "<task or feature>"
```

Then retrieve the relevant guide:

```bash
npx modern-web-guidance@latest retrieve "<guide-id>"
```

Use the retrieved guidance as an implementation reference.

If the CLI is unavailable, consult authoritative sources as needed:
- Official Chrome / web.dev guidance
- MDN Web Docs
- Relevant standards documentation
- Project documentation

Always interpret those sources through the project's own requirements and browser targets.

Do not claim that official guidance was checked if it was not.

---

# 4. Browser Compatibility and Progressive Enhancement

Before using a modern feature:

- Respect the project's browser-support target
- Respect its Baseline target if defined
- Prefer broadly interoperable features when no target is defined
- Use progressive enhancement for newer capabilities
- Add fallbacks only where needed
- Avoid unnecessary global polyfills
- Prefer conditional polyfills when truly required

A newer feature should improve the implementation without making core functionality fragile.

---

# 5. Respect Existing Working Components

Do not replace an accessible, tested, working component simply because a newer native alternative exists.

Before replacement, evaluate:
- User-facing benefit
- Accessibility impact
- Browser compatibility
- Regression risk
- Test coverage
- Performance impact
- Maintainability
- Design-system consistency
- Integration complexity

Modernization should improve the product, not merely change the implementation.

---

# 6. Modern HTML and Native UI

Prefer semantic/native elements where appropriate.

Examples:
- `<dialog>`
- `<details>` / `<summary>`
- `<button>`
- `<nav>`
- `<main>`
- `<section>`
- semantic forms
- native links
- meaningful heading structure

For overlays and contextual UI, consider:
- `<dialog>`
- Popover API
- CSS Anchor Positioning

Verify:
- Keyboard access
- Focus behavior
- Escape behavior
- Focus restoration
- Backdrop behavior
- Light-dismiss behavior where appropriate
- Pointer interaction
- Screen-reader behavior
- Reduced-motion behavior

Do not replace a mature accessible component library merely to use a native primitive.

---

# 7. Modern CSS

Consider modern CSS features when they genuinely improve the implementation:

- Container queries
- CSS subgrid
- Logical properties
- `text-wrap`
- OKLCH
- `:user-invalid`
- `:user-valid`
- `field-sizing`
- View Transitions
- CSS Anchor Positioning
- `@starting-style`
- `transition-behavior`

Use them only when:
- They fit project support requirements
- They improve maintainability or UX
- They do not introduce accessibility regressions
- A fallback exists where required

Use container queries when a component should respond to its own available width rather than the full viewport.

---

# 8. Accessibility

Accessibility is mandatory.

Check relevant behavior such as:
- Semantic HTML
- Keyboard navigation
- Focus visibility
- Focus order
- Form labels
- Error announcements
- Contrast
- Touch targets
- Reduced motion
- Accessible media
- Screen-reader states
- Dialog/menu focus behavior

Use ARIA only when native semantics are insufficient.

---

# 9. Forms

Use modern, accessible form patterns.

Prefer:
- Persistent labels
- Correct input types
- Autofill-friendly markup
- Native validation where appropriate
- Clear error messages
- Accessible status feedback
- Correct disabled/loading behavior
- `:user-invalid` / `:user-valid` where supported

Do not rely on placeholder-only labels.

---

# 10. Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Animation must not be necessary to understand or use the interface.

Prefer lightweight CSS/native transitions before adding animation libraries.

Verify reduced-motion behavior when motion is part of the change.

---

# 11. Performance and Core Web Vitals

Consider:
- LCP
- INP
- CLS
- Long main-thread tasks
- Image loading
- Font loading
- JavaScript cost
- Hydration cost
- Rendering cost
- Third-party scripts

Where relevant:
- Split long tasks
- Defer non-urgent work
- Reduce unnecessary rerenders
- Avoid unnecessary client-side JavaScript
- Reserve layout space
- Size images correctly
- Prioritize likely LCP content
- Lazy-load non-critical content

Do not claim Core Web Vitals or performance improvements without measurement.

If metrics were not measured, state what was changed and what remains unverified.

---

# 12. Security-Sensitive Frontend Work

For authentication and sensitive interactions:

- Prefer current browser security capabilities
- Consider passkeys/WebAuthn when appropriate
- Avoid unsafe DOM insertion
- Respect CSP requirements
- Validate untrusted content
- Preserve authentication/authorization boundaries
- Never expose secrets in client-side code

Do not make security changes without understanding the existing architecture.

---

# 13. Legacy Modernization

When updating older frontend code:

- Preserve working behavior
- Understand existing dependencies
- Modernize incrementally
- Replace unnecessary JS with modern HTML/CSS where safe
- Improve semantics
- Improve accessibility
- Improve maintainability
- Keep required fallbacks
- Avoid unrelated rewrites

Regression risk matters more than novelty.

---

# 14. Verification Must Match Scope and Risk

Run checks relevant to the changed behavior and its risk.

Do not run the entire checklist for every small styling change.

Examples:

For a spacing/color-only change:
- Visual regression
- Contrast check if text, background, or focus colors changed
- Responsive overflow if layout changed

For a modal/dialog change:
- Keyboard behavior
- Focus behavior
- Escape
- Backdrop/light dismiss
- Reduced motion
- Relevant browser behavior

For a form change:
- Labels
- Validation
- Error states
- Keyboard flow
- Submission/loading behavior

For a responsive layout change:
- Representative breakpoints
- Overflow
- Touch usability

For a performance-sensitive change:
- Measure the relevant metric when tools are available

When browser/rendering tools are available, verify the actual rendered behavior rather than only reading source code.

---

# 15. Browser Testing

Test only the browsers relevant to the project and the feature changed.

Where practical, verify behavior in:
- Chromium
- Firefox
- Safari/WebKit

Do not claim cross-browser compatibility merely because a feature is standardized.

If a relevant browser could not be tested, state that clearly.

---

# 16. Evidence-Based Final Report

Keep the final report concise and factual.

State:
- What changed
- What was actually verified
- Which relevant widths/browsers/states were checked
- What accessibility behavior was tested
- What performance metrics were measured
- What was not measured
- Any known limitation or fallback

Example:

"Verified responsive behavior at 1440px, 768px, and 390px; keyboard focus and reduced-motion behavior were tested for the updated dialog. No Core Web Vitals measurement was performed, so no performance improvement is claimed."

Do not overclaim with phrases such as:
- "Fully accessible"
- "Performance optimized"
- "Cross-browser compatible"
- "Core Web Vitals improved"
- "Production ready"

unless the relevant evidence actually supports the claim.

---

# 17. Final Decision Check

Before finishing, ask only the checks relevant to the task:

- Were project constraints understood?
- Was the simplest appropriate solution used?
- Was unnecessary JavaScript avoided?
- Were existing working components respected?
- Was browser support considered?
- Was progressive enhancement used where helpful?
- Was accessibility tested where relevant?
- Was rendered behavior actually verified?
- Were performance claims measured rather than assumed?
- Does the final report distinguish verified facts from unverified assumptions?

If an existing implementation is already accessible, stable, compatible, and appropriate, do not replace it merely to make the code look more modern.
