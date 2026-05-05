# Phase 8.1 PRD: Measurement and Baseline Gates

Status: implemented
Last updated: 2026-05-05

## Problem Statement

Phase 8 must improve performance without turning optimization into a broad
rewrite. IMDITHER needs repeatable measurements before choosing pooling,
tiling, OffscreenCanvas, WASM, WebGL, WebGPU, or third-party libraries.

## Solution

Add representative performance and memory baselines for still-image processing,
export, and future motion-shaped workloads. The baselines define pass/fail gates
for later acceleration slices.

## Requirements

- Measure representative small, medium, large, and huge still-image workloads.
- Include palette matching, quantization, ordered dithering, error diffusion,
  halftone, pre-effects, post-effects, preview, and export paths.
- Record allocation pressure for hot `Uint8ClampedArray` and `Float32Array`
  paths.
- Preserve visual golden fixtures as the no-drift gate.
- Document the browser and machine profile used for baseline numbers.
- Include a future-motion workload shape without requiring Phase 6
  implementation.
- Define success thresholds for later slices.
- Keep baselines non-invasive and browser-local.

## Acceptance Criteria

- Maintainers can run baseline measurement locally.
- Baseline output identifies hot paths and allocation pressure.
- Later Phase 8 slices have explicit measurement gates.
- No Editor Settings semantics change.
- No visual fixture drift.

## Out of Scope

- No production acceleration path.
- No WASM, GPU, codec, or third-party dependency adoption.
- No motion implementation.

## Implementation Notes (2026-05-05)

### New Files

| File | Purpose |
|---|---|
| `packages/core/src/baseline-runner.ts` | Shared helpers: `createBaselineInput`, `getMachineProfile`, `trackAllocations`, `createFrameSequence`, `BASELINE_GATES` |
| `packages/core/src/baseline-runner.test.ts` | 9 tests for baseline utilities |
| `packages/core/src/performance-baselines.bench.ts` | 28 vitest bench scenarios: ordered/diffusion/halftone/quantization/effects/size-scaling/preview-export/palette-matching/preprocess |
| `packages/core/src/memory-baselines.test.ts` | 7 tests for Uint8ClampedArray/Float32Array allocation pressure |
| `packages/core/src/motion-workload-shape.test.ts` | 5 tests for synthetic motion frame sequence workloads |
| `packages/core/src/baseline-gates.test.ts` | 4 tests for threshold gate constants |

### Package Scripts

- `bun run test:baseline` — runs all 35 baseline tests
- `bun run perf:bench` — runs 28 vitest bench scenarios

### Baseline Machine Profile (Linux x64, 12 cores, 23GB, Node 24)

| Scenario | Median |
|---|---|
| Ordered Bayer 4x4 (240x160) | ~85ms |
| Floyd-Steinberg (960x640) | ~126ms |
| Export 1920x1280 | ~358ms |
| Halftone dot round (240x160) | ~117ms |

### Threshold Gates

11 gates defined in `BASELINE_GATES` with `maxMedianMs` per processing path for later acceleration slices to target.

## Dependency Notes

This slice may proceed before Phase 6. It must not assume unresolved motion
semantics beyond using synthetic workload shapes.
