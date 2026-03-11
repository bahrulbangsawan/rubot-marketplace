# Making `confirm-dialog.tsx` Fully Accessible

Your current `<div>` + `z-50` + backdrop approach is missing every critical accessibility requirement for a dialog. Since this is a confirm dialog triggered by a destructive delete action, the correct pattern is an **Alert Dialog** (`role="alertdialog"`), which is semantically stronger than a regular dialog -- it signals to assistive technology that the user must respond before proceeding.

Here is the full replacement for `src/components/confirm-dialog.tsx`:

```tsx
// src/components/confirm-dialog.tsx
import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Accessible confirm dialog for destructive actions.
 *
 * WCAG 2.2 AA compliance:
 * - role="alertdialog" + aria-modal="true" (4.1.2 Name, Role, Value)
 * - aria-labelledby / aria-describedby (4.1.2)
 * - Focus trap with Tab/Shift+Tab cycling (2.1.1 Keyboard, 2.1.2 No Keyboard Trap)
 * - Escape to close (2.1.1 Keyboard)
 * - Focus restoration to trigger element on close (2.4.3 Focus Order)
 * - Backdrop blocks pointer interaction with inert content
 * - Visible focus indicators (2.4.7 Focus Visible)
 * - Screen reader announcement on open (4.1.3 Status Messages)
 */
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
  const triggerRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Save the trigger element when dialog opens, restore focus when it closes
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Focus the cancel button (safe default for destructive dialogs)
      // Slight delay to ensure the dialog is rendered
      requestAnimationFrame(() => {
        cancelButtonRef.current?.focus();
      });
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  // Focus trap: cycle Tab/Shift+Tab within the dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onCancel]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop -- blocks pointer interaction, not focusable */}
      <div
        className="fixed inset-0 z-50 bg-black/80"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onKeyDown={handleKeyDown}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg focus:outline-none"
        tabIndex={-1}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold leading-none tracking-tight"
        >
          {title}
        </h2>

        <p
          id="confirm-dialog-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={onCancel}
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
```

## Changes to Your Data Table Delete Button

The delete button in your data table rows needs to properly trigger this dialog and provide an accessible name. Update the trigger button:

```tsx
// In your data table row actions column
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    setItemToDelete(row.original);
    setIsConfirmOpen(true);
  }}
  aria-label={`Delete ${row.original.name}`}
  className="min-h-6 min-w-6 focus-visible:ring-2 focus-visible:ring-ring"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

Then use the dialog at the table level:

```tsx
<ConfirmDialog
  open={isConfirmOpen}
  onConfirm={() => {
    handleDelete(itemToDelete);
    setIsConfirmOpen(false);
  }}
  onCancel={() => setIsConfirmOpen(false)}
  title="Are you sure?"
  description={`This will permanently delete "${itemToDelete?.name}". This action cannot be undone.`}
  confirmLabel="Delete"
  cancelLabel="Cancel"
/>
```

## What Each Fix Addresses

| Feature | WCAG Criterion | What It Does |
|---|---|---|
| `role="alertdialog"` | 4.1.2 Name, Role, Value | Tells screen readers this is a confirmation dialog requiring a response |
| `aria-modal="true"` | 4.1.2 | Signals that content behind the dialog is inert |
| `aria-labelledby` / `aria-describedby` | 4.1.2 | Screen reader announces the title and description when the dialog opens |
| Focus trap (Tab/Shift+Tab cycling) | 2.1.1 Keyboard, 2.1.2 No Keyboard Trap | Keyboard users cannot tab out of the dialog but can still interact with all its controls |
| Escape to close | 2.1.1 Keyboard | Standard keyboard dismissal pattern users expect |
| Focus restoration to trigger | 2.4.3 Focus Order | After closing, focus returns to the delete button that opened it |
| Cancel button gets initial focus | 2.4.3 Focus Order | Safe default for destructive actions -- prevents accidental deletion |
| `aria-label` on icon-only delete button | 4.1.2 Name, Role, Value | Screen reader announces "Delete [item name]" instead of nothing |
| `aria-hidden="true"` on trash icon | 1.1.1 Non-text Content | Prevents screen reader from announcing the SVG path data |
| Visible focus ring (`focus-visible:ring-2`) | 2.4.7 Focus Visible | Keyboard users can see which button is focused |
| Minimum target size `min-h-6 min-w-6` | 2.5.8 Target Size | Delete button meets 24x24px minimum |
| Backdrop `aria-hidden="true"` | 4.1.2 | Screen reader ignores the backdrop overlay |

## Important Implementation Notes

1. **Focus the cancel button, not the confirm button.** For destructive actions, the safe choice should receive initial focus. This prevents accidental deletion if the user hits Enter reflexively.

2. **Use `role="alertdialog"` instead of `role="dialog"`.** Alert dialogs tell assistive technology that the user must acknowledge the content before continuing. Regular dialogs are for non-critical interactions. Since this is a delete confirmation, alertdialog is the correct role.

3. **The live region announcement happens automatically.** When a dialog with `aria-labelledby` and `aria-describedby` opens and receives focus, screen readers announce the title and description. You do not need a separate `aria-live` region.

4. **Consider using shadcn/ui AlertDialog instead.** If you are already using shadcn/ui in the project, `AlertDialog` (built on Radix) handles focus trapping, focus restoration, Escape to close, and all ARIA attributes automatically. You would replace the entire custom component:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// In the data table row:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${row.original.name}`}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "{row.original.name}". This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => handleDelete(row.original)}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

This is the recommended approach because Radix handles edge cases (portal mounting, scroll locking, nested dialogs, outside click) that are easy to get wrong in a custom implementation. The custom implementation above is provided in case you need to stay with your own component for other reasons.

## Verification Checklist

Before shipping, verify these manually:

- [ ] **Tab** cycles only between Cancel and Delete buttons while dialog is open
- [ ] **Shift+Tab** cycles in reverse
- [ ] **Escape** closes the dialog and returns focus to the delete button that triggered it
- [ ] **Screen reader** (VoiceOver: Cmd+F5 on macOS) announces the title and description when dialog opens
- [ ] **Cancel button** receives focus when dialog opens (not the Delete button)
- [ ] **Clicking backdrop** closes the dialog
- [ ] **Focus ring** is visible on both buttons when focused via keyboard
- [ ] **Delete button** in table row announces "Delete [item name]" to screen reader
