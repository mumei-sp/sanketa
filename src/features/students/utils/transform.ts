import type { Student } from '../types'
import type { StudentFormValues } from '../schemas/student-schema'

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

    // Guardian Information
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
 */
export function studentToForm(student: Student): Partial<StudentFormValues> {
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
      previousSchool: '',
      // Note: enrollmentDate is not in Student type
      // previousSchool is required in schema but not in Student type, defaulting to empty string
    },
    guardianInfo: {
      father: student.guardians?.father
        ? {
          name: student.guardians.father.name,
          phoneCountryCode: student.guardians.father.phoneCountryCode,
          phone: student.guardians.father.phone,
        }
        : {
          name: undefined,
          phoneCountryCode: undefined,
          phone: undefined,
        },
      mother: student.guardians?.mother
        ? {
          name: student.guardians.mother.name,
          phoneCountryCode: student.guardians.mother.phoneCountryCode,
          phone: student.guardians.mother.phone,
        }
        : {
          name: undefined,
          phoneCountryCode: undefined,
          phone: undefined,
        },
      alternativeGuardian: student.guardians?.alternativeGuardian
        ? {
          name: student.guardians.alternativeGuardian.name,
          relation: student.guardians.alternativeGuardian.relation,
          phoneCountryCode: student.guardians.alternativeGuardian.phoneCountryCode,
          phone: student.guardians.alternativeGuardian.phone,
        }
        : {
          name: undefined,
          relation: undefined,
          phoneCountryCode: undefined,
          phone: undefined,
        },
    },
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
