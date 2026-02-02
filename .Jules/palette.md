## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2026-02-02 - Accessibility Verification with Playwright
**Learning:** Using `page.get_by_label()` in Playwright scripts is a robust way to verify not just the presence of elements, but specifically their accessibility. If an element is only findable via `get_by_label`, it guarantees screen reader users can find it too.
**Action:** When adding ARIA labels, always verify using `get_by_label()` selectors rather than generic CSS selectors to double-check the accessibility work.
