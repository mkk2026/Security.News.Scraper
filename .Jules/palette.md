# Palette's Journal

## 2026-02-02 - Accessible Shadcn Forms
**Learning:** Shadcn/ui form components (Input, SelectTrigger) often rely on placeholders which are not accessible labels. When a visible `<label>` is omitted for design reasons, `aria-label` passes through correctly to the underlying elements.
**Action:** Always verify "naked" inputs and selects in this design system have `aria-label` or `aria-labelledby`.
