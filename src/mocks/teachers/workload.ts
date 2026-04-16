/**
 * Mock teacher workload data for development and testing.
 *
 * Keys match SchoolConfig subject names exactly.
 * When backend is ready, replace with API calls.
 */

export interface TeacherWorkloadData {
  teacherName: string
  totalClasses: number
  teachingHours: number
  extraDuties: number
}

/** Helper to generate varied but realistic workload data for a set of teachers */
function generateWorkload(
  teachers: string[],
  base: { classes: number; teaching: number; duties: number },
  variance: number,
  multiplier = 1,
): TeacherWorkloadData[] {
  return teachers.map((name, i) => {
    const offset = ((i * 7 + 3) % 5) - 2 // deterministic pseudo-random offset: -2 to +2
    return {
      teacherName: name,
      totalClasses: Math.round((base.classes + offset * variance) * multiplier),
      teachingHours: Math.round((base.teaching + ((i * 3) % 5 - 2) * variance) * multiplier),
      extraDuties: Math.round((base.duties + ((i * 5) % 4 - 1) * variance) * multiplier),
    }
  })
}

const scienceTeachers = ['Rayan Yasmine', 'Aliyah Summer', 'Kelsy Trisha', 'Zackary Smith', 'Javier Quintero']
const mathTeachers = ['Giana Gomez', 'Miley Addams', 'Kaily Jayson', 'Rayan Yasmine', 'Aliyah Summer']
const englishTeachers = ['Kelsy Trisha', 'Zackary Smith', 'Javier Quintero', 'Giana Gomez', 'Miley Addams']
const sstTeachers = ['Kaily Jayson', 'Rayan Yasmine', 'Aliyah Summer', 'Kelsy Trisha', 'Zackary Smith']
const hindiTeachers = ['Javier Quintero', 'Giana Gomez', 'Miley Addams', 'Kaily Jayson', 'Rayan Yasmine']
const csTeachers = ['Aliyah Summer', 'Kelsy Trisha', 'Zackary Smith', 'Javier Quintero', 'Giana Gomez']
const peTeachers = ['Miley Addams', 'Kaily Jayson', 'Rayan Yasmine', 'Aliyah Summer', 'Kelsy Trisha']
const artTeachers = ['Zackary Smith', 'Javier Quintero', 'Giana Gomez', 'Miley Addams']
const musicTeachers = ['Kaily Jayson', 'Rayan Yasmine', 'Aliyah Summer', 'Kelsy Trisha']
const libraryTeachers = ['Zackary Smith', 'Javier Quintero', 'Giana Gomez']

export const teacherWorkloadData: Record<string, Record<string, TeacherWorkloadData[]>> = {
  Mathematics: {
    Weekly: generateWorkload(mathTeachers, { classes: 20, teaching: 11, duties: 5 }, 2),
    Monthly: generateWorkload(mathTeachers, { classes: 20, teaching: 11, duties: 5 }, 2, 4),
  },
  English: {
    Weekly: generateWorkload(englishTeachers, { classes: 18, teaching: 10, duties: 4 }, 2),
    Monthly: generateWorkload(englishTeachers, { classes: 18, teaching: 10, duties: 4 }, 2, 4),
  },
  Science: {
    Weekly: generateWorkload(scienceTeachers, { classes: 19, teaching: 12, duties: 5 }, 2),
    Monthly: generateWorkload(scienceTeachers, { classes: 19, teaching: 12, duties: 5 }, 2, 4),
  },
  'Social Studies': {
    Weekly: generateWorkload(sstTeachers, { classes: 17, teaching: 10, duties: 4 }, 2),
    Monthly: generateWorkload(sstTeachers, { classes: 17, teaching: 10, duties: 4 }, 2, 4),
  },
  Hindi: {
    Weekly: generateWorkload(hindiTeachers, { classes: 16, teaching: 9, duties: 3 }, 2),
    Monthly: generateWorkload(hindiTeachers, { classes: 16, teaching: 9, duties: 3 }, 2, 4),
  },
  'Computer Science': {
    Weekly: generateWorkload(csTeachers, { classes: 15, teaching: 10, duties: 4 }, 2),
    Monthly: generateWorkload(csTeachers, { classes: 15, teaching: 10, duties: 4 }, 2, 4),
  },
  'Physical Education': {
    Weekly: generateWorkload(peTeachers, { classes: 22, teaching: 8, duties: 6 }, 2),
    Monthly: generateWorkload(peTeachers, { classes: 22, teaching: 8, duties: 6 }, 2, 4),
  },
  Art: {
    Weekly: generateWorkload(artTeachers, { classes: 14, teaching: 8, duties: 3 }, 2),
    Monthly: generateWorkload(artTeachers, { classes: 14, teaching: 8, duties: 3 }, 2, 4),
  },
  Music: {
    Weekly: generateWorkload(musicTeachers, { classes: 12, teaching: 7, duties: 2 }, 2),
    Monthly: generateWorkload(musicTeachers, { classes: 12, teaching: 7, duties: 2 }, 2, 4),
  },
  Library: {
    Weekly: generateWorkload(libraryTeachers, { classes: 10, teaching: 6, duties: 2 }, 1),
    Monthly: generateWorkload(libraryTeachers, { classes: 10, teaching: 6, duties: 2 }, 1, 4),
  },
}
