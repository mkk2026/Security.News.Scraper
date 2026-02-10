# Palette's Journal

## 2026-02-02 - Accessible Shadcn Forms
**Learning:** Shadcn/ui form components (Input, SelectTrigger) often rely on placeholders which are not accessible labels. When a visible `<label>` is omitted for design reasons, `aria-label` passes through correctly to the underlying elements.
**Action:** Always verify "naked" inputs and selects in this design system have `aria-label` or `aria-labelledby`.

## 2026-10-18 - Actionable Empty States
**Learning:** Static empty states (text only) leave users stranded, especially when filters are applied.
**Action:** Enhance empty states with direct actions (e.g., "Clear Filters", "Refresh") using the `Alert` component's description area to house buttons.

## 2026-10-24 - Skip Links for Keyboard Navigation
**Learning:** Single-page applications with sticky headers often trap keyboard users or force repetitive tabbing. A "Skip to main content" link is a critical, invisible-until-needed pattern.
**Action:** Always ensure `layout.tsx` includes a skip link targeting the main content area (`<main id="main-content">`).

## 2026-02-05 - Skeleton Loading States
**Learning:** Replacing text-based loading states (e.g., "Loading analytics...") with layout-mimicking skeletons significantly improves perceived performance and visual continuity.
**Action:** When implementing dashboards or data-heavy views, always create a corresponding `<ComponentSkeleton />` that matches the component's layout structure.

## 2026-10-25 - Context for External Links & Focus Styles
**Learning:** Links opening in new tabs (`target="_blank"`) lack context for screen readers, and custom components often miss focus styles.
**Action:** Add `<span className="sr-only">(opens in new tab)</span>` inside the link and ensure `focus-visible` styles are applied, especially when `outline` is removed.

## 2026-10-26 - Accessible Filter Clearance
**Learning:** Relying solely on empty states to clear filters is insufficient when results are still visible. Users need an immediate way to reset their view without navigating away or triggering a "no results" state.
**Action:** Implement a visible "Clear Filters" button adjacent to filter controls that appears conditionally when filters are active.
