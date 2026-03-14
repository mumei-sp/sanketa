import { ClipboardList } from 'lucide-react'
import { baseColors } from '@/theme/colors'

export function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: baseColors.heading }}>
          Assignments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dashboard / Assignments
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border">
        <ClipboardList className="w-12 h-12 mb-4 opacity-30" style={{ color: baseColors.heading }} />
        <h2 className="text-lg font-semibold" style={{ color: baseColors.heading }}>
          Assignments
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Coming soon
        </p>
      </div>
    </div>
  )
}
