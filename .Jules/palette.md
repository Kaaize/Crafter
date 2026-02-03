## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-26 - Accessible Div Buttons
**Learning:** Icon-only buttons implemented as `div`s are inaccessible by default. They need explicit semantics (`role="button"`, `aria-label`), keyboard focus (`tabindex="0"`), and interaction handlers (Enter/Space keys).
**Action:** When identifying interactive `div`s, always add `role="button"`, `tabindex="0"`, `aria-label`, `title`, and corresponding `keydown` listeners. Ensure a distinct `:focus-visible` style exists.
