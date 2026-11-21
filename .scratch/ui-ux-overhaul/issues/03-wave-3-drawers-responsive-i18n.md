# Slice 03: Export & Palette Drawers, Responsive Layout, and 100% EN/RU Localization

Status: ready-for-agent

## Outcome

Redesign the `Export` and `Custom Palette Editor` drawers for ergonomics and live feedback, fix the `1024px` and mobile responsive layouts, and eliminate every remaining hardcoded English string and awkward translation across the app.

## Acceptance Criteria

1. **Export Drawer Overhaul (`export-drawer-content.tsx`, `packages/ui/src/components/drawer.tsx`, `preview-stage.tsx`, `App.tsx`)**:
   - Add an accessible Close (`X`) button (`DrawerClose`) to `DrawerHeader` (or cleanly integrated into both `Export` and `Palette Editor` headers) so desktop users always have an explicit close target.
   - Eliminate the empty 600px vertical void in `ExportDrawerContent`:
     - Show an **Output Summary** card with final dimensions (`W x H px`), aspect ratio, active algorithm + palette info, and live estimated output file size (computed cleanly for the chosen format/quality on static images, or frame count + duration + fps for animated sources).
     - Replace the narrow `PNG v` dropdown with a clear segmented format selector (`PNG` | `WebP` | `JPEG` for static; `GIF` | `APNG` | `WebM` for animated) with brief format notes.
     - Keep quality/CRF slider clean and properly aligned with numeric readout.
     - Add a **Copy Image** button (copies rendered PNG blob to clipboard using `navigator.clipboard.write` when supported, reporting status via `sourceNotice` toast) alongside the primary **Download** button.

2. **Custom Palette Editor Overhaul (`palette-editor-drawer.tsx`, `drawer.tsx`)**:
   - Add explicit Close (`X`) button in the drawer header and a live color count badge (`N / 32`) explaining the 32-color limit.
   - On desktop (`md:`), keep `DrawerOverlay` lightweight / non-blurring for the palette editor (or allow non-blurring overlay prop on `DrawerContent` / `DrawerOverlay`) so the user sees crisp dithered pixels on the canvas while editing swatches in real time.
   - Reorganize controls by priority:
     - Top bar: primary `Extract from image` (segmented count `2 | 4 | 8 | 16 | 32` or clean select + action) and `+ Add color` button.
     - Compact secondary icon/menu toolbar for `Import file`, `Copy JSON`, `Paste`, `Export JSON`, `Export GPL` (instead of a 6-button wall of equal-weight rectangles).
     - Color list directly accessible with unified border radius, crisp swatch framing (visible border on white/black swatches), and **live color updates** (debounced/throttled `onChange` or immediate preview commit instead of waiting only for `onBlur`).

3. **Responsive Layout Fixes (`App.tsx`, `preview-action-strip.tsx`, `preview-surface-controls.tsx`, `manual/*`)**:
   - Enable the two-column side-by-side workspace layout starting at `lg:` (`1024px`): `lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1`.
   - Ensure `PreviewActionStrip` Undo/Redo buttons never clip or crowd in `RU` (`Отменить` / `Повторить`): remove fixed `md:w-44` constraint in favor of natural auto/min widths or compact icon+label responsive sizing.
   - Ensure mobile (`390x844`) layout has clean spacing, readable HUD controls that do not obscure the image awkwardly, and properly sized palette swatches.

4. **100% EN/RU Localization & Copy Polish (`apps/web/src/locales/en/common.json`, `apps/web/src/locales/ru/common.json`, all UI components)**:
   - Audit every component under `apps/web/src/components/` and `App.tsx` for hardcoded English strings (`Algorithm`, `Color Depth`, `Full`, `No parameters`, `PRE`/`CORE`/`POST`, `Look`, `Bilinear`, `Nearest`, `None`, `Slide comparison divider`, `Original`/`Processed` split labels, effect names/params, etc.) and route all user-visible text through `i18next`.
   - Replace `Look'и` in `ru/common.json` with natural Russian terminology (`Стили` for the tab, `Автоподбор` / `Рецепты` / `Стиль` across labels) while keeping English natural (`Looks`, `Auto-Tune`, `Recipes`).
   - Ensure every key in `en/common.json` has a matching, idiomatic key in `ru/common.json`.

## Verification

- Update and add tests (`export-drawer-content.test.tsx`, `manual-tab.test.tsx`, `preview-stage.test.tsx`, locale parity test confirming EN and RU keys match).
- Run `bun run format && bun verify` and confirm all checks pass.
- Visually verify in browser at `1280x800` (light & dark, EN & RU), `1024x768`, and `390x844` across all views and drawers.

## Comments

### Wave 3 (Slice 03) Completion Summary

- **Export Drawer Overhaul (`packages/ui/src/components/drawer.tsx`, `apps/web/src/components/export-drawer-content.tsx`, `apps/web/src/components/preview-stage.tsx`, `apps/web/src/lib/preview-stage-application.ts`, `apps/web/src/lib/export-action-application.ts`, `apps/web/src/lib/notice-formatter.ts`, `apps/web/src/App.tsx`)**: Added an explicit accessible Close (`X`) button via `DrawerClose` in the drawer header, replaced the vertical void with an Output Summary card (dimensions `W x H px`, aspect ratio, localized algorithm name, palette summary with swatch preview, async debounced estimated output file size for static images with graceful fallback, and frame count / FPS / duration for animated sources), switched format selection to a segmented `ToggleGroup` (`PNG | WebP | JPEG` for static; `GIF | APNG | WebM` when WebCodecs is available for animated) with per-format descriptions, replaced the dimmed 100% PNG quality slider with a lossless `Lossless · 100%` badge row while keeping aligned quality/CRF sliders with tabular numeric readouts, and wired a "Copy Image" PNG clipboard action (`copy-image-intent` -> `applyCopyImageAction` -> `sourceNotice` toast).
- **Custom Palette Editor Overhaul (`packages/ui/src/components/drawer.tsx`, `apps/web/src/components/manual/palette-editor-drawer.tsx`, `apps/web/src/components/manual/param-controls.tsx`, `apps/web/src/components/manual/palette-section.tsx`)**: Added `overlayVariant?: "default" | "subtle"` on `DrawerContent` / `DrawerOverlay` and applied `"subtle"` (non-blurring, transparent on desktop `md:`) to `PaletteEditorDrawer` so dithered pixels stay crisp while editing. Added Close (`X`) button and live `N / 32` counter badge in the header, prioritized `Extract from image` (`2 | 4 | 8 | 16 | 32` segmented picker + Extract button) and `+ Add color` at the top, compacted `Import`, `Paste`, `Copy JSON`, `Export JSON`, and `Export GPL` into a single utility toolbar, unified `rounded-md` swatch rows with contrast swatch borders and stable keys, and updated `PaletteColorInput` for live throttled `onChange` commits with `onBlur` flush.
- **Responsive Layout Fixes (`apps/web/src/App.tsx`, `apps/web/src/components/preview-action-strip.tsx`, `apps/web/src/components/history-controls.tsx`, `apps/web/src/components/preview-surface-controls.tsx`, `apps/web/src/components/preview-stage.tsx`)**: Enabled the two-column workspace starting at `lg:` (`lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1`) and balanced the mobile vertical split (`0.92fr / 1.08fr`). Replaced rigid widths in `PreviewActionStrip` and `HistoryControls` with responsive `w-auto` / `whitespace-nowrap` sizing (icon-only undo/redo on `< sm`) so Russian labels never clip or collide, tightened mobile HUD spacing, and reserved top HUD clearance on mobile (`pt-10 md:pt-0`).
- **100% EN/RU Localization & Copy Polish (`apps/web/src/locales/en/common.json`, `apps/web/src/locales/ru/common.json`, `apps/web/src/lib/i18n-labels.ts`, and components)**: Localized remaining English strings across `dither-section.tsx` (algorithm families and `None` / `Blue Noise` / `Halftone Dot`), `auto-tune-panel.tsx` (all 10 Auto-Tune archetype titles/intents and spinner label), `look-recipes-gallery.tsx` / `look-recipe-bar.tsx` (built-in recipe names), `preview-presentation.tsx` / `slide-compare-preview.tsx` (placeholder status), and fallback error copy in application modules. Replaced all `Look'и` / `look-` anglicisms in `ru/common.json` with idiomatic Russian (`Стили`, `Автоподбор стилей`, `Рецепты`, `Стиль`, `Ссылка на стиль`, `Сохранить стиль`), added missing `export.playsCount_other`, and added `apps/web/src/locales/locales.test.ts` verifying 100% EN/RU key, CLDR plural, placeholder, and non-empty string parity.
- **Verification**: Added and updated unit tests in `export-drawer-content.test.tsx`, `palette-editor-drawer.test.tsx`, `packages/ui/src/components/drawer.test.tsx`, `locales.test.ts`, `preview-stage.test.tsx`, `preview-stage-application.test.ts`, `export-action-application.test.ts`, and `source-notice-toast.test.tsx`. `bun run format && bun verify` passed with 0 errors and 0 warnings (`format:check`, `oxlint`, `typecheck`, `vite build`, `web`: 64 files / 407 tests passed with 0 skipped, `@workspace/ui`: 2 files / 3 tests passed with 0 skipped; untouched `@workspace/core`: 18 passed / 1 skipped files, 152 passed / 4 skipped tests).
