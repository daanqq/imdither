# Slide Before/After Preview PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

The current comparison experience makes users choose between seeing only the original image, only the processed image, or a split layout with two separate preview panels. The split layout is useful, but it costs horizontal space, makes fine differences harder to inspect, and does not feel like a direct before/after comparison tool.

Users need a single-frame before/after preview that lets them drag a divider across the image and inspect how the processed output differs from the original at the same coordinates.

## Solution

Replace the current split comparison mode with a slide before/after preview mode. In slide mode, the original and processed previews render in one shared frame. The original image is visible on the left side, the processed image is visible on the right side, and a draggable vertical divider controls the reveal position.

The divider starts at 50%. The divider position is kept while the user changes images and settings during the current app session, but it resets to 50% after a page reload. Slide mode works in both Fit and 1:1 view scale modes. The interaction supports pointer drag, click/tap-to-position, and keyboard adjustment.

## User Stories

1. As an IMDITHER user, I want to compare the original and processed image in one frame, so that I can inspect the same area without moving my eyes between two panels.
2. As an IMDITHER user, I want the left side of the slider to show the original image, so that the before state follows the standard before/after convention.
3. As an IMDITHER user, I want the right side of the slider to show the processed image, so that the after state is visually clear.
4. As an IMDITHER user, I want to drag a divider across the preview, so that I can reveal more or less of the processed output.
5. As an IMDITHER user, I want to click or tap the preview to move the divider, so that I can quickly inspect a specific position.
6. As an IMDITHER user, I want the divider to start at the center, so that I get an immediate balanced comparison.
7. As an IMDITHER user, I want the divider position to persist while I change settings, so that I can inspect the same region across multiple adjustments.
8. As an IMDITHER user, I want the divider position to persist while I load a different image in the same app session, so that the compare tool stays where I placed it.
9. As an IMDITHER user, I want the divider position to reset on app reload, so that each fresh session starts from a neutral comparison state.
10. As an IMDITHER user, I want slide comparison to work in Fit view, so that I can compare the whole image comfortably.
11. As an IMDITHER user, I want slide comparison to work in 1:1 view, so that I can inspect pixel-level details without losing before/after context.
12. As an IMDITHER user, I want the divider to stay attached to the displayed image, so that empty preview space does not affect comparison accuracy.
13. As an IMDITHER user, I want the divider handle to remain visible and usable, so that I can always adjust the comparison position.
14. As an IMDITHER user, I want the divider to clamp near the image edges, so that the handle never disappears completely.
15. As an IMDITHER user, I want keyboard controls for the divider, so that I can adjust the comparison without pointer input.
16. As an IMDITHER user, I want arrow keys to adjust the divider precisely, so that I can make small comparison changes.
17. As an IMDITHER user, I want Shift plus arrow keys to adjust the divider faster, so that I can move across the image quickly.
18. As an IMDITHER user, I want Home and End to move the divider near the edges, so that I can quickly inspect almost-all original or almost-all processed output.
19. As an IMDITHER user, I want accessible slider semantics, so that assistive technology can understand the divider control.
20. As an IMDITHER user, I want labels inside the slide frame, so that I know which side is original and which side is processed without extra UI chrome.
21. As an IMDITHER user, I want the compare control to say Slide, so that the mode name matches the interaction.
22. As an IMDITHER user, I want existing saved Split settings to open in Slide mode, so that persisted state from older sessions does not break.
23. As an IMDITHER user, I want processed-only and original-only modes to keep working, so that I can still inspect either image by itself.
24. As an IMDITHER user, I want slide mode to use the same processed preview buffer as the rest of the editor, so that the comparison matches what I would export.
25. As an IMDITHER user, I want slide mode to keep working with reduced previews, so that the editor stays responsive while full output catches up.
26. As an IMDITHER user, I want slide mode to avoid flicker during setting changes, so that comparison feels stable while the worker updates.
27. As an IMDITHER user, I want slide mode to hide or disable the divider when processed output is not ready, so that I do not drag a meaningless control.
28. As an IMDITHER user, I want the original image to remain visible while processed output is missing, so that the preview area still has useful content.
29. As an IMDITHER user, I want slide mode to remain local and browser-only, so that private images are not uploaded anywhere.
30. As an IMDITHER user, I want PNG export behavior to remain unchanged, so that comparison UI does not affect output.

## Implementation Decisions

- Replace the existing split compare mode with a slide compare mode.
- Rename the compare mode value from split to slide so internal state matches the feature behavior.
- Migrate persisted compare state from split to slide during settings hydration.
- Keep processed and original single-image modes unchanged.
- Add runtime-only state for the slide divider position with a default of 50%.
- Do not persist the slide divider position across page reloads.
- Clamp the divider position to 2% through 98%.
- Implement pointer interactions with Pointer Events so mouse, touch, and stylus share one path.
- Support click or tap on the slide image to immediately move the divider to that position.
- Use keyboard slider semantics for the divider handle.
- Support ArrowLeft and ArrowRight for 1% changes.
- Support Shift plus ArrowLeft and ArrowRight for 10% changes.
- Support Home and End for minimum and maximum divider positions.
- Render slide comparison with two canvases layered in one frame.
- Render the original canvas as the bottom layer.
- Render the processed canvas as the top layer.
- Clip the processed layer with CSS according to the divider position.
- Position the divider on the same percentage as the processed layer edge.
- Keep the divider tied to the image bounds rather than the empty preview viewport.
- Add a dedicated slide comparison preview module instead of overloading the current single-canvas preview module.
- Keep the current single-canvas preview module for processed-only and original-only modes.
- Use existing image buffers and drawing helpers rather than changing the processing engine.
- Keep worker behavior unchanged.
- Keep export behavior unchanged.
- Keep reduced preview behavior unchanged.
- Hide or disable the divider when the processed buffer is missing.
- Show the original buffer alone when processed output is missing.
- Keep labels inside the slide frame: Original on the left, Processed on the right.
- Update the compare control label from Split to Slide.
- Preserve the current separate button grouping in the compare controls.

## Testing Decisions

- Good tests should cover user-visible behavior and state transitions, not internal DOM structure.
- Store tests should verify compare mode migration from split to slide.
- Store tests should verify the slide divider position defaults to 50%.
- Store tests should verify the slide divider position is not persisted.
- Interaction tests should verify divider clamping at 2% and 98%.
- Interaction tests should verify pointer positioning maps preview coordinates to percent values.
- Interaction tests should verify keyboard behavior for arrows, Shift+arrows, Home, and End.
- Rendering tests should verify slide mode renders a single comparison frame rather than two side-by-side panels.
- Rendering tests should verify processed-only and original-only modes still render single previews.
- Rendering tests should verify the divider is not active when processed output is missing.
- Prior art in the codebase: core package tests cover pure processing behavior; web tests should follow that pattern by testing observable behavior rather than implementation internals.
- If no web test harness exists yet, this feature is a good point to introduce focused component or interaction tests for the slide comparison module.

## Out of Scope

- No changes to dithering algorithms.
- No changes to palette mapping.
- No changes to preview worker scheduling.
- No changes to PNG export output.
- No separate vertical split mode.
- No diagonal or radial reveal mode.
- No animated before/after playback.
- No persisted divider position after reload.
- No multi-image comparison.
- No backend or cloud processing.
- No redesign of the full control panel beyond the compare mode label.

## Further Notes

The slide preview is a UI-only comparison feature. It should not affect processing, metadata, export, or the deterministic core pipeline. The feature should preserve the current local-only editor model and should fit the existing dark, precise, workstation-style interface.

The most important product detail is coordinate alignment: original and processed images must occupy the same displayed rectangle in slide mode. If the two layers drift in size or position, the feature fails its core purpose.
