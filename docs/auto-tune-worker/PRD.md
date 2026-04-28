# Auto-Tune Worker PRD

Status: done
Last updated: 2026-04-29

## Problem Statement

Auto-Tune recommendations are useful, but the current runtime path can still do
heavy recommendation work on the main thread. A recent startup trace showed that
the first processed preview was not primarily blocked by the dithering worker.
The larger delay came after Source Intake and before the first visible processed
image, where Auto-Tune recommendation generation, palette extraction, rendered
candidate scoring, and React effects competed with preview readiness.

From the user's perspective, this makes the app feel slower than the actual
preview worker. The user wants the image to become visible first, then have
Auto-Tune recommendations appear as a secondary background enhancement. Auto-Tune
must not be part of the critical path from app launch or source load to first
ready preview.

## Solution

Move Auto-Tune recommendation generation behind a dedicated worker boundary while
preserving the current visible Auto-Tune workflow.

The editor should keep the current sequence where Auto-Tune starts only after the
first processed preview is ready. Once that preview exists, the app should run
recommendation generation in a persistent Auto-Tune worker using a small
Source-Intake-created analysis sample rather than the full Source Image. The
recommendations should remain local, deterministic, runtime-only, and visible in
the existing Looks panel.

The final user experience should be:

- The first preview appears without waiting for Auto-Tune scoring.
- Auto-Tune loading begins only after the first preview is available.
- Auto-Tune recommendations appear when worker scoring completes.
- Auto-Tune failure stays isolated to the Auto-Tune panel and does not break the
  preview, controls, source, export, or settings workflow.
- Loading a new source invalidates stale recommendations and ignores stale worker
  results.
- A reduced-preview notice appears only while a refined preview job is actually
  pending; a reduced buffer alone is not treated as a stuck processing state.
- The app remains browser-local and does not upload source images or analysis
  data.

## User Stories

1. As an IMDITHER user, I want the first processed preview to appear before Auto-Tune work starts, so that the app feels ready quickly.
2. As an IMDITHER user, I want Auto-Tune recommendations to load in the background, so that preview readiness is not delayed by scoring.
3. As an IMDITHER user, I want the Looks panel to show Auto-Tune loading only after I can already see the image, so that loading state reflects secondary work.
4. As an IMDITHER user, I want Auto-Tune recommendations to remain deterministic, so that the same source and settings produce stable suggestions.
5. As an IMDITHER user, I want applying an Auto-Tune recommendation to behave the same as before, so that worker migration does not change editing behavior.
6. As an IMDITHER user, I want Auto-Tune failures to be shown inline, so that a recommendation problem does not break the workstation.
7. As an IMDITHER user, I want source changes to clear stale Auto-Tune state, so that recommendations never belong to an old image.
8. As an IMDITHER user, I want quick source changes to ignore old worker results, so that obsolete recommendations do not overwrite current ones.
9. As an IMDITHER user, I want current preview, export, upload, undo, redo, and settings controls to remain usable while Auto-Tune runs, so that recommendations feel optional.
10. As an IMDITHER user, I want Auto-Tune to keep using my current output dimensions when it starts, so that generated looks preserve the expected export target.
11. As an IMDITHER user, I want later settings changes to remain responsive while Auto-Tune is running, so that background scoring does not restart on every control edit.
12. As an IMDITHER user, I want Auto-Tune to recompute for a new source, so that recommendations match the loaded image.
13. As an IMDITHER user, I want Auto-Tune to stay local to my browser, so that my images and analysis data are not sent to a backend.
14. As an IMDITHER user, I want uploaded images, pasted images, and bundled demo images to follow the same Auto-Tune worker path, so that behavior is consistent.
15. As an IMDITHER user, I want Auto-Tune to degrade predictably if workers are unavailable, so that the feature does not silently disappear in limited browsers.
16. As an IMDITHER user, I want worker fallback to stay behind the first preview, so that degraded behavior does not reintroduce initial preview blocking.
17. As an IMDITHER user, I want generated recommendations to keep the current visible labels, intents, ranks, and recommended marker, so that the UI language remains stable.
18. As an IMDITHER user, I want Auto-Tune recommendations to remain runtime state, so that they do not pollute saved settings or copied looks.
19. As an IMDITHER user, I want applying a recommendation to keep output dimensions, so that Auto-Tune does not unexpectedly resize my export.
20. As an IMDITHER user, I want the app to remain responsive on larger allowed sources, so that source size does not make recommendations feel unsafe.
21. As a maintainer, I want Auto-Tune worker work separated from preview and export worker work, so that recommendations cannot delay preview processing.
22. As a maintainer, I want the worker protocol to be typed and explicit, so that recommendation jobs are easy to reason about.
23. As a maintainer, I want Auto-Tune to receive a bounded analysis sample, so that worker messaging avoids full-source transfers.
24. As a maintainer, I want the analysis sample to be created during Source Intake, so that the app does not do a second full-source pass on the main thread.
25. As a maintainer, I want sample generation to reuse the core Auto-Tune sampling rule, so that worker migration does not change recommendation quality.
26. As a maintainer, I want the sampling rule to be exposed as a deep core utility, so that Source Intake and Auto-Tune share one deterministic contract.
27. As a maintainer, I want the Auto-Tune worker to be persistent, so that repeated recommendation jobs do not repeatedly pay worker startup cost.
28. As a maintainer, I want the Auto-Tune worker to cache small samples by source identity, so that future recompute flows avoid redundant sample transfer.
29. As a maintainer, I want stale-result handling at the client boundary, so that the synchronous core recommendation function does not need deep cancellation in this slice.
30. As a maintainer, I want worker-unavailable fallback to be explicit, so that unsupported browsers have predictable behavior.
31. As a maintainer, I want algorithm errors to surface as Auto-Tune errors, so that real bugs are not hidden by fallback.
32. As a maintainer, I want tests to protect observable behavior rather than private worker details, so that the implementation can evolve.
33. As a maintainer, I want the full verification gate to remain green, so that the worker migration does not weaken existing contracts.
34. As a maintainer, I want a clean path to future cooperative cancellation, so that deeper abort support can be added later if traces prove it is needed.
35. As a maintainer, I want a fresh trace after implementation, so that the worker migration can be validated against the original time-to-image bottleneck.

## Implementation Decisions

- Keep Auto-Tune as a runtime recommendation workflow, not a persisted editor mode.
- Preserve the public recommendation contract: archetype id, label, intent, Look Snapshot, rank, and exactly one strongest recommendation marker.
- Preserve recommendation application through the existing settings transition path.
- Preserve the current readiness gate: `App` enables Auto-Tune only after a processed preview buffer exists. The migration should keep that gate in the hook contract rather than introducing a second readiness source.
- Add a dedicated persistent Auto-Tune worker rather than sharing the preview/export processing worker.
- Keep preview and export processing higher priority by isolating Auto-Tune from the processing worker queue.
- Use a bounded Auto-Tune analysis sample instead of transferring the full Source Image to the Auto-Tune worker.
- Use a maximum long edge of 256 pixels for the Auto-Tune analysis sample.
- Promote Auto-Tune sample creation into a reusable core contract so sampling behavior stays deterministic and shared. The new public helper should preserve the current private `sampleSource` behavior used by Auto-Tune scoring.
- Keep `recommendAutoTuneLooks` compatible with a full Source Image or a pre-bounded analysis sample. Passing the Source-Intake-created sample to the worker should not change recommendation shape.
- Create the analysis sample during Source Intake, after source decode and pixel extraction, before returning the accepted source result.
- Create the sample in the same execution context that already extracted source pixels: the existing Source Intake worker for normal upload, paste, and demo paths, and the main-thread fallback only when Source Intake workers are unavailable.
- Do not add a second full-source sampling pass on the main thread for the normal worker-backed intake path.
- Carry the analysis sample alongside the loaded source runtime state.
- Treat the analysis sample as runtime-only data. It should not become part of copied settings, Look Snapshots, persisted editor settings, or export metadata.
- Keep the full source buffer for preview and export processing.
- Keep the analysis sample for Auto-Tune scoring only.
- Use a typed worker protocol dedicated to Auto-Tune recommendation jobs.
- Keep the Auto-Tune worker protocol separate from the existing processing worker protocol.
- Keep the current Source Intake worker lifecycle unchanged in this slice. The Source Intake worker is per-intake today; only the Auto-Tune recommendation worker is required to be persistent.
- The Auto-Tune worker request should include a job id, source identity, optional analysis sample, settings snapshot, and output dimensions.
- The Auto-Tune worker response should return either recommendations or an error message for the matching job id and source identity.
- The Auto-Tune worker should cache analysis samples by source identity.
- Use a small least-recently-used sample cache with a maximum of four source samples.
- The client should send the sample on the first job for a source and omit it on later jobs when the worker is expected to have the cached sample.
- If the worker reports a missing cached sample, the client should forget that source identity and retry once with the sample.
- Use soft cancellation for the first worker migration: abort before posting when possible, ignore stale results after posting, and let in-flight core scoring finish naturally.
- Do not add deep cooperative cancellation checkpoints inside Auto-Tune scoring, palette extraction, or core processing in this slice.
- Preserve the current hook behavior where settings changes are not an effect dependency for recommendation generation. Auto-Tune should not restart on every control edit while the same source remains loaded.
- Start a recommendation job from a settings snapshot taken after the readiness gate opens and the loading paint has yielded.
- Accept a worker result only if the source identity and generation id still match current UI state.
- A new source invalidates the old recommendation generation.
- Auto-Tune loading should be true only after the first preview exists and while a recommendation job is pending.
- The desktop reduced-preview overlay should be tied to pending Preview
  Refinement work, not only to a reduced preview buffer being visible.
- Worker unavailable or worker startup/postMessage failure should use a main-thread fallback after a paint yield.
- Algorithm errors inside worker scoring should surface as Auto-Tune errors instead of silently falling back to main-thread scoring.
- Keep the app local-only. No backend scoring, upload service, account model, or online model call is introduced.
- Keep the existing visible Auto-Tune panel layout and recommendation card behavior unless worker state requires minor loading/error wiring.
- Preserve existing demo, upload, and clipboard source flows through the same Source Intake boundary.

## Testing Decisions

- Good tests should verify externally visible behavior: first-preview gating, background Auto-Tune loading, stale-result ignoring, source-change invalidation, worker success, worker error, and fallback behavior.
- Tests should avoid locking down private worker implementation details such as exact timer order, internal map operations, or exact module loading behavior.
- Core tests should cover deterministic analysis-sample creation from large and small sources.
- Core tests should verify that small sources can be reused directly or sampled without changing dimensions unnecessarily.
- Core tests should verify that large sources are reduced to the agreed maximum long edge while preserving aspect ratio.
- Source Intake tests should verify that accepted sources include an Auto-Tune analysis sample.
- Source Intake tests should verify that the analysis sample is produced for demo, upload, and fallback paths where practical.
- Source Intake tests should verify that oversized rejection remains unchanged and does not require an analysis sample.
- Source Intake tests that assert hidden pixel data or enumerable buffer keys should be updated for the new runtime-only sample without exposing raw pixel arrays in UI/debug snapshots.
- Worker protocol/client tests should verify complete responses, error responses, abort-before-post behavior, stale result ignoring, worker unavailable fallback, and retry-on-missing-sample behavior.
- Worker protocol/client tests should verify that the first job for a source sends a sample and later jobs may rely on cache.
- Worker protocol/client tests should verify that normal recommendation jobs post only the bounded analysis sample, not the full Source Image.
- Hook tests should verify that Auto-Tune does not run before the readiness gate is enabled.
- Hook tests should verify that Auto-Tune loading starts only after readiness is enabled.
- Hook tests should verify that settings changes during an active job do not create repeated recommendation jobs.
- Hook tests should verify that a new source invalidates old recommendations and ignores old completions.
- UI component tests should continue to assert recommendation rendering, loading, error, apply, and applied/recommended marker behavior.
- Existing Auto-Tune public contract tests remain the authority for recommendation shape and deterministic shortlist behavior.
- Existing Source Intake tests are prior art for accepted/rejected source behavior and worker fallback.
- Existing processing worker client tests are prior art for typed worker request/response and cache-retry behavior.
- Existing Processing Jobs tests are prior art for stale job and cancellation semantics.
- Existing preview tests are prior art for protecting first visible preview behavior and reduced-preview notice behavior without asserting implementation internals.
- A fresh browser trace can compare time from navigation/source load to first ready processed preview and confirm whether long-running "Preview Only" display is actual work or only overlay state.
- The implementation passed the full repository verification gate after code changes.

## Out of Scope

- No new visible Auto-Tune controls.
- No change to recommendation labels, intents, or visible archetype count.
- No change to the Look Snapshot schema.
- No change to copied settings payloads.
- No persistence of analysis samples.
- No persistence of recommendation reasoning or scoring metrics.
- No auto-apply behavior.
- No backend Auto-Tune service.
- No image upload.
- No account system.
- No ML dependency.
- No ONNX, TensorFlow.js, CLIP, NIMA, LPIPS, or similar model runtime.
- No GPU/WebGPU implementation.
- No WASM rewrite.
- No change to dithering algorithms.
- No change to palette presets.
- No change to export formats or export quality behavior.
- No change to undo/redo semantics.
- No deep cooperative cancellation inside core scoring in this slice.
- No manual regenerate button unless a later PRD introduces it.
- No requirement to optimize total CPU time if the first-preview critical path is fixed.

## Further Notes

This PRD follows the trace-backed finding that the first-preview delay was not
dominated by the dither worker itself. The current first improvement already
gates Auto-Tune behind first preview. This worker migration is the next step:
keep that gate and move the secondary recommendation work off the main thread.

The intended deep modules are:

- Auto-Tune Sampling: deterministic creation of a bounded analysis sample, extracted from the current private Auto-Tune sampling rule.
- Source Intake Result: loaded source plus runtime analysis sample created in the same worker or fallback context that decoded the source.
- Auto-Tune Worker Protocol: typed recommendation job messages.
- Auto-Tune Worker Client: persistent worker lifecycle, sample cache knowledge,
  abort-before-post behavior, retry-on-missing-sample, fallback, and stale-result
  handling.
- Auto-Tune Worker Runtime: recommendation generation from cached or posted
  analysis samples.
- Auto-Tune Hook: UI-facing loading, error, recommendation, and applied marker
  state.

Implementation should proceed in red-green slices:

1. Add the shared sampling contract and carry the analysis sample through Source
   Intake.
2. Add the worker protocol and persistent worker client with behavior tests.
3. Add the worker runtime and cache behavior.
4. Migrate the Auto-Tune hook to the worker client while preserving the first
   preview gate.
5. Verify, then use fresh traces to confirm the first-preview critical path no
   longer includes Auto-Tune scoring and that desktop reduced-preview notices
   are tied to active refinement work.
