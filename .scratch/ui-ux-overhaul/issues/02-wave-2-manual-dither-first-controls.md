# Slice 02: Manual Tab "Dither-First" Architecture, Slider/Control Polish, and Modularity

Status: ready-for-agent

## Outcome

Restructure the `Manual` inspector tab around a "Dither-first" creative workflow, fix all control alignment and slider UX defects, upgrade the Pre/Post effect stack editing experience, and decompose the 2155-line `manual-tab.tsx` into clean, maintainable submodules.

## Acceptance Criteria

1. **"Dither-First" Information Architecture (`manual-tab.tsx` & extracted submodules)**:
   - Reorder the `Manual` tab sections so the primary creative controls are immediately visible without scrolling:
     1. Compact **Look Recipe / Preset bar** (clean select + Save + overflow menu, without the fake bordered `PRESET` box).
     2. **Dither** section (expanded by default): Algorithm select + Randomize button, algorithm-specific parameters (Bayer Matrix, Halftone Screen, etc.).
     3. **Palette** section (expanded by default): Palette preset select + Randomize button, Color Depth segmented control, Matching select, compact swatch preview strip (max 1-2 rows showing up to 16 swatches + `+N` overflow indicator when >16 instead of a 4-row wall of 32 squares), and clear `Edit Palette` trigger button.
     4. **Tone** section (collapsible, with active modification dot/indicator when non-default): Brightness, Contrast, and clean inline/collapsible Advanced controls (Color Mode, Gamma, Invert).
     5. **Effects (`Pre` / `Post`)** section: clean effect stack with Add Pre-Effect / Add Post-Effect controls.
     6. **Output** section (collapsible, with current `W x H` summary in header): Width input + `1x` reset + quick scale presets (`0.5x`, `1x`), Resize Kernel, Alpha Flatten.
     7. **Utility** section (collapsible): compact 2-column grid for Copy/Paste Look Link, Copy/Paste Settings JSON, and full-width Reset to Defaults button.
   - Hide `Temporal Stability` completely for static images; only render it when `isAnimated` is true (thread `isAnimated` from `App.tsx` -> `InspectorPanel` -> `ManualTab`).

2. **Control Geometry & Slider Polish**:
   - Fix `ParamSelect` layout so the select trigger always stretches cleanly (`flex-1 min-w-0`) and aligns with adjacent controls (`Algorithm`, `Palette`, `Matching`).
   - Upgrade `CommittedSliderField` (`committed-slider-field.tsx` + `globals.css`):
     - Support center-origin fill for bipolar sliders (`min < 0 && max > 0`, e.g., Brightness `-100..+100`, Contrast `-100..+100`) so `0` shows a clean neutral track with a center tick mark rather than 50% orange fill.
     - Support optional `unit` suffix (e.g., `°`, `lpi`, `px`, `%`) formatted cleanly in tabular mono next to the label.
     - Hide or softly mute/collapse the reset button (`RotateCcwIcon`) when value equals `defaultValue`, revealing it cleanly only when modified so default sliders look calm and uncluttered.
   - Replace raw `<Slider>` for Halftone `Angle` and `Frequency` with `CommittedSliderField` showing numeric readouts + units (`°`, `lpi`), avoiding per-pixel undo stack flooding.

3. **Effect Stack (`Pre` / `Post`) UX**:
   - Localize all stage display names (Pre/Post effect labels and parameters) via i18n keys.
   - Automatically expand a newly added Pre or Post stage so the user can adjust its parameters immediately without an extra click.
   - Visually dim disabled stages (`opacity-60`) and clearly distinguish enabled toggle, drag handle, and delete action.
   - Show active stage count badge on section headers.

4. **Structural Decomposition of `manual-tab.tsx`**:
   - Extract cohesive submodules under `apps/web/src/components/manual/` (e.g., `look-recipe-bar.tsx`, `dither-section.tsx`, `palette-section.tsx`, `tone-section.tsx`, `output-section.tsx`, `effect-stack-section.tsx`, `utility-section.tsx`, `palette-editor-drawer.tsx`, `param-controls.tsx`) while preserving `ManualTab`'s public export and prop contract (plus optional `isAnimated?: boolean`).

## Verification

- Update and add unit tests in `manual-tab.test.tsx`, `committed-slider-field.test.tsx`, `inspector-panel.test.tsx` verifying Dither-first order, bipolar slider fill attributes, Halftone numeric readouts, hiding `Temporal Stability` on static images, auto-expansion of newly added stages, and swatch overflow compaction.
- Run `bun run format && bun verify` and confirm all checks pass.

## Comments

### Wave 2 (Slice 02) Completion Summary

- **Dither-First Architecture & Decomposition (`apps/web/src/components/manual-tab.tsx`, `apps/web/src/components/manual/*`)**: Decomposed the 2,155-line `manual-tab.tsx` into a 209-line orchestrator backed by 11 cohesive submodules (`section-card.tsx`, `param-controls.tsx`, `look-recipe-bar.tsx`, `dither-section.tsx`, `palette-section.tsx`, `palette-editor-drawer.tsx`, `tone-section.tsx`, `effect-stack-helpers.ts`, `effect-stack-section.tsx`, `output-section.tsx`, `utility-section.tsx`). Reordered sections to `Look Recipe -> Dither (expanded) -> Palette (expanded) -> Tone (collapsed, active modified indicator) -> Effects Pre/Post -> Output (collapsed, live W x H header + 0.5x/1x scale presets) -> Utility (collapsed, 2-column grid + full-width Reset to Defaults)`. Removed the fake bordered `PRESET` label box.
- **Animation-Only Temporal Stability**: Threaded `isAnimated?: boolean` from `App.tsx` -> `InspectorPanel` -> `ManualTab` -> `DitherSection` (defaulting to `false`) so `Temporal Stability` is omitted completely for static images.
- **Control Geometry, Palette Swatch Strip & Slider Polish (`committed-slider-field.tsx`, `packages/ui/src/styles/globals.css`)**: Updated `ParamSelect` and select triggers to stretch full width (`w-full min-w-0 flex-1`). Capped inline palette swatches at 16 (1-2 clean 8-column rows) with a crisp `+N` overflow pill for larger palettes. Upgraded `CommittedSliderField` with bipolar center-origin fill (`--committed-slider-fill-start` / `--committed-slider-fill-end`) and center tick marker at `0`, optional `unit` suffix in tabular mono, and auto-hiding reset button when at `defaultValue`. Replaced raw `<Slider>` controls for Halftone `Angle` (`°`) and `Frequency` (`lpi`) with `CommittedSliderField`.
- **Pre/Post Effect Stack & i18n**: Localized all Pre/Post stage names, parameter labels, and option values across `en/common.json` and `ru/common.json` (118/118 key parity under `manual.*`). Added automatic expansion of newly added Pre/Post stages upon creation, dimmed disabled stages (`opacity-60`) with visual separation between drag handle, expand label, enable switch, and reorder/delete actions, and added active stage count badges in Pre/Post headers.
- **Verification**: Updated and expanded `committed-slider-field.test.tsx`, `manual-tab.test.tsx`, and `inspector-panel.test.tsx`. `bun run format && bun verify` passed with 0 warnings and 0 errors (`format:check`, `oxlint`, `typecheck`, `vite build`, `web`: 62 files / 396 tests passed with 0 skipped, `@workspace/ui`: 1 file / 1 test passed with 0 skipped; untouched `@workspace/core`: 18 passed / 1 skipped files, 152 passed / 4 skipped tests).
