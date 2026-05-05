# Phase 8.3 PRD: Canvas, Worker, and Tile Architecture

Status: planned
Last updated: 2026-05-03

## Problem Statement

Large still outputs and future motion output will stress memory and worker
boundaries. IMDITHER needs a deliberate tile and canvas architecture before
moving heavy work across browser APIs.

## Solution

Evaluate OffscreenCanvas in workers and define an internal tile-processing
contract for huge output paths. Keep the user-facing preview/export workflow the
same while making memory behavior more predictable.

## Requirements

- Evaluate OffscreenCanvas support and fallback behavior.
- Define an internal tile contract for huge Full Output processing.
- Keep tile behavior invisible to the normal preview UI.
- Preserve deterministic composition across tile boundaries.
- Keep sequential error diffusion on CPU unless a measured alternative is
  proven later.
- Ensure ordered dithers, halftone, blur, edge, bloom, color transforms, and
  compositing can be considered as tile-friendly candidates.
- Document memory budget and worker ownership boundaries.
- Document compatibility with Frame Sequence processing.

## Acceptance Criteria

- Huge still-output path has a documented tile strategy.
- OffscreenCanvas decision is documented as ship, defer, or reject.
- Fallback path works when OffscreenCanvas is unavailable.
- Visual output remains unchanged.
- Preview UX remains unchanged.

## Out of Scope

- No streaming preview UI.
- No motion implementation.
- No WASM or GPU production path.
- No custom codec work.

## Dependency Notes

This slice is blocked until Phase 6 is described if tile or worker decisions
need real motion semantics. It may proceed earlier only for still-only internal
tiling with explicit no-motion assumptions.
