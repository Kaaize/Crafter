## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-10-25 - Retrofitting Accessibility on Legacy Maps
**Learning:** Legacy map tools often use icon-only buttons (zoom, pan, layers) without accessibility labels, making them unusable for screen readers. Retrofitting these is a high-impact "micro-UX" win.
**Action:** Always scan for `onclick` handlers on buttons without text content. Add `aria-label` describing the action (e.g., "Zoom In", "Floor Up"). Don't forget dynamic elements created in JS!
