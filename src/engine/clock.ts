/**
Injectable time source.

The implementation now lives in `@kuhyx/ts-core`, shared with konbini-67,
which had grown a near-identical copy. This file stays as the local seam:
`src/engine/` is this game's own boundary, and the lint rule banning
`performance.now()`/`Date.now()` outside it still applies.
*/
export {
  createManualClock,
  createRealClock,
  realClock,
  type Clock,
  type ManualClock,
} from '@kuhyx/ts-core';
