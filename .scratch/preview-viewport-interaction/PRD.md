# PRD: Preview Viewport Interaction

Status: done

## Problem Statement

`PreviewPresentationSurface` and `ViewportInteractionController` currently split
the **Preview Viewport** interaction contract across two places. The controller
owns some gesture state, but the React shell still decides which browser inputs
enter the controller, when a **Preview Viewport** update is live-only, when it is
committed to persisted editor state, and when pointer capture should happen.

This shallow interface caused recent regressions:

- Fit View pointer clicks entered **Manual View** unexpectedly.
- **Slide Divider** live dragging leaked into hover movement.
- Manual drag risked writing **Preview Viewport** state during the hot move path.
- Wheel zoom and Compare Mode transitions had transient frame/divider mismatch.

The current module hides gesture math but not the session policy. Callers still
need to know too much about gesture ordering.

## Solution

Replace `ViewportInteractionController` with a deeper
`PreviewViewportInteraction` module.

The new module owns **Preview Viewport** gesture policy as a session-style state
machine. It emits typed outcomes that tell the **Preview Presentation Shell**
what to do:

- capture or release a pointer;
- apply a live viewport update to the DOM frame;
- commit a viewport update to editor state;
- ignore an input.

The shell remains responsible for DOM side effects and rendering. The module
owns the policy for which user interaction produces which outcome.

**Slide Divider** remains a **Preview Surface Adapter** interaction. It is not
part of `PreviewViewportInteraction`.

## User Stories

1. As a user, I want Fit View clicks on the preview to stay in **Screen Fit**, so
   that clicking the image does not unexpectedly enter **Real Pixels**.
2. As a user, I want wheel zoom to enter **Real Pixels** immediately, anchored to
   the cursor.
3. As a user, I want Manual View drag to move the image smoothly without lag.
4. As a user, I want Manual View drag to persist the final **Preview Viewport**
   only when I release the pointer.
5. As a user, I want Touch Pinch Zoom to stay smooth and commit the final zoom
   after the gesture ends.
6. As a maintainer, I want one module to define pointer capture, live updates,
   and commit-on-release, so that interaction regressions are tested at one
   seam.

## Implementation Decisions

### Module

- Rename/replace `ViewportInteractionController` with
  `PreviewViewportInteraction`.
- Keep it non-React and stateful.
- Keep **Preview Viewport** outside the module as persisted editor state.
- Keep **Compare Mode** outside the module as editor selection state.
- Keep **Slide Divider** outside the module as adapter-owned interaction.

### Interface

The interface is session-style:

- `wheel(event)` handles wheel zoom.
- `startPointer(event, mode)` starts or ignores a pointer session.
- `movePointer(event)` updates an active pointer session.
- `finishPointer(event)` completes a pointer session.
- `cancelPointer(event)` cancels a pointer session.
- `syncViewport(viewport)` syncs external state only while idle.
- `syncLayout(displayFrame)` syncs the current **Display Frame**.

### Interaction Modes

- `viewport-enabled`: wheel, Manual View pan, Touch Pan, and Touch Pinch Zoom
  are allowed.
- `manual-only`: pointer interaction is allowed only when already in Manual
  View; Fit View pointer clicks are ignored.
- `viewport-disabled`: pointer interaction is ignored because a surface adapter
  owns the gesture, for example **Slide Divider** drag.

### Outcomes

The module returns typed outcomes:

- `ignore`
- `capture-pointer`
- `release-pointer`
- `live-viewport`
- `commit-viewport`
- `batch`

Outcome rules:

- Wheel zoom returns `commit-viewport`.
- Manual pointer movement returns `live-viewport`.
- Manual pointer release returns `commit-viewport`.
- Fit View mouse pointer down returns `ignore`.
- Fit View touch can begin a Touch Pan/Touch Pinch Zoom session.
- Touch Pinch Zoom returns `live-viewport` during movement and
  `commit-viewport` when finished.
- Pointer capture and release are outcomes, not internal DOM side effects.

## Implementation Slices

### Slice 1: Outcome Model And Parity

Requirements:

- Create `PreviewViewportInteraction` and outcome types.
- Port current wheel zoom, Manual View pan, Touch Pan, and Touch Pinch Zoom
  behavior.
- Preserve current layout and viewport syncing behavior.
- Add deterministic tests for the outcome contract.

Acceptance criteria:

- Wheel zoom returns `commit-viewport`.
- Manual drag move returns `live-viewport`.
- Manual drag release returns `commit-viewport`.
- Fit View mouse pointer down returns `ignore`.
- Touch pointer down in Fit View can start a viewport session.

### Slice 2: Preview Presentation Shell Integration

Requirements:

- Replace direct `ViewportInteractionController` usage in
  `PreviewPresentationSurface`.
- Apply pointer capture/release outcomes in the shell.
- Apply live viewport outcomes to manual frame DOM updates.
- Commit only `commit-viewport` outcomes through `onViewportChange`.
- Keep `fitPointerInteraction` owned by the **Slide Compare** adapter.

Acceptance criteria:

- Fit View click does not enter **Real Pixels**.
- Manual drag does not write editor state on every move.
- Wheel zoom still enters **Real Pixels**.
- Touch Pinch Zoom still updates and commits the **Preview Viewport**.

### Slice 3: Regression Hardening

Requirements:

- Add or adjust tests for recent interaction regressions.
- Remove legacy controller names once shell integration is complete.
- Keep `CONTEXT.md` and this PRD aligned with shipped terminology.

Acceptance criteria:

- Compare Mode switching preserves measured **Display Frame** geometry.
- **Slide Divider** drag remains live but does not follow hover movement.
- Wheel zoom from **Screen Fit** to **Real Pixels** does not produce transient
  divider/frame mismatch.
- `bun check` passes.

## Testing Decisions

- Test the module through typed outcomes, not private gesture state.
- Prefer deterministic unit tests for session transitions.
- Keep component tests for shell integration and visible behavior.
- Do not add screenshot tests.
- Do not use `bun run dev` for verification.

## Out of Scope

- New Compare Modes.
- New gesture types such as inertia or flick.
- Changes to **Editor Settings**, Settings JSON, Look Snapshot, or Look Payload.
- Changes to Source Intake, Processing Jobs, Auto-Tune, or Export Jobs.
- Moving **Slide Divider** into the viewport interaction module.

## Supersedes

This PRD supersedes `.scratch/viewport-interaction-controller/PRD.md`. The older
PRD described a controller-callback interface; this PRD replaces it with a
session-style outcome interface.
