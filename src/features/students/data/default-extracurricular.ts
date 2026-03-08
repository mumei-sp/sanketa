import type { ExtracurricularActivity } from '@/features/students/types'

/**
 * Default extracurricular activity presets for mock/seed data.
 * Feature-owned defaults so mocks and tests can reuse without duplicating.
 */
export const defaultExtracurricularPresets: ExtracurricularActivity[][] = [
  [
    { club: 'Basketball', role: 'Team Member', achievements: 'Inter-school tournament participation', duration: '2023 - Present', advisor: 'Coach Mike R.', iconKey: 'sports' },
    { club: 'Chess', role: 'Member', achievements: 'School chess club champion', duration: '2022 - Present', advisor: 'Mr. David L.', iconKey: 'other' },
  ],
  [
    { club: 'Drama', role: 'Lead Performer', achievements: 'Annual play lead role', duration: '2023 - Present', advisor: 'Ms. Sarah K.', iconKey: 'art' },
    { club: 'Music', role: 'Band Member', achievements: 'Spring concert performance', duration: '2022 - Present', advisor: 'Mr. James W.', iconKey: 'music' },
  ],
  [
    { club: 'Cricket', role: 'Bowler', achievements: 'District under-14 team', duration: '2022 - Present', advisor: 'Coach Ramesh P.', iconKey: 'sports' },
    { club: 'Math Club', role: 'Member', achievements: 'Math Olympiad participant', duration: '2023 - Present', advisor: 'Ms. Priya S.', iconKey: 'other' },
  ],
  [
    { club: 'Swimming', role: 'Team Member', achievements: 'Regional meet qualifier', duration: '2022 - Present', advisor: 'Coach Andrea V.', iconKey: 'swimming' },
    { club: 'Photography', role: 'Member', achievements: 'School yearbook contributor', duration: '2023 - Present', advisor: 'Ms. Clara F.', iconKey: 'art' },
  ],
  [
    { club: 'Robotics', role: 'Programmer', achievements: 'Regional robotics competition', duration: '2023 - Present', advisor: 'Mr. Daniel K.', iconKey: 'robotics' },
    { club: 'Soccer', role: 'Midfielder', achievements: 'League participation', duration: '2022 - Present', advisor: 'Coach Tom B.', iconKey: 'sports' },
  ],
  [
    { club: 'Dance', role: 'Lead Performer', achievements: 'Performed at National Festival', duration: '2030 - Present', advisor: 'Ms. Clara F.', iconKey: 'dance' },
    { club: 'Art Club', role: 'Member', achievements: 'Exhibition participant', duration: '2023 - Present', advisor: 'Ms. Emma T.', iconKey: 'art' },
  ],
  [
    { club: 'Debate', role: 'Speaker', achievements: 'State debate qualifier', duration: '2023 - Present', advisor: 'Mr. John H.', iconKey: 'other' },
  ],
  [
    { club: 'Volleyball', role: 'Team Member', achievements: 'School team captain', duration: '2022 - Present', advisor: 'Coach Lisa M.', iconKey: 'sports' },
    { club: 'Science Club', role: 'Member', achievements: 'Science fair 2nd place', duration: '2023 - Present', advisor: 'Dr. Amy N.', iconKey: 'other' },
  ],
]

/**
 * Returns a preset list of extracurricular activities by index (cycles through presets).
 * Used by mock data to assign default activities to students.
 */
export function getDefaultExtracurricular(index: number): ExtracurricularActivity[] {
  return defaultExtracurricularPresets[index % defaultExtracurricularPresets.length]
}
