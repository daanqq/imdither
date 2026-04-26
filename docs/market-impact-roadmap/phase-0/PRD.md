# Market Impact Roadmap Phase 0 PRD

Status: done
Last updated: 2026-04-26

## Problem Statement

IMDITHER is already useful as a local-first dithering workstation, but the repo
is not hardened enough for the broader Market Impact Roadmap. The current
product contract, settings schema, licensing posture, deterministic visual
baselines, export behavior, and performance reference scenarios are spread
across code, tests, roadmap notes, and feature PRDs.

From a maintainer's perspective, this creates risk before Phase 1 palette work:
a future feature could silently change algorithm output, blur the boundary
between processing settings and UI preferences, weaken export behavior, or make
performance claims without a comparable baseline.

Phase 0 exists to make the project externally legible and safer to extend. It
must harden the current product without adding new product features.

## Solution

Create a core hardening baseline for the current product:

- make the repository license explicit with MIT licensing
- keep the root PRD synchronized with the implemented product
- document the public settings and schema contract in a dedicated reference
- add deterministic core pixel golden fixtures for algorithm behavior
- add export contract fixtures for PNG, WebP, and JPEG behavior
- strengthen visual drift checks through deterministic preview and export
  contracts in the existing Vitest layer
- add representative non-gating performance fixtures before any WASM or GPU work

The Phase 0 exit criterion is a public hardening baseline: a maintainer or
external contributor can understand what IMDITHER currently promises, what JSON
settings mean, what behavior is protected by tests, and what performance
scenarios must be compared before acceleration work.

Phase 0 should be implemented in four sequential slices:

1. `public-contract`
2. `core-goldens`
3. `export-goldens`
4. `visual-perf-baseline`

## User Stories

1. As a maintainer, I want the repository license to be explicit, so that users
   and contributors understand the usage rights.
2. As a maintainer, I want MIT licensing, so that future package, CLI, and
   creative-tool integrations have low adoption friction.
3. As an external developer, I want the README to point to the product and
   schema contracts, so that I can understand the project without reading every
   source file.
4. As an OSS user, I want the root PRD to match the shipped product, so that
   docs do not describe stale behavior.
5. As a maintainer, I want a dedicated settings schema reference, so that the
   clipboard and future public JSON contract have one stable source of truth.
6. As a user copying settings JSON, I want the documented schema to explain what
   is included, so that I know what will be restored later.
7. As a user copying settings JSON, I want the documented schema to explain what
   is excluded, so that I do not expect source images, preview state, or export
   preferences to be part of processing settings.
8. As a maintainer, I want the settings contract to distinguish processing
   settings from UI preferences, so that future features do not persist
   transient state in the wrong model.
9. As a maintainer, I want the settings contract to document schema version 1,
   so that migrations and additive changes have a clear compatibility baseline.
10. As a maintainer, I want invalid pasted settings to remain rejected or
    safely normalized, so that the editor cannot enter an unsupported state.
11. As a maintainer, I want partial settings normalization documented, so that
    default merging behavior is intentional.
12. As a maintainer, I want recipe identity excluded from settings JSON, so that
    Processing Presets remain applied recipes rather than a second settings
    model.
13. As a maintainer, I want export format and export quality excluded from
    Editor Settings, so that file encoding preferences do not change processing
    reproducibility.
14. As a maintainer, I want core algorithm output protected by compact pixel
    fixtures, so that algorithm drift is visible in code review and tests.
15. As a maintainer, I want golden fixtures to use direct `PixelBuffer` data, so
    that core tests stay DOM-free and independent from image encoders.
16. As a maintainer, I want fixtures to be small and reviewable, so that test
    failures can be understood without opening binary images.
17. As a maintainer, I want representative settings cases for ordered,
    diffusion, direct quantization, and special algorithms, so that the most
    important visual families are protected.
18. As a maintainer, I want the core golden harness to call the public
    processing API, so that tests protect external behavior rather than private
    implementation details.
19. As a contributor adding an algorithm, I want an obvious place to add or
    update core goldens, so that new visual behavior is reviewed deliberately.
20. As a maintainer, I want export fixtures for PNG, WebP, and JPEG contracts,
    so that format behavior cannot drift silently.
21. As a maintainer, I want export tests to assert MIME type, extension, and
    quality handling, so that UI choices map to the intended browser encoder
    requests.
22. As a maintainer, I want JPEG alpha flattening covered by exact pre-encode
    pixel expectations, so that transparent input is handled intentionally.
23. As a maintainer, I want encoder failure behavior covered, so that unsupported
    browser encoders fail explicitly instead of silently producing the wrong
    format.
24. As a maintainer, I want export goldens to avoid byte-for-byte PNG, WebP, and
    JPEG snapshots in Phase 0, so that tests do not depend on unstable browser
    encoder output.
25. As a maintainer, I want visual drift checks to reuse existing unit and
    component test layers, so that the baseline remains fast and compatible with
    the current workflow.
26. As a maintainer, I want Fit and 1:1 preview sizing contracts covered, so
    that preview behavior does not regress while palette and inspection features
    are added.
27. As a maintainer, I want slide comparison alignment and control behavior
    covered, so that before/after preview remains trustworthy.
28. As a maintainer, I want export jobs to stay full-output operations, so that
    screen preview optimizations cannot reduce exported image quality.
29. As a maintainer, I want visual drift wording to be precise, so that Phase 0
    does not overclaim screenshot-diff coverage.
30. As a maintainer, I want performance fixtures before WASM or GPU work, so
    that acceleration proposals can be compared against representative current
    behavior.
31. As a maintainer, I want performance fixtures to be non-gating in Phase 0, so
    that normal verification is not flaky across local and CI hardware.
32. As a maintainer, I want performance scenarios to include representative
    image buffers and settings, so that later measurements are not based on a
    trivial path only.
33. As a maintainer, I want timing output to be report-style first, so that
    thresholds can be calibrated later with real data.
34. As a contributor, I want Phase 0 split into focused slices, so that review
    can happen around one kind of risk at a time.
35. As a maintainer, I want the `public-contract` slice first, so that the
    fixture work knows exactly what public behavior it protects.
36. As a maintainer, I want the `core-goldens` slice before algorithm breadth
    expansion, so that new algorithms do not arrive without regression coverage.
37. As a maintainer, I want the `export-goldens` slice before export hardening,
    so that existing browser export behavior is locked down first.
38. As a maintainer, I want the `visual-perf-baseline` slice before GPU or WASM
    work, so that acceleration work follows evidence instead of assumption.
39. As a user, I want Phase 0 to avoid new UI features, so that hardening does
    not destabilize the current editor experience.
40. As a maintainer, I want Phase 0 to remain compatible with the existing
    local-only browser model, so that public hardening does not introduce a
    backend or cloud dependency.

## Implementation Decisions

- Phase 0 is a hardening phase, not a product feature phase.
- The accepted Phase 0 exit criterion is a public hardening baseline:
  licensing, settings contract docs, current PRD alignment, deterministic core
  goldens, export contract goldens, visual contract checks, and non-gating
  performance fixtures.
- Phase 0 is split into four implementation slices: `public-contract`,
  `core-goldens`, `export-goldens`, and `visual-perf-baseline`.
- The repository license will be MIT.
- The public settings and schema contract will live in a dedicated settings
  schema reference document, not only inside the root PRD.
- The root PRD remains the product contract. The settings schema document is
  the stable reference for the versioned settings JSON contract.
- Editor Settings schema version 1 remains processing-only.
- Editor Settings include algorithm, Bayer size, palette identity, optional
  custom palette data, alpha background, resize settings, and preprocessing
  settings.
- Editor Settings exclude recipe identity, compare mode, view scale, export
  format, export quality, source image data, preview target dimensions, runtime
  job status, and other transient UI state.
- Processing Presets remain applied recipes. Recipe identity is derived from
  current settings and is not persisted in settings JSON.
- Export format and export quality remain export preferences outside Editor
  Settings.
- Core golden fixtures will use compact direct pixel data, not binary image
  files.
- Core golden fixtures will exercise the public processing API with fixed input
  buffers and expected RGBA output arrays.
- Core golden fixtures should be stored close to core tests and should be easy
  to review as text.
- Export golden fixtures in Phase 0 are contract fixtures, not byte-for-byte
  encoded PNG, WebP, or JPEG snapshots.
- Export contract fixtures should assert pre-encode behavior and browser encoder
  request behavior: format option, MIME type, extension, quality handling, alpha
  flattening, and failure reporting.
- Phase 0 visual drift checks will use the existing deterministic Vitest test
  layer rather than introducing Playwright screenshot diff infrastructure.
- Visual contract coverage should combine core pixel goldens, preview geometry
  tests, slide comparison tests, and export contract tests.
- Playwright or screenshot diff infrastructure remains a later decision after a
  stable browser baseline policy exists.
- Performance fixtures will be non-gating in Phase 0.
- Performance fixtures should provide representative scenarios and report
  timing output for manual before/after comparison.
- Performance thresholds should not be added to the standard verification gate
  until CI/runtime noise has been calibrated.
- Phase 0 must not require running the development server as part of normal
  implementation.

## Testing Decisions

- Tests should protect public behavior and stable contracts, not private helper
  shapes.
- Core golden tests should assert exact deterministic RGBA output from the
  public processing API for small representative fixtures.
- Core golden tests should cover algorithm families rather than every private
  branch in the processing stages.
- Export tests should assert browser encoder contract behavior without relying
  on encoded binary bytes.
- JPEG alpha flattening should be tested through exact pre-encode pixel output.
- Encoder failure should remain explicitly tested for the selected format.
- Settings schema tests should cover valid settings, partial normalization,
  invalid schema rejection, and the boundary between processing settings and
  preferences.
- Preview visual contract tests should cover Fit sizing, 1:1 sizing, preview
  target separation from final settings, slide comparison accessibility, and
  layer alignment behavior where observable.
- Performance fixtures should not fail `bun verify` based on timing thresholds.
- Performance fixture output should be useful for manual comparison before and
  after acceleration work.
- Prior art includes current core pipeline tests, algorithm registry tests,
  processing preset tests, export layer tests, screen preview sizing tests,
  processing job tests, preview stage tests, and slide compare preview tests.
- The standard verification command after non-documentation changes remains the
  root verification command.

## Out of Scope

- No palette editor UI.
- No palette import or export UI.
- No palette extraction.
- No explicit color-depth controls.
- No Oklab or Lab color matching.
- No zoom and pan inspection workflow.
- No undo or redo stack.
- No shareable look payloads.
- No effect stack.
- No motion pipeline.
- No batch queue, public package release, or CLI.
- No WASM or GPU acceleration.
- No backend, accounts, cloud sync, or remote processing.
- No Playwright screenshot diff infrastructure in Phase 0.
- No byte-for-byte PNG, WebP, or JPEG encoded snapshots in Phase 0.
- No timing thresholds in the standard verification gate in Phase 0.

## Shipped Scope

Phase 0 shipped as a hardening baseline without adding editor UI features:

- MIT licensing is explicit in the root `LICENSE` file and package metadata.
- README links the current product PRD, settings schema reference, and license.
- `docs/settings-schema.md` documents Editor Settings schema version 1, included
  processing fields, excluded UI/export/runtime state, partial normalization,
  invalid-settings rejection, and compatibility expectations.
- Settings schema tests protect partial normalization, invalid schema rejection,
  and the boundary between processing settings and UI/export preferences.
- Core pixel goldens protect ordered, diffusion, direct quantization, and special
  algorithm families through the public `processImage` API.
- Export contract tests assert MIME type, extension, quality handling, JPEG alpha
  flattening, and explicit encoder failure behavior without byte snapshots.
- Existing deterministic Vitest coverage remains the visual contract layer for
  preview sizing, slide comparison, full-output export jobs, and export behavior.
- `bun run --cwd packages/core perf:baseline` provides non-gating timing reports
  for representative ordered, diffusion, and export-sized special-algorithm
  scenarios.

## Further Notes

Palette tooling, perceptual matching, inspection UX, effect stacks, motion
support, automation, and acceleration should build on these public contracts.
Performance acceleration work should compare against the non-gating baseline
before adding thresholds or moving hot paths to WASM/GPU.
