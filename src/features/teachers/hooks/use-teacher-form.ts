import { useForm, type UseFormReturn, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TeacherSchema, type TeacherFormValues } from '../schemas/teacher-schema'

export interface UseTeacherFormReturn {
  control: UseFormReturn<TeacherFormValues>['control']
  register: UseFormReturn<TeacherFormValues>['register']
  errors: FieldErrors<TeacherFormValues>
  handleSubmit: UseFormReturn<TeacherFormValues>['handleSubmit']
  watch: UseFormReturn<TeacherFormValues>['watch']
  setValue: UseFormReturn<TeacherFormValues>['setValue']
}

export function useTeacherForm(defaultValues?: Partial<TeacherFormValues>): UseTeacherFormReturn {
  const form = useForm<TeacherFormValues>({
    // @ts-expect-error - zodResolver has type issues with z.preprocess, but works correctly at runtime
    resolver: zodResolver(TeacherSchema),
    defaultValues: (defaultValues || {
      personalInfo: {
        firstName: '',
        middleName: '',
        lastName: '',
        preferredName: '',
        dateOfBirth: '',
      },
      employmentInfo: {
        teacherId: '',
        employmentType: 'Full-Time',
        department: '',
        joiningDate: '',
      },
      professionalInfo: {
        subject: '',
        qualification: '',
        specialization: '',
        classAssignments: '',
      },
      contactInfo: {
        email: '',
        primaryPhone: '',
        phoneCountryCode: '+91',
        secondaryPhone: '',
        emergencyPhone: '',
        address: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        profilePictureUrl: '',
      },
      additionalInfo: {
        bio: '',
        specialNeedsTraining: false,
        medicalInfo: '',
      },
    }) as Partial<TeacherFormValues>,
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
