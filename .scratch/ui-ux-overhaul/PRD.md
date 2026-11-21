# UI/UX Overhaul PRD

Status: ready-for-agent

## Problem Statement

IMDITHER has a distinctive warm studio / printmaker identity (charcoal + warm terracotta in dark mode, archival paper + sienna in light mode, pixel `IMDITHER` brand mark, `IBM Plex Sans` + `IBM Plex Mono`). However, the current UI feels like a rigid engineering prototype:

- Flat 1px boxes nested inside boxes (`--radius: 0.25rem`, `box-shadow: none`) with weak surface separation and orange accent overload across every active `ToggleGroupItem` and tab.
- Visual defects in controls: unstretched `ParamSelect` in Palette, left-anchored fill on bipolar `-100..+100` sliders (`Brightness`, `Contrast`), raw `<Slider>` without readouts for Halftone `Angle` / `Frequency`, CSS cascade mismatch between `@layer components` and `@layer utilities` on field labels, and low-contrast floating HUD buttons in light mode.
- The `Looks` tab forces blind selection: no palette swatches on Auto-Tune cards, exposed internal enums (`color-preserve`, `grayscale-first`), tiny 8px status badges, and Built-in / Saved Look Recipes buried in a dropdown inside `Manual`.
- The `Manual` tab buries primary controls (`Dither` algorithm and `Palette`) beneath `Output`, `Pre`, and `Tone`, renders a 4-row wall of 32 swatches inline, shows animation-only `Temporal Stability` for static images, and leaves newly added effect stages collapsed.
- The `PreviewStage` lacks a clear 3-mode compare switcher, Before/After labels on the slide divider, a clear zoom/inspector HUD, non-overlapping status overlays, visible toast feedback for `sourceNotice`, editor keyboard shortcuts (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, hold `Space`, `C`, `+`/`-`/`0`), and header source context.
- `Export` opens a mostly empty 800px full-height drawer without a close button, dimensions/size estimate, or copy-to-clipboard action; `Custom Palette Editor` lacks a close button, `N / 32` counter, live color updates, and obscures the live canvas behind a blurred overlay.
- Responsive layout breaks at `1024px` (switching to two columns only at `xl: 1280px`), `RU` buttons clip on tight widths, and multiple strings remain hardcoded in English.

## Design Direction

Preserve and elevate the warm studio / archival printmaker palette:

- **Light mode**: archival paper background (`--surface-workbench`), clean elevated cards (`--surface-inspector`), crisp preview matte (`--surface-preview`), subtle recessed control fills, warm translucent borders, sienna/terracotta accent reserved for primary CTA (`Export`), active slider fills, and focused indicators.
- **Dark mode**: rich warm charcoal workbench, stepped elevated inspector/popover surfaces, recessed control wells, subtle hairlines, luminous amber-terracotta accent without visual clutter.
- **Depth & Geometry**: soft refined radii (`0.5rem` panels/cards, `0.375rem` controls/buttons, `0.25rem` badges/swatches), delicate elevation shadows for floating HUD/popovers/drawers, calm neutral active state for segmented `ToggleGroupItem` instead of bright orange overload.
- **Typography**: `IBM Plex Sans` for UI labels, headings, and actions; `IBM Plex Mono` strictly for numeric readouts, dimensions, hex codes, shortcuts, and technical metadata. Fix `@layer` cascade so field labels share a single consistent typographic scale.

## Slice Breakdown

The overhaul is delivered in 3 sequential slices:

1. **Slice 01 (Wave 1)**: Visual system tokens & UI primitives (`packages/ui`), Header context bar + PreviewStage HUD/overlays/split compare + Toast feedback (`sourceNotice`) + editor keyboard shortcuts, and `Looks` tab transformation (palette swatches, clean tags, status indicators, Built-in & Saved Look Recipes gallery).
2. **Slice 02 (Wave 2)**: `Manual` tab "Dither-first" information architecture, control geometry & slider polish (bipolar center fill, Halftone `CommittedSliderField` with units, `ParamSelect` width fix, hiding `Temporal Stability` on static images), enhanced Pre/Post effect stack UX, and decomposition of `manual-tab.tsx` into focused submodules.
3. **Slice 03 (Wave 3)**: Rebuilt `Export` and `Custom Palette Editor` drawers (close buttons, non-obscuring palette editing, live swatch updates, file size/dimensions summary, Copy Image to clipboard, `N / 32` counter, compact action toolbar), `lg:` (1024px) two-column responsive layout + mobile polish, and 100% EN/RU localization cleanup.

## Allowed Side Effects

- Updates to `packages/ui/src/styles/globals.css` and `packages/ui/src/components/*`.
- Updates and modular decomposition under `apps/web/src/components/*`, `apps/web/src/lib/*`, `apps/web/src/locales/*`, and `apps/web/src/App.tsx`.
- Updates and additions to unit tests under `apps/web/src/**/*.test.ts(x)` and `packages/ui/src/**/*.test.tsx`.
- No changes to deterministic image/motion processing algorithms in `packages/core/src/*`.
- No staging of git files (`git add` is forbidden).

## Verification Evidence

After every slice:
- `bun run format` followed by `bun verify` (`format:check`, `lint`, `typecheck`, `test`, `build`) passes with zero skipped tests and zero warnings/errors.
- After Wave 3 completion, live browser inspection at `1280x800` (light & dark, EN & RU, Looks, Manual, Export, Palette Editor), `1024x768`, and `390x844`.
