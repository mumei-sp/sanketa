import { z } from 'zod'

export const TeacherSchema = z.object({
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
  employmentInfo: z.object({
    teacherId: z.string().min(1, 'Teacher ID is required'),
    employmentType: z.string().min(1, 'Employment type is required'),
    department: z.string().min(1, 'Department is required'),
    joiningDate: z.string().optional(),
  }),
  professionalInfo: z.object({
    subject: z.string().min(1, 'Subject is required'),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    classAssignments: z.string().optional(),
  }),
  contactInfo: z.object({
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
    primaryPhone: z.string().optional(),
    phoneCountryCode: z.string().optional(),
    secondaryPhone: z.string().optional(),
    emergencyPhone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    stateProvince: z.string().optional(),
    postalCode: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }),
  additionalInfo: z.object({
    bio: z.string().optional(),
    specialNeedsTraining: z.boolean().optional(),
    medicalInfo: z.string().optional(),
  }),
})

export type TeacherFormValues = z.infer<typeof TeacherSchema>
