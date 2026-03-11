# Making `confirm-dialog.tsx` Accessible

Your current implementation using a plain `div` with `z-50` and a backdrop is missing accessibility support. Here is how to make it compliant with WCAG guidelines.

## Updated Component

```tsx
// src/components/confirm-dialog.tsx
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Save previous focus and move focus into dialog on open
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      cancelBtnRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 id="dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p id="dialog-description" className="mt-2 text-sm text-gray-600">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            className="rounded px-4 py-2 border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded px-4 py-2 bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
```

## Usage From Data Table Delete Button

Make sure the delete button has an accessible label:

```tsx
<button
  onClick={() => openConfirmDialog(row.id)}
  aria-label={`Delete ${row.name}`}
>
  <TrashIcon aria-hidden="true" />
</button>
```

Then render the dialog:

```tsx
<ConfirmDialog
  open={isOpen}
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
  title="Delete item?"
  description="This action cannot be undone. The item will be permanently removed."
/>
```

## Key Accessibility Features

1. **`role="alertdialog"` and `aria-modal="true"`** -- tells screen readers this is a modal dialog that requires user action.

2. **`aria-labelledby` and `aria-describedby`** -- connects the dialog title and description so they are announced when the dialog opens.

3. **Focus trap** -- Tab and Shift+Tab cycle through only the buttons inside the dialog, preventing focus from escaping to the page behind it.

4. **Escape to close** -- standard keyboard pattern for dismissing dialogs.

5. **Focus restoration** -- when the dialog closes, focus returns to the element that triggered it (the delete button).

6. **Cancel gets initial focus** -- for destructive actions, the non-destructive option should receive focus first to prevent accidental confirmation.

7. **Screen reader announcements** -- the `alertdialog` role combined with `aria-labelledby` and `aria-describedby` causes screen readers to announce the title and description automatically.

8. **Visible focus indicators** -- `focus:ring-2` provides a visible focus ring for keyboard users.

9. **`aria-hidden="true"` on backdrop** -- prevents screen readers from interacting with the overlay.

10. **`aria-label` on icon-only delete button** -- provides a text alternative since there is no visible button text.
