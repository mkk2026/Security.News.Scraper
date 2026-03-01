## 2025-03-01 - [Add global keyboard shortcut to search]
**Learning:** Adding `aria-keyshortcuts` when implementing global keyboard shortcuts (like `Cmd+K` / `Ctrl+K`) ensures that screen reader users are notified of the shortcut. This is especially important for search inputs. `e.key.toLowerCase()` should be used when listening to keydowns to handle combinations cross-platform properly.
**Action:** When adding global search hotkeys, ensure `aria-keyshortcuts` is added, a visual `kbd` hint is provided that hides when typing, and key events handle case-insensitivity robustly.
