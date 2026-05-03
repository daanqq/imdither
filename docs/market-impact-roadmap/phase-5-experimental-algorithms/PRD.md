# Phase 5.2 PRD: Experimental Algorithm Evaluation

Status: evaluated
Last updated: 2026-05-03

## Problem Statement

IMDITHER can gain credibility from high-quality and specialized dithering
methods, but roadmap candidates such as Ostromoukhov adaptive diffusion,
void-and-cluster masks, Yliluoma-style positional dithering, and dot diffusion
carry higher implementation, performance, and visual-contract risk than
straight diffusion kernels.

## Solution

Run a bounded evaluation slice for high-quality and experimental algorithms.
Each candidate receives a documented decision: ship, defer, or reject. Shipping
is allowed only when the candidate stays deterministic, local-first,
fixture-covered, and acceptable for preview/export performance.

## User Stories

1. As a visual maker, I want a high-quality still-image dithering mode, so that
   detailed images can produce smoother results when speed is less important.
2. As a visual maker, I want blue-noise improvements evaluated, so that flat
   gradients can avoid obvious ordered patterns.
3. As a visual maker, I want arbitrary-palette positional dithering evaluated,
   so that limited palettes can produce richer perceived colors.
4. As a visual maker, I want dot diffusion evaluated, so that future
   parallel-friendly dithering can be considered without committing too early.
5. As a maintainer, I want each candidate decision recorded, so that rejected
   or deferred algorithms do not keep reappearing as vague roadmap work.
6. As a maintainer, I want shipped experimental algorithms to use normal
   registry metadata, so that users see them consistently with stable
   algorithms.
7. As a maintainer, I want performance gates before shipping expensive modes,
   so that preview responsiveness does not regress silently.
8. As a user sharing looks, I want shipped experimental algorithms to round trip
   through Settings JSON and Look Payloads, so that results remain repeatable.

## Implementation Decisions

- Evaluate Ostromoukhov adaptive error diffusion as a high-quality still mode.
- Evaluate void-and-cluster blue-noise mask generation.
- Evaluate Joel Yliluoma-style arbitrary-palette positional dithering.
- Evaluate dot diffusion for future parallel-friendly execution.
- Each candidate gets a decision: ship, defer, or reject.
- A shipped candidate must have deterministic output, registry metadata,
  settings validation, visual fixtures, and acceptable measured performance.
- Deferred or rejected candidates must record why the result did not ship.
- Shipped candidates use Algorithm Family metadata from the registry.
- No ADR is planned for this slice because individual algorithm additions are
  reversible unless later architecture changes make them hard to unwind.

## Testing Decisions

- Good tests prove user-visible behavior and repeatability, not internal loop
  structure.
- Shipped candidates need process tests for deterministic output.
- Shipped candidates need visual fixtures or goldens against representative
  inputs.
- Shipped candidates need registry and settings contract coverage.
- Performance evidence should compare candidate runtime against existing still
  algorithms on representative fixture sizes.
- Evaluation-only candidates need written outcome notes instead of full test
  coverage if they are not shipped.
- Prior art exists in algorithm registry tests, process tests, process golden
  tests, and performance baseline scripts.

## Out of Scope

- No algorithm marketplace.
- No GPU, WebGPU, WebGL, WASM, tile processing, or worker architecture rewrite.
- No Auto-Tune ranking changes unless a candidate ships and a later PRD chooses
  recommender integration.
- No Processing Preset or Look Recipe expansion by default.
- No Halftone Screen UI controls.
- No motion or batch pipeline work.

## Further Notes

This PRD is deliberately evaluation-shaped. The goal is not to ship every named
candidate; the goal is to convert ambiguous roadmap items into measured
decisions.

Candidate outcomes are recorded in [Decisions](DECISIONS.md). Ostromoukhov
shipped as a deterministic Error Diffusion algorithm. Void-and-cluster
blue-noise mask generation, Yliluoma-style arbitrary-palette positional
dithering, and dot diffusion were deferred.
