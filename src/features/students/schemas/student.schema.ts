import { z } from 'zod'

/**
 * Zod schema for student form validation.
 * Defines validation rules for all student form domains.
 */
export const StudentSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    preferredName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.preprocess(
      val => (val === '' ? undefined : val),
      z
        .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.null(), z.undefined()])
        .optional(),
    ),
  }),
  administration: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    admissionNumber: z.string().optional(),
    admissionDate: z.string().optional(),
    rollNumber: z.string().optional(),
  }),
  academicInfo: z.object({
    gradeLevel: z.string().optional(),
    section: z.string().optional(),
    enrollmentDate: z.string().optional(),
    previousSchool: z.string().min(1, 'Previous school cannot be empty'),
  }),
  contactInfo: z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    primaryPhone: z.string().optional(),
    phoneCountryCode: z.string().optional(),
    address: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }),
  guardianInfo: z.object({
    father: z.object({
      name: z.string().optional(),
      phoneCountryCode: z.string().optional(),
      phone: z.string().optional(),
    }),
    mother: z.object({
      name: z.string().optional(),
      phoneCountryCode: z.string().optional(),
      phone: z.string().optional(),
    }),
    alternativeGuardian: z.object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phoneCountryCode: z.string().optional(),
      phone: z.string().optional(),
    }),
  }),
  additionalInfo: z.object({
    hobbies: z.string().optional(),
    specialNeedsSupport: z.boolean().optional(),
    medicalConditionAlert: z.boolean().optional(),
    medicalInfo: z.string().optional(),
  }),
})

/**
 * Type inferred from StudentSchema for form values.
 */
export type StudentFormValues = z.infer<typeof StudentSchema>
