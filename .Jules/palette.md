## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-26 - Retrofitting Accessibility Helper
**Learning:** Reusing the `makeAccessible` helper function from `builder.js` in `crafter.js` proved to be an efficient way to retrofit keyboard accessibility onto legacy non-semantic elements (interactive divs).
**Action:** When encountering similar legacy codebases with interactive `div`s, look for or introduce a standardized `makeAccessible` utility to handle `role`, `tabindex`, `aria-label`, and `keydown` events in one place.
