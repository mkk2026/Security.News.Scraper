# Palette's Journal

## 2026-02-02 - Accessible Shadcn Forms
**Learning:** Shadcn/ui form components (Input, SelectTrigger) often rely on placeholders which are not accessible labels. When a visible `<label>` is omitted for design reasons, `aria-label` passes through correctly to the underlying elements.
**Action:** Always verify "naked" inputs and selects in this design system have `aria-label` or `aria-labelledby`.

## 2026-10-18 - Actionable Empty States
**Learning:** Static empty states (text only) leave users stranded, especially when filters are applied.
**Action:** Enhance empty states with direct actions (e.g., "Clear Filters", "Refresh") using the `Alert` component's description area to house buttons.
