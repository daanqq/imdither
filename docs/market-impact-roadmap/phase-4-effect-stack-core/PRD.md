# Phase 4.1 PRD: Effect Stack Core

Status: planned
Last updated: 2026-05-02

## Problem Statement

IMDITHER has a deterministic processing path, but look-building still centers on
one dither or palette-mapping pass plus scalar preprocessing. Phase 4 needs a
serializable Effect Stack so future pre-effects, post-effects, and UI controls
can extend the pipeline without creating a second settings model.

The core change must preserve the current deterministic output as the
compatibility baseline. Existing Settings JSON, Look Payloads, Processing
Presets, and Auto-Tune Recommendations must keep working after normalization.

## Outcome

Add the core Effect Stack contract to Editor Settings schema version 3.

The stack is an ordered list of typed Effect Stages with Stage Instance Id,
Stage Kind, enabled state, and serializable params. It is stored inside Editor
Settings and therefore becomes part of Settings JSON and Look Snapshots. Stage
data must not contain Pixel Buffers, binary assets, DOM handles, worker handles,
or runtime job state.

The Phase 4 core model keeps palette, matching mode, dither algorithm, and
Bayer size as existing top-level settings. Quantize and dither stages wrap the
current core behavior instead of duplicating those fields.

## Requirements

1. Editor Settings gains `schemaVersion: 3` and `effectStack`.
2. Schema v2 settings normalize into v3 settings with the compatibility stack.
3. A missing, empty, or disabled optional stack still produces the compatibility
   baseline, not an unprocessed source image.
4. Effect Stage shape includes stable Stage Instance Id, Stage Kind, enabled
   state, and serializable params.
5. Stage Kind determines pipeline group and execution order (`pre`, `quantize`,
   `dither`, `post`). Specific effect behavior is determined by
   `params.effect`.
6. Core Stage Kinds cover typed `pre`, `quantize`, `dither`, and `post`
   categories.
7. Fixed group ordering is enforced: built-in source preparation, `pre` stages,
   existing preprocessing, quantize/dither core stages, and `post` stages.
8. Users may only reorder optional stages inside the same group in Phase 4.
9. Phase 4 core does not allow multiple dither stages, arbitrary cross-group
   ordering, or moving resize and alpha flattening into the stack.
10. Existing palette, matching mode, dither algorithm, and Bayer size settings
    remain the source of truth for current quantize/dither behavior.
11. Processing Presets remain stack-neutral in this slice.
12. Auto-Tune Recommendations remain stack-neutral and apply to the
    compatibility stack in this slice.
13. Look Snapshot and Look Payload validation accepts schema v3 settings and
    continues to reject invalid stage data.
14. Stage params use bounded numeric/string/boolean shapes only.
15. Cache keys include stage data where stage behavior changes output.

## Acceptance Criteria

- Current default settings process to the same output before and after the
  schema v3 migration.
- v2 Settings JSON normalizes into v3 settings without user-visible errors.
- Settings JSON copy/paste preserves `effectStack`.
- Look Snapshot and Look Payload copy/paste preserve `effectStack`.
- Invalid stage kinds, invalid params, duplicate Stage Instance Ids, and invalid
  ordering are rejected or normalized deterministically.
- Processing Presets produce the same visible output as before unless a future
  PRD makes them stack-aware.
- Auto-Tune apply resets to the compatibility stack unless a future PRD makes
  Auto-Tune stack-aware.

## Allowed Side Effects

- Editor Settings schema bump from 2 to 3.
- Settings schema docs update.
- Look Snapshot payloads may contain schema v3 settings.
- Settings normalization and compatibility tests change to cover v2-to-v3
  migration.
- Processing cache key structure changes to account for stack behavior.

## Verification Evidence

Implementation should provide:

- settings contract tests for schema v3 validation and v2 migration;
- process tests proving compatibility output stays stable;
- Look Snapshot tests proving stack round trips through payloads;
- transition/store tests proving stack changes are undoable Editor Settings
  changes;
- `bun verify` after code changes.

## Out of Scope

- No visible Stack tab UI.
- No new optional effects.
- No node graph.
- No arbitrary stage graph or cross-group ordering.
- No multiple dither stages.
- No stack-aware Processing Presets.
- No stack-aware Auto-Tune ranking.
- No GPU, WASM, or tile-cache rewrite.

