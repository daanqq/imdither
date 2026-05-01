# Preview Cycle Module PRD

Status: done.

## Problem

`App.tsx` owned too much Preview runtime orchestration:

- Screen Preview target calculation from Display Frame size.
- Preview Job start and cancellation.
- reduced Preview and refined Preview result application.
- Preview Refinement pending state.
- status, error, and metadata updates for Preview Jobs.

This made the app shell harder to navigate and mixed Preview Cycle mechanics
with Source Intake, Export, Clipboard Settings, Auto-Tune, and Inspector wiring.

## Outcome

Deepen Preview Cycle behind one React hook seam.

`App.tsx` passes the current Source Image, Editor Settings, Preview Viewport
mode, and the Processing Jobs adapter into Preview Cycle. Preview Cycle returns
the renderable Preview Pixel Buffer, Preview Refinement state, Screen Preview
target, a Display Frame size callback, and a reset command for new Source
Intake.

## Acceptance Criteria

- `App.tsx` does not directly call `getScreenPreviewTarget`.
- `App.tsx` does not directly start Preview Jobs.
- `App.tsx` does not own reduced/refined Preview event switching.
- Preview Stage receives the same Preview Pixel Buffer, Preview Refinement, and
  Screen Preview target props as before.
- Processing Jobs still own job timing, worker calls, reduced/refined work, and
  cancellation behavior.
- Export remains outside Preview Cycle and still uses Full Output settings.
- Large Pixel Buffers remain out of global Zustand state.

## Implemented Shape

- `apps/web/src/lib/use-preview-cycle.ts` owns the Preview Cycle hook.
- `apps/web/src/lib/processing-jobs.ts` remains the Preview/Export job adapter.
- `apps/web/src/App.tsx` consumes Preview Cycle and passes its output into
  Preview Stage.

## Invariants

- Preview Cycle may calculate Screen Preview targets, but it must not mutate
  Editor Settings.
- Preview Cycle may apply Preview Job results to React-local Preview state, but
  stale jobs must not overwrite newer Source Image or Editor Settings state.
- Preview Cycle must keep previous Preview output visible while replacement
  work is queued or processing.
- Preview Cycle must not own Export Jobs.

## Verification

- `bun check` passed after implementation.
