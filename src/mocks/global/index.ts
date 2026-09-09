/**
 * The global database.
 *
 * Identity, and the mapping from a person to the schools they belong to.
 * Nothing that belongs to a school: `Multi-Tenant-LMS__ARCH.md` is explicit —
 * *"GlobalDB stores identity and lightweight mapping data only. No heavy
 * domain data (students, marks, attendance)."*
 *
 * Only a service and the auth mock should import these — they stand in for
 * backend tables.
 */

export * from './users'
export { listTenants, listActiveTenants, findTenant, resetTenants } from './tenants/store'
export type { Tenant } from './tenants/store'
export {
  listMemberships,
  resolveTenants,
  membersOf,
  findMembership,
  addMembership,
  setMembershipActive,
  resetMemberships,
} from './memberships/store'
export type { Membership } from './memberships/store'
