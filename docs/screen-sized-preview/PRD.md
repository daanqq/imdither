# Screen-Sized Preview PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

Users can see a regular grid or moire pattern in the preview that is not present in the exported PNG. This happens when the app renders a high-frequency dithered pixel buffer into a canvas and then lets the browser resize that canvas for the `Fit` view. The exported PNG is generated from the real output buffer at its native dimensions, so the preview can visually misrepresent the final result.

From the user's perspective, this is confusing: the preview appears to contain an artifact, while the exported result does not. The app should make `Fit` mode a trustworthy screen preview without changing the final export dimensions or editor settings.

## Solution

In `Fit` mode, generate the processed preview at the measured on-screen display size instead of generating a larger dithered image and relying on CSS canvas scaling. The preview worker should receive an optional screen-sized target that is separate from the user's final output settings. The final PNG export must continue to use the full selected output size.

The original layer in compare views should be drawn into the same display-sized canvas dimensions as the processed layer, so slide comparison remains geometrically aligned. The `1:1` view should keep showing the true output dimensions.

The feature should be mostly invisible to the user: `Fit` becomes cleaner and less misleading, while the existing `1:1` mode remains the way to inspect actual output pixels.

## User Stories

1. As an image editor user, I want the `Fit` preview to avoid browser scaling artifacts, so that I do not mistake preview-only moire for real output.
2. As an image editor user, I want exported PNG files to remain full resolution, so that preview optimization does not reduce final quality.
3. As an image editor user, I want `1:1` mode to show real output pixels, so that I can inspect the final dither pattern exactly.
4. As an image editor user, I want slide comparison to keep original and processed layers aligned, so that the divider compares the same image geometry on both sides.
5. As an image editor user, I want the original layer to match the processed preview size in `Fit`, so that comparison is not distorted by mismatched canvas dimensions.
6. As an image editor user, I want preview updates to stay responsive while changing settings, so that controls do not feel blocked by image processing.
7. As an image editor user, I want window resizing to update the preview without excessive flicker, so that the app feels stable during layout changes.
8. As an image editor user, I want small layout shifts to avoid restarting processing, so that minor UI changes do not churn the worker.
9. As an image editor user, I want the app to avoid noisy warning labels in normal `Fit` mode, so that the interface stays focused on the image.
10. As an image editor user, I want the existing reduced-preview overlay only when the displayed preview is temporarily below the intended display target, so that status messages remain meaningful.
11. As an image editor user, I want full-size output metadata and caps to keep reflecting the export target, so that the UI does not confuse preview size with output size.
12. As an image editor user, I want copied settings to keep storing the final output settings, so that preview size is not accidentally persisted.
13. As an image editor user, I want pasted settings to keep restoring the final output settings, so that screen size never becomes part of the settings schema.
14. As an image editor user, I want source images and settings changes to cancel stale preview jobs, so that old work cannot replace newer preview results.
15. As an image editor user, I want quick preview and refined preview behavior to remain, so that high-resolution outputs still feel interactive.
16. As an image editor user, I want refined `Fit` preview to stop at the measured display size, so that the browser does not downscale a larger dithered buffer.
17. As an image editor user, I want `Fit` preview to avoid upscaling beyond the final output dimensions, so that the app does not imply extra detail.
18. As a mobile user, I want `Fit` mode to remain the enforced preview mode, so that the layout stays usable on small screens.
19. As a desktop user, I want toggling between `Fit` and `1:1` to produce predictable preview behavior, so that I can choose between clean screen preview and exact pixel inspection.
20. As a maintainer, I want preview sizing logic isolated behind small module interfaces, so that it can be tested without browser rendering details.
21. As a maintainer, I want processing jobs to accept preview sizing as an override, so that editor settings remain a stable final-output contract.
22. As a maintainer, I want worker calls to remain deterministic for a given source, settings, and preview target, so that tests can assert processing behavior.
23. As a maintainer, I want export jobs to ignore preview target overrides, so that screen preview changes cannot regress export quality.
24. As a maintainer, I want preview resize observation to be debounced, so that worker cancellation does not become excessive during window resize.
25. As a maintainer, I want memoized preview components to remain stable across status-only updates, so that React renders do not redraw ready canvases unnecessarily.

## Implementation Decisions

- Build a screen-preview sizing module that converts measured frame dimensions, final output dimensions, and view scale into an optional preview target.
- The sizing module should preserve aspect ratio, round to integer CSS pixels, and clamp `Fit` preview dimensions so they never exceed the full output size.
- Use CSS pixels as the `Fit` preview target, not `devicePixelRatio` scaled pixels. The goal is to avoid CSS downscaling of dither output.
- Add a `ResizeObserver`-backed measurement path for the preview frame.
- Restart preview processing after display-size changes only when the measured width or height changes by at least 16 pixels.
- Debounce display-size driven preview restarts by about 120 milliseconds.
- Keep display-size measurement out of persisted editor settings.
- Extend preview processing with an optional preview target override separate from final editor settings.
- Generate temporary worker settings from the final settings plus the preview target override.
- Preserve the existing two-stage preview model: a quick interactive preview followed by a refined preview.
- In `Fit`, refined preview should clamp to the desired display target and existing preview pixel budget.
- In `Fit`, quick preview should clamp to the refined target and the interactive pixel budget.
- In `1:1`, preview target should remain the full output size subject to existing budget behavior.
- Export jobs must continue to use full final settings and must not accept or apply display preview targets.
- Correct preview metadata should continue to report the full intended output dimensions where the UI expects output metadata.
- Draw the original layer into a canvas with the same display dimensions as the processed layer for slide comparison.
- Do not store additional large pixel buffers in React or Zustand for the original display layer.
- Add a canvas drawing helper that can draw a source buffer into explicit canvas dimensions for display purposes.
- Keep the processed and original slide compare layers aligned to the same display frame.
- Do not add a permanent `SCREEN PREVIEW` or similar UI label in normal `Fit` mode.
- Keep reduced-preview status messaging only when the current preview is below the desired display target for the current mode.
- Keep the existing final-output controls, settings clipboard behavior, and export naming behavior unchanged.

## Testing Decisions

- Good tests should assert external behavior and stable contracts, not incidental implementation details such as exact hook ordering or private timer names.
- Test the screen-preview sizing module directly with pure inputs and outputs.
- Cover aspect-ratio preservation, integer rounding, clamping to final output dimensions, and `Fit` versus `1:1` behavior.
- Test that display-size preview target generation uses CSS pixels rather than `devicePixelRatio`.
- Test the processing job module with a preview target override to confirm worker settings use display target dimensions for preview work.
- Test that preview target overrides do not mutate final editor settings.
- Test that refined preview targets clamp to the display target in `Fit`.
- Test that quick preview targets clamp below refined preview targets by the interactive pixel budget.
- Test that export jobs still run at full output size and ignore preview target behavior.
- Test status events at the processing-job boundary, following the existing preview lifecycle tests.
- Test memoization boundaries for preview components so ready canvases do not redraw on status-only updates.
- Test slide compare rendering contracts so original and processed layers receive matching display dimensions when processed output is ready.
- Existing processing-job lifecycle tests are the closest prior art for worker sizing and export guarantees.
- Existing preview component tests are the closest prior art for memoization and visible render-state behavior.
- Existing preview-frame sizing tests are the closest prior art for aspect-ratio and display-size calculations.
- Run the repository quality gate with `bun verify` after implementation.

## Out of Scope

- Replacing React, shadcn, Radix, or the current canvas architecture.
- Changing final PNG export dimensions or quality.
- Adding WebGL, WebGPU, or GPU-based preview rendering.
- Adding a new user-facing preview mode.
- Adding permanent explanatory copy or a tutorial for preview scaling.
- Persisting preview display size in settings JSON or localStorage.
- Supporting custom palette editing.
- Changing the source image intake limits.
- Changing the dithering algorithms themselves.
- Changing the visual style of the preview stage beyond removing the misleading artifact.
- Removing the existing `Fit` and `1:1` controls.
- Using `devicePixelRatio` scaled preview targets in the initial implementation.

## Further Notes

The core product decision is that `Fit` is a screen preview, while `1:1` is exact pixel inspection. This keeps the preview honest for the current viewport without weakening final export semantics.

The main technical risk is excess worker churn during resize. The measurement threshold and debounce should keep that under control while still updating the preview when the visible frame meaningfully changes.

The second technical risk is compare-mode alignment. Slide compare should treat the display frame as a shared coordinate system and avoid comparing a display-sized processed layer against a differently scaled original layer.
