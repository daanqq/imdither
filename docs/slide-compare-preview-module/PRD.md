# Slide Compare Preview Module PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

The slide comparison feature already exists, but its rendering, pointer interaction, keyboard interaction, sizing logic, canvas drawing, and missing-output state are concentrated inside the main editor component.

This makes the editor harder to change safely. The main editor should coordinate source intake, editor settings, processing jobs, and export, but it should not also own the detailed mechanics of the slide comparison surface. The current shape also makes the slide comparison behavior harder to test in isolation, especially the parts that need browser APIs such as ResizeObserver, Pointer Events, canvas drawing, and keyboard slider semantics.

Users do not need new visible behavior for this refactor. They need the same slide comparison experience to become easier to maintain without regressions.

## Solution

Extract slide comparison into a dedicated Slide Compare Preview Module with a small, stable interface.

The editor passes the module the original image buffer, optional processed image buffer, current divider percentage, view scale, status text, and a divider-change callback. The module owns the slide preview frame, layered canvases, divider rendering, pointer drag, click or tap positioning, keyboard adjustment, fit versus 1:1 sizing, and the missing-processed-output state.

The main editor remains responsible for choosing the Compare Mode, holding the current runtime divider percentage, starting Preview Jobs, and passing the latest image buffers into the preview surface. Export behavior, Processing Jobs, Source Intake, Editor Settings, algorithms, palettes, and output metadata remain unchanged.

## User Stories

1. As an IMDITHER user, I want slide comparison to behave exactly as before, so that a refactor does not disrupt my editing workflow.
2. As an IMDITHER user, I want the original and processed image to stay aligned in one frame, so that I can compare the same coordinates reliably.
3. As an IMDITHER user, I want the left side to show the original image, so that the before state remains obvious.
4. As an IMDITHER user, I want the right side to show the processed image, so that the after state remains obvious.
5. As an IMDITHER user, I want the divider position to stay where I put it during the session, so that I can inspect the same region while changing settings.
6. As an IMDITHER user, I want the divider to start from the existing default, so that fresh sessions still begin with a balanced comparison.
7. As an IMDITHER user, I want dragging the divider to remain smooth, so that comparison feels responsive.
8. As an IMDITHER user, I want click or tap positioning to keep working, so that I can jump to a specific image region quickly.
9. As an IMDITHER user, I want keyboard controls to keep working, so that the divider remains accessible without pointer input.
10. As an IMDITHER user, I want the divider to stay clamped near the image edges, so that the handle never becomes unreachable.
11. As an IMDITHER user, I want Fit View to preserve the whole-image comparison experience, so that the preview remains useful in constrained layouts.
12. As an IMDITHER user, I want 1:1 View to preserve pixel-level comparison, so that I can inspect dithering detail.
13. As an IMDITHER user, I want slide comparison to remain usable on touch devices, so that mobile and tablet input paths keep working.
14. As an IMDITHER user, I want the original image to remain visible while the processed preview is missing, so that the preview area still has useful content.
15. As an IMDITHER user, I want the divider to be unavailable when processed output is missing, so that I do not interact with a meaningless control.
16. As an IMDITHER user, I want status text during processing to remain visible, so that I can understand why the processed layer is not ready yet.
17. As an IMDITHER user, I want processed-only and original-only modes to remain unchanged, so that slide refactoring does not affect other Compare Modes.
18. As an IMDITHER user, I want reduced previews to keep working in slide mode, so that the editor remains responsive while high-quality preview catches up.
19. As an IMDITHER user, I want export to remain based on Full Output, so that the comparison UI never changes the exported PNG.
20. As an IMDITHER user, I want the app to stay local-only, so that private images are still processed in the browser.
21. As a maintainer, I want the main editor to delegate slide preview mechanics, so that the editor is easier to read and modify.
22. As a maintainer, I want slide comparison to expose a small component interface, so that future changes do not require touching unrelated editor workflows.
23. As a maintainer, I want slide sizing behavior isolated, so that Fit View and 1:1 View can be tested without the whole editor.
24. As a maintainer, I want pointer coordinate mapping isolated from editor state, so that drag behavior can be tested directly.
25. As a maintainer, I want keyboard divider behavior to remain covered by pure tests, so that accessibility controls are protected.
26. As a maintainer, I want canvas drawing to stay behind a narrow UI boundary, so that large pixel buffers do not leak into global state.
27. As a maintainer, I want the module to accept image buffers and draw them internally, so that the caller does not know about the two-canvas layering detail.
28. As a maintainer, I want the module to own ResizeObserver usage, so that layout measurement is not spread through the editor.
29. As a maintainer, I want the module to cancel animation frames on unmount, so that pointer interaction does not leave stale browser callbacks behind.
30. As a maintainer, I want tests to catch visible regressions instead of implementation rewrites, so that the refactor can change internals freely.

## Implementation Decisions

- Build a dedicated Slide Compare Preview Module.
- Move slide preview rendering out of the main editor component.
- Keep the module UI-only.
- Keep Compare Mode selection in the editor state layer.
- Keep runtime slide divider state in the editor shell, because it is session-level view state shared with the compare mode.
- Keep the divider default at 50%.
- Keep the divider bounds at 2% and 98%.
- Keep the existing pointer behavior: drag, click or tap to position, pointer capture while dragging, and no divider movement when processed output is missing.
- Keep the existing keyboard behavior: ArrowLeft, ArrowRight, Shift plus arrows, Home, and End.
- Keep the existing accessible slider semantics for the divider handle.
- Keep the existing Fit View and 1:1 View behavior.
- Keep slide frame sizing tied to displayed image bounds, not the empty preview viewport.
- Keep the original and processed canvases layered in one frame.
- Keep original as the bottom layer.
- Keep processed as the clipped top layer.
- Keep the module responsible for drawing both canvases from the provided image buffers.
- Keep the existing canvas drawing helper as an adapter rather than moving pixel-buffer drawing into editor state.
- Keep the existing slide math helper as a pure logic module.
- Expand the slide math helper only if new pure calculations are useful for testability.
- Do not change Processing Jobs.
- Do not change Source Intake.
- Do not change Editor Settings.
- Do not change the worker adapter.
- Do not change export behavior.
- Do not persist divider position after reload.
- Do not add new compare modes.
- Keep the visual style consistent with the current dark workstation interface.

## Testing Decisions

- Good tests should verify user-visible behavior and module contracts, not private component structure.
- Existing pure slide math tests remain the baseline for clamping, pointer coordinate mapping, and keyboard mapping.
- Add module-level tests for rendering the original and processed layers in slide mode.
- Add module-level tests for missing processed output: original remains visible, status is shown, and divider interaction is unavailable.
- Add module-level tests for divider callbacks from pointer interaction.
- Add module-level tests for keyboard divider changes.
- Add module-level tests for Fit View sizing behavior when the viewport changes.
- Add module-level tests for 1:1 View sizing behavior.
- Add regression tests that processed-only and original-only compare modes still use the single-preview path outside this module.
- Use browser-facing tests only where browser behavior matters.
- Keep pure calculations in pure tests when possible.
- Avoid asserting exact DOM nesting unless that nesting is part of accessibility or observable behavior.
- Stub canvas drawing and layout measurement where necessary so tests focus on interaction and state, not pixel rendering internals.
- Prior art in the codebase: slide math tests cover pure compare behavior, store tests cover compare mode migration, and processing job tests cover module behavior through emitted events.

## Out of Scope

- No redesign of slide comparison.
- No new before/after interaction model.
- No persisted divider position.
- No changes to algorithms.
- No changes to palettes.
- No changes to preprocessing.
- No changes to Source Intake.
- No changes to Preview Job scheduling.
- No changes to Export Job scheduling.
- No changes to PNG encoding.
- No changes to Output Size policy.
- No backend processing.
- No cloud sync.
- No batch image comparison.
- No vertical, diagonal, radial, or animated reveal mode.

## Further Notes

This refactor should be behavior-preserving. The main architectural win is making Slide Compare a deep UI module: it should hide substantial browser interaction and rendering complexity behind a small interface that the editor can treat as a preview surface.

The key risk is coordinate drift between original and processed layers. Any implementation should protect the invariant that both layers occupy the same displayed rectangle.
