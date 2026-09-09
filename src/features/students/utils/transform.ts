import type { Student } from '../types'
import type { StudentFormValues } from '../schemas/student-schema'
import type { ParentOfStudent } from '@/api/services/parent-service'
import { splitPhone } from '@/utils/format'

/**
 * Transforms nested form structure to flat Student structure
 * Converts StudentFormValues (nested) to Student (flat)
 */
export function formToStudent(formValues: StudentFormValues): Partial<Student> {
  const student: Partial<Student> = {
    // Personal Information
    firstName: formValues.personalInfo?.firstName,
    middleName: formValues.personalInfo?.middleName,
    lastName: formValues.personalInfo?.lastName,
    preferredName: formValues.personalInfo?.preferredName,
    dateOfBirth: formValues.personalInfo?.dateOfBirth,
    gender: formValues.personalInfo?.gender ?? undefined,

    // Contact Information
    primaryPhone: formValues.contactInfo?.primaryPhone,
    phoneCountryCode: formValues.contactInfo?.phoneCountryCode,
    profilePictureUrl: formValues.contactInfo?.profilePictureUrl,
    address: formValues.contactInfo?.address,

    // Academic Information
    studentId: formValues.administration?.studentId,
    admissionNumber: formValues.administration?.admissionNumber,
    admissionDate: formValues.administration?.admissionDate,
    rollNumber: formValues.administration?.rollNumber,
    gradeLevel: formValues.academicInfo?.gradeLevel,
    section: formValues.academicInfo?.section,

    // Guardian Information — a transport field, not a stored one. The service
    // turns it into `parents` + `student_parents` rows and drops it, the way
    // the backend does inside the transaction that writes the student. Nothing
    // reads it off a student record.
    guardians: {
      father: formValues.guardianInfo?.father
        ? {
          name: formValues.guardianInfo.father.name,
          phoneCountryCode: formValues.guardianInfo.father.phoneCountryCode,
          phone: formValues.guardianInfo.father.phone,
        }
        : undefined,
      mother: formValues.guardianInfo?.mother
        ? {
          name: formValues.guardianInfo.mother.name,
          phoneCountryCode: formValues.guardianInfo.mother.phoneCountryCode,
          phone: formValues.guardianInfo.mother.phone,
        }
        : undefined,
      alternativeGuardian: formValues.guardianInfo?.alternativeGuardian
        ? {
          name: formValues.guardianInfo.alternativeGuardian.name,
          relation: formValues.guardianInfo.alternativeGuardian.relation,
          phoneCountryCode: formValues.guardianInfo.alternativeGuardian.phoneCountryCode,
          phone: formValues.guardianInfo.alternativeGuardian.phone,
        }
        : undefined,
    },

    // Additional Info (stored in studentInfo JSON field)
    studentInfo: formValues.additionalInfo
      ? {
        hobbies: formValues.additionalInfo.hobbies,
        specialNeedsSupport: formValues.additionalInfo.specialNeedsSupport,
        medicalConditionAlert: formValues.additionalInfo.medicalConditionAlert,
        medicalInfo: formValues.additionalInfo.medicalInfo,
      }
      : undefined,
  }

  // Remove undefined guardian entries
  if (student.guardians) {
    if (!student.guardians.father) delete student.guardians.father
    if (!student.guardians.mother) delete student.guardians.mother
    if (!student.guardians.alternativeGuardian) delete student.guardians.alternativeGuardian
  }

  return student
}

/**
 * Transforms flat Student structure to nested form structure
 * Converts Student (flat) to StudentFormValues (nested)
 *
 * The guardian rows are a separate argument, and required, because they come
 * from a different table and a different request. Making the caller pass them
 * is the only thing that stops the form quietly rendering three empty
 * guardian slots on a student who has three guardians.
 */
export function studentToForm(
  student: Student,
  guardians: ParentOfStudent[],
): Partial<StudentFormValues> {
  const formValues: Partial<StudentFormValues> = {
    personalInfo: {
      firstName: student.firstName ?? '',
      middleName: student.middleName,
      lastName: student.lastName ?? '',
      preferredName: student.preferredName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender ?? undefined,
    },
    contactInfo: {
      primaryPhone: student.primaryPhone,
      phoneCountryCode: student.phoneCountryCode,
      profilePictureUrl: student.profilePictureUrl,
      address: student.address,
    },
    administration: {
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      admissionDate: student.admissionDate,
      rollNumber: student.rollNumber,
    },
    academicInfo: {
      gradeLevel: student.gradeLevel,
      section: student.section,
      enrollmentDate: undefined,
      // Neither of these is stored on a student, so both are write-only: the
      // form collects them and the save discards them. That was survivable
      // for enrollmentDate, which is optional, and not for previousSchool,
      // which the schema requires — an empty default failed validation on
      // every edit, so the Save button on this form did nothing at all until
      // the user scrolled up and noticed the one red field. 'N/A' is what the
      // add form already defaults to, so the two paths now agree.
      previousSchool: 'N/A',
    },
    guardianInfo: guardiansToFormSlots(guardians),
    additionalInfo: student.studentInfo
      ? {
        hobbies:
          typeof student.studentInfo.hobbies === 'string'
            ? student.studentInfo.hobbies
            : undefined,
        specialNeedsSupport:
          typeof student.studentInfo.specialNeedsSupport === 'boolean'
            ? student.studentInfo.specialNeedsSupport
            : undefined,
        medicalConditionAlert:
          typeof student.studentInfo.medicalConditionAlert === 'boolean'
            ? student.studentInfo.medicalConditionAlert
            : undefined,
        medicalInfo:
          typeof student.studentInfo.medicalInfo === 'string'
            ? student.studentInfo.medicalInfo
            : undefined,
      }
      : undefined,
  }

  return formValues
}

/**
 * Transforms API response to Student type
 * Handles API response structure and converts to Student
 */
export function apiToStudent(apiData: unknown): Student {
  // Type guard to check if apiData has the expected structure
  if (typeof apiData !== 'object' || apiData === null) {
    throw new Error('Invalid API data: expected object')
  }

  const data = apiData as Record<string, unknown>

  // Extract user_profiles fields
  const userProfile: Partial<Student> = {
    id: data.id as string | number,
    userId: data.userId as string | number,
    profileType: (data.profileType as 0 | 1 | 2 | 3 | 4 | 5) ?? 0,
    firstName: data.firstName as string | undefined,
    middleName: data.middleName as string | undefined,
    lastName: data.lastName as string | undefined,
    fullName: data.fullName as string | undefined,
    preferredName: data.preferredName as string | undefined,
    displayName: data.displayName as string | undefined,
    dateOfBirth: data.dateOfBirth as string | undefined,
    gender: data.gender as 0 | 1 | 2 | 3 | undefined,
    primaryPhone: data.primaryPhone as string | undefined,
    profilePictureUrl: data.profilePictureUrl as string | undefined,
    syncedAt: data.syncedAt as string | undefined,
    syncVersion: data.syncVersion as number | undefined,
  }

  // Extract students table fields
  const student: Student = {
    ...userProfile,
    studentId: (data.studentId as string) || '',
    phoneCountryCode: data.phoneCountryCode as string | undefined,
    address: data.address as string | undefined,
    admissionNumber: data.admissionNumber as string | undefined,
    admissionDate: data.admissionDate as string | undefined,
    rollNumber: data.rollNumber as string | undefined,
    gradeLevel: data.gradeLevel as string | undefined,
    section: data.section as string | undefined,
    studentInfo: data.studentInfo as Record<string, unknown> | undefined,

    // Display/metrics fields (may come from API or need defaults)
    gpa: typeof data.gpa === 'number' ? data.gpa : 0,
    performance: (data.performance as 'Good' | 'Needs Support' | 'At Risk') || 'Good',
    percentage: typeof data.percentage === 'number' ? data.percentage : 0,
    status: (data.status as 'Active' | 'On Leave') || 'Active',

    // Guardian information
    guardians: data.guardians as Student['guardians'],

    // Legacy fields
    name: data.name as string | undefined,
    class: data.class as string | undefined,
    avatarUrl: data.avatarUrl as string | undefined,
  } as Student

  return student
}

/**
 * Transforms Student to API payload
 * Converts Student to the format expected by the API
 */
export function studentToApi(student: Student): Record<string, unknown> {
  const apiPayload: Record<string, unknown> = {
    // User profile fields
    id: student.id,
    userId: student.userId,
    profileType: student.profileType,
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
    fullName: student.fullName,
    preferredName: student.preferredName,
    displayName: student.displayName,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    primaryPhone: student.primaryPhone,
    profilePictureUrl: student.profilePictureUrl,

    // Student-specific fields
    studentId: student.studentId,
    phoneCountryCode: student.phoneCountryCode,
    address: student.address,
    admissionNumber: student.admissionNumber,
    admissionDate: student.admissionDate,
    rollNumber: student.rollNumber,
    gradeLevel: student.gradeLevel,
    section: student.section,
    studentInfo: student.studentInfo,

    // Display/metrics
    gpa: student.gpa,
    performance: student.performance,
    percentage: student.percentage,
    status: student.status,

    // Guardian information
    guardians: student.guardians,
  }

  // Remove undefined values
  return Object.fromEntries(Object.entries(apiPayload).filter(([_, value]) => value !== undefined))
}


/**
 * Fill the form's three guardian slots from the student's actual parent rows.
 *
 * The form is the odd one out here: everything else that shows a guardian —
 * the detail page, provisioning, a parent's own account — reads the `parents`
 * tables, and the form used to read an embedded copy on the student record.
 * Two copies of one fact, and the form held the stale one, so correcting a
 * father's phone on the detail page and then saving the form put the old
 * number back.
 *
 * Father and Mother take the links of that name. The single alternative slot
 * takes the first link that is neither, which is all the form can express: a
 * student with two extra guardians shows one of them here, and the other is
 * edited on the detail page. The slot is left blank rather than filled with a
 * guess when there is no such link.
 */
export function guardiansToFormSlots(
  guardians: ParentOfStudent[],
): StudentFormValues['guardianInfo'] {
  const named = (relationship: string) =>
    guardians.find(guardian => guardian.relationship === relationship)
  const other = guardians.find(
    guardian => guardian.relationship !== 'Father' && guardian.relationship !== 'Mother',
  )

  const slot = (guardian: ParentOfStudent | undefined) => {
    const { countryCode, number } = splitPhone(guardian?.phone)
    return { name: guardian?.fullName ?? '', phoneCountryCode: countryCode, phone: number }
  }

  return {
    father: slot(named('Father')),
    mother: slot(named('Mother')),
    alternativeGuardian: { ...slot(other), relation: other?.relationship ?? '' },
  }
}
