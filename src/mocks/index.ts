/**
 * Top-level barrel for the mock layer.
 *
 * Import specific feature mocks directly from their subfolder
 * (e.g. `import { studentsData } from '@/mocks/students'`) rather than the
 * top-level barrel — that keeps chunk boundaries tight so importing one
 * feature's mocks doesn't pull in everything.
 *
 * The shared helpers are re-exported here because they're stateless and
 * universally useful.
 */

export * from './_shared'
