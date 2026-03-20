import type { Teacher } from '../types'
import type { TeacherDetail } from '../types/teacher-detail'
import type { TeacherFormValues } from '../schemas/teacher-schema'

/**
 * Transforms a Teacher or TeacherDetail to form values for the edit form
 */
export function teacherToForm(teacher: Teacher | TeacherDetail): Partial<TeacherFormValues> {
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
      department: ('department' in teacher ? (teacher as TeacherDetail).department : '') ?? '',
      joiningDate: ('joiningDate' in teacher ? (teacher as TeacherDetail).joiningDate : '') ?? '',
    },
    professionalInfo: {
      subject: teacher.subject ?? '',
      qualification: ('qualification' in teacher ? (teacher as TeacherDetail).qualification : '') ?? '',
      specialization: ('specialization' in teacher ? (teacher as TeacherDetail).specialization : '') ?? '',
      classAssignments:
        'classAssignments' in teacher && Array.isArray((teacher as TeacherDetail).classAssignments)
          ? (teacher as TeacherDetail).classAssignments.join(', ')
          : '',
    },
    contactInfo: {
      email: teacher.email ?? '',
      primaryPhone: teacher.primaryPhone,
      phoneCountryCode: teacher.phoneCountryCode,
      secondaryPhone: ('secondaryPhone' in teacher ? (teacher as Record<string, string>).secondaryPhone : '') ?? '',
      emergencyPhone: ('emergencyPhone' in teacher ? (teacher as Record<string, string>).emergencyPhone : '') ?? '',
      address: ('address' in teacher ? (teacher as TeacherDetail).address : '') ?? '',
      city: ('city' in teacher ? (teacher as Record<string, string>).city : '') ?? '',
      stateProvince: ('stateProvince' in teacher ? (teacher as Record<string, string>).stateProvince : '') ?? '',
      postalCode: ('postalCode' in teacher ? (teacher as Record<string, string>).postalCode : '') ?? '',
      profilePictureUrl: teacher.profilePictureUrl,
    },
    additionalInfo: {
      bio: ('bio' in teacher ? (teacher as Record<string, string>).bio : '') ?? '',
      specialNeedsTraining: ('specialNeedsTraining' in teacher ? (teacher as Record<string, boolean>).specialNeedsTraining : false) ?? false,
      medicalInfo: ('medicalInfo' in teacher ? (teacher as Record<string, string>).medicalInfo : '') ?? '',
    },
  }
}
