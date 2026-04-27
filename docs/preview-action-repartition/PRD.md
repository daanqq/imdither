# Preview Action Repartition PRD

Status: done
Last updated: 2026-04-27

## Problem Statement

The current Preview Stage toolbar gives equal visual weight to file actions, export preferences, compare modes, view modes, zoom, and inspection controls. On desktop this is tolerable, but on mobile the rows consume too much vertical space and make the preview feel secondary to its controls.

From the user's perspective, view controls should live on the preview because they affect inspection of the current image. Export controls should remain easy to reach because the user decides to export while looking at the final result, but export settings should not keep occupying the mobile preview surface.

The inspector also still carries output controls that no longer match the desired workflow. Width, resize kernel, and alpha flattening are image-adjustment controls, while format, quality, and palette file downloads are export/download controls.

## Solution

Repartition the Preview Stage and inspector controls by workflow ownership.

Preview owns viewing controls. Compare mode becomes a small floating control on the preview surface that shows the current mode and cycles through `Slide`, `Processed`, and `Original`. View scale, zoom, 1:1, and pixel inspection move into a floating view control on the preview surface. The view control opens a Popover on desktop/tablet and a bottom Drawer on mobile.

The action row below the preview keeps only file/output and history actions: `Upload` and primary `Export` align to the left while icon-only `Undo` and `Redo` align to the right. The export button opens an Export Drawer on all screen sizes. Format, quality, and final image download live in that drawer.

The inspector drops the `Output` tab. Output width, resize kernel, and alpha flattening move into `Adjust`. Palette editing and palette file downloads remain in `Palette` because they are palette assets, not final image export settings.

## User Stories

1. As an IMDITHER user, I want the preview to remain visually dominant on mobile, so that I can judge the processed result without toolbar rows taking over the screen.
2. As an IMDITHER user, I want compare controls on the preview surface, so that the control is next to the image it affects.
3. As an IMDITHER user, I want one compare button instead of a three-option segmented row, so that mobile preview controls stay compact.
4. As an IMDITHER user, I want the compare button to show the current compare mode, so that I always know what I am viewing.
5. As an IMDITHER user, I want clicking the compare button to cycle modes, so that I can switch quickly without opening another panel.
6. As an IMDITHER user, I want the compare cycle to start from `Slide`, so that the default before/after workflow stays primary.
7. As an IMDITHER user, I want the compare cycle to proceed `Slide`, `Processed`, `Original`, and back to `Slide`, so that the order matches the inspection workflow.
8. As an IMDITHER user, I want assistive labels to say what the compare button will switch to, so that the compact visual label remains accessible.
9. As an IMDITHER user, I want view controls on the preview surface, so that I do not leave the image context to change fit, pixel view, zoom, or inspection.
10. As an IMDITHER user, I want the view control to summarize the current state, so that I can see `Fit` or `Pixels` and the zoom percentage at a glance.
11. As an IMDITHER user, I want detailed view controls in a Popover on desktop, so that I can adjust inspection without consuming permanent toolbar space.
12. As a mobile IMDITHER user, I want detailed view controls in a bottom Drawer, so that touch targets remain comfortable.
13. As a mobile IMDITHER user, I want the preview to stay visible behind the view drawer, so that I keep visual context while changing view settings.
14. As an IMDITHER user, I want floating preview controls to prefer preview margins, so that they avoid covering image pixels when there is available space.
15. As an IMDITHER user, I want floating preview controls to overlay the image only when the preview is too tight, so that controls remain reachable on small screens.
16. As an IMDITHER user, I want floating controls to use blurred paper-like surfaces, so that labels stay readable without visually fighting noisy dithered images.
17. As an IMDITHER user, I want floating controls to appear only after an image is loaded, so that the empty state stays clean.
18. As an IMDITHER user, I want `Upload` to remain visible below the preview, so that changing the source image stays quick.
19. As an IMDITHER user, I want `Undo` and `Redo` to remain always visible as icon buttons, so that editing stays recoverable without opening menus.
20. As an IMDITHER user, I want `Export` to remain visible below the preview, so that final download stays tied to reviewing the current result.
21. As an IMDITHER user, I want `Export` to open a responsive Drawer, so that export options can be reviewed without crowding the action row.
22. As an IMDITHER user, I want export format inside the Export Drawer, so that the action row is not split between export button and format selector.
23. As an IMDITHER user, I want export quality inside the Export Drawer, so that quality is part of the final download flow.
24. As an IMDITHER user, I want the Drawer primary action to say what file type will be downloaded, so that the final action is explicit.
25. As an IMDITHER user, I want PNG quality to remain visibly lossless at 100%, so that PNG behavior stays understandable.
26. As an IMDITHER user, I want palette JSON and GPL downloads in `Palette`, so that reusable palette assets live with palette editing.
27. As an IMDITHER user, I want palette editing to remain in `Palette`, so that managing colors stays separate from downloading files.
28. As an IMDITHER user, I want width in `Adjust`, so that output size is treated as part of image transformation rather than export settings.
29. As an IMDITHER user, I want resize kernel in `Adjust`, so that resizing behavior lives next to width.
30. As an IMDITHER user, I want alpha flattening in `Adjust`, so that image compositing behavior lives with other processing adjustments.
31. As an IMDITHER user, I want the `Output` tab removed after its controls move, so that inspector navigation has fewer false destinations.
32. As an IMDITHER user, I want the inspector tabs to be `Looks`, `Adjust`, and `Palette`, so that each tab has a clear workflow.
33. As an IMDITHER user, I want existing preview, export, palette, and resize behavior to remain unchanged, so that this repartition is a layout and flow improvement, not a processing change.
34. As a maintainer, I want preview action ownership to be explicit, so that future controls have obvious placement.
35. As a maintainer, I want export logic to stay centralized behind the existing export handlers, so that the drawer does not duplicate download behavior.
36. As a maintainer, I want view control content shared between Popover and Drawer, so that desktop and mobile behavior cannot drift.
37. As a maintainer, I want compare cycling to be a small tested helper, so that UI code does not encode hidden ordering assumptions.
38. As a maintainer, I want inspector control movement to preserve existing settings transitions, so that persisted settings and undo/redo remain stable.

## Implementation Decisions

- Preserve the existing local, browser-only editor model.
- Keep `Slide` as the default compare mode.
- Replace the visible three-item compare segmented control with a single compare cycle control.
- The compare cycle order is `Slide`, `Processed`, `Original`, `Slide`.
- The compare cycle control shows the current mode, not the next mode.
- The compare cycle control exposes the next mode through accessible labeling and optional tooltip copy.
- Place the compare cycle control as a loaded-only floating control at the top-left of the preview surface.
- Keep compare labels short: `Slide`, `Processed`, and `Original`.
- Move view scale, 1:1, zoom, and pixel inspector affordances into a loaded-only floating view control at the top-right of the preview surface.
- The view control summary shows `Fit` when in fit mode and `Pixels` plus zoom percentage when in manual pixel mode.
- Use a shadcn Popover for desktop/tablet view details.
- Use the existing shadcn Drawer for mobile view details.
- Share one view control content module between Popover and Drawer.
- View control content includes `Fit`, `Pixels`, `1:1`, zoom slider, and pixel inspector toggle when pixel inspection is available.
- Keep pixel inspection unavailable on mobile if current desktop-only behavior remains in place.
- Floating preview controls should prefer preview margins and may overlay the image only when margins are too tight.
- Floating preview controls use translucent preview-paper surfaces with
  backdrop blur, no visible border, and low radius so they remain readable
  without fighting the preview.
- Keep the bottom preview action row visible.
- Reduce the bottom action row to `Upload`, `Export`, `Undo`, and `Redo`.
- Align `Upload` and `Export` to the left edge of the preview frame.
- Align `Undo` and `Redo` to the right edge of the preview frame.
- Keep `Upload` visible after an image has loaded.
- Keep `Undo` and `Redo` as icon-only square buttons with disabled state visible.
- Keep `Export` as the primary action in the row.
- Change `Export` so it opens an Export Drawer on all screen sizes.
- Responsive drawers open from the right on desktop and from the bottom on
  mobile.
- Do not keep a separate format select beside `Export`.
- Move export format into the Export Drawer.
- Move export quality into the Export Drawer.
- Keep PNG quality visible as lossless `100%` when PNG is selected.
- Put the final image download behind a primary action inside the Export Drawer.
- The drawer primary action should reflect the selected format, such as `Download PNG`.
- Keep palette JSON and GPL downloads in `Palette`.
- Keep palette import, extraction, color editing, and palette selection in `Palette`.
- Move output width into `Adjust`.
- Move resize kernel into `Adjust`.
- Move alpha flattening into `Adjust`.
- Remove the `Output` inspector tab once its controls have moved.
- Keep inspector tabs as `Looks`, `Adjust`, and `Palette`.
- Preserve the existing settings transition interface.
- Preserve editor settings schema and persisted store behavior.
- Preserve existing export handlers and avoid duplicating export generation logic in UI components.
- Add Popover via the shadcn workflow before using it.
- Use existing shadcn primitives for Drawer, Popover, Button, Toggle Group, Select, Slider, Field, and Separator composition.
- Avoid adding a router or new state-management dependency.

## Testing Decisions

- Good tests should verify user-visible behavior and public callbacks rather than internal DOM structure.
- Test that the Preview Stage no longer renders the three-option compare segmented row.
- Test that the compare cycle control renders only when an image is loaded.
- Test that the compare cycle control displays the current compare mode.
- Test that clicking the compare cycle control calls compare mode change with the next mode.
- Test the compare cycle order across `Slide`, `Processed`, and `Original`.
- Test that the view control renders only when an image is loaded.
- Test that the view control summary reflects fit mode.
- Test that the view control summary reflects manual pixel mode and zoom percentage.
- Test that view control content can switch to fit mode.
- Test that view control content can switch to pixel/manual mode.
- Test that the 1:1 action centers the manual viewport at zoom 1.
- Test that zoom slider changes keep the viewport in manual mode.
- Test that pixel inspector toggle remains available only when enabled by the Preview Stage props.
- Test that the action row contains `Upload`, `Export`, icon-only `Undo`, and icon-only `Redo`.
- Test that `Upload` and `Export` align left while `Undo` and `Redo` align right.
- Test that the action row no longer contains the export format select.
- Test that `Export` opens the Export Drawer instead of immediately starting the download.
- Test that final download from the Export Drawer calls the existing export handler.
- Test that the Export Drawer changes export format through the existing export format callback.
- Test that the Export Drawer changes export quality through the existing export quality callback.
- Test that PNG quality is shown as 100% and disabled when PNG does not support quality.
- Test that palette JSON and GPL download actions remain in `Palette` and call existing palette export handlers.
- Test that `Adjust` contains width, resize kernel, and alpha flatten controls after the move.
- Test that `Output` tab is not rendered after repartition.
- Test that `Palette` still contains palette selection and editing entry points.
- Test that palette file downloads are not duplicated in the Export Drawer.
- Test that existing settings transitions are emitted unchanged for width, resize kernel, and alpha flattening.
- Existing Preview Stage tests are prior art for action-row behavior, compare mode, view scale, zoom, and export callbacks.
- Existing Inspector Panel tests are prior art for tab content and settings transition wiring.
- Existing export layer tests are prior art for format, quality, file naming, and download behavior.
- Existing Palette Editor tests are prior art for palette import, copy, export, and color editing callbacks.
- Run `bun verify` after implementation because this PRD changes TypeScript, component tests, and UI wiring.

## Out of Scope

- No changes to dithering algorithms.
- No changes to worker scheduling.
- No changes to source intake, drag-and-drop, paste, or demo loading behavior.
- No changes to export image encoding beyond moving controls.
- No new export formats.
- No new palette file formats.
- No new persisted compare mode semantics.
- No persisted drawer or popover open state.
- No mobile pixel inspector redesign.
- No marketing-style preview chrome.
- No replacement of the inspector tabs shell.
- No theme token overhaul beyond local spacing and surface classes needed for the new controls.
- No dev server requirement for this PRD.

## Further Notes

This PRD supersedes the earlier assumption that `Output` remains the canonical export preferences area. The new ownership model is:

- Preview surface owns viewing controls.
- Preview action row owns immediate file/output entry points.
- Export Drawer owns final image download configuration.
- `Adjust` owns image transformation controls.
- `Palette` owns palette choice, editing, extraction, import, and palette asset downloads.

The central design rule is proximity by intent. Controls used while looking at the image belong on the preview. Controls used to prepare a final image download belong in the Export Drawer. Controls that change the processed image belong in `Adjust`. Controls that manage reusable palette assets belong in `Palette`.
