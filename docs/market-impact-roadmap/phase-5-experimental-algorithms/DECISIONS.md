# Phase 5.2 Experimental Algorithm Evaluation — Decisions

Status: evaluated
Last updated: 2026-05-03

## Candidates

### 1. Ostromoukhov Adaptive Error Diffusion

**Decision: SHIP**

Shipped as `ostromoukhov` algorithm id.

The algorithm is deterministic (same input → same coefficients → same output),
local-first, and uses the existing error diffusion infrastructure with per-pixel
adaptive coefficient selection. It produces visibly smoother gradients than
fixed-coefficient diffusion by varying the kernel based on input luminance.

Registry metadata uses `"Error Diffusion"` family.

Coverage:

- Registry metadata test
- Deterministic output test
- Golden fixture on 4×4 representative input
- Output-differs-from-Floyd-Steinberg test
- Settings contract test (new id accepted, invalid ids rejected)

### 2. Void-and-Cluster Blue-Noise Mask Generation

**Decision: DEFER**

The existing hardcoded 8×8 blue-noise mask produces acceptable results.
Generating a larger or higher-quality mask via void-and-cluster is a
self-contained optimization task that does not introduce new user-visible
algorithms. It should be revisited when ordered-dither quality targets are
measured against competitor blue-noise quality, or when the product needs
dynamic mask generation for non-square aspect ratios or custom screen sizes.

### 3. Joel Yliluoma-Style Arbitrary-Palette Positional Dithering

**Decision: DEFER**

This algorithm (Bisqwit's dithering) is complex to implement correctly,
requiring precomputed look-up tables for arbitrary palettes. It would add
significant implementation and maintenance cost. Revisit if the product
identifies a specific user need for high-quality arbitrary-palette positional
dithering that existing algorithms (Ostromoukhov, Floyd-Steinberg with
perceptual matching) do not satisfy.

### 4. Dot Diffusion

**Decision: DEFER**

Dot diffusion is primarily valuable for parallel-friendly execution. IMDITHER
currently has no GPU, WASM, or multi-threaded processing path that would
benefit from a dot-diffusion approach. Revisit when a parallel execution
surface (WebGPU, WASM SIMD, worker farm) is added and measurement shows a
convincing speedup over sequential error diffusion.
