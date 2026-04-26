# Market Impact Roadmap

Status: planned
Last updated: 2026-04-26

## Source

This roadmap is derived from `IMDITHER Deep Research Report.pdf` and the local Markdown extraction in `deep-research-report.md`.

The research compares IMDITHER with adjacent dithering, effects, media, and creator-workflow tools such as Effect.app, Diffused Editor, Turbo Dither, Ditter, PhotoMosh, Polarr, FastEdit, and Dithermark.

## Strategic Direction

IMDITHER should not become a generic image editor. The stronger product position is a local-first retro image lab focused on palette reduction, dithering, halftone, screen texture, print-like aesthetics, and shareable looks.

The working product promise:

> Build looks from palette, texture, and screen structure.

This direction keeps the current local-only, browser-first, deterministic processing model while expanding the product from a focused dithering tool into a look-building workstation.

## Research Summary

Current strengths:

- DOM-free processing core in `packages/core`
- worker-backed processing boundary in `apps/web`
- local upload, drag-and-drop, clipboard paste, and demo image intake
- stable original, processed, and slide compare preview modes
- Fit and 1:1 preview semantics
- curated processing recipes
- registry-backed algorithms and preset palettes
- PNG, WebP, and JPEG export layer
- versioned settings schema with room for custom palettes

Main competitive gaps:

- no palette editor UI
- no palette extraction workflow
- no explicit color-depth control
- limited perceptual color matching
- no true zoom and pan inspection workflow
- no undo/history stack
- no shareable look payloads
- no composable effect stack
- no motion pipeline for GIF, APNG, WebM, or video
- no batch queue, public CLI, or published package surface
- no GPU or WASM acceleration layer

The highest-impact roadmap areas are:

1. palette tooling
2. color-depth and perceptual quality controls
3. inspection UX
4. shareable looks and history
5. effect-stack architecture
6. motion and automation surfaces
7. performance acceleration after stronger visual test coverage

## Prioritized Feature Plan

| Priority | Feature                                             | Impact                                                     | Complexity  |
| -------- | --------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| P0       | Documentation, license, and public contract cleanup | Makes the project externally legible before larger growth  | Low         |
| P1       | Palette editor with import/export and extraction    | Turns sessions into reusable creative assets               | Medium      |
| P1       | Explicit color-depth controls                       | Makes the product clearer for non-experts                  | Medium      |
| P1       | Oklab/Lab perceptual matching                       | Improves visible quality more than many extra kernels      | Medium      |
| P1       | Real zoom and pan inspection                        | Improves trust in pixel-level output                       | Low-medium  |
| P1       | Multi-format still export hardening                 | Keeps standard creator workflows covered                   | Medium      |
| P2       | Auto-Tune and recipe recommender                    | Gives users strong starting points from image analysis     | Medium      |
| P2       | Undo/history and shareable looks                    | Makes experimentation safe and repeatable                  | Medium      |
| P2       | Effect stack MVP                                    | Moves IMDITHER from tool to workstation                    | Medium-high |
| P3       | Dither breadth expansion                            | Improves credibility versus direct dithering competitors   | Medium      |
| P3       | Halftone and screening lab                          | Differentiates IMDITHER around print and screen aesthetics | High        |
| P4       | GIF, APNG, WebM, and video pipeline                 | Differentiates against still-only tools                    | High        |
| P4       | Batch queue, public core package, and CLI           | Opens pro and automation workflows                         | Medium-high |
| P5       | WASM and GPU hot paths                              | Improves large-frame, batch, and motion performance        | High        |

## Implementation TODO

### Phase 0: Core Hardening

- [x] Sync `docs/PRD.md` with the current product state.
- [x] Make the root license explicit and easy to find.
- [x] Document the public settings and schema contract.
- [x] Add golden fixtures for core algorithms.
- [x] Add export contract fixtures for PNG, WebP, and JPEG.
- [x] Add deterministic visual contract checks for preview and export behavior.
- [x] Add representative performance fixtures before any WASM or GPU work.

Success signal: shipped. The repo is safer to extend, easier to understand from
the outside, and protected against silent visual regressions through public
contract docs, settings contract tests, core pixel goldens, export contract
tests, existing preview/compare Vitest coverage, and a non-gating performance
baseline command.

### Phase 1: Palette Platform MVP

- [x] Add a custom palette editor UI backed by existing settings support.
- [x] Import palettes from `.hex`, `.gpl`, `.json`, and clipboard text.
- [x] Export palettes as JSON and GPL.
- [x] Add palette extraction from the current source image.
- [x] Start extraction with median-cut quantization.
- [x] Keep optional k-means refinement as a later quality pass.
- [x] Separate `palette source` from `palette size` without persisting them as settings fields.
- [x] Preserve Processing Presets as applied recipes, not persisted modes.

Success signal: shipped. Users can create, reuse, and exchange palettes without leaving the local editor.

### Phase 2: Color Quality and Inspection

- [ ] Add explicit color-depth controls.
- [ ] Add Oklab or Lab nearest-color matching.
- [ ] Add a matching mode control where it is visually meaningful.
- [ ] Add recipe variants that demonstrate perceptual matching versus RGB matching.
- [ ] Add continuous zoom.
- [ ] Add pan.
- [ ] Add optional pixel grid.
- [ ] Add a cursor loupe.
- [ ] Keep original and processed transforms locked during zoomed compare.

Success signal: users can intentionally control palette size, trust color matching, and inspect pixel-level output.

### Phase 3: Look-Building Workflow

- [ ] Add undo and redo for editor settings changes.
- [ ] Add immutable look snapshots.
- [ ] Add shareable looks through URL-safe or clipboard-safe payloads.
- [ ] Add an Auto-Tune analysis pass over histogram, entropy, edge density, palette suitability, and output size.
- [ ] Return 3-5 recommended looks instead of one opaque magic result.
- [ ] Keep copied Settings JSON focused on processing, not transient UI state.

Success signal: users can explore aggressively, recover quickly, and share repeatable looks.

### Phase 4: Effect Stack MVP

- [ ] Write a dedicated PRD for a serializable effect stack.
- [ ] Model stages as typed `pre`, `quantize`, `dither`, and `post` stages.
- [ ] Support stage enable/disable.
- [ ] Support stable stage ordering.
- [ ] Keep stage parameters serializable.
- [ ] Keep the existing deterministic processing path as the compatibility baseline.
- [ ] Add first post-effects: grain, CRT bloom, edge threshold, and paper/noise texture.
- [ ] Add first pre-effects: blur-before-dither and contrast shaping.
- [ ] Keep effect stack state out of large pixel buffers and binary data.

Success signal: dithering becomes one part of a broader local look-building pipeline.

### Phase 5: Algorithm and Halftone Breadth

- [ ] Group algorithms by family in the UI.
- [ ] Add Jarvis-Judice-Ninke error diffusion.
- [ ] Add full Sierra.
- [ ] Add Two-Row Sierra.
- [ ] Add Ostromoukhov adaptive error diffusion as a high-quality still mode.
- [ ] Evaluate void-and-cluster blue-noise mask generation.
- [ ] Evaluate Joel Yliluoma-style arbitrary-palette positional dithering.
- [ ] Evaluate dot diffusion for future parallel-friendly execution.
- [ ] Expand halftone controls with dot shape, angle, frequency, and pattern size.
- [ ] Explore pseudo-CMYK or channel-separated screening as an advanced print mode.

Success signal: IMDITHER has enough breadth to compete with serious dithering tools without turning the algorithm selector into a flat, noisy list.

### Phase 6: Motion and Export Surfaces

- [ ] Add an animated-image intake spike using browser frame decoding APIs.
- [ ] Define a frame sequence processing contract.
- [ ] Add frame preview controls.
- [ ] Add temporal stability options for animated dithering.
- [ ] Add GIF or APNG export as the first motion output.
- [ ] Add WebM/video export through a WebCodecs-based path where supported.
- [ ] Keep still-image export stable while adding motion.

Success signal: IMDITHER differentiates from still-only dithering tools while preserving local-first processing.

### Phase 7: Automation and Pro Workflows

- [ ] Define a publishable `@imdither/core` package contract.
- [ ] Expose a headless processing API.
- [ ] Add a CLI for files, folders, recipes, and settings JSON.
- [ ] Add a batch queue to the web app.
- [ ] Add output naming templates.
- [ ] Add resumable or cancellable batch progress.
- [ ] Keep batch workers separate from interactive preview workers where useful.

Success signal: IMDITHER supports production throughput without requiring a backend service.

### Phase 8: Performance Acceleration

- [ ] Add buffer pooling for hot `Uint8ClampedArray` and `Float32Array` paths.
- [ ] Reduce intermediate allocations in palette matching and quantization.
- [ ] Evaluate OffscreenCanvas in workers.
- [ ] Add deterministic stage cache invalidation.
- [ ] Add tile-based processing for huge output paths.
- [ ] Move nearest-palette search and quantization candidates to WASM only after baselines exist.
- [ ] Move ordered dithers, halftone, blur, edge, bloom, color transforms, and compositing candidates to WebGL or WebGPU only after profiling.
- [ ] Keep sequential error diffusion on CPU until a measured alternative is better.

Success signal: performance work follows measured bottlenecks instead of a broad rewrite.

## Non-Goals

- Do not pivot into a general-purpose photo editor.
- Do not add accounts, cloud sync, or backend processing as part of this roadmap.
- Do not prioritize neural or ML effects unless the product direction changes.
- Do not start with a full GPU rewrite.
- Do not turn Processing Presets into a second settings model.
- Do not make motion work destabilize still-image export.
- Do not ship algorithm breadth without visual fixtures that catch drift.

## Recommended Starting Slice

The first implementation slice should be:

1. palette editor UI
2. palette import/export
3. explicit color-depth controls
4. Oklab or Lab matching
5. zoom and pan inspection

This slice has the best combination of visible user impact, competitive positioning, and compatibility with the current local-first architecture.
