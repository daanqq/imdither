# Phase 8.2 PRD: CPU Hot-Path Cleanup

Status: implemented
Last updated: 2026-05-05

## Problem Statement

Before adding heavier acceleration layers, IMDITHER should remove avoidable CPU
and allocation costs in the current deterministic pipeline.

## Solution

Use Phase 8.1 measurements to apply narrow CPU-path optimizations: buffer
pooling, fewer intermediate arrays, faster palette matching internals, and
deterministic stage cache improvements.

## Requirements

- Pool hot `Uint8ClampedArray` and `Float32Array` buffers where ownership is
  clear.
- Reduce intermediate allocations in palette matching and quantization.
- Improve deterministic stage cache invalidation without changing processing
  semantics.
- Preserve worker cancellation and stale-result behavior.
- Keep Pixel Buffers, binary assets, DOM objects, and runtime handles out of
  Editor Settings and Effect Stack data.
- Document whether each cache decision is compatible with future Frame
  Sequence processing.
- Use measured wins from Phase 8.1 as the implementation driver.

## Acceptance Criteria

- At least one representative workload shows measurable improvement.
- Visual golden fixtures remain unchanged.
- Settings JSON remains compatible.
- Still preview and export behavior remain unchanged.
- Future Frame Sequence compatibility notes exist for cache decisions.

## Out of Scope

- No OffscreenCanvas adoption.
- No tile-based processing.
- No WASM or GPU path.
- No third-party library adoption.
- No motion implementation.

## Implementation Notes (2026-05-05)

### New Files

| File | Purpose |
|---|---|
| `packages/core/src/buffer-pool.ts` | Float32Array + PixelBuffer pool with acquire/release/clear |
| `packages/core/src/buffer-pool.test.ts` | 8 tests: pool acquire, reuse, cross-size isolation, clear |
| `packages/core/src/memory-baselines-pool.test.ts` | 3 tests: pool reduces Float32Array allocs across calls |

### Changed Files

| File | Change |
|---|---|
| `packages/core/src/stages.ts` | Float32Array pool in `diffuseError` + `ditherOstromoukhov`; scratch arrays replace per-pixel `[r,g,b]` tuples in 5 call sites; `createBuffer` uses `acquirePixelBuffer` + native `fill()` |
| `packages/core/src/effect-registry.ts` | `clonePixelBuffer` uses `acquirePixelBuffer` + `data.set()`; `applyEffectStages` releases intermediate chain buffers |
| `packages/core/src/process.ts` | Pipeline releases `flattened/resized/effected/preprocessed/dithered` when no cache present |
| `packages/core/src/memory-baselines.test.ts` | `clearPool()` added for test isolation |

### Optimizations Applied

1. **Float32Array work buffer pool** — `diffuseError` and `ditherOstromoukhov` use shared pool keyed by `byteLength`. Eliminates ~9.4MB allocation per 960x640 diffusion call on reuse.

2. **PixelBuffer pool** — `createBuffer` and `clonePixelBuffer` use `acquirePixelBuffer`. Pipeline releases intermediates (`process.ts` without cache, `effect-registry.ts` chain).

3. **Scratch arrays** — `mapToPalette`, `ditherWithThresholdMatrix`, `ditherHalftoneDot`, `diffuseError`, `ditherOstromoukhov` reuse mutable `[r,g,b]` scratch arrays instead of creating tuple per pixel. Eliminates ~8M tuple allocations per megapixel.

4. **Native fill** — `createBuffer` uses `data.fill(fill)` instead of JS loop.

### Not Implemented

- Stage cache frame-sequence-aware eviction — requires Phase 6 motion contract first
- `clonePixelBuffer` duplication (`effect-registry.ts` vs `stages.ts`) — minor, no circular dep risk
- Frame Sequence compatibility notes for cache decisions

### Verification

- 140 tests pass, 4 skipped (same as baseline)
- TypeScript strict mode: zero errors
- Settings JSON schema: unchanged
- Visual golden fixtures: no drift (all process-goldens.test.ts pass)
- Memory baselines: 2 sequential `processImage` calls → 1 Float32Array allocation (was 2)
- Worker cancellation and stale-result behavior: preserved (no changes to worker code)

## Dependency Notes

This slice may proceed before Phase 6 when it stays inside still-image CPU
semantics. If a cache decision requires real frame timing, disposal, or temporal
stability rules, write the Phase 6 contract first.
