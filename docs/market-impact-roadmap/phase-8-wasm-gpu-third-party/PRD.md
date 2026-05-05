# Phase 8.4 PRD: WASM, GPU, and Third-Party Evaluation

Status: planned
Last updated: 2026-05-03

## Problem Statement

WASM, WebGL, WebGPU, and third-party libraries can improve performance, but they
can also increase bundle size, browser variance, determinism risk, and
maintenance cost. Phase 8 needs evaluation gates before adoption.

## Solution

Evaluate acceleration candidates through narrow Acceleration Adapters. Each
candidate ends with a documented ship, defer, or reject decision based on
measured performance, determinism, browser support, bundle impact, license, and
fallback behavior.

## Requirements

- Keep every candidate behind an Acceleration Adapter.
- Evaluate WASM only after CPU baselines identify a bottleneck worth moving.
- Evaluate WebGL or WebGPU first for ordered dithers, halftone, blur, edge,
  bloom, color transforms, and compositing candidates.
- Keep sequential error diffusion on CPU until a measured alternative is better.
- Evaluate third-party libraries as candidates, not default foundations.
- Document bundle impact and browser support.
- Document deterministic output behavior or accepted tolerance.
- Document fallback behavior for unsupported APIs.
- Document compatibility with future Frame Sequence processing.

## Candidate Shortlist

- Browser `OffscreenCanvas` and transfer paths.
- WebCodecs-related helpers for future motion export.
- GIF/APNG/WebP encoder or decoder libraries only through Phase 6 evidence.
- WASM image-processing libraries only when they preserve local-first behavior
  and fit bundle/license constraints.
- WebGL/WebGPU helper libraries only when they reduce implementation risk
  without hiding too much processing behavior.

## Acceptance Criteria

- Each candidate has ship, defer, or reject outcome.
- Shipped candidates show measurable improvement on representative workload.
- No visual drift unless a later PRD explicitly accepts tolerance.
- Fallback path is documented and tested.
- No acceleration candidate becomes the core foundation without evidence.

## Out of Scope

- No full GPU rewrite.
- No custom decoder or encoder implementation.
- No motion implementation unless Phase 6 implementation has already accepted
  that scope.
- No public package or CLI work.

## Dependency Notes

This slice should generally follow Phase 6 spike work when codec, frame, or
motion-export assumptions are involved. Still-only acceleration candidates may
be evaluated earlier if the PRD states that no motion semantics are assumed.
