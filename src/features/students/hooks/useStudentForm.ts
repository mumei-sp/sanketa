import { useForm, type UseFormReturn, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { StudentSchema, type StudentFormValues } from '../schemas/student.schema'

/**
 * Hook return type for useStudentForm
 */
export interface UseStudentFormReturn {
  control: UseFormReturn<StudentFormValues>['control']
  register: UseFormReturn<StudentFormValues>['register']
  errors: FieldErrors<StudentFormValues>
  handleSubmit: UseFormReturn<StudentFormValues>['handleSubmit']
  watch: UseFormReturn<StudentFormValues>['watch']
  setValue: UseFormReturn<StudentFormValues>['setValue']
}

/**
 * Headless form controller hook for student form.
 * Initializes React Hook Form with Zod validation.
 *
 * @param defaultValues - Optional default values for form initialization
 * @returns Form control, register, errors, handleSubmit, and watch functions
 */
export function useStudentForm(defaultValues?: Partial<StudentFormValues>): UseStudentFormReturn {
  const form = useForm<StudentFormValues>({
    // @ts-expect-error - zodResolver has type issues with z.preprocess, but works correctly at runtime
    resolver: zodResolver(StudentSchema),
    defaultValues: (defaultValues || {
      personalInfo: {
        firstName: '',
        middleName: '',
        lastName: '',
        preferredName: '',
        dateOfBirth: '',
      },
      administration: {
        studentId: '',
        admissionNumber: '',
        admissionDate: '',
        rollNumber: '',
      },
      academicInfo: {
        gradeLevel: '',
        section: '',
        enrollmentDate: '',
        previousSchool: 'N/A',
      },
      contactInfo: {
        email: '',
        primaryPhone: '',
        phoneCountryCode: '+91',
        address: '',
        profilePictureUrl: '',
      },
      guardianInfo: {
        father: {
          name: '',
          phoneCountryCode: '+91',
          phone: '',
        },
        mother: {
          name: '',
          phoneCountryCode: '+91',
          phone: '',
        },
        alternativeGuardian: {
          name: '',
          relation: '',
          phoneCountryCode: '+91',
          phone: '',
        },
      },
      additionalInfo: {
        hobbies: '',
        specialNeedsSupport: false,
        medicalConditionAlert: true,
        medicalInfo: '',
      },
    }) as Partial<StudentFormValues>,
  })

  return {
    // @ts-expect-error - Type mismatch due to z.preprocess in schema, but works correctly at runtime
    control: form.control,
    register: form.register,
    errors: form.formState.errors,
    // @ts-expect-error - Type mismatch due to z.preprocess in schema, but works correctly at runtime
    handleSubmit: form.handleSubmit,
    watch: form.watch,
    setValue: form.setValue,
  }
}