/**
 * FormSheet — the single container for every create/edit form in the app.
 *
 * Before this existed, "add a record" opened three different things depending
 * on which table you were looking at: a right-hand Sheet at 640px (route,
 * vehicle, driver), a full-bleed Sheet (notice, calendar event), or a centred
 * Dialog at 540px (assign student, fee structure, the student detail forms).
 * Same job, three surfaces.
 *
 * The rule this settles on:
 *
 *   - Create or edit a record  → FormSheet (right-hand panel)
 *   - Confirm or destroy       → Dialog / AlertDialog (centred, small)
 *   - Read a record's details  → Sheet directly (e.g. FeeStudentPanel)
 *
 * A right-hand panel is the better home for a form: it is full height, so long
 * forms scroll naturally instead of fighting a centred box's max-height, and on
 * a phone it is effectively full-screen. The header and footer stay pinned so
 * Save is always reachable.
 *
 * @example
 * ```tsx
 * <FormSheet
 *   open={open}
 *   onOpenChange={onOpenChange}
 *   title={isEdit ? 'Edit Assignment' : 'Assign Student'}
 *   onSubmit={form.handleSubmit(onSubmit)}
 *   submitLabel={isEdit ? 'Update' : 'Assign'}
 * >
 *   <FormSection title="Student Details" width={12}>…</FormSection>
 * </FormSheet>
 * ```
 */

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  type SheetSize,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Panel heading, e.g. "Add Route" / "Edit Route". */
  title: string
  /** Optional line under the title explaining the form. */
  description?: string
  /** The form body — normally a stack of `FormSection`s. */
  children: React.ReactNode
  /**
   * Submit handler. When given, the body is wrapped in a `<form>` and the
   * footer's confirm button submits it. Omit for panels that manage their own
   * actions via `footer`.
   */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  /** Confirm button text. */
  submitLabel?: string
  /** Cancel button text. */
  cancelLabel?: string
  /** Disables the confirm button (e.g. while saving). */
  isSubmitting?: boolean
  /** Replaces the default Cancel/Confirm pair entirely. */
  footer?: React.ReactNode
  /**
   * Panel width from `sm` up. Defaults to `lg`; use `xl` for forms with
   * side-by-side field groups, `2xl` for ones that embed a table.
   */
  size?: SheetSize
  className?: string
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  footer,
  size = 'lg',
  className,
}: FormSheetProps) {
  const body = (
    <>
      {/* Only this region scrolls, so the title and the actions stay put. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">{children}</div>
      </div>

      {/* Actions split the width evenly on a phone, where the panel is
          full-screen and there is no page behind it to dismiss against. */}
      <div className="flex items-center justify-end gap-2 border-t px-6 py-4 max-md:[&>*]:flex-1 pb-[max(env(safe-area-inset-bottom),1rem)] md:pb-4">
        {footer ?? (
          <>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button
              type={onSubmit ? 'submit' : 'button'}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-foreground"
            >
              {submitLabel}
            </Button>
          </>
        )}
      </div>
    </>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size={size}
        className={cn('flex flex-col gap-0 p-0', className)}
        // Radix warns when a dialog has no description. Take its documented
        // opt-out rather than shipping an sr-only copy of the title, which a
        // screen reader would then announce twice. When a description IS given,
        // leave the prop alone so Radix wires it up.
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <SheetHeader className="border-b px-6 py-4 pr-16 pt-[max(env(safe-area-inset-top),1rem)]">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            {body}
          </form>
        ) : (
          body
        )}
      </SheetContent>
    </Sheet>
  )
}
