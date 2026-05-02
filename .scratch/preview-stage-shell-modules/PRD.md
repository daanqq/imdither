# Preview Stage Shell Modules PRD

Status: needs-triage

## Problem Statement

Preview Stage owns the preview workstation shell, but its implementation still
contains several distinct UI and workflow concerns in one large module:
drop/upload handling, processing overlays, source error overlays, Preview
Presentation mounting, preview-owned controls, history actions, and Export
Drawer content.

From the user's perspective, the UI works, but future changes to Export Drawer,
preview controls, or history/upload layout risk touching the same module that
wires Preview Presentation. That raises regression risk around preview behavior,
especially because Preview Stage sits beside the preview interaction seams.

From the maintainer's perspective, Preview Stage is not wrong as a product
concept; it is the correct shell. The problem is that its internal modules are
too shallow and colocated. Edits to one repeated concern have weak locality.

## Solution

Keep Preview Stage as the outer workstation shell, but deepen its internal
modules around the distinct Preview Stage concerns:

- Preview Surface Controls: Compare Mode chip and Preview View controls
- Export Drawer Content: Export Format, Export Quality, and final Export Action
- Preview Action Strip: upload, Export drawer trigger, Undo, Redo
- Preview Status Overlays: processing/refinement and source rejection overlays
- Preview Display Measurement: resize observer and display-size notification

The implementation should preserve current UI behavior and layout. This PRD is a
shell modularity refactor, not a redesign.

## User Stories

1. As an IMDITHER user, I want Preview Stage layout to remain visually
   unchanged, so that architecture cleanup does not disrupt my workflow.
2. As an IMDITHER user, I want Upload to keep loading Source Images, so that
   file intake behavior is unchanged.
3. As an IMDITHER user, I want drag and drop to keep accepting image files, so
   that Source Load behavior is unchanged.
4. As an IMDITHER user, I want invalid drops to keep reporting the same error,
   so that rejection feedback stays clear.
5. As an IMDITHER user, I want Compare Mode switching to behave the same, so
   that Processed View, Original View, and Slide Compare remain predictable.
6. As an IMDITHER user, I want Fit View, Real Pixels, zoom, and Pixel Inspector
   controls to stay in the same preview-owned position, so that inspection
   workflow is unchanged.
7. As an IMDITHER user, I want Undo and Redo to remain available in the bottom
   action strip, so that Settings History remains quick to access.
8. As an IMDITHER user, I want Export Drawer behavior to stay unchanged, so that
   Export Format, Export Quality, and Export Action remain familiar.
9. As an IMDITHER user, I want processing and source rejection overlays to keep
   appearing in the same place, so that status feedback remains legible.
10. As a maintainer, I want Preview Surface Controls in their own deep module, so
    that preview control changes do not touch Export Drawer or shell layout.
11. As a maintainer, I want Export Drawer Content in its own deep module, so that
    export UI changes do not touch Preview Presentation wiring.
12. As a maintainer, I want Preview Action Strip in its own deep module, so that
    upload/export/history row changes remain local.
13. As a maintainer, I want Preview Status Overlays in their own deep module, so
    that status copy and visual changes do not touch preview interaction code.
14. As a maintainer, I want Preview Display Measurement isolated, so that Screen
    Preview sizing behavior remains testable and protected.
15. As a maintainer, I want Preview Stage to keep owning shell composition, so
    that product vocabulary and layout responsibility remain clear.
16. As a maintainer, I want no changes to Preview Presentation public behavior,
    so that this refactor does not reopen preview rendering seams.
17. As a maintainer, I want test coverage at module seams, so that each shell
    concern can be changed independently.
18. As a maintainer, I want existing Preview Stage tests to keep passing, so that
    behavior parity is proven.

## Implementation Decisions

- Preserve Preview Stage as the product-level shell module.
- Extract Preview Surface Controls into a local or dedicated module with a small
  interface over Compare Mode, Preview Viewport, dimensions, and Pixel Inspector
  capability.
- Extract Export Drawer Content into a local or dedicated module with a small
  interface over Export Preferences and Export Action.
- Extract Preview Action Strip into a local or dedicated module with a small
  interface over Upload, Export drawer trigger state, and Settings History
  commands.
- Extract Preview Status Overlays into local or dedicated modules over Job
  Status, algorithm label, preview refinement state, and error text.
- Keep Preview Display Measurement as an explicit module or hook with tests
  around threshold/debounce behavior where practical.
- Do not change Tailwind layout values unless extraction requires moving the
  same classes.
- Do not change Export Drawer copy, Compare Mode labels, Preview View controls,
  Upload behavior, Undo/Redo behavior, or overlay copy in this slice.
- Do not move Source Intake Application, Export Action Application, or Preview
  Presentation responsibilities into Preview Stage submodules.

## Testing Decisions

- Good tests should verify observable Preview Stage shell behavior, not private
  file layout.
- Preserve existing Preview Stage tests as behavioral regression coverage.
- Add focused tests for extracted Preview Surface Controls if existing coverage
  does not already prove Compare Mode and Preview Viewport callbacks.
- Add focused tests for Export Drawer Content if existing coverage does not
  already prove Export Format, Export Quality, and Export Action callbacks.
- Add focused tests for Preview Action Strip if upload/export/history callback
  wiring becomes its own module.
- Add tests for Preview Status Overlays where copy/status decisions become
  separate from Preview Stage.
- Existing Preview Stage tests are prior art.
- Existing responsive drawer tests are prior art for drawer behavior.
- Existing preview interaction tests are prior art for avoiding preview behavior
  regressions.
- Run `bun check` after implementation.

## Out of Scope

- Redesigning Preview Stage layout.
- Moving Preview Presentation responsibilities.
- Changing Compare Mode behavior.
- Changing Preview Viewport Interaction behavior.
- Changing Export Action Application.
- Changing Source Intake Application.
- Changing mobile versus desktop layout rules.
- Changing Screen Preview sizing semantics.
- Changing Canvas Redraw Boundary or Render Boundary behavior.

## Further Notes

This PRD aims for locality. Deleting the extracted modules should make their
complexity reappear inside Preview Stage, not disappear; that is the signal that
the modules are earning their keep.
