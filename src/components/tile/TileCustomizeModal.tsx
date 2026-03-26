import { Check, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'

export interface TileOption {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Icon circle background color (from theme tokens) */
  iconBg: string
  /** Icon color (from theme tokens) */
  iconColor: string
  /** Optional description text */
  description?: string
}

interface TileCustomizeModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when open state changes */
  onOpenChange: (open: boolean) => void
  /** All available tile options */
  options: TileOption[]
  /** Currently selected tile IDs */
  selectedIds: string[]
  /** Called when a tile is toggled on/off */
  onToggle: (id: string) => void
  /** Called to reset to defaults */
  onReset: () => void
  /** Maximum number of selections allowed */
  maxSelections: number
  /** Modal title */
  title?: string
}

/**
 * Reusable modal for selecting which tiles to display.
 *
 * Renders a grid of selectable tile option cards with icon, label, and description.
 * Selected tiles show an accent border + checkmark. Disabled when max reached.
 *
 * All colors from theme tokens — no hardcoded values.
 *
 * @example
 * ```tsx
 * <TileCustomizeModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   options={myTileOptions}
 *   selectedIds={selectedIds}
 *   onToggle={toggle}
 *   onReset={reset}
 *   maxSelections={4}
 *   title="Customize Dashboard"
 * />
 * ```
 */
export function TileCustomizeModal({
  open,
  onOpenChange,
  options,
  selectedIds,
  onToggle,
  onReset,
  maxSelections,
  title = 'Customize Tiles',
}: TileCustomizeModalProps) {
  const isMaxed = selectedIds.length >= maxSelections

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle style={{ color: colors.text.heading }}>{title}</DialogTitle>
          <DialogDescription>
            Select up to {maxSelections} tiles to display.{' '}
            <span className="font-medium" style={{ color: colors.text.heading }}>
              {selectedIds.length}/{maxSelections}
            </span>{' '}
            selected.
          </DialogDescription>
        </DialogHeader>

        {/* Tile options grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 overflow-y-auto flex-1"
          style={{ gap: spacing['3'], maxHeight: '50vh', padding: spacing['1.5'] }}
        >
          {options.map(opt => {
            const isSelected = selectedIds.includes(opt.id)
            const isDisabled = !isSelected && isMaxed

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => !isDisabled && onToggle(opt.id)}
                disabled={isDisabled}
                className="relative flex flex-col items-center text-center rounded-lg border-2 transition-all"
                style={{
                  padding: spacing['3'],
                  borderColor: isSelected ? colors.accent.base : colors.border.default,
                  backgroundColor: isSelected ? colors.accent.soft : colors.background.card,
                  opacity: isDisabled ? 0.45 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {/* Checkmark badge */}
                {isSelected && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.text.heading }}
                  >
                    <Check className="w-3 h-3" style={{ color: colors.background.card }} />
                  </div>
                )}

                {/* Icon circle */}
                <div
                  className="flex items-center justify-center rounded-full mb-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: opt.iconBg,
                  }}
                >
                  <opt.icon className="w-5 h-5" style={{ color: opt.iconColor }} />
                </div>

                {/* Label */}
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{ color: colors.text.heading }}
                >
                  {opt.label}
                </span>

                {/* Description */}
                {opt.description && (
                  <span
                    className="text-[10px] leading-tight mt-0.5"
                    style={{ color: colors.text.muted }}
                  >
                    {opt.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
            style={{ color: colors.text.muted }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
          <Button
            onClick={() => onOpenChange(false)}
            className="text-sm"
            style={{
              backgroundColor: colors.text.heading,
              color: colors.background.card,
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
