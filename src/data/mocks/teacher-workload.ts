/**
 * Mock teacher workload data for development and testing
 * TODO: Replace with real API calls when backend is ready
 */

export interface TeacherWorkloadData {
  teacherName: string
  totalClasses: number // in hours
  teachingHours: number // in hours
  extraDuties: number // in hours
}

/**
 * Mock workload data for different subjects and time periods
 */
export const teacherWorkloadData: Record<string, Record<string, TeacherWorkloadData[]>> = {
  Science: {
    Weekly: [
      {
        teacherName: 'Rayan Yasmine',
        totalClasses: 19,
        teachingHours: 12,
        extraDuties: 5,
      },
      {
        teacherName: 'Aliyah Summer',
        totalClasses: 20,
        teachingHours: 12,
        extraDuties: 3,
      },
      {
        teacherName: 'Kelsy Trisha',
        totalClasses: 18,
        teachingHours: 12,
        extraDuties: 3,
      },
      {
        teacherName: 'Zackary Smith',
        totalClasses: 19,
        teachingHours: 12,
        extraDuties: 3,
      },
      {
        teacherName: 'Javier Quintero',
        totalClasses: 22,
        teachingHours: 12,
        extraDuties: 6,
      },
      {
        teacherName: 'Giana Gomez',
        totalClasses: 24,
        teachingHours: 12,
        extraDuties: 4,
      },
      {
        teacherName: 'Miley Addams',
        totalClasses: 20,
        teachingHours: 8,
        extraDuties: 6,
      },
      {
        teacherName: 'Kaily Jayson',
        totalClasses: 24,
        teachingHours: 8,
        extraDuties: 6,
      },
    ],
    Monthly: [
      {
        teacherName: 'Rayan Yasmine',
        totalClasses: 80,
        teachingHours: 40,
        extraDuties: 20,
      },
      {
        teacherName: 'Aliyah Summer',
        totalClasses: 72,
        teachingHours: 48,
        extraDuties: 16,
      },
      {
        teacherName: 'Kelsy Trisha',
        totalClasses: 88,
        teachingHours: 32,
        extraDuties: 24,
      },
      {
        teacherName: 'Zackary Smith',
        totalClasses: 64,
        teachingHours: 56,
        extraDuties: 12,
      },
      {
        teacherName: 'Javier Quintero',
        totalClasses: 96,
        teachingHours: 36,
        extraDuties: 28,
      },
      {
        teacherName: 'Giana Gomez',
        totalClasses: 76,
        teachingHours: 44,
        extraDuties: 20,
      },
      {
        teacherName: 'Miley Addams',
        totalClasses: 84,
        teachingHours: 40,
        extraDuties: 16,
      },
      {
        teacherName: 'Kaily Jayson',
        totalClasses: 68,
        teachingHours: 52,
        extraDuties: 24,
      },
    ],
  },
  Mathematics: {
    Weekly: [
      {
        teacherName: 'Rayan Yasmine',
        totalClasses: 18,
        teachingHours: 11,
        extraDuties: 4,
      },
      {
        teacherName: 'Aliyah Summer',
        totalClasses: 20,
        teachingHours: 10,
        extraDuties: 5,
      },
      {
        teacherName: 'Kelsy Trisha',
        totalClasses: 19,
        teachingHours: 12,
        extraDuties: 3,
      },
      {
        teacherName: 'Zackary Smith',
        totalClasses: 22,
        teachingHours: 9,
        extraDuties: 6,
      },
      {
        teacherName: 'Javier Quintero',
        totalClasses: 17,
        teachingHours: 13,
        extraDuties: 4,
      },
      {
        teacherName: 'Giana Gomez',
        totalClasses: 21,
        teachingHours: 8,
        extraDuties: 7,
      },
      {
        teacherName: 'Miley Addams',
        totalClasses: 16,
        teachingHours: 14,
        extraDuties: 5,
      },
      {
        teacherName: 'Kaily Jayson',
        totalClasses: 23,
        teachingHours: 7,
        extraDuties: 8,
      },
    ],
    Monthly: [
      {
        teacherName: 'Rayan Yasmine',
        totalClasses: 72,
        teachingHours: 44,
        extraDuties: 16,
      },
      {
        teacherName: 'Aliyah Summer',
        totalClasses: 80,
        teachingHours: 40,
        extraDuties: 20,
      },
      {
        teacherName: 'Kelsy Trisha',
        totalClasses: 76,
        teachingHours: 48,
        extraDuties: 12,
      },
      {
        teacherName: 'Zackary Smith',
        totalClasses: 88,
        teachingHours: 36,
        extraDuties: 24,
      },
      {
        teacherName: 'Javier Quintero',
        totalClasses: 68,
        teachingHours: 52,
        extraDuties: 16,
      },
      {
        teacherName: 'Giana Gomez',
        totalClasses: 84,
        teachingHours: 32,
        extraDuties: 28,
      },
      {
        teacherName: 'Miley Addams',
        totalClasses: 64,
        teachingHours: 56,
        extraDuties: 20,
      },
      {
        teacherName: 'Kaily Jayson',
        totalClasses: 92,
        teachingHours: 28,
        extraDuties: 32,
      },
    ],
  },
  English: {
    Weekly: [
      {
        teacherName: 'Rayan Yasmine',
        totalClasses: 19,
        teachingHours: 9,
        extraDuties: 5,
      },
      {
        teacherName: 'Aliyah Summer',
        totalClasses: 17,
        teachingHours: 11,
        extraDuties: 4,
      },
      {
        teacherName: 'Kelsy Trisha',
        totalClasses: 21,
        teachingHours: 8,
        extraDuties: 6,
      },
      {
        teacherName: 'Zackary Smith',
        totalClasses: 15,
        teachingHours: 13,
        extraDuties: 3,
      },
      {
        teacherName: 'Javier Quintero',
        totalClasses: 23,
        teachingHours: 7,
        extraDuties: 7,
      },
      {
        teacherName: 'Giana Gomez',
        totalClasses: 18,
        teachingHours: 10,
        extraDuties: 5,
      },
      {
        teacherName: 'Miley Addams',
        totalClasses: 20,
        teachingHours: 9,
        extraDuties: 4,
      },
      {
        teacherName: 'Kaily Jayson',
        totalClasses: 16,
        teachingHours: 12,
        extraDuties: 6,
      },
    ],
    Monthly: [
      {
        teacherName: 'Rayan Yasmine',
        totalClasses: 76,
        teachingHours: 36,
        extraDuties: 20,
      },
      {
        teacherName: 'Aliyah Summer',
        totalClasses: 68,
        teachingHours: 44,
        extraDuties: 16,
      },
      {
        teacherName: 'Kelsy Trisha',
        totalClasses: 84,
        teachingHours: 32,
        extraDuties: 24,
      },
      {
        teacherName: 'Zackary Smith',
        totalClasses: 60,
        teachingHours: 52,
        extraDuties: 12,
      },
      {
        teacherName: 'Javier Quintero',
        totalClasses: 92,
        teachingHours: 28,
        extraDuties: 28,
      },
      {
        teacherName: 'Giana Gomez',
        totalClasses: 72,
        teachingHours: 40,
        extraDuties: 20,
      },
      {
        teacherName: 'Miley Addams',
        totalClasses: 80,
        teachingHours: 36,
        extraDuties: 16,
      },
      {
        teacherName: 'Kaily Jayson',
        totalClasses: 64,
        teachingHours: 48,
        extraDuties: 24,
      },
    ],
  },
}
