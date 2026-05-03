# Phase 4.4 PRD: Look Recipes

Status: implemented
Last updated: 2026-05-02

## Problem Statement

Stack editing creates richer looks, but users need a compact way to apply and
save complete style recipes without turning Processing Presets into a second
settings model.

## Outcome

Add Look Recipes to the Manual tab. A Look Recipe is a one-shot style recipe
that applies selected Editor Settings fields, including Effect Stack, palette,
dither, color, and adjust fields, while preserving output geometry.

## Requirements

1. The Manual tab includes a compact recipe bar with `Custom`, built-in recipes,
   saved local recipes, save action, and recipe menu action.
2. The app ships eight immutable built-in Look Recipes.
3. Users can save the current look as a named browser-local Look Recipe.
4. Users can rename or delete saved local Look Recipes.
5. Built-in recipes cannot be renamed or deleted.
6. Applying a Look Recipe updates Editor Settings through Settings History.
7. Applying a Look Recipe preserves output width, output height, resize mode,
   alpha background, source image, export format, and export quality.
8. Active recipe matching uses exact style equality and ignores output geometry.
9. If the current style does not match a recipe, the selector shows `Custom`.

## Acceptance Criteria

- Built-in and saved recipes appear in the Stack recipe selector.
- Saving a recipe stores it in browser-local app state, not Editor Settings.
- Applying a recipe is undoable and redoable.
- Output geometry remains unchanged after recipe apply.
- Editing stack, palette, dither, color, or adjust fields can move the selector
  back to `Custom`.

## Allowed Side Effects

- Web persisted state gains a local Look Recipe library.
- Manual tab top bar gains recipe controls.
- Tests cover recipe capture, apply, matching, normalization, and store actions.

## Verification Evidence

Implementation should provide:

- Look Recipe module tests for capture, apply, match, built-ins, and
  normalization;
- store tests for save/apply and geometry preservation;
- component tests for Stack recipe bar rendering;
- `bun verify` after code changes.

## Out of Scope

- No backend sync.
- No import/export of recipe libraries.
- No Auto-Tune recipe authoring.
- No removal of existing Adjust or Palette tabs in this slice.
