## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2026-02-12 - Robust Temporary Feedback
**Learning:** When implementing temporary visual feedback (like "Copied!" or "✅"), simple timeouts create race conditions if the user triggers the action rapidly. The original text can be lost or the feedback can get stuck.
**Action:** Always store the original state in a data attribute (e.g., `data-original-text`) and clear any existing timeouts before setting a new one. This ensures the UI always reverts to the correct state, no matter how fast the user clicks.
