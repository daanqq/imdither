# Phase 5.1 PRD: Algorithm Families and Diffusion Breadth

Status: implemented
Last updated: 2026-05-03

## Problem Statement

IMDITHER already has a registry-backed Dither Algorithm selector, but the list
is becoming a flat mix of direct mapping, ordered patterns, diffusion methods,
blue-noise style masks, and halftone screening. Phase 5 needs more serious
dithering breadth without making algorithm choice noisy or unclear.

## Solution

Add Algorithm Family metadata to the Dither Algorithm registry and use it to
group the Algorithm selector in the Control Panel and Stack Core dither mirror.
Add three deterministic left-to-right error diffusion algorithms:
Jarvis-Judice-Ninke, full Sierra, and Two-Row Sierra.

This slice keeps the current settings contract narrow: Editor Settings continue
to store only the stable Dither Algorithm Id. Algorithm Family is UI metadata,
not persisted state.

## User Stories

1. As a visual maker, I want algorithms grouped by family, so that I can choose
   a method without reading a flat technical list.
2. As a visual maker, I want classic error diffusion variants, so that I can
   compare softer and stronger diffusion textures.
3. As a visual maker, I want Jarvis-Judice-Ninke, so that I can use a broad
   diffusion kernel with smoother tonal spread.
4. As a visual maker, I want full Sierra, so that I can choose a stronger
   Sierra-family result than Sierra Lite.
5. As a visual maker, I want Two-Row Sierra, so that I can choose a middle
   texture between full Sierra and Sierra Lite.
6. As a returning user, I want existing algorithm ids to keep working, so that
   old Settings JSON and Look Payloads remain usable.
7. As a user editing from the Manual tab, I want the same grouped algorithm
   choices as the main controls, so that Core mirrors do not feel like a second
   model.
8. As a user experimenting quickly, I want Random Algorithm to keep working, so
   that grouped display does not remove fast exploration.
9. As a maintainer, I want Algorithm Family to live beside algorithm metadata,
   so that UI grouping and registry tests use one source of truth.
10. As a maintainer, I want new algorithms covered by deterministic output
    checks, so that later changes do not silently alter visual contracts.

## Implementation Decisions

- Add Algorithm Family as registry metadata on each Dither Algorithm definition.
- Canonical families are Direct Mapping, Ordered, Error Diffusion, Blue Noise,
  and Halftone.
- Family grouping is used in the Control Panel Algorithm selector.
- Family grouping is used in the Stack Core dither mirror selector.
- Existing Dither Algorithm Ids remain unchanged.
- New Dither Algorithm Ids are `jarvis-judice-ninke`, `sierra`, and
  `two-row-sierra`.
- New diffusion algorithms use the existing left-to-right diffusion helper
  shape.
- New diffusion algorithms support existing Matching Mode behavior.
- No serpentine scanning in this slice.
- No scan-direction setting or algorithm capability in this slice.
- No settings schema bump for this slice.
- Processing Presets and Auto-Tune ranking stay unchanged.
- Settings JSON docs list the new accepted algorithm ids.

## Testing Decisions

- Good tests cover external behavior: selectable metadata, settings
  normalization, grouped UI labels, and deterministic processed pixels.
- Registry tests verify each algorithm exposes a family and the expected
  family assignments.
- Process tests verify each new algorithm produces deterministic output and
  differs from nearby existing diffusion algorithms on representative input.
- Settings contract tests verify new ids normalize and invalid ids still fail.
- Component tests verify Control Panel and Stack Core selector grouping.
- Golden or visual contract fixtures cover representative output for the new
  diffusion algorithms.
- Prior art exists in algorithm registry tests, process tests, process golden
  tests, Control Panel tests, and Manual tab tests.

## Out of Scope

- No richer algorithm browser, search, descriptions, previews, compare table,
  route, or modal.
- No serpentine scanning.
- No adaptive coefficients.
- No Auto-Tune candidate or ranking changes.
- No new Processing Presets or Look Recipes.
- No Halftone Screen controls.
- No GPU, WASM, tile, or worker rewrite.

## Further Notes

This is the first implementation slice for Phase 5. It makes the selector
scalable and adds low-risk diffusion breadth before experimental algorithms or
settings-heavy halftone work.
