# Phase 2.1 PRD: Color Quality

Status: done
Last updated: 2026-04-26

## Problem Statement

Users can choose palettes and dithering algorithms, but they cannot explicitly control how many colors from a palette are used or how nearest palette colors are matched. Today, the effective color depth is implicit in the selected palette size, and nearest-color selection uses RGB distance only. This makes it harder for users to intentionally create 2-color, 4-color, 8-color, or 16-color looks from larger palettes, and it prevents users from choosing perceptually better matching when RGB distance produces visibly poor color substitutions.

## Solution

Add explicit color-depth controls and perceptual color matching as processing settings. Users will be able to limit processing to the first N colors of the active palette while keeping the full palette intact for editing and export. Users will also be able to choose between RGB matching and Perceptual matching, where Perceptual uses Oklab nearest-color distance.

The default behavior remains visually compatible with the current product: existing settings migrate to the new schema with full palette depth and RGB matching. New recipes demonstrate RGB versus Perceptual matching without changing existing recipes by default.

## User Stories

1. As an image editor user, I want to choose Full palette color depth, so that the current selected palette behaves exactly as authored.
2. As an image editor user, I want to limit processing to 2 colors, so that I can create strict 1-bit style output from larger palettes.
3. As an image editor user, I want to limit processing to 4 colors, so that I can create compact retro looks without manually deleting palette colors.
4. As an image editor user, I want to limit processing to 8 colors, so that I can quickly test low-color versions of a palette.
5. As an image editor user, I want to limit processing to 16 colors, so that I can compare a 16-color look against a larger palette.
6. As an image editor user, I want the color-depth limit to use the first N colors of the active palette, so that the result is deterministic and easy to reason about.
7. As a custom palette user, I want color-depth limiting to avoid deleting colors from my palette, so that I can experiment without losing palette work.
8. As a custom palette user, I want exported palettes to include the full palette, so that color-depth experiments do not change my reusable palette asset.
9. As a custom palette user, I want image export to respect the current color-depth limit, so that exported images match the previewed processing settings.
10. As a palette editor user, I want to see when only the first N of M palette colors are used, so that I understand why later colors may not affect the image.
11. As a user of preset palettes, I want preset palette order to remain meaningful, so that limiting to N colors is predictable.
12. As a user importing old settings JSON, I want old payloads to continue loading, so that previous workflows remain usable.
13. As a user copying settings JSON, I want new payloads to include color-depth settings, so that another user can reproduce my color-count choice.
14. As a user copying settings JSON, I want new payloads to include matching mode, so that another user can reproduce RGB or Perceptual matching.
15. As a user with existing persisted app settings, I want the app to migrate safely, so that my editor does not reset unexpectedly.
16. As a user who prefers current output, I want RGB matching to remain the default, so that existing looks do not change unexpectedly.
17. As a user seeking better color quality, I want to switch to Perceptual matching, so that palette choices better match human visual perception.
18. As a user comparing color matching modes, I want RGB and Perceptual controls to be visibly accessible, so that I can intentionally choose the mode.
19. As a user who does not know color science, I want Perceptual matching to be named plainly, so that I understand it as a quality option rather than a technical requirement.
20. As a technical user, I want documentation to state that Perceptual matching uses Oklab distance, so that the processing contract is precise.
21. As a user applying a no-dither palette map, I want matching mode to affect nearest-color choices, so that I can compare pure RGB and Oklab mapping.
22. As a user applying Bayer dithering, I want matching mode to affect nearest-color choices, so that ordered dither output respects the selected matching semantics.
23. As a user applying blue-noise dithering, I want matching mode to affect nearest-color choices, so that color quality controls are consistent across nearest-color algorithms.
24. As a user applying halftone-dot dithering, I want matching mode to affect nearest-color choices, so that screen-like output uses the same matching rules.
25. As a user applying error diffusion, I want matching mode to affect nearest-color choices, so that diffusion output can benefit from perceptual nearest-color decisions.
26. As a user applying Matt Parker dithering, I want that tonal algorithm to remain stable, so that the matching-mode control does not unexpectedly redefine its behavior.
27. As a recipe user, I want a recipe that demonstrates RGB color matching, so that I have a clear baseline look.
28. As a recipe user, I want a recipe that demonstrates Perceptual color matching, so that I can see the value of Oklab matching quickly.
29. As a recipe user, I want the RGB and Perceptual demonstration recipes to differ only by matching mode, so that the difference is easy to understand.
30. As a quality-focused user, I want recipe variants to use color-preserve preprocessing, so that matching behavior is visible on color images.
31. As a maintainer, I want public settings schema versioning to reflect the new processing semantics, so that settings contracts remain honest.
32. As a maintainer, I want schema v1 payloads to normalize into schema v2 settings, so that migrations are centralized and testable.
33. As a maintainer, I want effective palette limiting to be isolated from palette editing, so that processing behavior and palette asset management stay separate.
34. As a maintainer, I want Oklab conversion and palette matching to be encapsulated behind a small matcher interface, so that algorithms do not duplicate color-space logic.
35. As a maintainer, I want palette Oklab coordinates to be prepared once per palette/mode where practical, so that matching does not waste work per pixel.
36. As a maintainer, I want tests to catch old-settings migration, so that copy/paste and persisted settings remain reliable.
37. As a maintainer, I want tests to catch effective palette limiting, so that first-N semantics do not drift.
38. As a maintainer, I want tests to catch RGB versus Oklab differences, so that perceptual matching is actually exercised.
39. As a maintainer, I want processing goldens or contract tests to reflect the new settings defaults, so that visual regressions remain detectable.
40. As a documentation reader, I want settings documentation to describe color depth and matching mode, so that external users can understand copied settings payloads.

## Implementation Decisions

- Public processing settings move to schema version 2.
- New schema version 2 settings include color-depth configuration and matching mode.
- Settings normalization accepts schema version 1 payloads and returns schema version 2 settings.
- The default color-depth mode is Full palette, preserving current behavior.
- The default matching mode is RGB, preserving current visual output.
- Color-depth limiting is implemented as an effective processing palette derived from the active palette.
- Color-depth limiting uses the first N colors of the active palette.
- Color-depth limiting does not mutate the selected preset palette or custom palette.
- Palette import, palette editing, and palette export continue to operate on the full palette.
- Image processing and image export use the effective limited palette.
- Matching mode supports RGB and Oklab-backed Perceptual matching.
- RGB matching remains squared Euclidean distance in encoded sRGB channels.
- Perceptual matching uses squared Euclidean distance in Oklab coordinates derived from sRGB.
- Oklab is the only perceptual matching mode for this phase; CIE Lab is not added.
- A deep palette matcher module should encapsulate palette preparation, RGB matching, Oklab conversion, and nearest-color lookup behind a stable interface.
- Nearest-color algorithms receive or create a palette matcher rather than duplicating distance logic.
- Matching mode applies to all nearest-color processing paths.
- Matt Parker dithering remains unchanged because it is a tonal level algorithm rather than a nearest-color algorithm.
- New recipe variants named Screenprint 16 RGB and Screenprint 16 Perceptual are added.
- The RGB and Perceptual recipe variants use identical settings except matching mode.
- The demonstration recipes use no dithering and a color-preserving palette so that matching differences are not hidden by dither texture.
- The Inspector contains color-depth and color-matching controls.
- The color-depth control explains that processing is limited to the first N colors of the active palette.
- When a limit is active and the palette contains more colors than the limit, the UI communicates that the first N of M colors are being used.
- Copied Settings JSON includes color-depth and matching-mode settings because they affect processing output.
- Existing processing presets remain applied recipes, not a second settings model.
- Persisted editor state uses a store migration and merge normalizer so existing browser state that still lacks schema version 2 fields is repaired before the UI reads it.

## Testing Decisions

- Good tests should assert external behavior and stable contracts rather than implementation details.
- Settings normalization tests should verify that schema version 1 payloads migrate to schema version 2 defaults.
- Settings normalization tests should verify that schema version 2 payloads preserve color-depth and matching-mode values.
- Settings contract tests should verify accepted color-depth counts and matching-mode enum values.
- Effective palette tests should verify Full palette behavior and first-N limiting behavior.
- Processing tests should verify that color-depth limiting changes the palette size used in metadata and output processing.
- Processing tests should verify that default settings preserve RGB behavior.
- Palette matcher tests should verify deterministic RGB nearest-color selection.
- Palette matcher tests should verify deterministic Oklab nearest-color selection with fixtures chosen to differ from RGB where possible.
- Algorithm contract tests should verify that nearest-color algorithms accept the selected matching mode through the shared matcher behavior.
- Matt Parker coverage should verify that matching mode does not alter its tonal selection contract unless a future PRD changes that behavior.
- Processing preset tests should verify that Screenprint 16 RGB and Screenprint 16 Perceptual differ only by matching mode.
- Existing golden fixture patterns should be reused where they already validate deterministic core pixel output.
- Existing settings-contract tests are prior art for schema and normalization coverage.
- Existing processing-preset tests are prior art for recipe matching and recipe option coverage.
- Existing core process tests and golden tests are prior art for behavior-level pixel processing coverage.
- Web UI tests, if added, should assert that controls issue settings transitions rather than testing internal component state.

## Out of Scope

- Image-aware color subset selection is out of scope.
- Auto-extracting a palette from the source image as part of color-depth control is out of scope.
- CIE Lab matching is out of scope.
- Changing Matt Parker dithering semantics is out of scope.
- Reordering preset palettes is out of scope unless a separate palette-quality pass is planned.
- Destructive palette trimming when color depth changes is out of scope.
- Dimming or disabling palette editor swatches beyond the active color-depth limit is out of scope for the first implementation slice.
- Zoom, pan, pixel grid, and cursor loupe are out of scope for this subphase.
- Undo/history and shareable looks are out of scope.
- Effect stack work is out of scope.
- WASM/GPU acceleration is out of scope.

## Further Notes

This subphase shipped before the inspection UX subphase because it changes core processing semantics and the public settings contract. The delivered slice includes schema migration, persisted-state repair, matcher extraction, effective palette limiting, recipe variants, Inspector controls, tests, and documentation.
