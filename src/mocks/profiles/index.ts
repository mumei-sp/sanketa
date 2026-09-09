/**
 * A person's identity and access *at one school*.
 *
 * Only a service and the auth mock should import this — it stands in for the
 * tenant schema's `user_profiles`, `profile_types` and `profile_roles`.
 */

export {
  listProfiles,
  profileOf,
  listProfileTypes,
  typesOf,
  roleIdsOf,
  profilesWithRole,
  createProfile,
  updateProfile,
  grantRole,
  revokeRole,
  createProfileType,
  deactivateProfileType,
  assignProfileType,
  resetProfiles,
} from './store'
export type { Profile, ProfileType, ProfileRole, ProfileTypeLink, Capacity } from './store'
export { resolveTenantAccess } from './access'
export type { TenantAccess } from './access'
