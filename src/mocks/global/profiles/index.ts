/**
 * `GlobalDB.user_profiles` — the person behind a login, once for the platform.
 *
 * The source of truth for the subset every tenant replicates. Only a service
 * and the auth mock should import this; it stands in for a backend table.
 */

export {
  listGlobalProfiles,
  globalProfileOf,
  replicaOf,
  createGlobalProfile,
  updateGlobalProfile,
  REPLICATED_COLUMNS,
} from './store'
export type { GlobalProfile } from './store'
export { syncProfileToActiveTenant, syncUnsyncedProfiles } from './sync'
