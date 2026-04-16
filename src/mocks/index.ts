/**
 * Top-level barrel for the mock layer.
 *
 * Feature mocks will be added to this file as they migrate out of
 * `src/data/mocks/` and `src/features/*/mocks/` into the canonical
 * `src/mocks/{feature}/` home. For now only the shared primitives are
 * re-exported so service adapters can start using them immediately.
 */

export * from './_shared'
