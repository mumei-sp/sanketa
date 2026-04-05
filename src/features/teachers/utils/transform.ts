import type { Teacher } from '../types'
import type { TeacherDetail } from '../types/teacher-detail'
import type { TeacherFormValues } from '../schemas/teacher-schema'

/**
 * Transforms form values to flat Teacher structure for API submission
 */
export function formToTeacher(formValues: TeacherFormValues): Partial<Teacher> {
  return {
    firstName: formValues.personalInfo?.firstName,
    middleName: formValues.personalInfo?.middleName,
    lastName: formValues.personalInfo?.lastName,
    preferredName: formValues.personalInfo?.preferredName,
    dateOfBirth: formValues.personalInfo?.dateOfBirth,
    gender: formValues.personalInfo?.gender ?? undefined,

    teacherId: formValues.employmentInfo?.teacherId,
    subject: formValues.professionalInfo?.subject,
    email: formValues.contactInfo?.email,
    primaryPhone: formValues.contactInfo?.primaryPhone,
    profilePictureUrl: formValues.contactInfo?.profilePictureUrl,
  } as Partial<Teacher>
}

/**
 * Transforms a Teacher or TeacherDetail to form values for the edit form
 */
export function teacherToForm(teacher: Teacher | TeacherDetail): Partial<TeacherFormValues> {
  const t = teacher as any
  return {
    personalInfo: {
      firstName: teacher.firstName ?? '',
      middleName: teacher.middleName,
      lastName: teacher.lastName ?? '',
      preferredName: teacher.preferredName,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender ?? undefined,
    },
    employmentInfo: {
      teacherId: teacher.teacherId ?? '',
      employmentType: ('employmentType' in teacher ? teacher.employmentType : 'Full-Time') ?? 'Full-Time',
      department: (t.department ?? '') as string,
      joiningDate: (t.joiningDate ?? '') as string,
    },
    professionalInfo: {
      subject: teacher.subject ?? '',
      qualification: (t.qualification ?? '') as string,
      specialization: (t.specialization ?? '') as string,
      classAssignments:
        'classAssignments' in teacher && Array.isArray((teacher as TeacherDetail).classAssignments)
          ? (teacher as TeacherDetail).classAssignments?.join(', ') ?? ''
          : '',
    },
    contactInfo: {
      email: teacher.email ?? '',
      primaryPhone: teacher.primaryPhone,
      phoneCountryCode: t.phoneCountryCode,
      secondaryPhone: (t.secondaryPhone ?? '') as string,
      emergencyPhone: (t.emergencyPhone ?? '') as string,
      address: ('address' in teacher ? (teacher as TeacherDetail).address : '') ?? '',
      city: (t.city ?? '') as string,
      stateProvince: (t.stateProvince ?? '') as string,
      postalCode: (t.postalCode ?? '') as string,
      profilePictureUrl: teacher.profilePictureUrl,
    },
    additionalInfo: {
      bio: (t.bio ?? '') as string,
      specialNeedsTraining: (t.specialNeedsTraining ?? false) as boolean,
      medicalInfo: (t.medicalInfo ?? '') as string,
    },
  }
}
