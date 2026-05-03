# Phase 4.3 PRD: First Effects

Status: implemented
Last updated: 2026-05-03

## Problem Statement

Effect Stack Core and UI create a pipeline and editing surface, but Phase 4 only
becomes useful when users can add effects that visibly extend IMDITHER beyond
one dither pass. The first effects must support the roadmap promise of building
looks from palette, texture, and screen structure while staying deterministic
and local-first.

## Outcome

Add six deterministic optional Effect Stages:

- `pre.blur`
- `pre.contrast-shape`
- `post.grain`
- `post.edge-threshold`
- `post.paper-noise`
- `post.crt-bloom`

All effects operate on Pixel Buffers inside the DOM-free core package. Noise
effects use seeded coordinate hashing and never use `Math.random()`.

## Requirements

1. `pre.blur` runs before existing preprocessing and dither/quantize behavior.
2. `pre.blur` defaults to radius `1.5`.
3. `pre.contrast-shape` runs before existing preprocessing and defaults to
   amount `0.25` and curve `soft`.
4. `post.grain` runs after dither/quantize behavior and defaults to amount
   `0.12` with a stable seed.
5. `post.edge-threshold` runs after dither/quantize behavior and defaults to
   threshold `0.32` and strength `0.5`.
6. `post.paper-noise` runs after dither/quantize behavior and defaults to
   amount `0.08` and scale `2`.
7. `post.crt-bloom` runs after dither/quantize behavior and defaults to
   intensity `0.2` and radius `2`.
8. CRT bloom radius is bounded small in the MVP.
9. Effects are deterministic across repeated runs for the same Source Image and
   Editor Settings.
10. Effects work for preview and Full Output through the same processing path.
11. Effects are included in processing cache keys.
12. Effects stay CPU-only in this slice.
13. Stage params are clamped and validated through schema v3.
14. Visual fixtures cover at least one pre effect and one post effect.

## Acceptance Criteria

- Each effect changes output when enabled and leaves output unchanged when
  disabled.
- Repeated runs with same settings produce byte-stable Pixel Buffers.
- Seeded noise effects are deterministic and do not use global randomness.
- CRT bloom stays bounded enough for normal preview/export verification.
- Effects compose through fixed group ordering.
- Existing default processing remains unchanged when no optional effects are
  enabled.

## Allowed Side Effects

- Core stage module gains new pixel-stage helpers.
- Golden fixtures expand for effect outputs.
- Auto-Tune rendered scoring may observe changed output only when a user applies
  stack effects; Auto-Tune itself remains stack-neutral.
- Performance baseline may shift for stack-enabled settings, but default
  baseline should remain close to current behavior.

## Verification Evidence

Implementation should provide:

- unit tests for each effect's deterministic behavior and disabled behavior;
- process tests for pre/core/post ordering;
- golden fixtures for representative effect output;
- performance fixture notes for CRT bloom if runtime meaningfully changes;
- `bun verify` after code changes.

## Out of Scope

- No GPU, WebGL, WebGPU, or WASM implementation.
- No animated CRT scanline simulation.
- No imported texture images or binary texture assets.
- No full paper material editor.
- No physical CRT emulation.
- No stack-aware Auto-Tune ranking.
- No stack-aware Processing Presets.
