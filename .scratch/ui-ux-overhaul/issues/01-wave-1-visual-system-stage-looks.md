# Slice 01: Visual System, Preview Stage HUD, Toast/Shortcuts, and Looks Gallery

Status: ready-for-agent

## Outcome

Upgrade the foundational visual design system (preserving the warm archival paper / dark charcoal + terracotta identity), transform the workspace header and `PreviewStage` into a refined studio canvas with clear HUD controls, wire toast notifications to `sourceNotice` plus standard editor keyboard shortcuts, and turn the `Looks` tab into a visual style gallery with palette swatches and Look Recipes.

## Acceptance Criteria

1. **Design Tokens & UI Primitives (`packages/ui`)**:
   - Update `packages/ui/src/styles/globals.css` with 3 clear surface tiers (workbench, elevated panel, recessed input/control surface), softer radii (`--radius: 0.5rem`, proportional `--radius-sm`/`--radius-md`), subtle elevation tokens for HUD/popovers/drawers, and balanced contrast in both light and dark modes.
   - Remove orange overload on active `ToggleGroupItem` / `Toggle`: active segmented controls use a calm high-contrast neutral surface with subtle border/shadow, reserving `--primary` for primary CTA (`Export`), slider fills, focus rings, and subtle active indicators.
   - Fix CSS layer specificity conflicts so `[data-slot="field-label"]`, `[data-slot="field-legend"]`, buttons, inputs, and selects render with consistent `IBM Plex Sans` UI labels and `IBM Plex Mono` numeric/data tokens.
   - Update `packages/ui/src/components/tabs.tsx`, `toggle-group.tsx`, `button.tsx`, `card.tsx`, `popover.tsx`, `select.tsx` as needed for consistent radii, subtle borders, hover/active micro-interactions, and light-mode readability.

2. **Header Context & Language/Theme Polish (`apps/web/src/App.tsx`)**:
   - Keep `BrandMark` crisp without muddy glow on light mode.
   - Fix `LanguageToggle` duplicate spans bug (`RURU`) and display clear locale toggle (`EN / RU` or globe icon + current language indicator).
   - Add a compact, responsive context pill/bar in the header showing active source name (or Demo), dimensions (`W x H`), active algorithm label, and active palette color count (hidden gracefully on very narrow mobile screens so the header never wraps awkwardly).

3. **PreviewStage HUD, Split Compare, and Overlays (`preview-stage.tsx`, `preview-surface-controls.tsx`, `slide-compare-preview.tsx`, `preview-status-overlays.tsx`, `preview-action-strip.tsx`)**:
   - Replace single cycling `Comparison` button with a 3-way segmented control (`Split` | `Result` | `Original`) in a high-contrast frosted HUD capsule with crisp hairline border and subtle shadow in both light and dark themes.
   - Upgrade the top-right viewport trigger into a clear zoom/view capsule (`Fit` / `100%` + chevron + quick direct Pixel Inspector/Loupe toggle button on desktop), and clean up the viewport popover (remove redundant `1:1` next to `Real Pixels`, show accurate zoom readout/controls, crisp border & shadow).
   - Upgrade `SlideComparePreview`: tactile draggable handle with left/right arrows icon (`MoveHorizontal` / `ChevronsLeftRight`) instead of plain `||`, subtle hover/drag feedback, and compact `Original` / `Processed` corner labels that auto-hide when the divider approaches either edge.
   - Move `ProcessingOverlay` and `SourceErrorOverlay` so they never overlap the top-left/top-right HUD buttons (e.g. compact centered bottom-top or top-center floating pill below the top HUD or docked cleanly).
   - Refine `PreviewActionStrip` spacing, tooltip/title keyboard hints, and button sizing so Undo/Redo never cramp.

4. **Toast Notifications & Editor Keyboard Shortcuts (`App.tsx` + toast component)**:
   - Render `sourceNotice` (currently written to store and never displayed) as a clean, non-blocking floating toast with auto-dismiss and manual dismiss button (e.g. bottom-center above action strip or top-center), cleaning up raw `[BRACKETED]` technical tags into friendly copy where appropriate while preserving informative detail.
   - Add standard editor keyboard shortcuts (ignored when typing inside inputs/textareas/selects/contenteditable):
     - `Ctrl/Cmd+Z`: Undo
     - `Ctrl/Cmd+Shift+Z` (and `Ctrl+Y`): Redo
     - Hold `Space`: temporarily peek at `Original` view (restores previous compare mode on keyup, prevented from scrolling page)
     - `C`: cycle compare mode
     - `+` / `=` and `-`: zoom in / out; `0`: reset to Fit

5. **Looks Tab Gallery (`auto-tune-panel.tsx`, `inspector-panel.tsx`)**:
   - Render a horizontal palette swatch strip on each Auto-Tune recommendation card (derived from `recommendation.snapshot.settings.customPalette` or `PRESET_PALETTES`).
   - Replace raw internal strings (`color-preserve`, `grayscale-first`) and duplicate chips with 2-3 clean human-readable chips (Algorithm, Palette name/count, Color/Mono or Contrast tone).
   - Replace cramped `8px` uppercase badges and empty right spacer column with clean status indicators (subtle accent border/bar + crisp `Recommended` pill + checkmark `Applied` badge that works cleanly in both light and dark modes without crushing chip contrast).
   - Add a **Recipes** section in the `Looks` tab showing Built-in Look Recipes (`BUILT_IN_LOOK_RECIPES`) and user-saved Look Recipes with palette swatch strips, active indicator, one-click apply, and quick Save Current Look action.

## Verification

- Update existing tests (`auto-tune-panel.test.tsx`, `inspector-panel.test.tsx`, `preview-stage.test.tsx`, `preview-status-overlays.test.tsx`, `slide-compare-preview.test.tsx`) and add focused tests for keyboard shortcuts, toast notice display, and new HUD/gallery behaviors.
- Run `bun run format && bun verify` and confirm all checks pass.

## Comments

### Wave 1 (Slice 01) Completion Summary

- **Visual System (`packages/ui`)**: Upgraded light/dark archival studio tokens in `packages/ui/src/styles/globals.css` with 3 surface tiers (`--surface-workbench`, `--surface-inspector`, `--surface-control` / `--surface-control-active`), softer radii (`--radius: 0.5rem`), translucent borders, and elevation shadows (`--shadow-control`, `--shadow-hud`, `--shadow-popover`, `--shadow-drawer`). Removed `@layer components` cascade conflicts and moved canonical styling into `button.tsx`, `toggle.tsx`, `toggle-group.tsx`, `tabs.tsx`, `card.tsx`, `popover.tsx`, `select.tsx`, `field.tsx`, `input.tsx`, `badge.tsx`, and `drawer.tsx`. Replaced orange active fill on `Toggle`/`ToggleGroupItem` with a calm elevated neutral surface.
- **Header & Source Context (`apps/web/src/App.tsx`)**: Cleaned `BrandMark` (removed muddy light-mode glow), fixed `LanguageToggle` duplicate span bug (`RURU` / `ENEN`) with globe icon + single locale indicator, and added a responsive header context bar showing active source (or Demo), output dimensions, algorithm, and palette color count.
- **PreviewStage HUD, Split Compare, Overlays & Action Strip**: Replaced cycling compare button with a 3-way segmented frosted HUD (`Split | Result | Original`), upgraded top-right viewport capsule (`Fit` / `N%` + chevron + desktop Pixel Inspector toggle) and cleaned popover (removed redundant `1:1`, added `-`/`+` zoom steppers), upgraded `SlideComparePreview` with circular `ChevronsLeftRight` handle and edge-hiding `Original` / `Result` labels, repositioned `ProcessingOverlay` and `SourceErrorOverlay` below the top HUD (`top-14`), and refined `PreviewActionStrip` / `HistoryControls` hierarchy and shortcut tooltips.
- **Toast & Shortcuts**: Added `SourceNoticeToast` + `formatSourceNotice` wired to `editorStore.sourceNotice` (with `sourceNoticeVersion`, auto-dismiss, and manual close) and global keyboard shortcuts (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl+Y`, hold `Space` peek, `C`, `+`/`=`/`-`/`0`) skipping editable elements.
- **Looks Tab Gallery**: Upgraded `AutoTunePanel` with palette color swatch bars, 3 clean human-readable chips (no raw enums), and refined `Recommended` / `Applied` indicators; added `LookRecipesGallery` in `InspectorPanel`'s `Looks` tab with Built-in and Saved recipes, swatch bars, active state, delete for user recipes, and inline `Save Current` form.
- **i18n & Verification**: Added all new keys to both `en/common.json` and `ru/common.json`. `bun run format && bun verify` passed (`format:check`, `oxlint` 0 warnings/0 errors, `typecheck`, `test`, and `vite build`). Note: `web` (62 files, 389 tests) and `@workspace/ui` (1 file, 1 test) passed with 0 skipped; untouched `@workspace/core` has 4 pre-existing skipped tests in `palette-extraction.test.ts` (18 passed / 1 skipped files, 152 passed / 4 skipped tests).
