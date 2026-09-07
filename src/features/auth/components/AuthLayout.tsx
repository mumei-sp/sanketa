
interface AuthLayoutProps {
  children: React.ReactNode
}

/**
 * AuthLayout - Split layout for authentication pages.
 *
 * Desktop: left form panel + right hero panel (side by side)
 * Tablet/Mobile: hero on top (shorter) + form below (scrollable)
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Hero panel ── */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-10 lg:w-1/2 lg:py-0"
        style={{ backgroundColor: 'var(--heading)' }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-white">Sanketa</span>
          </div>

          {/* Welcome text */}
          <h1 className="mb-2 text-2xl font-bold text-white lg:text-3xl">
            Welcome to Sanketa
          </h1>
          <p className="mb-8 max-w-sm text-sm text-white/70">
            Connect, manage, and grow your school community effortlessly
          </p>

          {/* Dashboard preview card */}
          <div className="hidden w-full max-w-md sm:block">
            <DashboardPreview />
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-white px-6 py-10 lg:items-center lg:py-0">
        {/* my-auto centres the form in the leftover height on a phone without
            clipping its top when the content is taller than the panel. */}
        <div className="my-auto w-full max-w-md lg:my-0">{children}</div>
      </div>
    </div>
  )
}

/**
 * Minimal dashboard preview card for the hero section.
 * Uses CSS only — no screenshot dependency.
 */
function DashboardPreview() {
  return (
    <div className="rounded-xl bg-white/10 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
      {/* Title bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="ml-2 h-2 w-16 rounded-full bg-white/20" />
      </div>

      {/* Stat cards row */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {['#FECCFD', '#CDEAF0', '#FECCFD', '#CDEAF0'].map((color, i) => (
          <div key={i} className="rounded-lg p-2.5" style={{ backgroundColor: `${color}30` }}>
            <div className="mb-1.5 h-1.5 w-6 rounded-full" style={{ backgroundColor: `${color}80` }} />
            <div className="h-3 w-8 rounded" style={{ backgroundColor: `${color}60` }} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-white/5 p-3">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-white/20" />
          <div className="flex items-end gap-1.5">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h * 0.5}px`,
                  backgroundColor: i % 2 === 0 ? '#FECCFD50' : '#CDEAF050',
                }}
              />
            ))}
          </div>
        </div>
        <div className="w-24 rounded-lg bg-white/5 p-3">
          <div className="mb-2 h-1.5 w-10 rounded-full bg-white/20" />
          <div className="mx-auto h-14 w-14 rounded-full border-4 border-[#FECCFD50]" style={{
            borderRightColor: '#CDEAF050',
            borderBottomColor: '#CDEAF050',
          }} />
        </div>
      </div>
    </div>
  )
}
