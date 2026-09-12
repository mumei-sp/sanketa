import { z } from 'zod'
import { AudienceReachSchema } from '@/config/audience'

export const NoticeFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content must be under 5000 characters'),
  category: z.string().min(1, 'Category is required'),
  audience: z.string().min(1, 'Audience is required'),
  /** The machine-readable half — see `config/audience.ts`. */
  reach: AudienceReachSchema,
  status: z.string().min(1, 'Status is required'),
  postDate: z.string().min(1, 'Post date is required'),
  dateLabel: z.string().min(1, 'Please select a date type'),
  dateValue: z.string().min(1, 'Please select a date'),
  dateEndValue: z.string().optional(),
  thumbnail: z.string().min(1, 'Please select or upload an image'),
  pinned: z.boolean().optional(),
}).refine(
  data => !data.dateEndValue || !data.dateValue || data.dateEndValue >= data.dateValue,
  { message: 'End date must be after start date', path: ['dateEndValue'] },
)

export type NoticeFormValues = z.infer<typeof NoticeFormSchema>
