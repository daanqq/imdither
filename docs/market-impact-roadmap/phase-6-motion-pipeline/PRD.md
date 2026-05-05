# Phase 6 PRD: Motion Pipeline Contract

Status: in-progress
Last updated: 2026-05-04

## Implementation Progress

- [x] GIF intake via gifuct-js through motion worker
- [x] GIF export via gifenc through Frame Sequence contract
- [x] Frame Sequence type and processing contract in `@workspace/core`
- [x] Frame preview controls (play/pause, scrub, frame step)
- [x] Temporal stability ("none" | "global-palette") in Editor Settings
- [x] Still export stability preserved alongside GIF export
- [x] APNG intake and export (see phase-6-apng/PRD.md)
- [x] WebM/video intake and export via &lt;video&gt; element + WebCodecs (see phase-6-video-pipeline/PRD.md)

## Problem Statement

IMDITHER is still-image first. The roadmap calls for GIF, APNG, WebM, and video
work, but motion cannot be added safely by treating every format as a one-off
decoder or exporter. Phase 6 needs a shared motion contract before later
performance work can make cache, tile, worker, WASM, or GPU assumptions.

## Solution

Define the browser-local Frame Sequence processing contract and run codec/library
spikes before implementation. Motion output uses the same Editor Settings
semantics as still output, while adding frame timing, preview controls, temporal
stability options, and export targets.

Do not hand-roll decoders or encoders when a reliable browser API or compatible
third-party library can provide the format boundary.

## User Stories

1. As a visual maker, I want to import animated images, so that IMDITHER can
   process motion looks without leaving the browser.
2. As a visual maker, I want each frame processed with the same Editor Settings,
   so that still and motion looks remain understandable.
3. As a visual maker, I want play, pause, scrub, and frame-step controls, so
   that I can inspect animated output before export.
4. As a visual maker, I want temporal stability options, so that dithering does
   not flicker unintentionally between frames.
5. As a visual maker, I want a first animated export target, so that motion work
   produces a shareable file.
6. As a maintainer, I want format support to be evaluated through browser APIs
   and third-party libraries, so that IMDITHER does not grow custom codec
   maintenance.
7. As a maintainer, I want a Frame Sequence contract, so that Phase 8
   acceleration can reason about caches, tiles, and workers without inventing
   motion semantics.
8. As a still-image user, I want still export to remain stable, so that motion
   support does not destabilize the existing product.

## Requirements

- Define `Frame Sequence` as ordered frames plus timing metadata.
- Preserve source metadata needed for loop count, frame duration, and source
  dimensions.
- Account for GIF-style disposal and blend behavior in the intake contract.
- Evaluate animated GIF, APNG, animated WebP, WebM, and video intake support.
- Prefer browser APIs where they are stable enough.
- Evaluate third-party libraries for unsupported browser codec gaps.
- Keep all codec/library candidates behind narrow adapters until accepted.
- Process each frame with normalized Editor Settings.
- Keep Settings JSON focused on processing semantics, not decoded frame data.
- Add temporal stability policy for palette locking, noise seeds, and dither
  stability modes.
- Define preview controls: play, pause, scrub, frame step, fps, duration, and
  current frame display.
- Pick GIF or APNG as the first motion export target.
- Treat WebM/video export as WebCodecs-based where browser support allows.
- Define clear unsupported-file and unsupported-browser errors.
- Keep still-image intake, preview, and export unchanged.
- Hand Phase 8 a documented memory, cache, tile, and worker compatibility
  boundary.

## Third-Party Evaluation Criteria

- Browser-only and local-first.
- ESM, Vite, and Bun compatible.
- Worker-compatible where decoding or encoding can be off the main thread.
- License compatible with the project.
- Deterministic enough for visual contract testing, or explicitly documented
  tolerance.
- Acceptable bundle impact for a motion feature.
- Clear fallback behavior when unavailable.
- Useful for future Frame Sequence and Phase 8 acceleration work.

## Testing Decisions

- Contract tests cover Frame Sequence normalization and timing metadata.
- Intake tests cover supported and unsupported animated sources with fixture
  metadata.
- Preview tests cover play, pause, scrub, and frame-step state transitions.
- Processing tests prove still Editor Settings semantics are reused per frame.
- Export tests cover the first animated output target.
- Regression tests prove still-image export remains unchanged.

## Out of Scope

- No backend, account, cloud, or server-side processing.
- No custom codec implementation unless library/API evaluation fails and a
  later PRD accepts the maintenance cost.
- No Phase 8 acceleration implementation.
- No GPU or WASM rewrite.
- No batch queue or CLI.

## Further Notes

This PRD is a prerequisite for Phase 8 work that needs motion assumptions. If a
performance slice can be implemented without motion semantics, it may proceed
before Phase 6 implementation, but it must not bake in incompatible frame,
cache, tile, or worker behavior.
