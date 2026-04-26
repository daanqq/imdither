# Phase 3.1 PRD: History Core

Status: done
Last updated: 2026-04-26

## Problem Statement

IMDITHER users can now change many processing controls quickly: recipes,
algorithms, palettes, color depth, perceptual matching, output size, and tone
preprocessing. This makes the editor more expressive, but it also makes
experimentation fragile. A bad settings change can only be repaired manually.

Users need a fast recovery path while exploring looks. That recovery path should
restore the processing look, not unrelated UI state such as compare mode,
preview zoom, export format, runtime status, or panel open state.

## Solution

Add undo and redo for Editor Settings changes only.

The history stack wraps the existing settings transition boundary. Any
user-facing transition that changes Editor Settings can be undone and redone.
Transient UI state remains outside history. Source intake can still apply output
size recommendations, but those automatic source-driven transitions do not fill
the undo stack.

The slice exit criterion is that users can recover from look-building settings
changes predictably, and future look payload or Auto-Tune application can reuse
the same recovery behavior.

## User Stories

1. As an IMDITHER user, I want to undo a settings change, so that I can recover
   from an experiment that made the image worse.
2. As an IMDITHER user, I want to redo an undone settings change, so that I can
   compare whether the reverted look was actually better.
3. As an IMDITHER user, I want undo and redo to work for recipe changes, so
   that choosing a starting recipe is reversible.
4. As an IMDITHER user, I want undo and redo to work for algorithm changes, so
   that comparing dithering methods is safe.
5. As an IMDITHER user, I want undo and redo to work for Bayer matrix changes,
   so that ordered dither texture experiments are reversible.
6. As an IMDITHER user, I want undo and redo to work for palette changes, so
   that switching palettes does not lose my previous look.
7. As an IMDITHER user, I want undo and redo to work for custom palette edits,
   so that adding, editing, deleting, importing, or extracting colors can be
   recovered.
8. As an IMDITHER user, I want undo and redo to work for color-depth changes, so
   that limited-color experiments are safe.
9. As an IMDITHER user, I want undo and redo to work for color matching changes,
   so that RGB and Perceptual matching can be compared safely.
10. As an IMDITHER user, I want undo and redo to work for output width and size
    changes, so that resolution experiments are reversible.
11. As an IMDITHER user, I want undo and redo to work for brightness, contrast,
    gamma, invert, and color mode changes, so that tone experiments are safe.
12. As an IMDITHER user, I want undo and redo to work for alpha background and
    resize kernel changes, so that advanced settings remain recoverable.
13. As an IMDITHER user, I want undo and redo to work for pasted settings, so
    that importing settings is reversible.
14. As an IMDITHER user, I want undo and redo to work for defaults reset, so
    that resetting the editor is not destructive.
15. As an IMDITHER user, I want source image loading to stay out of undo
    history, so that undo does not unexpectedly swap my image.
16. As an IMDITHER user, I want compare mode to stay out of undo history, so
    that view changes do not pollute look recovery.
17. As an IMDITHER user, I want zoom, pan, and pixel inspector state to
    stay out of undo history, so that inspection work does not pollute look
    recovery.
18. As an IMDITHER user, I want export format and export quality to stay out of
    undo history, so that file encoding preferences remain independent from the
    processing look.
19. As an IMDITHER user, I want advanced panel open state to stay out of undo
    history, so that layout preferences are not treated as creative changes.
20. As an IMDITHER user, I want status, errors, notices, and metadata to stay
    out of undo history, so that runtime feedback does not affect look recovery.
21. As an IMDITHER user, I want undo and redo controls to communicate when they
    are unavailable, so that I understand whether recovery is possible.
22. As an IMDITHER user, I want applying a new settings change after undo to
    clear the redo path, so that history behaves predictably.
23. As an IMDITHER user, I want the history stack to be session-local, so that a
    browser reload starts from persisted settings without stale recovery state.
24. As an IMDITHER user, I want source-intake output-size recommendations to
    avoid filling the undo stack, so that loading the demo or a new file does
    not create confusing history entries.
25. As a maintainer, I want history to wrap the existing settings transition
    gate, so that settings policy remains centralized.
26. As a maintainer, I want future look import and Auto-Tune recommendation
    application to use the same history behavior, so that Phase 3 stays
    coherent.

## Implementation Decisions

- This is Phase 3 slice 1: `history-core`.
- The slice is implemented in the web editor store and preview stage.
- History tracks Editor Settings changes only.
- Undo and redo do not track source image changes, compare mode, preview
  viewport, export preferences, advanced panel open state, runtime status,
  errors, source notices, or metadata.
- Undoable changes include recipe, algorithm, Bayer matrix, palette, custom
  palette edits, palette import, palette extraction, color depth, matching mode,
  output size, brightness, contrast, gamma, invert, color mode, alpha
  background, resize kernel, pasted settings, and defaults reset.
- Source-intake output-size transitions should not create undo history entries.
- Applying a new settings transition after undo clears the redo stack.
- History state is session-local and is not included in persisted editor state.
- History should wrap the existing settings transition boundary rather than
  duplicating settings policy.
- Undo and redo application should use normalized Editor Settings and trigger
  the same preview/export behavior as other settings changes.
- Undo and redo controls are visible in the preview action row between Upload
  and Export. Disabled states communicate stack boundaries.
- Undoing or redoing an output-size change resets the preview viewport so users
  do not land in an empty off-frame pixel inspection area.
- The preview toolbar keeps Screen Fit and Real Pixels controls visible; using
  1:1, zoom, or the pixel inspector switches into Real Pixels mode.
- Export Quality wiring remains present but the visible quality control is
  hidden until the next layout iteration.
- This slice should not introduce Look Snapshots or Auto-Tune UI.

## Testing Decisions

- Good tests should assert public store behavior and visible editor contracts
  rather than internal stack implementation details.
- History tests should verify undo, redo, redo clearing, disabled boundaries,
  and session-local behavior through public actions.
- History tests should verify that every settings transition category that
  affects Editor Settings can be undone and redone.
- History tests should verify that source image changes, compare mode, preview
  viewport, export preferences, advanced panel state, status, errors, notices,
  and metadata do not enter history.
- History tests should verify that source-intake output-size transitions can be
  applied without creating a confusing undo entry.
- Settings transition tests are prior art for centralized settings policy.
- Store tests are prior art for persistence boundaries and UI state separation.
- Component tests, if added, should assert visible undo/redo affordances and
  emitted intents, not internal React state.

## Out of Scope

- No Look Snapshot codec.
- No URL or clipboard look sharing.
- No Auto-Tune analysis or recommendations.
- No source image history.
- No compare mode, viewport, export preference, status, notice, metadata, or
  panel-state history.
- No persistent history across reloads.
- No branching history UI beyond normal redo clearing.
- No new Editor Settings schema version.

## Further Notes

History is the first Phase 3 slice because later look import and Auto-Tune
application should be reversible through the same settings recovery path.

Implemented verification:

- `bun test apps/web/src/store/editor-store.test.ts`
- `bun test apps/web/src/components/preview-stage.test.tsx`
- `bun verify`
