## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2026-02-01 - Icon-Only Button Consistency
**Learning:** For icon-only buttons, `aria-label` provides necessary context for screen readers, but `title` is equally important for sighted users to see tooltips. Omitting `title` creates a gap where users might guess the icon's function.
**Action:** Always pair `aria-label` with `title` for icon-only buttons to ensure universal clarity.
