## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-26 - Standard Accessibility Helper Pattern
**Learning:** Legacy components often use `div`s for interaction. The `makeAccessible(element, label)` helper (setting role='button', tabindex='0', keydown='Enter/Space') is the established pattern to fix this without rewriting HTML structure.
**Action:** Reuse this helper for any future interactive `div` or `span` elements.
