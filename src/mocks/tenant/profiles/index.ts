/**
 * A person's identity and access *at one school*.
 *
 * Only a service and the auth mock should import this — it stands in for the
 * tenant schema's `user_profiles`, `staff`, `staff_designations` and
 * `profile_roles`.
 */

export {
  listProfiles,
  profileOf,
  personOf,
  upsertPerson,
  staffOf,
  listStaff,
  attachLogin,
  detachLogin,
  listDesignations,
  designationOf,
  roleIdsOf,
  roleGrantsOf,
  profilesWithRole,
  createProfile,
  deleteProfile,
  updateProfile,
  grantRole,
  revokeRole,
  lapsedGrants,
  markLapsesRecorded,
  createDesignation,
  deactivateDesignation,
  setDesignation,
} from './store'
export { capacitiesOf } from './capacities'
export type {
  Profile,
  StaffRecord,
  StaffDesignation,
  ProfileRole,
  Capacity,
} from './store'
/**
 * `resolveActiveAccess` is the everyday read — what this session may do.
 * `resolveTenantAccess` is the whole truth about a person here, and exists for
 * the chooser, which has to enumerate what they could be. See `access.ts`.
 */
export {
  resolveTenantAccess,
  resolveActiveAccess,
  resolveActiveSide,
  sidesAvailable,
  narrowToSide,
} from './access'
export type { TenantAccess } from './access'
