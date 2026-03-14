import {
  GraduationCap,
  PartyPopper,
  DollarSign,
  Shield,
  CalendarDays,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { baseColors, withOpacity } from '@/theme/colors'
import { useIsMobile } from '@/hooks/use-mobile'
import { categoryConfig, allCategories } from '../utils/category-config'
import type { CalendarEvent, EventCategory } from '../types'

interface CalendarCategoryTabsProps {
  events: CalendarEvent[]
  selectedCategory: EventCategory | 'all'
  onCategoryChange: (category: EventCategory | 'all') => void
}

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  PartyPopper,
  DollarSign,
  Shield,
}

interface TabItem {
  key: EventCategory | 'all'
  label: string
  count: number
  icon: LucideIcon
  bgColor: string
  borderColor: string
  iconBgColor: string
  iconColor: string
}

export function CalendarCategoryTabs({
  events,
  selectedCategory,
  onCategoryChange,
}: CalendarCategoryTabsProps) {
  const isMobile = useIsMobile()

  const tabs: TabItem[] = [
    {
      key: 'all',
      label: 'All Schedules',
      count: events.length,
      icon: CalendarDays,
      bgColor: baseColors.blue,
      borderColor: baseColors.heading,
      iconBgColor: baseColors.blue,
      iconColor: baseColors.heading,
    },
    ...allCategories.map(cat => {
      const config = categoryConfig[cat]
      const isFinance = cat === 'Finance'
      return {
        key: cat as EventCategory,
        label: config.label,
        count: events.filter(e => e.extendedProps.category === cat).length,
        icon: iconMap[config.iconName] || CalendarDays,
        bgColor: config.backgroundColor,
        borderColor: config.borderColor,
        iconBgColor: isFinance ? baseColors.heading : config.backgroundColor,
        iconColor: isFinance ? '#FFFFFF' : baseColors.heading,
      }
    }),
  ]

  if (isMobile) {
    const [allTab, ...categoryTabs] = tabs
    const AllIcon = allTab.icon
    const allActive = selectedCategory === allTab.key
    return (
      <div className="space-y-3">
        {/* All Schedules - full width */}
        <button
          type="button"
          onClick={() => onCategoryChange(allTab.key)}
          className={cn(
            'flex items-center justify-between p-3 rounded-xl border transition-all w-full',
            allActive
              ? 'border-current shadow-sm'
              : 'border-border bg-white hover:shadow-sm',
          )}
          style={allActive ? { borderColor: allTab.borderColor, backgroundColor: allTab.bgColor + '30' } : undefined}
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-xs font-medium text-muted-foreground">{allTab.label}</span>
            <span className="text-lg font-bold" style={{ color: baseColors.heading }}>
              {allTab.count}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: allTab.iconBgColor }}
          >
            <AllIcon className="w-4.5 h-4.5" style={{ color: allTab.iconColor }} />
          </div>
        </button>

        {/* Category cards - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {categoryTabs.map(tab => {
            const Icon = tab.icon
            const isActive = selectedCategory === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onCategoryChange(tab.key)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all',
                  isActive
                    ? 'border-current shadow-sm'
                    : 'border-border bg-white hover:shadow-sm',
                )}
                style={isActive ? { borderColor: tab.borderColor, backgroundColor: tab.bgColor + '30' } : undefined}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{tab.label}</span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: baseColors.heading }}
                  >
                    {tab.count}
                  </span>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: tab.iconBgColor }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: tab.iconColor }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Desktop: full-width card tabs
  return (
    <div className="flex items-stretch gap-3 w-full">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = selectedCategory === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onCategoryChange(tab.key)}
            className={cn(
              'flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all',
              isActive
                ? 'shadow-sm'
                : 'border-border bg-white hover:shadow-sm',
            )}
            style={
              isActive
                ? { borderColor: tab.borderColor, backgroundColor: withOpacity(tab.bgColor, 0.2) }
                : undefined
            }
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{ backgroundColor: tab.iconBgColor, width: 28, height: 28, minWidth: 28 }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: tab.iconColor }} />
            </div>
            <span
              className="text-xs font-medium text-muted-foreground whitespace-nowrap"
              style={isActive ? { color: baseColors.heading } : undefined}
            >
              {tab.label}
            </span>
            <span
              className="ml-auto text-base font-bold"
              style={{ color: baseColors.heading }}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
