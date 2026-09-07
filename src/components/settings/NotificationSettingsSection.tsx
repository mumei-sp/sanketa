/**
 * NotificationSettingsSection — which categories reach the bell.
 *
 * One switch per category. Event-level control ("mute substitutions but keep
 * timetable edits") is a preference page nobody finishes reading, and a school
 * admin thinks in areas, not event names.
 *
 * Only in-app delivery appears here. Email and push belong in this list too,
 * but neither can be honoured without a backend that sends them, and a switch
 * that silently does nothing is worse than an absent one — so the note at the
 * foot says so rather than the UI implying otherwise.
 *
 * Muting hides a category; it does not delete anything. Turning one back on
 * restores its history immediately, because the filter is applied when the
 * feed is read rather than when it is stored.
 */

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { border, text } from '@/theme/colors'
import {
  getCategoryIcon,
  getCategoryLabel,
} from '@/features/notifications/utils/notification-display'
import type { NotificationCategory } from '@/features/notifications/types'
import type { SchoolConfig } from '@/config/school-config'

interface NotificationSettingsSectionProps {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

/** Listed in the order they matter to someone running a school day. */
const CATEGORIES: { id: NotificationCategory; description: string }[] = [
  { id: 'attendance', description: 'Registers submitted and edited' },
  { id: 'grades', description: 'Drafts saved and results submitted' },
  { id: 'finance', description: 'Payments recorded and expenses logged' },
  { id: 'notices', description: 'Notices published, pinned or removed' },
  { id: 'people', description: 'Enrolments, promotions and new staff' },
  { id: 'timetable', description: 'Schedule changes, substitutions and events' },
  { id: 'system', description: 'Configuration changes' },
]

export function NotificationSettingsSection({
  draft,
  setDraft,
}: NotificationSettingsSectionProps) {
  const categories = draft.notifications.categories

  const toggle = (id: NotificationCategory, enabled: boolean) => {
    setDraft(current => ({
      ...current,
      notifications: {
        ...current.notifications,
        categories: { ...current.notifications.categories, [id]: enabled },
      },
    }))
  }

  const mutedCount = CATEGORIES.filter(category => categories[category.id] === false).length

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-section-title" style={{ color: 'var(--heading)' }}>
          In-app notifications
        </h3>
        <p className="text-body-muted text-muted-foreground mt-1">
          Choose what reaches the bell.
          {mutedCount > 0 && ` ${mutedCount} muted.`}
        </p>
      </div>

      <div className="flex flex-col rounded-lg border" style={{ borderColor: border.default }}>
        {CATEGORIES.map((category, index) => {
          const Icon = getCategoryIcon(category.id)
          // Absent means enabled, so a category added after this config was
          // written is on rather than silently muted.
          const enabled = categories[category.id] !== false
          const switchId = `notify-${category.id}`

          return (
            <div
              key={category.id}
              className="flex items-center gap-3 px-3 py-3"
              style={
                index > 0 ? { borderTop: `1px solid ${border.default}` } : undefined
              }
            >
              <Icon className="size-4 shrink-0" style={{ color: text.muted }} aria-hidden />
              <div className="min-w-0 flex-1">
                <Label htmlFor={switchId} className="cursor-pointer text-body font-medium">
                  {getCategoryLabel(category.id)}
                </Label>
                <p className="text-caption text-muted-foreground">{category.description}</p>
              </div>
              <Switch
                id={switchId}
                checked={enabled}
                onCheckedChange={value => toggle(category.id, value)}
                aria-label={`${getCategoryLabel(category.id)} notifications`}
              />
            </div>
          )
        })}
      </div>

      <p className="text-caption text-muted-foreground">
        Email and push delivery need a backend to send them, so they are not offered yet.
      </p>
    </div>
  )
}
