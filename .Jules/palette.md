## 2024-10-25 - Copy Link Feedback Pattern
**Learning:** Users often lack confidence that "Copy Link" buttons actually worked without explicit feedback. Using `navigator.clipboard.writeText()` combined with a temporary text change ("Copied!") and a visual state change (e.g., green background) provides immediate, delightful confirmation.
**Action:** When implementing copy-to-clipboard actions, always include a visual success state that reverts after ~2 seconds. Ensure to handle race conditions if the user clicks multiple times rapidly.

## 2024-11-23 - Modal Focus Management
**Learning:** Simply setting `display: block` for modals traps keyboard users on the trigger element, creating a disjointed experience where they can't access modal content without tabbing through the entire page.
**Action:** Always implement a `openModal` helper that:
1. Stores the trigger element (`document.activeElement`).
2. Moves focus to the first interactive element inside the modal.
3. Listens for `Escape` to close.
4. Restores focus to the trigger on close.
