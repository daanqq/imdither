# Phase 2.2 PRD: Inspection UX

Status: done
Last updated: 2026-04-26

## Problem Statement

Users can compare original and processed output, and they can switch between Fit and 1:1 preview modes, but they do not have a complete pixel-inspection workflow. There is no continuous zoom, no controlled pan, no optional pixel grid, and no cursor-level pixel inspector. This makes it harder to trust dithering output, evaluate palette matching, inspect pixel-level details, and compare original versus processed pixels at high zoom.

## Solution

Replace the two-state preview scale model with a dedicated app-level preview viewport. The viewport supports Fit mode and Manual mode, continuous zoom, image-space center coordinates, controlled pointer-drag panning, optional pixel grid, and a cursor pixel inspector. Original and processed views share the same viewport transform during slide compare so that zoomed comparisons remain locked.

The preview viewport is app UI state, not public processing settings. It can be persisted locally for user convenience, but it is not included in copied Settings JSON and does not affect deterministic processing output.

## User Stories

1. As an image editor user, I want to fit the image to the available preview area, so that I can see the whole composition at once.
2. As an image editor user, I want to jump to 100% zoom, so that one image pixel maps to one CSS pixel.
3. As an image editor user, I want to zoom continuously beyond 100%, so that I can inspect individual dither pixels.
4. As an image editor user, I want to zoom out below 100%, so that I can inspect large outputs without switching back to Fit.
5. As an image editor user, I want zoom controls near the preview, so that inspection controls are close to the thing being inspected.
6. As an image editor user, I want Fit, 100%, and zoom controls to be separate from processing controls, so that I understand they do not change exported pixels.
7. As an image editor user, I want preview pan to work while zoomed in, so that I can inspect any region of the image.
8. As an image editor user, I want to drag the zoomed preview to pan, so that inspection feels direct and spatial.
9. As an image editor user, I want the cursor to indicate when panning is possible, so that I understand the interaction.
10. As an image editor user, I want panning to update a stable viewport center, so that zooming and resizing do not behave randomly.
11. As an image editor user, I want the viewport center to be stored in image-pixel coordinates, so that inspection remains tied to the image rather than the screen.
12. As an image editor user, I want the viewport center clamped to image bounds, so that I cannot lose the image entirely while panning.
13. As an image editor user, I want zoom to keep the same inspected point stable where practical, so that changing zoom does not disorient me.
14. As an image editor user, I want original-only preview to support the same zoom and pan controls, so that I can inspect source pixels.
15. As an image editor user, I want processed-only preview to support the same zoom and pan controls, so that I can inspect output pixels.
16. As an image editor user, I want slide compare to keep original and processed transforms locked, so that the same image coordinates line up while zoomed.
17. As an image editor user, I want slide compare's divider handle to remain usable while panning is available, so that compare interaction does not break.
18. As an image editor user, I want dragging on the divider handle to move the divider, so that compare behavior remains familiar.
19. As an image editor user, I want dragging elsewhere in manual zoom mode to pan both layers, so that zoomed compare stays aligned.
20. As an image editor user, I want an optional pixel grid, so that I can distinguish individual pixels at high zoom.
21. As an image editor user, I want the grid to remain hidden at low zoom even when enabled, so that it does not create visual noise.
22. As an image editor user, I want the grid to become visible at 400% zoom and above, so that it appears only when individual pixel boundaries are meaningful.
23. As an image editor user, I want the grid to be an overlay only, so that it never affects exported images.
24. As an image editor user, I want the grid to cover both original and processed layers in slide compare, so that the same coordinate system is visible across both.
25. As an image editor user, I want a cursor pixel inspector, so that I can read exact pixel coordinates and colors.
26. As an image editor user, I want the pixel inspector to show x and y coordinates, so that I know exactly where I am inspecting.
27. As an image editor user, I want the pixel inspector to show original hex color, so that I can understand the source pixel.
28. As an image editor user, I want the pixel inspector to show processed hex color, so that I can understand the palette-mapped result.
29. As an image editor user, I want slide compare's pixel inspector to show both original and processed values regardless of divider position, so that I can compare exact pixels quickly.
30. As an image editor user, I want the pixel inspector to hide when the cursor leaves the preview, so that it does not clutter the interface.
31. As an image editor user, I want the pixel inspector to degrade gracefully when processed output is not ready, so that the UI remains useful while processing.
32. As an image editor user, I want the pixel inspector to inspect displayed buffers, so that values match what I currently see in preview.
33. As an image editor user, I want grid and pixel-inspector toggles to persist locally, so that my preferred inspection workflow remains available across sessions.
34. As a mobile or small-screen user, I want Fit mode to remain safe and usable, so that the preview does not become awkward on constrained displays.
35. As a keyboard or button user, I want toolbar controls for Fit and 100%, so that I am not forced to use pointer gestures only.
36. As a user sharing settings JSON, I want zoom, pan, grid, and pixel-inspector state omitted, so that copied settings remain focused on processing output.
37. As a user importing settings JSON, I want inspection state to remain independent, so that imported processing settings do not unexpectedly move my viewport.
38. As a maintainer, I want viewport state separated from processing settings, so that the core processing contract remains deterministic and DOM-free.
39. As a maintainer, I want a small viewport transform module, so that fit/manual geometry, coordinate conversion, and clamping can be tested without React.
40. As a maintainer, I want preview rendering components to consume a simple viewport interface, so that original, processed, and slide compare modes stay consistent.
41. As a maintainer, I want pointer pan math to be isolated from component markup where practical, so that interaction behavior can be tested and maintained.
42. As a maintainer, I want old Fit/1:1 app state to migrate to the new viewport state, so that persisted users do not lose sensible preview behavior.
43. As a maintainer, I want old Fit to migrate to Fit mode, so that existing users retain whole-image preview behavior.
44. As a maintainer, I want old 1:1 to migrate to Manual mode at 100% zoom, so that existing users retain actual-size semantics.
45. As a maintainer, I want continuous zoom and screen-sized preview jobs to remain compatible, so that preview processing remains responsive.
46. As a maintainer, I want preview target sizing to remain clearly separate from visual zoom, so that zooming does not necessarily trigger unnecessary reprocessing.
47. As a maintainer, I want slide compare rendering to avoid unnecessary redraws while panning or moving the divider, so that inspection feels responsive.
48. As a product owner, I want inspection controls to support Phase 2's success signal, so that users can trust pixel-level output.

## Implementation Decisions

- The existing two-state view scale model is replaced by an app-level preview viewport model.
- The preview viewport contains mode, zoom, center coordinates, pixel-grid enabled state, and pixel-inspector enabled state.
- Viewport mode supports Fit and Manual.
- Zoom uses a numeric scale where 1 means 100%, or one image pixel equals one CSS pixel.
- Wheel zoom applies multiplicative steps and rounds the resulting zoom percentage to 50% increments so the pixel grid remains aligned.
- Center coordinates are stored as image-pixel coordinates rather than CSS pixels or normalized coordinates.
- Center coordinates are named as center coordinates rather than pan offsets.
- Fit mode auto-fits the current preview frame to the available preview area.
- Manual mode uses the numeric zoom and image-space center coordinates to position the rendered frame.
- Pointer-drag panning is controlled through viewport state rather than native scrollbars.
- Manual-mode panning updates center coordinates in image pixels.
- The viewport center is clamped into image bounds when dimensions or viewport state changes.
- The preview toolbar contains inspection controls: Fit, 100%, zoom control, Grid toggle, and Pixel Inspector toggle.
- Processing controls remain in the Inspector; inspection controls live near the preview.
- Pixel grid is an app overlay and is never included in exported images.
- The grid toggle can be enabled at any zoom, but the grid is rendered only in Manual mode at 400% zoom and above.
- The grid is rendered over the shared compared image area, not separately baked into source canvases.
- Pixel Inspector MVP is a floating color and coordinate readout rather than an optical magnifying sub-canvas.
- The pixel inspector shows image-space x/y coordinates and original/processed hex values where available.
- The pixel inspector reads from displayed preview buffers.
- In slide compare, the pixel inspector reports both original and processed values regardless of divider position.
- Original and processed layers share the same viewport transform in slide compare.
- The slide divider keeps pointer priority when interacting with the divider handle.
- Dragging non-divider preview areas in Manual mode pans the locked viewport.
- Preview viewport state is stored in the web app store and may be locally persisted.
- Preview viewport state is not part of the public processing settings schema.
- Preview viewport state is not included in copied Settings JSON.
- Existing persisted Fit/1:1 state migrates to the new viewport state.
- The core processing package remains unaware of viewport, grid, loupe, or pan state.
- A deep viewport geometry module should encapsulate fit sizing, manual transforms, coordinate conversion, zoom anchoring, and clamping behind stable functions.
- A small pixel sampling module should encapsulate coordinate-to-buffer index conversion and hex formatting for original/processed inspector values.

## Testing Decisions

- Good tests should assert user-visible behavior and stable geometry contracts rather than internal React state.
- Viewport geometry tests should cover Fit sizing for different aspect ratios.
- Viewport geometry tests should cover Manual transform calculation from zoom and center coordinates.
- Viewport geometry tests should cover coordinate conversion from client/display space to image-pixel space.
- Viewport geometry tests should cover center clamping when image dimensions change.
- Viewport geometry tests should cover migration from old Fit state to new Fit viewport state.
- Viewport geometry tests should cover migration from old 1:1 state to Manual 100% viewport state.
- Pixel-grid tests should cover the render threshold contract: enabled grid appears only in Manual mode at 400% zoom and above.
- Pixel-sampling tests should cover valid coordinate sampling, out-of-bounds handling, and hex formatting.
- Pixel-inspector tests should cover original-only, processed-only, and original-plus-processed value availability.
- Slide compare tests should cover locked transform behavior at the component contract level where practical.
- Slide compare tests should preserve existing divider behavior while adding pan behavior.
- Store tests should verify that viewport state is independent from processing settings and copied settings payloads.
- Existing slide compare tests are prior art for pointer interaction and before/after preview behavior.
- Existing screen-sized preview tests are prior art for separating preview target sizing from processing output.
- Existing preview render boundary tests are prior art for avoiding unnecessary redraws and keeping rendering contracts stable.
- If end-to-end UI tests are added later, they should verify that zooming, panning, grid, and loupe are visible behaviors, not implementation details.

## Out of Scope

- Color-depth controls are out of scope for this subphase because they belong to Phase 2.1 Color Quality.
- RGB versus Oklab matching is out of scope for this subphase because it belongs to Phase 2.1 Color Quality.
- Public settings schema changes are out of scope except for ensuring viewport is not added to that schema.
- Optical magnifying sub-canvas loupe is out of scope for the MVP.
- Palette nearest-color details inside the loupe are out of scope for the MVP.
- Full keyboard panning and advanced accessibility shortcuts are out of scope for the first implementation slice, though toolbar buttons should remain accessible.
- Wheel-to-zoom and trackpad pinch zoom are optional follow-ups unless explicitly included in implementation planning.
- Exporting the pixel grid or loupe overlay is out of scope.
- Sharing viewport state in URLs or shareable looks is out of scope for Phase 2.2.
- Undo/history integration is out of scope.
- Effect stack work is out of scope.
- Motion pipeline work is out of scope.
- WASM/GPU acceleration is out of scope.

## Further Notes

This subphase should follow Phase 2.1 because it relies on the product having clearer color-quality controls to inspect. The most important architectural boundary is keeping preview viewport state out of the public processing settings contract. The most important UX boundary is keeping processing controls in the Inspector while placing inspection controls in the preview toolbar.
