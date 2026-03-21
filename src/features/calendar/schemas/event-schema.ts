import { z } from 'zod'

export const EVENT_CATEGORIES = [
  { value: 'Academic', label: 'Academic' },
  { value: 'Events', label: 'Events' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Administration', label: 'Administration' },
] as const

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

export const REMINDER_OPTIONS = [
  { value: 'none', label: 'No Reminder' },
  { value: '5min', label: '5 minutes before' },
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hr', label: '1 hour before' },
  { value: '1day', label: '1 day before' },
] as const

export const EventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(2000, 'Description must be under 2000 characters').optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  isAllDay: z.boolean().default(false),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  location: z.string().max(200).optional().or(z.literal('')),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  attendees: z.string().max(500).optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  reminder: z.enum(['none', '5min', '15min', '30min', '1hr', '1day']).default('none'),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional().or(z.literal('')),
}).refine(
  data => {
    if (!data.isAllDay && !data.startTime) return false
    return true
  },
  { message: 'Start time is required', path: ['startTime'] },
).refine(
  data => {
    if (!data.isAllDay && data.startTime && data.endTime && data.endTime <= data.startTime) {
      return false
    }
    return true
  },
  { message: 'End time must be after start time', path: ['endTime'] },
)

export type EventFormValues = z.infer<typeof EventFormSchema>
