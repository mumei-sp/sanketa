/**
 * Arc-style dual color picker — two handles on a 2D hue/lightness plane with
 * a conic-rainbow frame and a dot-grid background.
 *
 * Adapted from Cuicui's arc-color-picker (MIT) to emit two independent HEX
 * values instead of a single `hsla()`, and stripped of the StaticNoise /
 * DotsPattern deps in favour of inline CSS.
 *
 * x-axis = hue (0–360°), y-axis = lightness (top 95% → bottom 20%), with
 * saturation pinned at 62% to keep picked colors within the brand's soft
 * band.
 */

import * as React from 'react'
import { Lightbulb, SlidersHorizontal, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Color math (local, dep-free)
// ============================================================================

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let hue = 0
  switch (max) {
    case r: hue = ((g - b) / d + (g < b ? 6 : 0)); break
    case g: hue = ((b - r) / d + 2); break
    case b: hue = ((r - g) / d + 4); break
  }
  return [hue * 60, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60)      [r, g, b] = [c, x, 0]
  else if (h < 120)[r, g, b] = [x, c, 0]
  else if (h < 180)[r, g, b] = [0, c, x]
  else if (h < 240)[r, g, b] = [0, x, c]
  else if (h < 300)[r, g, b] = [x, 0, c]
  else             [r, g, b] = [c, 0, x]
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Top of plane = l 0.95, bottom = l 0.20 */
function yFromLightness(l: number): number {
  return 1 - (l - 0.2) / 0.75
}
function lightnessFromY(y: number): number {
  return 0.95 - y * 0.75
}

/** Saturation band per handle — primary stays soft, heading stays saturated. */
const SATURATION = {
  primary: 0.62,
  heading: 0.55,
}

// ============================================================================
// Types
// ============================================================================

export type HandleKey = 'primary' | 'heading'

interface Position {
  x: number
  y: number
}

export interface ArcColorPickerProps {
  primary: string
  heading: string
  onChange: (patch: { primary?: string; heading?: string }) => void
  /** Called when the lightbulb (invert) button is pressed. */
  onInvert?: () => void
  /** Called when the sliders (advanced) button is pressed. */
  onAdvanced?: () => void
  /** Called when the ban (reset) button is pressed. */
  onReset?: () => void
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ArcColorPicker({
  primary,
  heading,
  onChange,
  onInvert,
  onAdvanced,
  onReset,
  className,
}: ArcColorPickerProps) {
  const planeRef = React.useRef<HTMLDivElement>(null)
  const activeHandle = React.useRef<HandleKey | null>(null)

  const primaryPos = React.useMemo<Position>(() => {
    const [h, , l] = hexToHsl(primary)
    return { x: h / 360, y: yFromLightness(l) }
  }, [primary])

  const headingPos = React.useMemo<Position>(() => {
    const [h, , l] = hexToHsl(heading)
    return { x: h / 360, y: yFromLightness(l) }
  }, [heading])

  const moveHandle = React.useCallback(
    (clientX: number, clientY: number) => {
      const plane = planeRef.current
      const handle = activeHandle.current
      if (!plane || !handle) return
      const rect = plane.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      const hue = x * 360
      const l = lightnessFromY(y)
      const s = SATURATION[handle]
      const hex = hslToHex(hue, s, l)
      onChange(handle === 'primary' ? { primary: hex } : { heading: hex })
    },
    [onChange],
  )

  React.useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!activeHandle.current) return
      const point = 'touches' in e ? e.touches[0] : e
      moveHandle(point.clientX, point.clientY)
    }
    const onUp = () => {
      activeHandle.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [moveHandle])

  const startDrag = (handle: HandleKey) => (
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    e.preventDefault()
    activeHandle.current = handle
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-3 shadow-sm flex flex-col gap-3 border',
        className,
      )}
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        width: '260px',
      }}
    >
      {/* Dot-grid plane with conic rainbow frame */}
      <div className="relative w-full aspect-square p-[7px] rounded-xl arc-picker-frame">
        <div
          ref={planeRef}
          role="application"
          aria-label="Theme color plane"
          className="relative w-full h-full rounded-lg overflow-hidden cursor-crosshair"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage:
              'radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        >
          <Handle
            position={primaryPos}
            color={primary}
            ariaLabel="Primary color handle"
            onMouseDown={startDrag('primary')}
            onTouchStart={startDrag('primary')}
          />
          <Handle
            position={headingPos}
            color={heading}
            ariaLabel="Heading color handle"
            onMouseDown={startDrag('heading')}
            onTouchStart={startDrag('heading')}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="grid grid-cols-3 gap-1.5">
        <ActionButton
          label="Invert lightness"
          onClick={onInvert}
          active
        >
          <Lightbulb size={13} strokeWidth={1.75} />
        </ActionButton>
        <ActionButton label="Advanced" onClick={onAdvanced}>
          <SlidersHorizontal size={13} strokeWidth={1.75} />
        </ActionButton>
        <ActionButton label="Reset" onClick={onReset}>
          <Ban size={13} strokeWidth={1.75} />
        </ActionButton>
      </div>
    </div>
  )
}

// ============================================================================
// Handle
// ============================================================================

function Handle({
  position,
  color,
  ariaLabel,
  onMouseDown,
  onTouchStart,
}: {
  position: Position
  color: string
  ariaLabel: string
  onMouseDown: (e: React.MouseEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
}) {
  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="absolute size-7 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md border-[2.5px] border-white transition-transform hover:scale-110"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        backgroundColor: color,
      }}
    />
  )
}

// ============================================================================
// ActionButton
// ============================================================================

function ActionButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'h-9 rounded-lg flex items-center justify-center transition-colors border',
        active
          ? 'text-white border-transparent'
          : 'hover:bg-[color:var(--secondary)]',
      )}
      style={
        active
          ? { backgroundColor: 'var(--heading)', borderColor: 'var(--heading)' }
          : { backgroundColor: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
      }
    >
      {children}
    </button>
  )
}
