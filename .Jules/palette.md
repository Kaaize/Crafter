## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-26 - Sticky Copy Pattern
**Learning:** Users struggle to copy rapidly changing data (like mouse coordinates). Implementing a "Sticky" behavior (pausing updates on hover of the display area) combined with "Click to Copy" transforms a frustration into a feature.
**Action:** When displaying real-time data, always consider how a user might want to capture a specific value. Add pause-on-hover and click-to-copy handlers.
