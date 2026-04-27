# Inspector Control Repartition PRD

Status: planned
Slice: 2 of 3
Last updated: 2026-04-27

## Problem Statement

After the tabbed inspector shell exists, the current control grouping still reflects the old single Control Panel. Processing controls, compare controls, output sizing, palette editing, sharing utilities, and advanced settings are mixed in one vertical stream. This makes the new tabs less useful unless controls are repartitioned by user intent.

From the user's perspective, adjusting a look, discovering looks, editing palettes, comparing preview states, and exporting output are different workflows. The UI should make those workflows visible without forcing users through one long form.

## Solution

Repartition controls across the accepted tab model and move preview-specific controls closer to the preview surface.

`Adjust` becomes the daily look-tuning workspace: recipe selector, algorithm, Bayer size when applicable, brightness, contrast, color depth, color matching, and advanced tone/processing controls. `Looks` owns Auto-Tune and recipe discovery. `Palette` owns palette selection and palette actions. `Output` owns output dimensions, export preferences, resize kernel, alpha flattening, and utility sharing actions.

Compare mode moves out of the inspector's processing controls and into the preview toolbar because it changes how the result is viewed rather than how the image is processed. It should not be duplicated in the inspector after the move. The Preview Stage remains responsible for upload, undo/redo, export action, compact desktop format selection where appropriate, view scale, zoom, and desktop-only pixel inspection. Export quality moves to `Output`.

## User Stories

1. As an IMDITHER user, I want frequent look controls in `Adjust`, so that daily editing starts in one focused place.
2. As an IMDITHER user, I want Auto-Tune in `Looks`, so that automated starting points do not interrupt manual adjustment.
3. As an IMDITHER user, I want recipe discovery in `Looks`, so that curated looks live near Auto-Tune recommendations.
4. As an IMDITHER user, I want palette selection in `Palette`, so that color choice has a dedicated workspace.
5. As an IMDITHER user, I want output width in `Output`, so that final file dimensions are separated from look tuning.
6. As an IMDITHER user, I want export format and quality in `Output` where mobile space is tight, so that the preview toolbar stays compact.
7. As a desktop IMDITHER user, I want export format to remain close to the export action when it fits, so that exporting stays fast.
8. As a mobile IMDITHER user, I want export quality to stop crowding the preview toolbar, so that toolbar controls remain tappable.
9. As an IMDITHER user, I want compare mode near the preview, so that before/after viewing feels tied to the image surface.
10. As an IMDITHER user, I want zoom and fit controls to stay near the preview, so that navigation stays close to the image.
11. As an IMDITHER user, I want pixel inspection to remain desktop-only, so that mobile touch interactions stay focused on panning and preview use.
12. As an IMDITHER user, I want `Adjust` to avoid palette-management clutter, so that core tuning remains compact.
13. As an IMDITHER user, I want `Palette` to show enough state to understand the active palette, so that I do not need to inspect JSON or settings.
14. As an IMDITHER user, I want advanced tone and processing settings to be collapsed until needed, so that common controls stay visible.
15. As an IMDITHER user, I want Settings JSON and Look clipboard actions to stop occupying prime vertical space, so that utility actions do not crowd daily controls.
16. As an IMDITHER user, I want all existing settings transitions to keep working after controls move, so that the visual grouping does not change behavior.
17. As an IMDITHER user, I want undo and redo to keep working regardless of active tab, so that editing remains recoverable.
18. As an IMDITHER user, I want applying a recipe or Auto-Tune look to update the preview exactly as before, so that regrouping does not change processing.
19. As an IMDITHER user, I want copied looks and settings to keep using the same payloads, so that sharing compatibility remains stable.
20. As an IMDITHER user, I want output changes to continue preserving aspect-ratio behavior, so that existing resize expectations remain intact.
21. As an IMDITHER user, I want alpha flattening and resize kernel settings in `Output`, so that export-adjacent finalization choices live together.
22. As an IMDITHER user, I want the UI to avoid a catch-all `Advanced` tab, so that hidden controls are still grouped by meaning.
23. As a maintainer, I want control groups to have clear ownership, so that future controls have obvious placement.
24. As a maintainer, I want existing transition and store contracts preserved, so that repartitioning stays a view-layer change.
25. As a maintainer, I want preview toolbar tests to cover compare movement, so that view controls do not drift back into processing controls.
26. As a maintainer, I want component boundaries to stay thin over existing helpers, so that layout refactoring does not duplicate domain logic.
27. As a maintainer, I want the quality gate to pass after implementation, so that regrouping does not regress behavior.

## Implementation Decisions

- Treat this slice as a semantic regrouping over the tab shell from slice 1.
- Keep `Adjust` as the default tab.
- Put recipe, algorithm, Bayer size, brightness, contrast, color depth, and color matching in `Adjust`.
- Keep advanced tone and processing controls as collapsible content rather than a top-level `Advanced` tab.
- Keep advanced tone and processing controls under one shared `Collapsible` in the MVP slice, preserving the existing `advancedOpen` UI state.
- Put Auto-Tune recommendations and recipe discovery in `Looks`.
- Put palette select, swatch summary, extraction, import, export, and conversion actions in `Palette`.
- Leave the dense custom palette color list for the deep editor Drawer slice; do not add a fake `Edit colors` action before that behavior exists.
- Put output width, inferred height, resize kernel, alpha flatten, export format, export quality, Look clipboard, Settings JSON, and Defaults in `Output`.
- Move Compare controls to the Preview Stage toolbar and remove them from the inspector.
- Keep upload, undo, redo, export action, view scale, zoom, and desktop-only pixel inspector in the Preview Stage.
- Keep export action in the Preview Stage because exporting is a primary action on the current preview/output.
- Treat `Output` as the canonical export preferences area.
- Preserve a compact desktop export format selector near the export action if the layout supports it, wired to the same `exportFormat` state.
- Move export quality out of the preview toolbar and into `Output`.
- Split the former Control Panel JSX into thin semantic subcomponents such as `AdjustControls`, `PaletteControls`, and `OutputControls`.
- Preserve the existing settings transition interface.
- Preserve Editor Settings schema and persisted store behavior.
- Preserve Settings JSON and Look payload contracts.
- Avoid introducing a separate settings model for recipes or Auto-Tune.
- Avoid duplicating palette parsing, extraction, and export logic in view components.

## Testing Decisions

- Good tests should verify that moved controls still perform the same public actions.
- Test that Compare controls render in the Preview Stage rather than the processing inspector.
- Test that Compare mode callbacks still update the selected mode.
- Test that `Adjust` contains the core look controls and those controls call the same settings transitions.
- Test that the single advanced collapsible preserves current open/closed behavior.
- Test that `Output` contains output width and finalization/export preferences.
- Test that export quality renders in `Output`, not in the preview toolbar.
- Test that compact desktop format selection and `Output` format preference stay wired to the same state when both are present.
- Test that Look and Settings JSON utilities continue to call clipboard handlers from their new location.
- Test that palette actions continue to call the existing palette handlers from `Palette`.
- Test that the dense custom color list is not introduced in `Palette` before the deep editor slice.
- Test that moving controls does not change Editor Settings serialization.
- Test that tab switching does not reset draft slider state unexpectedly.
- Test that export format and quality changes still do not trigger preview processing.
- Existing Control Panel tests are prior art for settings transition wiring.
- Existing Preview Stage tests are prior art for preview toolbar actions and view controls.
- Existing export layer tests are prior art for export preference behavior.
- Existing editor settings transition tests are prior art for schema and settings behavior.
- Run `bun verify` after implementation because this slice changes code.

## Out of Scope

- No new Auto-Tune ranking behavior.
- No compact recommendation rail redesign beyond necessary placement.
- No custom palette color editor overlay.
- No new export formats.
- No changes to preview job scheduling.
- No changes to processing algorithms.
- No changes to source intake.
- No persistent recipe id.
- No new top-level `Advanced` tab.
- No redesign of theme tokens except local spacing needed for the repartitioned controls.

## Further Notes

The key product distinction is workflow ownership. `Adjust` changes the look, `Looks` finds starting points, `Palette` manages color sources, `Output` finalizes file/output behavior, and the Preview Stage controls how the current result is viewed.

This slice should be implemented after the shell is stable, because otherwise control movement and scroll-model fixes will be hard to validate independently.
