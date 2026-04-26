# Processing Presets PRD

Status: done
Last updated: 2026-04-25

## Problem Statement

IMDITHER currently exposes Palette and Algorithm as separate controls. This is flexible, but it makes users discover good combinations by trial and error every time they start editing an image.

Some palette and algorithm combinations have a clear visual intent: monochrome ordered dithering, sea-colored diffusion, red high-contrast output, blue-noise color texture, or halftone-style output. Users need a fast way to apply those combinations without losing the ability to inspect and fine-tune the underlying Palette and Algorithm controls.

The feature should not turn presets into a second settings model. A preset should be a helpful starting recipe, not a mode that owns the editor after it is selected.

## Solution

Add Processing Presets as curated, applicable recipes that set a small subset of Editor Settings: Palette, Algorithm, optionally Bayer Size, and optionally Color Mode.

The editor should display a compact Recipe selector above the existing Palette and Algorithm controls. Selecting a recipe applies its controlled settings in one transition. The existing Palette, Algorithm, Bayer Matrix, and Color Mode controls remain visible and editable. If the user changes a recipe-controlled field after applying a recipe, the Recipe selector should show Custom.

Processing Presets should live in the core domain as a small registry/helper, not as UI-only data. The web app should consume that registry for options and matching, and it should apply recipes through the existing settings transition layer.

Processing Presets should not add `presetId` to Editor Settings, Settings JSON, processing metadata, or export metadata. Settings should continue to store the actual processing choices, while the active recipe is computed from those settings.

## User Stories

1. As an IMDITHER user, I want to choose a ready-made processing recipe, so that I can quickly start from a good palette and algorithm combination.
2. As an IMDITHER user, I want recipes to be curated rather than every possible palette and algorithm pair, so that the list is useful instead of noisy.
3. As an IMDITHER user, I want the Recipe selector to appear near Palette and Algorithm, so that I understand it controls those choices.
4. As an IMDITHER user, I want choosing a recipe to update Palette, so that the selected palette is visible and editable.
5. As an IMDITHER user, I want choosing a recipe to update Algorithm, so that the selected dithering method is visible and editable.
6. As an IMDITHER user, I want Bayer recipes to set Bayer Matrix size, so that ordered dithering recipes are reproducible.
7. As an IMDITHER user, I want non-Bayer recipes to leave my last Bayer Matrix size alone, so that switching away from Bayer does not erase that preference.
8. As an IMDITHER user, I want recipes to optionally set Color Mode, so that a recipe can preserve its intended look when palette defaults are not enough.
9. As an IMDITHER user, I want recipes without an explicit Color Mode to use the selected palette's default Color Mode, so that palette behavior remains consistent.
10. As an IMDITHER user, I want manual Palette changes to keep applying the palette's default Color Mode, so that existing behavior does not regress.
11. As an IMDITHER user, I want manual Algorithm changes to leave Color Mode alone, so that algorithm comparison remains focused.
12. As an IMDITHER user, I want Palette and Algorithm controls to remain visible after choosing a recipe, so that recipes are transparent and tweakable.
13. As an IMDITHER user, I want the Recipe selector to show Custom after I change a controlled setting, so that the UI does not claim I am still using the original recipe.
14. As an IMDITHER user, I want the Recipe selector to show a recipe again if my settings match it, so that pasted or manually recreated combinations are recognized.
15. As an IMDITHER user, I want Custom to appear when I use a custom palette, so that a curated recipe is not falsely shown for different colors.
16. As an IMDITHER user, I want applying a recipe to clear custom palette colors, so that the named recipe actually uses its preset palette.
17. As an IMDITHER user, I want copied Settings JSON to contain actual settings rather than a recipe id, so that settings stay portable and explicit.
18. As an IMDITHER user, I want pasted Settings JSON to show a matching recipe only when the actual fields match, so that recipe identity is derived from behavior.
19. As an IMDITHER user, I want old Settings JSON without a recipe id to keep working, so that this feature does not break saved settings.
20. As an IMDITHER user, I want processing metadata to remain focused on algorithm and output details, so that recipe selection does not create confusing export history.
21. As an IMDITHER user, I want exported PNG output to remain determined by the current Editor Settings, so that recipes are just shortcuts to reproducible settings.
22. As an IMDITHER user, I want recipes to preserve output size, resize, brightness, contrast, gamma, invert, and alpha background, so that applying a recipe does not unexpectedly change image-specific edits.
23. As an IMDITHER user, I want a small initial set of recognizable recipes, so that I can choose by visual intent instead of reading technical combinations.
24. As an IMDITHER user, I want recipe names to be human-readable, so that the selector feels like a creative workflow rather than internal ids.
25. As a maintainer, I want Processing Presets to be a core registry, so that recipe definitions are close to Palette and Algorithm domain concepts.
26. As a maintainer, I want the registry to expose a list of recipe options, so that UI does not maintain a duplicate recipe list.
27. As a maintainer, I want the registry to expose lookup by id, so that applying a recipe has one validation path.
28. As a maintainer, I want the registry to expose matching from Editor Settings, so that Custom detection is centralized and testable.
29. As a maintainer, I want matching to reject custom palettes, so that preset palette recipes remain honest.
30. As a maintainer, I want matching to include Palette and Algorithm, so that recipes map to their core visual choices.
31. As a maintainer, I want Bayer recipe matching to include Bayer Size, so that ordered dithering recipes are precise.
32. As a maintainer, I want non-Bayer recipe matching to ignore Bayer Size, so that irrelevant hidden settings do not prevent matching.
33. As a maintainer, I want recipe Color Mode matching to reflect the effective recipe-controlled Color Mode, so that Custom appears when visual intent changes.
34. As a maintainer, I want duplicate recipe signatures to be rejected by tests, so that active recipe matching is deterministic.
35. As a maintainer, I want recipe application to go through a settings transition, so that UI components do not reimplement domain rules.
36. As a maintainer, I want recipe application to update controlled settings atomically, so that preview jobs never see a half-applied recipe.
37. As a maintainer, I want the Settings schema version to remain unchanged, so that no migration is needed for a shortcut feature.
38. As a maintainer, I want no processing pipeline change, so that recipe work cannot affect algorithm math.
39. As a maintainer, I want no metadata shape change, so that export and worker contracts stay stable.
40. As a maintainer, I want tests to describe recipe behavior through public APIs, so that the implementation can evolve without brittle UI details.

## Implementation Decisions

- Model Processing Presets as applicable recipes, not persistent modes.
- Keep Palette, Algorithm, Bayer Matrix, and Color Mode as the underlying editable controls.
- Add a Recipe selector above Palette and Algorithm in the control panel.
- A selected recipe applies a curated combination of Palette, Algorithm, optional Bayer Size, and optional Color Mode.
- Do not include output size, resize fit, resize kernel, brightness, contrast, gamma, invert, or alpha background in recipes.
- Store Processing Presets in the core domain.
- Add a small Processing Preset registry/helper rather than a processing executor abstraction.
- The registry should expose recipe options, lookup by id, and matching from Editor Settings.
- Keep recipe ids stable once introduced.
- Keep recipe names human-readable and oriented around visual intent.
- Use a curated v1 recipe list instead of generating every palette and algorithm combination.
- Do not add `presetId` or `recipeId` to Editor Settings.
- Do not change the Settings JSON schema version for this feature.
- Do not serialize recipe identity in copied Settings JSON.
- Compute the active recipe by matching current Editor Settings against the recipe registry.
- Show Custom when no recipe matches the current settings.
- Reject active recipe matching when custom palette colors are present.
- Applying a recipe clears custom palette colors.
- Applying a recipe sets Palette and Algorithm.
- Bayer recipes must explicitly set Bayer Size.
- Non-Bayer recipes do not set Bayer Size.
- Matching Bayer recipes requires Bayer Size equality.
- Matching non-Bayer recipes ignores Bayer Size.
- Recipes may explicitly set Color Mode.
- If a recipe does not explicitly set Color Mode, application uses the selected palette's default Color Mode.
- Recipe Color Mode matching should reflect the effective Color Mode controlled by the recipe.
- Manual Palette changes continue to apply the palette's default Color Mode.
- Manual Algorithm changes continue to preserve current Color Mode.
- Implement recipe application as a dedicated settings transition.
- Keep recipe application pure and DOM-free inside the transition module.
- Keep Processing Presets out of processing metadata and export metadata.
- Preserve preview and export behavior apart from the settings changes caused by applying a recipe.
- Preserve worker and processing pipeline contracts.

## Initial Recipes

The first implementation should add this curated v1 recipe set:

1. Mono Bayer
   - Palette: Black / White
   - Algorithm: Bayer
   - Bayer Size: 4
   - Color Mode: Grayscale First
   - Intent: classic high-contrast ordered monochrome dithering.
2. Fine Mono Bayer
   - Palette: 4 Gray
   - Algorithm: Bayer
   - Bayer Size: 8
   - Color Mode: Grayscale First
   - Intent: smoother ordered grayscale output with less binary contrast.
3. Sea Glass Atkinson
   - Palette: Sea Glass
   - Algorithm: Atkinson
   - Color Mode: Color Preserve
   - Intent: soft coastal color diffusion with restrained error spread.
4. Redline Floyd
   - Palette: Redline
   - Algorithm: Floyd-Steinberg
   - Color Mode: Color Preserve
   - Intent: sharp red-and-black diffusion for high-energy contrast.
5. Poster Blocks
   - Palette: Poster 12
   - Algorithm: None
   - Color Mode: Color Preserve
   - Intent: direct palette quantization for flat posterized color.
6. Blue Ink Noise
   - Palette: Blue Ink
   - Algorithm: Blue Noise
   - Color Mode: Grayscale First
   - Intent: ink-like monochrome texture with less ordered patterning.
7. Halftone Mono
   - Palette: Black / White
   - Algorithm: Halftone Dot
   - Color Mode: Grayscale First
   - Intent: print-style dot output for monochrome images.
8. Game Boy Sierra
   - Palette: Game Boy
   - Algorithm: Sierra Lite
   - Color Mode: Grayscale First
   - Intent: handheld-console grayscale-green output with lightweight diffusion.

The implementation should use stable ids derived from these names, such as `mono-bayer`, `fine-mono-bayer`, `sea-glass-atkinson`, `redline-floyd`, `poster-blocks`, `blue-ink-noise`, `halftone-mono`, and `game-boy-sierra`.

## Testing Decisions

- Good tests should verify public behavior: recipe lookup, active recipe matching, settings transition output, and UI consumption where useful.
- Test that every recipe references an existing preset palette.
- Test that every recipe references an existing algorithm.
- Test that recipe ids are unique.
- Test that recipe matching signatures are unique.
- Test that recipe lookup returns the expected recipe for valid ids.
- Test that recipe lookup rejects unknown ids according to the chosen core API behavior.
- Test that matching returns a recipe when Editor Settings match Palette, Algorithm, effective Color Mode, and Bayer Size where relevant.
- Test that matching returns Custom/null when Palette differs.
- Test that matching returns Custom/null when Algorithm differs.
- Test that matching returns Custom/null when Bayer Size differs for a Bayer recipe.
- Test that matching ignores Bayer Size for non-Bayer recipes.
- Test that matching returns Custom/null when Color Mode no longer matches the recipe-controlled value.
- Test that matching returns Custom/null when custom palette colors are present.
- Test that applying a recipe sets Palette and Algorithm.
- Test that applying a Bayer recipe sets Bayer Size.
- Test that applying a non-Bayer recipe preserves the current Bayer Size.
- Test that applying a recipe with explicit Color Mode uses that Color Mode.
- Test that applying a recipe without explicit Color Mode uses the palette default Color Mode.
- Test that applying a recipe clears custom palette colors.
- Test that applying a recipe preserves output size, resize, preprocessing fields not controlled by the recipe, alpha background, and other unrelated settings.
- Test that Settings JSON normalization still accepts settings without recipe identity.
- Use existing core registry tests as prior art for drift prevention.
- Use existing settings transition tests as prior art for behavior-focused transition coverage.
- Use existing control panel tests if present; otherwise prefer pure module tests over broad UI tests.
- Avoid tests that assert private registry object structure beyond exported contracts.

## Out of Scope

- No custom recipe creation UI.
- No recipe editing UI.
- No recipe import or export.
- No recipe categories unless needed for the initial selector experience.
- No generated matrix of all palette and algorithm combinations.
- No `presetId` or `recipeId` in Editor Settings.
- No Settings JSON schema migration.
- No processing metadata change.
- No export metadata change.
- No algorithm math changes.
- No palette data changes beyond choosing which existing palettes appear in recipes.
- No custom palette editor.
- No automatic palette extraction.
- No backend, account, cloud sync, or shared recipe catalog.
- No changes to Source Intake.
- No changes to Preview Job scheduling.
- No changes to Export Job scheduling.
- No changes to PNG encoding.

## Further Notes

Processing Preset terminology should stay distinct from preset palettes. A Palette Preset is a color set. A Processing Preset is a recipe that applies processing-related Editor Settings.

The core invariant is that recipes are shortcuts to actual settings. Once applied, the resulting image should be reproducible from Editor Settings alone, without needing to remember which recipe was selected.

Initial recipe names should favor user intent over raw internal ids. Later recipe additions should stay curated and should not turn the Recipe selector into a generated matrix of every Palette and Algorithm pair.
