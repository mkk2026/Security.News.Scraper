# Palette's Journal

## 2024-05-23 - Keyboard Shortcut Accessibility
**Learning:** Adding a visual hint for a keyboard shortcut (Cmd+K) improves usability for sighted users, but screen reader users might miss it unless `aria-keyshortcuts` is explicitly set on the interactive element.
**Action:** Always pair visual keyboard hints with `aria-keyshortcuts` attribute on the target element to ensure full accessibility.
