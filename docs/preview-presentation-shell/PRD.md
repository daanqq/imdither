# Preview Presentation Shell PRD

Status: done
Last updated: 2026-04-29

## Problem Statement

Preview Presentation has already absorbed shared preview mechanics, but the shell
around it still leaks too much rendering knowledge into Preview Stage.
Preview Stage still chooses between processed, original, and Slide Compare
surfaces; derives view scale; passes manual and preview frame dimensions; keeps
the measured surface viewport box; and wires per-surface display sizes.

From the user's perspective, this makes preview fixes fragile. Work on Fit View,
Manual View, Slide Compare alignment, Pixel Inspector sampling, or mobile
gestures can still require edits across the workstation shell and individual
Preview Surface branches. The preview should remain visually unchanged, but the
code should make the truthful preview contract easier to protect.

## Solution

Deepen Preview Presentation behind a product-state model interface.

Preview Stage should remain the workstation shell for the preview area: upload
and drop affordances, processing and source error overlays, Export Drawer entry,
Export Preferences controls, Undo and Redo, and card-level layout. It should
pass Preview Presentation the product state needed to render a preview, not the
ready-made display geometry for each surface.

Preview Presentation should own the surface selection and display mechanics for
processed-only, original-only, and Slide Compare modes. Slide Compare remains a
distinct internal Preview Surface Adapter because it owns the Slide Divider and
two-layer composition. Original-only and processed-only use a canvas adapter.
The public interface should describe Compare Mode, Preview Viewport, original
and processed Pixel Buffers, output dimensions, preview target dimensions, job
state, and desktop precision capability.

Display Frame measurement moves inside Preview Presentation. Screen Preview
target calculation stays outside this refactor for now because it affects
Preview Job scheduling rather than only display mechanics.

## Shipped Result

- Preview Stage now passes `PreviewPresentation` a product-state model instead
  of selecting `SlideComparePreview` or canvas surfaces directly.
- Preview Presentation now owns processed-only, original-only, and Slide Compare
  surface selection.
- Preview Presentation derives `fit` versus `actual` view scale from Preview
  Viewport mode.
- Preview Presentation derives Fit View display dimensions from Screen Preview
  target dimensions and Manual View dimensions from Full Output dimensions.
- Preview Presentation owns Slide Divider runtime state and resets it when the
  Source Image identity changes.
- Preview Presentation reports Display Frame measurement through the existing
  external display-size callback used by Screen Preview scheduling.
- The old Preview Stage geometry helper was removed so display mechanics have
  one owner.

## User Stories

1. As an IMDITHER user, I want processed preview to look unchanged, so that the
   refactor does not disrupt editing.
2. As an IMDITHER user, I want original preview to look unchanged, so that
   source inspection remains reliable.
3. As an IMDITHER user, I want Slide Compare to look unchanged, so that before
   and after comparison remains familiar.
4. As an IMDITHER user, I want Fit View to continue showing the whole image, so
   that I can judge composition quickly.
5. As an IMDITHER user, I want Real Pixels to continue using Manual View, so
   that I can inspect output pixels precisely.
6. As an IMDITHER user, I want wheel zoom to continue anchoring around the
   cursor, so that zooming does not jump away from the inspected region.
7. As an IMDITHER user, I want mouse pan to continue moving the Manual View
   image, so that desktop inspection stays fast.
8. As an IMDITHER user, I want Touch Pan to continue moving the Manual View
   image, so that mobile inspection stays direct.
9. As an IMDITHER user, I want Touch Pinch Zoom to continue preserving the
   Gesture Anchor, so that mobile zoom stays predictable.
10. As an IMDITHER user, I want Pixel Inspector to remain available on desktop,
    so that I can inspect original and processed colors.
11. As an IMDITHER user, I want Pixel Inspector to sample the same visible
    coordinates after the refactor, so that color readouts remain trustworthy.
12. As an IMDITHER user, I want Slide Divider dragging to remain smooth, so that
    comparison remains responsive.
13. As an IMDITHER user, I want Slide Divider alignment to stay tied to the
    visible Display Frame, so that original and processed layers do not drift.
14. As an IMDITHER user, I want Slide Divider position to reset for a new Source
    Image, so that a new image starts from a neutral comparison.
15. As an IMDITHER user, I want Slide Divider position to stay runtime-only, so
    that copied looks and settings do not include transient compare state.
16. As an IMDITHER user, I want reduced preview and refinement states to keep
    their current behavior, so that responsiveness does not regress.
17. As an IMDITHER user, I want Export to remain based on Full Output, so that
    preview display changes never alter the downloaded file.
18. As an IMDITHER user, I want Export Format and Export Quality controls to stay
    where they are, so that the export workflow does not change.
19. As an IMDITHER user, I want Upload and drop behavior to stay unchanged, so
    that loading a Source Image remains familiar.
20. As an IMDITHER user, I want Undo and Redo to stay visible below the preview,
    so that settings history remains accessible.
21. As an IMDITHER user, I want processing and source error overlays to stay
    unchanged, so that runtime feedback remains clear.
22. As an IMDITHER user, I want no new visible controls or instructional copy,
    so that the preview surface stays focused.
23. As a maintainer, I want Preview Stage to stop choosing Preview Surface
    implementations, so that the shell does not own rendering mechanics.
24. As a maintainer, I want Preview Stage to pass a product-state model, so that
    the public interface stays small and stable.
25. As a maintainer, I want Preview Presentation to choose internal Preview
    Surface Adapters, so that surface behavior is localized.
26. As a maintainer, I want Slide Compare to remain a distinct internal adapter,
    so that Slide Divider behavior stays local.
27. As a maintainer, I want original and processed canvas rendering to share the
    same adapter shape, so that single-surface preview modes do not drift apart.
28. As a maintainer, I want Display Frame measurement inside Preview
    Presentation, so that geometry knowledge does not leak into Preview Stage.
29. As a maintainer, I want Screen Preview target calculation to remain outside
    this module for now, so that Preview Job policy stays with runtime
    orchestration.
30. As a maintainer, I want view scale derivation to be internal to Preview
    Presentation, so that callers do not translate Preview Viewport mode into
    display mechanics.
31. As a maintainer, I want manual frame dimensions to be internal to Preview
    Presentation, so that Manual View sizing is tested behind one seam.
32. As a maintainer, I want preview frame dimensions to be internal to Preview
    Presentation, so that Fit View and Manual View use one display model.
33. As a maintainer, I want measured viewport box state to be internal to Preview
    Presentation, so that surface adapters do not require shared caller state.
34. As a maintainer, I want canvas drawing to remain behind Preview Surface
    Adapters, so that Pixel Buffer drawing does not leak into Preview Stage.
35. As a maintainer, I want tests to cover observable preview behavior, so that
    the internal adapter shape can change later.
36. As a maintainer, I want deterministic tests rather than screenshot baselines,
    so that geometry regressions are caught without brittle visual snapshots.
37. As a maintainer, I want the refactor split into small slices, so that compare,
    zoom, pan, and inspector regressions can be isolated quickly.

## Implementation Decisions

- The seam is Preview Presentation, not Preview Stage.
- Preview Stage remains the shell for Upload, drop, overlays, Export Drawer,
  Export Preferences, Undo, Redo, and preview-area layout.
- Preview Stage no longer chooses between processed-only, original-only, and
  Slide Compare rendering branches after the refactor.
- Preview Stage passes a product-state model into Preview Presentation.
- The product-state model includes Compare Mode, Preview Viewport, original
  Pixel Buffer, processed Pixel Buffer, Full Output dimensions, Screen Preview
  target dimensions, Processing Status, Preview Refinement state, and desktop
  precision capability.
- Adapter callbacks remain separate from the product-state model.
- Preview Presentation owns view scale derivation from Preview Viewport mode.
- Preview Presentation owns Display Frame measurement.
- Preview Presentation reports Display Frame size through an external callback.
- Screen Preview target calculation remains outside Preview Presentation for
  this PRD.
- Preview Job scheduling remains outside Preview Presentation for this PRD.
- Preview Presentation owns manual frame and preview frame sizing decisions.
- Preview Presentation owns the measured surface viewport box.
- Preview Presentation owns the choice of internal Preview Surface Adapter.
- Slide Compare remains a distinct internal Preview Surface Adapter.
- Slide Compare no longer remains a public sibling branch owned by Preview Stage.
- Original-only and processed-only modes use a canvas Preview Surface Adapter.
- Canvas drawing remains inside surface adapters.
- Slide Divider state moves inside Preview Presentation.
- Slide Divider remains View-local State.
- Slide Divider is not persisted.
- Slide Divider is not included in Editor Settings.
- Slide Divider is not included in Settings JSON.
- Slide Divider is not included in Look Snapshots or Look Payloads.
- Slide Divider is not included in Export Metadata.
- Slide Divider can preserve its last value while the current Preview
  Presentation instance remains mounted.
- Slide Divider resets to the default value for a new Source Image.
- Preview Viewport remains outside Preview Presentation because it is already
  persisted and migrated through editor state.
- Compare Mode remains outside Preview Presentation because it is editor
  selection state.
- Pixel Inspector sampling remains inside Preview Presentation.
- Pixel Inspector visibility remains controlled by desktop precision capability
  and Preview Viewport state.
- Processing and source error overlays remain in Preview Stage.
- Export Drawer content remains in Preview Stage.
- Upload input and drop handling remain in Preview Stage.
- Undo and Redo controls remain in Preview Stage.
- No visible preview behavior changes are intended.
- No new Compare Modes are added.
- No Source Intake changes are included.
- No Processing Job behavior changes are included.
- No Export Job behavior changes are included.
- No Editor Settings schema changes are included.
- No Settings JSON contract changes are included.
- No Look Payload contract changes are included.
- No worker protocol changes are included.
- Implementation should be split into two slices.
- Slice A creates the product-state model and moves internal adapter choice into
  Preview Presentation.
- Slice A removes public surface branching from Preview Stage.
- Slice B moves Display Frame geometry ownership into Preview Presentation.
- Slice B removes `viewScale`, measured viewport box, manual frame dimensions,
  and per-mode display-size decisions from Preview Stage.

## Testing Decisions

- Good tests should verify Preview Presentation behavior through the module
  interface, not through private adapter structure.
- Good tests should assert user-visible geometry and interaction contracts, not
  exact DOM nesting unless that nesting affects accessibility or visible
  behavior.
- Deterministic unit and component tests are preferred.
- Screenshot tests are out of scope for this refactor.
- Preview Presentation Core tests should cover the display model.
- Preview Presentation Core tests should verify that processed, original, and
  Slide Compare modes use the same frame sizing policy where appropriate.
- Preview Presentation Core tests should verify that Fit View uses Screen Preview
  target dimensions.
- Preview Presentation Core tests should verify that Manual View uses Full
  Output dimensions.
- Preview Presentation Core tests should verify that new Source Image identity
  resets Slide Divider.
- Preview Presentation Core tests should verify the agreed Slide Divider
  persistence behavior while the presentation remains mounted.
- Preview Presentation Shell tests should verify that Display Frame measurement
  calls the external display-size callback.
- Preview Presentation Shell tests should verify that wheel zoom, pan, and pinch
  still emit Preview Viewport changes.
- Preview Presentation Shell tests should verify that Pixel Inspector appears
  only when enabled and when a sample exists.
- Preview Presentation Shell tests should verify that processed-only,
  original-only, and Slide Compare modes render through the new public
  Presentation interface.
- Existing Preview Viewport tests remain prior art for zoom, pan, anchoring, and
  coordinate mapping.
- Existing Preview Presentation tests remain prior art for frame sizing,
  viewport updates, divider mapping, and inspector sampling.
- Existing Slide Compare tests remain prior art for divider behavior and layer
  alignment.
- The former Preview Stage geometry coverage moved into Preview Presentation
  Core tests for product-state display model derivation.
- Existing Preview Stage tests should be updated only where public responsibilities
  change.
- Tests should not require Playwright for this PRD.

## Out of Scope

- No visual redesign of the preview area.
- No new preview controls.
- No new Compare Modes.
- No changes to Source Intake.
- No changes to Auto-Tune.
- No changes to Processing Jobs.
- No changes to Preview Job cancellation.
- No changes to Preview Refinement timing.
- No changes to worker protocols.
- No changes to dithering algorithms.
- No changes to palettes.
- No changes to Editor Settings.
- No changes to Settings JSON.
- No changes to Look Payloads.
- No changes to Export File encoding.
- No changes to Export Preferences.
- No persistence for Slide Divider.
- No screenshot baseline system.
- No Playwright coverage for this refactor.
- No migration to WebGL, WebGPU, Konva, Fabric, Pixi, or a tiled viewer.

## Further Notes

This PRD supersedes the open question from the previous Preview Presentation
Module PRD about whether Slide Divider should move fully inside Preview
Presentation. The answer for this refactor is yes: Slide Divider becomes
Preview Presentation View-local State and resets for a new Source Image.

The key architectural aim is depth. Preview Presentation should hide rendering,
measurement, and surface-adapter complexity behind a product-state model
interface. Preview Stage should remain a shell with clear leverage: it composes
workstation actions around the preview without knowing how individual Preview
Surfaces are rendered.

The key implementation risk is coordinate drift. Any implementation should
preserve the invariant that original and processed imagery share the same
Display Frame in Slide Compare and that Pixel Inspector samples the coordinates
the user can see.
