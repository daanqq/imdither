# Market Impact Roadmap Phase 1 PRD

Status: done
Last updated: 2026-04-26

## Problem Statement

IMDITHER already has strong preset palettes, deterministic palette-aware
processing, settings copy/paste, and schema-level custom palette support. The
missing piece is a user-facing palette workflow.

Today, users can choose from curated palette presets, but they cannot create,
edit, import, export, or extract a palette without leaving the app or hand
editing Settings JSON. This weakens the product promise of building looks from
palette, texture, and screen structure. It also prevents palettes from becoming
reusable creative assets inside the local editor.

Phase 1 exists to turn custom palettes from a schema capability into a real
local-first workflow while preserving Processing Presets as applied recipes,
keeping Editor Settings reproducible, and avoiding a larger library/history
model before the product needs it.

## Solution

Add a Palette Platform MVP to the existing single-screen workstation:

- one active custom palette in Editor Settings
- canonical custom palette state with a `Custom` palette identity
- inline palette editor inside the Inspector
- palette import from files and clipboard text
- palette export as JSON and GPL
- palette extraction from the current Source Image
- deterministic median-cut extraction with user-selected palette size
- manual swatch editing with hex and native color inputs
- stable color normalization and validation

Phase 1 should be implemented in four sequential vertical slices:

1. `custom-palette-transition`
2. `palette-codec`
3. `inline-palette-editor`
4. `source-palette-extraction`

The Phase 1 exit criterion is that users can create, edit, reuse, exchange, and
extract palettes without leaving the local editor. The implementation should not
introduce accounts, cloud storage, palette libraries, undo/history, or a second
settings model.

## User Stories

1. As an IMDITHER user, I want to create a custom palette in the editor, so that
   I can make looks that are not limited to preset palettes.
2. As an IMDITHER user, I want the Palette control to show Custom when a custom
   palette is active, so that the UI honestly describes the current look.
3. As an IMDITHER user, I want only one active custom palette in Phase 1, so
   that the workflow stays focused on the current image and current look.
4. As an IMDITHER user, I want custom palettes to be stored in Settings JSON, so
   that copied settings reproduce the palette-dependent output.
5. As an IMDITHER user, I want custom palette colors to be explicit hex values,
   so that the settings remain portable and readable.
6. As an IMDITHER user, I want selecting a preset palette to replace the active
   custom palette, so that preset selection remains direct and predictable.
7. As an IMDITHER user, I want applying a Processing Preset to replace the
   active custom palette, so that named recipes use their intended preset
   palettes.
8. As an IMDITHER user, I want a short notice when my custom palette is replaced
   by a preset or recipe, so that I understand why the Custom state disappeared.
9. As an IMDITHER user, I want no confirmation dialog when changing palettes, so
   that experimentation remains fast.
10. As an IMDITHER user, I want the custom palette editor to live in the
    Inspector, so that palette work stays in the same single-screen workflow.
11. As an IMDITHER user, I want to see swatches for every custom palette color,
    so that I can quickly scan the active palette.
12. As an IMDITHER user, I want to edit a color with a hex input, so that I can
    enter exact values.
13. As an IMDITHER user, I want to edit a color with the native color picker, so
    that I can adjust colors visually.
14. As an IMDITHER user, I want to add colors up to the editor limit, so that I
    can build larger creative palettes.
15. As an IMDITHER user, I want to delete colors down to the minimum valid
    palette size, so that the palette always remains processable.
16. As an IMDITHER user, I want to turn the current preset palette into a custom
    palette, so that I can start from a known palette and modify it.
17. As an IMDITHER user, I want manual palette edits to preserve my current
    Color Mode, so that changing colors does not unexpectedly change
    preprocessing.
18. As an IMDITHER user, I want custom palettes to preserve the current
    algorithm, output size, alpha background, and preprocessing values, so that
    editing a palette changes only the palette.
19. As an IMDITHER user, I want invalid hex values to be rejected clearly, so
    that I can correct the first bad color quickly.
20. As an IMDITHER user, I want colors normalized to stable lowercase hex, so
    that exported palettes and copied settings are consistent.
21. As an IMDITHER user, I want duplicate colors removed when importing or
    extracting, so that the palette contains meaningful unique choices.
22. As an IMDITHER user, I want short hex values to be accepted, so that common
    shorthand like `#fff` works.
23. As an IMDITHER user, I want alpha colors to be rejected in Phase 1, so that
    palettes stay aligned with the RGB processing engine.
24. As an IMDITHER user, I want to import a palette from a file, so that I can
    reuse palettes from other tools.
25. As an IMDITHER user, I want to import a palette from clipboard text, so that
    I can paste palette colors without creating a file.
26. As an IMDITHER user, I want file import to support HEX, GPL, and JSON, so
    that common palette exchange formats work.
27. As an IMDITHER user, I want clipboard import to use the same parser as file
    import, so that behavior is consistent.
28. As an IMDITHER user, I want JSON palette import to accept the IMDITHER
    palette payload, so that exported palettes can be reimported.
29. As an IMDITHER user, I want JSON palette import to accept a simple hex
    array, so that lightweight palette snippets are easy to paste.
30. As an IMDITHER user, I want JSON palette import to accept Settings JSON with
    a custom palette, so that I can recover a palette from copied settings.
31. As an IMDITHER user, I want palette export as a small palette JSON payload,
    so that I can share only the palette asset.
32. As an IMDITHER user, I want full Settings JSON copy to remain separate from
    palette export, so that processing settings and palette assets are not
    confused.
33. As an IMDITHER user, I want GPL export, so that I can use palettes in tools
    that understand GIMP Palette files.
34. As an IMDITHER user, I want HEX/plain text import to accept whitespace,
    comma, and line separated colors, so that simple text palettes are easy to
    use.
35. As an IMDITHER user, I want GPL import to understand common GIMP Palette
    RGB rows, so that existing GPL palettes work.
36. As an IMDITHER user, I want parser errors to explain the unsupported input,
    so that import failures are actionable.
37. As an IMDITHER user, I want to extract a palette from the current Source
    Image, so that I can build a look from the image itself.
38. As an IMDITHER user, I want extraction to use the original Source Image
    rather than the processed preview, so that extracted colors are independent
    from the selected palette and algorithm.
39. As an IMDITHER user, I want to choose an extraction size, so that I can
    decide whether the result should be simple or more detailed.
40. As an IMDITHER user, I want extraction size options of 2, 4, 8, 16, and 32,
    so that common limited-palette workflows are covered.
41. As an IMDITHER user, I want extraction to default to 8 colors, so that the
    first result is useful without being noisy.
42. As an IMDITHER user, I want extracted palettes sorted in a readable order,
    so that swatches are easier to understand.
43. As an IMDITHER user, I want imported palettes larger than the editor limit
    to still load when valid, so that existing large palettes are not rejected
    unnecessarily.
44. As an IMDITHER user, I want manual add disabled when a palette is already
    above the editor limit, so that the UI respects the Phase 1 editing scope.
45. As an IMDITHER user, I want palettes above the editor limit to allow
    deletion, so that I can reduce them back to an editable size.
46. As a maintainer, I want palette parsing and exporting in a pure module, so
    that format behavior can be tested without React or browser UI.
47. As a maintainer, I want palette extraction in the core domain, so that the
    algorithm is DOM-free and reusable by future package or CLI surfaces.
48. As a maintainer, I want the web app to call a simple extraction API, so that
    source palette extraction does not leak UI details into the core.
49. As a maintainer, I want custom palette application to go through the
    settings transition layer, so that palette rules are centralized.
50. As a maintainer, I want Processing Presets to remain applied recipes, so
    that Phase 1 does not introduce a second persisted mode.
51. As a maintainer, I want recipe matching to stay honest when custom palettes
    are active, so that preset recipes are not falsely displayed.
52. As a maintainer, I want Editor Settings schema version 1 to remain valid, so
    that Phase 1 does not require a migration.
53. As a maintainer, I want the custom palette schema cap to remain higher than
    the editor cap, so that imported or pasted settings can preserve larger
    palettes.
54. As a maintainer, I want no palette drag-and-drop in Phase 1, so that image
    drag-and-drop remains unambiguous.
55. As a maintainer, I want no palette library in Phase 1, so that persistence
    remains focused on the current Editor Settings.
56. As a maintainer, I want Phase 1 split into vertical slices, so that parser,
    transition, UI, and extraction risks can be reviewed independently.

## Implementation Decisions

- Phase 1 is the Palette Platform MVP from the Market Impact Roadmap.
- Phase 1 introduces one active custom palette, not a local library of named
  user palettes.
- Active custom palettes are stored in Editor Settings through the existing
  custom palette field.
- The canonical active custom palette identity is `custom`.
- Selecting a preset palette clears the custom palette and applies the selected
  preset palette's default color mode.
- Applying a Processing Preset clears the custom palette and applies the recipe
  palette.
- Replacing a custom palette with a preset or recipe should not show a
  confirmation dialog.
- Replacing a custom palette with a preset or recipe should show a short status
  notice.
- A dedicated custom palette settings transition should set the palette identity
  to `custom` and set normalized custom palette colors.
- The custom palette settings transition must preserve the current Color Mode.
- The custom palette settings transition must preserve algorithm, output size,
  alpha background, resize behavior, tone preprocessing, and other unrelated
  settings.
- Editor Settings schema version remains unchanged.
- The settings schema cap remains 2 to 256 custom colors.
- The Phase 1 editor UI cap is 32 colors.
- Custom palettes imported or pasted with 33 to 256 colors remain valid active
  palettes.
- The UI should disable adding new colors while the active custom palette is at
  or above the editor cap.
- The UI should continue to allow deleting colors from imported palettes above
  the editor cap.
- The inline palette editor lives in the Inspector near the existing Palette
  selector.
- The current preset palette selector remains the main control for preset
  palettes.
- The palette selector should show Custom when the active settings contain a
  custom palette.
- The inline palette editor should provide swatches, hex inputs, native color
  inputs, add, delete, import, export, clipboard import, and extract actions.
- The inline palette editor should include a command to convert the current
  preset palette into a custom palette.
- The inline palette editor should not support swatch reordering in Phase 1.
- Palette import should be available through file picker and clipboard text.
- Palette file import should support HEX, GPL, JSON, text/plain, and
  application/json inputs.
- Palette drag-and-drop is out of scope for Phase 1.
- Palette import from file and clipboard should share the same parser.
- Palette parsing should normalize colors to lowercase 6-digit hex values with
  a leading `#`.
- Short 3-digit hex input should expand to 6-digit hex.
- Hex input without a leading `#` should be accepted when otherwise valid.
- Duplicate colors should be removed while preserving the first occurrence.
- Parsed palettes must contain at least 2 unique colors after normalization.
- Parsed palettes must contain no more than 256 unique colors.
- Alpha hex colors are not supported in Phase 1.
- CSS color names, CSS `rgb(...)`, ASE, ACO, and URL imports are not supported
  in Phase 1.
- JSON palette export should produce a small IMDITHER palette payload, not full
  Settings JSON.
- JSON palette import should accept the IMDITHER palette payload.
- JSON palette import should accept a plain array of hex colors.
- JSON palette import should accept full Settings JSON when it contains a
  custom palette.
- GPL export should use a standard GIMP Palette text payload with a stable name,
  column count, and RGB rows.
- GPL import should support the standard header, optional name and comment
  lines, and RGB color rows.
- HEX and plain text import should support colors separated by lines,
  whitespace, or commas.
- HEX and plain text import should ignore empty lines and explicit comment
  lines.
- A line containing `#ffffff` is a color, not a comment.
- The palette codec should be a deep module with a small interface for parsing,
  normalizing, and serializing palette colors.
- Source palette extraction should run from the current original Source Image,
  not from the processed preview.
- Palette extraction should live in the core domain because it operates on
  PixelBuffer data and is reusable outside React.
- The Phase 1 extraction API should accept a source buffer and requested size
  and return normalized hex colors.
- Extraction should use deterministic median-cut quantization for Phase 1.
- Optional k-means refinement is deferred to a later quality pass.
- Extracted palette output should be sorted by luminance for readable swatch
  order.
- Extraction size options are 2, 4, 8, 16, and 32, with 8 as the default.
- Extraction can be called synchronously from the web app in Phase 1.
- Moving extraction to a worker is a later optimization if profiling shows UI
  lag.
- Palette source and palette size are separate concepts in the UI: source is
  preset, custom, imported, or extracted; size is the current color count or
  requested extraction count.
- Palette source and palette size should not become new persisted Editor
  Settings fields in Phase 1.
- Processing Presets remain applied recipes and should not persist recipe
  identity.
- Settings JSON copy/paste remains the full processing settings flow.
- Palette import/export remains a palette asset flow.
- The implementation order is custom palette transition, palette codec, inline
  palette editor, then source palette extraction.

## Testing Decisions

- Tests should assert public behavior and stable contracts rather than private
  implementation details.
- The custom palette transition should be tested through the settings transition
  API.
- Custom palette transition tests should verify canonical custom identity,
  normalized custom colors, preservation of current Color Mode, and preservation
  of unrelated settings.
- Preset palette transition tests should verify that selecting a preset clears
  custom palette data and applies preset default Color Mode.
- Processing Preset transition tests should continue to verify that applying a
  recipe clears custom palette data.
- Processing Preset matching tests should continue to verify that custom
  palettes do not match preset recipes.
- Settings schema tests should verify valid custom palette boundaries and
  invalid custom palette rejection where not already covered.
- Palette codec tests should cover JSON payload import, JSON hex-array import,
  Settings JSON palette extraction, HEX/plain text import, GPL import, JSON
  export, and GPL export.
- Palette codec tests should cover 3-digit hex expansion, missing `#`
  normalization, lowercase output, duplicate removal, minimum unique colors,
  maximum unique colors, invalid tokens, alpha rejection, and comment handling.
- Palette codec tests should explicitly cover `#ffffff` as a color rather than
  a comment.
- Inline palette editor tests should cover user-observable behavior: showing
  Custom state, converting current preset to custom, adding colors, editing
  colors, deleting colors, respecting minimum and editor cap limits, invoking
  import/export actions, and applying parsed palettes.
- Inline palette editor tests should avoid asserting private component state or
  exact layout internals.
- Source extraction tests should live in the core test layer and use direct
  PixelBuffer fixtures.
- Source extraction tests should verify deterministic output for fixed input
  buffers.
- Source extraction tests should verify requested size handling for 2, 4, 8, 16,
  and 32 colors when enough unique source colors exist.
- Source extraction tests should verify duplicate handling and luminance-sorted
  output.
- Source extraction tests should verify transparent or semi-transparent pixels
  follow the chosen RGB sampling behavior.
- Web extraction tests should verify that the current Source Image buffer is
  used and that applying extraction creates a custom palette.
- Import and extraction UI tests should verify clear error reporting for invalid
  palette input.
- Prior art includes settings transition tests, processing preset tests, settings
  contract tests, core pipeline tests, core pixel golden tests, source intake
  tests, export layer tests, and Control Panel tests.
- Non-documentation implementation should be verified with the root verification
  command.

## Out of Scope

- No local library of named user palettes.
- No palette persistence model beyond the active Editor Settings custom palette.
- No palette reorder UI.
- No palette drag-and-drop.
- No cloud sync, accounts, backend, or shared palette catalog.
- No URL palette import.
- No ASE, ACO, Lospec URL, CSS color names, CSS `rgb(...)`, or alpha palette
  support.
- No k-means refinement in Phase 1.
- No Wu quantization in Phase 1.
- No worker-based extraction unless profiling later proves it necessary.
- No undo or redo stack.
- No immutable look snapshots.
- No shareable look payloads.
- No effect stack.
- No color-depth control beyond palette size choices used by extraction and the
  active palette color count.
- No Oklab or Lab nearest-color matching.
- No zoom and pan inspection workflow.
- No motion pipeline.
- No batch queue, CLI, or public package release.
- No WASM or GPU acceleration.
- No Settings JSON schema version bump.
- No Processing Preset persistence.

## Further Notes

Phase 1 deliberately turns the existing schema-level custom palette capability
into a user-facing workflow before adding broader look-building features.

The most important architectural boundary is keeping palette parsing/exporting
and source extraction as deep, testable modules. The web UI should compose those
modules rather than owning palette format rules or quantization behavior.

The custom palette workflow should preserve the current local-first browser
model. Palette files and clipboard payloads are exchanged directly in the
browser, and source extraction runs against the locally loaded Source Image.

This PRD prepares the Phase 1 implementation only. Later roadmap phases can
build on it with perceptual matching, color-depth controls, undo/history,
shareable looks, palette libraries, and automation surfaces.
