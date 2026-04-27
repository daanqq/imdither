# Preview Presentation Module PRD

Status: done
Last updated: 2026-04-28

## Problem Statement

Preview Presentation now spans processed-only, original-only, and Slide Compare surfaces. The same browser interaction rules appear in more than one place: Display Frame measurement, Fit View versus Manual View frame sizing, wheel zoom, Touch Pan, Touch Pinch Zoom, Pixel Inspector coordinate mapping, animation-frame scheduling, and canvas redraw behavior.

This makes preview work fragile. A bug in zoom, pan, inspector sampling, or frame sizing can require changes across separate preview surfaces, and tests must know too much about individual React components instead of the shared Preview Presentation contract.

## Architecture Direction

Deepen Preview Presentation behind one seam.

Preview Presentation should own the display and interaction mechanics for Preview Surfaces without changing image processing semantics. Processed-only, original-only, and Slide Compare remain adapters behind that seam.

Slide Compare should be treated as an adapter, not as a separate parallel path. Shared Preview Presentation logic owns frame, viewport, gesture, inspector, and redraw rules. The Slide Compare adapter owns only Slide Divider behavior and the two-layer surface composition that makes it unique.

## Decisions

- Keep `PreviewViewport` outside the module as persisted View-local State.
- Keep `PreviewViewport` in the existing editor state path.
- Keep drag state, active pointers, pinch state, animation-frame refs, measured viewport box, and Pixel Inspector sample inside Preview Presentation.
- Keep Compare Mode selection outside Preview Presentation.
- Keep Slide Divider percentage as Preview Stage View-local State for now.
- Do not add new Compare Modes as part of this work.
- Do not change Preview Jobs, Source Intake, Editor Settings, Export Jobs, or image processing.
- Do not change visible preview behavior during the first slice.
- Keep Pixel Inspector sampling inside Preview Presentation; adapters pass original and processed buffers.
- Keep Slide Compare's fit-view divider interaction as an adapter interaction, while shared Preview Presentation owns manual pan, wheel zoom, touch gestures, frame measurement, and inspector sampling.

## Module Shape

Use two layers:

1. Pure Preview Presentation core in `apps/web/src/lib/preview-presentation.ts`.
2. React Preview Presentation shell in `apps/web/src/components/preview-presentation.tsx`.

The pure core should own deterministic calculations:

- frame style inputs and Manual View frame metrics
- pointer-to-image coordinate mapping
- wheel zoom next Preview Viewport
- pan next center
- Slide Divider mapping in Manual View

The React shell should own browser/runtime mechanics:

- `ResizeObserver`
- refs and animation-frame scheduling
- pointer capture lifecycle
- touch and pointer gesture state
- Pixel Inspector state
- adapter contracts for processed, original, and Slide Compare surfaces

Canvas drawing remains in the surface adapters so the shared shell does not own image layer composition.

## Extraction Plan

### Slice 1: Pure Core First

- Status: done.
- Move duplicated Preview Presentation math into `apps/web/src/lib/preview-presentation.ts`.
- Add focused tests for current behavior.
- Update `preview-stage.tsx` and `slide-compare-preview.tsx` to call the pure core.
- Avoid JSX reshuffling.
- Preserve visible behavior.

### Slice 2: Shared React Shell

- Status: done.
- Extract shared React runtime mechanics from `CanvasPanel` and `SlideComparePreview`.
- Keep adapters for processed-only, original-only, and Slide Compare.
- Preserve existing Preview Viewport and Slide Divider state ownership.

### Slice 3: Public Interface Cleanup

- Status: done.
- Simplify preview module interfaces once the shared shell is stable.
- Remove remaining duplication.
- Keep tests focused on the Preview Presentation seam rather than private component structure.
- The shared shell now accepts semantic inspector buffers and a fit-pointer adapter contract instead of raw outside-manual pointer hooks.
- Canvas memo boundaries include viewport-change callbacks so a ready surface cannot retain stale interaction handlers.

## Testing Direction

- Test pure Preview Presentation calculations first.
- Prefer tests that assert current user-visible behavior: frame sizing, viewport updates, coordinate mapping, divider mapping, and inspector sampling.
- Keep browser-facing tests only where browser behavior matters.
- Do not assert exact DOM nesting unless it is part of accessibility or visible behavior.
- Preserve existing Slide Compare tests and expand them only where the shared seam changes responsibility.

## Open Questions

- Whether `Slide Divider` should move fully inside Preview Presentation after the shared shell exists.
- Whether a later adapter should support a single interface for all Preview Surface labels and overlays.
