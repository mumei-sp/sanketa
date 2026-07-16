import * as React from 'react'

interface CountUpProps {
  /** Final value to settle on. */
  value: number
  /** Animation length in ms. */
  duration?: number
  /** Formatter for the displayed number. Defaults to en-IN grouping. */
  format?: (n: number) => string
}

const defaultFormat = (n: number) => n.toLocaleString('en-IN')

/**
 * CountUp — eases a number from 0 to `value` on mount (and re-eases from the
 * previous value on change) with an ease-out cubic, matching the dashboard's
 * motion language.
 *
 * Resilient by design: a safety timeout snaps to the final value even if
 * requestAnimationFrame never fires (headless browsers, throttled background
 * tabs), and `prefers-reduced-motion` renders the final value immediately.
 */
export function CountUp({ value, duration = 900, format = defaultFormat }: CountUpProps) {
  const reduceMotion = React.useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const [display, setDisplay] = React.useState(reduceMotion ? value : 0)
  const fromRef = React.useRef(reduceMotion ? value : 0)

  React.useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      fromRef.current = value
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    // Guarantee the real value lands even where rAF is frozen.
    const safety = window.setTimeout(() => {
      setDisplay(value)
      fromRef.current = value
    }, duration + 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(safety)
    }
  }, [value, duration, reduceMotion])

  return <>{format(display)}</>
}
