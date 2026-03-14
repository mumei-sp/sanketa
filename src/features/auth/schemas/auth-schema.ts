import { z } from 'zod'

const PHONE_REGEX = /^\+?\d[\d\s-]{6,14}\d$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Login form validation schema.
 * Accepts email OR phone number as the identifier field.
 */
export const LoginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone number is required')
    .superRefine((val, ctx) => {
      const trimmed = val.trim()
      const looksLikePhone = /^\+?\d/.test(trimmed)

      if (looksLikePhone) {
        if (!PHONE_REGEX.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please enter a valid phone number',
          })
        }
      } else {
        if (!EMAIL_REGEX.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please enter a valid email address',
          })
        }
      }
    }),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormValues = z.infer<typeof LoginSchema>

/**
 * Register form validation schema
 */
export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be less than 100 characters'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    phoneCountryCode: z.string().optional(),
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\d{7,15}$/, 'Please enter a valid phone number'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms & Conditions' }),
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof RegisterSchema>
