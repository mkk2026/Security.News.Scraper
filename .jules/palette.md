## 2025-02-28 - Adding keyboard shortcut hints and accessibility for global search

**Learning:** When adding global keyboard shortcuts (e.g., `Cmd+K` to focus search) that attach listeners directly to the document, it's vital to provide visual and semantic indicators directly on the target elements. This app's focus pattern dictates that any visual elements overlaying inputs (like the hint "⌘K") must use `pointer-events-none` so they don't block clicks to the underlying input. Furthermore, to make this available to screen readers natively, the `aria-keyshortcuts` attribute (e.g., `aria-keyshortcuts="Control+K"`) should be attached to the target interactive element (the search input) rather than relying on custom aria announcements. Note: Keyboard event listeners must use `e.key.toLowerCase()` to ensure robust cross-platform case-insensitive handling when modifier keys like shift are active.

**Action:** Whenever implementing document-level keyboard shortcuts for a specific element:
1.  Add `aria-keyshortcuts` to the targeted element.
2.  Provide a visual hint using a `<kbd>` element overlaying the input.
3.  Ensure overlays use `pointer-events-none` and appropriate absolute positioning.
4.  Use `.toLowerCase()` when evaluating `e.key` on KeyboardEvents.
