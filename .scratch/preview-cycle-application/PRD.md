# Preview Cycle Application PRD

Status: done

## Outcome

Deepen Preview Cycle under the existing React hook seam. The hook should become
a thin React adapter over a browser-side Preview Cycle Application that
calculates Screen Preview targets, starts/cancels Preview Jobs through
Processing Jobs, reduces Preview Job events, and applies runtime effects through
a Preview Cycle Runtime Adapter.

## Problem Statement

`docs/preview-cycle-module/PRD.md` already established Preview Cycle as the
React runtime layer that owns Screen Preview target calculation, Preview Job
start/cancel wiring, reduced/refined Preview updates, and Preview Refinement
state before Preview Stage receives renderable state.

The current implementation still keeps event reduction inside
`use-preview-cycle.ts`: queued, processing, reduced-preview-ready,
refined-preview-ready, and failed events are translated to Preview output,
Preview Refinement state, status, metadata, and errors inside React callback
plumbing. That makes the hook the real test surface for Preview Cycle behavior
instead of a testable application seam.

## Solution

Introduce a Preview Cycle Application below the existing `usePreviewCycle` hook.

The new Module should:

- calculate Screen Preview targets from Display Frame size, Preview Viewport
  mode, and output dimensions;
- start Preview Jobs through Processing Jobs;
- reduce Preview Job events into Preview Cycle runtime effects;
- own freshness checks for source/settings/viewport/target so superseded events
  cannot update runtime state;
- expose reset as a Preview Cycle Application command;
- keep Processing Jobs separate and keep Export Jobs outside Preview Cycle.

The hook remains the React adapter: it supplies current Source Image, Editor
Settings, Preview Viewport mode, Display Frame size, Processing Jobs, and React
setter-backed runtime adapter methods.

## Acceptance Criteria

1. `usePreviewCycle` no longer owns the Preview Job event switch for queued,
   processing, reduced, refined, and failed outcomes.
2. Preview Cycle Application calculates Screen Preview targets currently
   calculated in the hook.
3. Preview Cycle Application starts Preview Jobs through Processing Jobs.
4. Processing Jobs remains responsible for job timing, worker calls,
   reduced/refined execution, cancellation handles, and Export Job interaction.
5. Preview Cycle Application does not own Export Jobs.
6. Queued and processing Preview Job events preserve the previous Preview output.
7. Reduced Preview results replace Preview output, update metadata, clear error,
   set ready status, and set Preview Refinement state according to whether
   refinement will follow.
8. Refined Preview results replace Preview output, update metadata, clear error,
   set ready status, and clear Preview Refinement state.
9. Failed Preview Job events preserve the last successful Preview output, clear
   Preview Refinement state and metadata, report error, and set error status.
10. Superseded Preview Job events cannot apply runtime effects after Source
    Image, Editor Settings, Preview Viewport mode, or Screen Preview target
    changes.
11. Preview Cycle reset is exposed by the hook but implemented as a Preview
    Cycle Application command.
12. Reset cancels active preview work when needed, clears Preview output and
    Preview Refinement state, and does not mutate Editor Settings.
13. Preview Stage receives the same renderable Preview Pixel Buffer, Preview
    Refinement state, and Screen Preview target behavior as before.
14. Large Pixel Buffers remain out of global Zustand state.
15. The implementation does not change Preview Presentation, Preview Stage,
    Processing Jobs timing, worker clients, Export, Settings JSON, or processing
    semantics.

## Implementation Decisions

- Introduce a Preview Cycle Application module in the web app layer.
- Introduce a Preview Cycle Runtime Adapter for Preview output, Preview
  Refinement state, status, error, and metadata effects.
- Keep `usePreviewCycle` as the public React hook seam consumed by `App.tsx`.
- Keep Processing Jobs as the scheduling and worker adapter.
- Keep Preview Cycle target calculation in the application seam, not in JSX or
  `App.tsx`.
- Keep previous Preview output visible while replacement work is queued or
  processing.
- Keep failure non-destructive to the last successful Preview output.
- Keep reset explicit and destructive only to Preview Cycle local state.
- Do not change the existing reduced/refined timing policy.

## Test Plan

- Add focused Preview Cycle Application tests.
- Test Screen Preview target calculation is requested from Display Frame size,
  Preview Viewport mode, and output dimensions.
- Test queued and processing events update status without clearing Preview
  output.
- Test reduced-preview-ready applies Preview output, metadata, ready status,
  cleared error, and pending refinement state.
- Test refined-preview-ready applies Preview output, metadata, ready status,
  cleared error, and cleared refinement state.
- Test failed events preserve previous Preview output while clearing refinement
  state and reporting error/status effects.
- Test reset cancels active preview work and clears Preview output/refinement
  state without mutating Editor Settings.
- Test stale events from superseded cycle runs are ignored.
- Keep existing Processing Jobs tests focused on scheduling, worker execution,
  cancellation timing, reduced/refined execution, and Export Job interaction.
- Update hook tests only where public hook wiring changes.

## Out Of Scope

- Refactoring Processing Jobs internals.
- Changing reduced/refined timing, pixel budgets, or worker scheduling.
- Refactoring Preview Stage.
- Refactoring Preview Presentation or Preview Viewport Interaction.
- Changing Source Intake or Source Replacement behavior.
- Changing Export Jobs or Full Output behavior.
- Moving large Pixel Buffers into Zustand.
- Changing Settings JSON, Look Payload, persisted state, or processing semantics.

## Verification

Implementation must pass:

```sh
bun verify
```

Markdown-only edits to this PRD do not require `bun verify`.
