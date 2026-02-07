## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-26 - Keyboard Accessibility Helper Pattern
**Learning:** The `makeAccessible` helper function is a robust pattern for converting non-interactive elements (divs, imgs) into keyboard-accessible buttons across multiple tools (`builder.js`, `crafter.js`). It handles `tabindex`, `role`, `aria-label`, and `keydown` events consistently.
**Action:** Reuse this pattern when auditing other legacy tools that use divs for interaction instead of rewriting HTML structure completely.
