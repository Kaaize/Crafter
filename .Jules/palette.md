## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-26 - Icon-Only Button Accessibility
**Learning:** The application heavily relies on icon-only buttons (emojis, unicode chars like ▲/▼) without text labels. These are invisible to screen readers without explicit attributes.
**Action:** Systematically audit all icon-only buttons and enforce a pattern of pairing `title` (for mouse tooltip) and `aria-label` (for screen reader) on every interactive element.
