# Motion Runtime Applications PRD

Status: needs-triage

## Problem Statement

IMDITHER now supports still Source Images and motion sources, but the App Shell
still owns most motion runtime orchestration. GIF, APNG, and video intake branch
inside `App.tsx`, where the shell handles job ids, abort controllers, Frame
Sequence state, first-frame Source Image creation, Output Size updates, Preview
Viewport resets, Motion Export Settings defaults, per-frame processing, playback
timers, status, and errors.

This makes the motion runtime shallow. The App Shell must know ordering and
freshness rules that belong behind deeper browser-side seams, and motion behavior
is harder to test without rendering the whole app.

## Outcome

Deepen the motion runtime into three explicit slices:

1. Motion Intake Application
2. Motion Cycle
3. Motion Playback wiring

Each slice must preserve current user-facing behavior while reducing App Shell
knowledge of motion-specific ordering, cancellation, and state ownership.

## Acceptance Criteria

- GIF, APNG, and video files still load through the existing UI entry points.
- Successful Motion Intake still creates a Frame Sequence and a first-frame
  Source Image.
- Successful Motion Intake still sets Output Size from Frame Sequence
  dimensions and resets Preview Viewport to Fit View.
- Successful Motion Intake still initializes current frame selection and Motion
  Export Settings defaults from the Frame Sequence.
- Loading a still Source Image still clears active motion source state.
- Changing Editor Settings for a loaded Frame Sequence still reprocesses frames
  through the Motion Worker.
- Stale motion jobs still cannot update processed frames, status, or errors
  after cancellation or replacement.
- Motion playback still supports play/pause, previous frame, next frame, and
  direct frame selection.
- App Shell no longer owns the core ordering rules for Motion Load Command
  application, Motion Cycle job freshness, or Motion Playback stepping.
- Tests exercise the new seams directly through commands/adapters where
  possible.

## Allowed Side Effects

- Add browser-side modules under `apps/web/src/lib/`.
- Add focused tests for the new motion runtime seams.
- Update `App.tsx` wiring to call the new seams.
- Update `CONTEXT.md` if terminology sharpens during implementation.
- Preserve existing store shape unless a slice needs a narrow runtime helper to
  make ownership explicit.

## Slice 1: Motion Intake Application

### Requirements

- Add a Motion Intake Application seam for applying Motion Load Commands.
- Accept GIF, APNG, and video file-backed Motion Load Commands after raw browser
  events have been normalized.
- Keep file kind detection either in the App Shell or a narrow helper; raw DOM
  events must stay outside Motion Intake Application.
- Apply successful Motion Intake by setting Frame Sequence state, first-frame
  Source Image state, current frame index `0`, animated source name, Motion
  Export Settings defaults, Output Size transition, Preview Viewport reset,
  status, and error state through a runtime adapter.
- Treat first-frame Source Image creation as required successful Motion Intake
  behavior, not a temporary UI adapter.
- Apply Source Kind Switch: loading a motion source replaces the active still
  Source Image with the first-frame Source Image.
- Keep Auto-Tune Analysis Sample creation for the first-frame Source Image.
- Preserve video intake on the main thread because it uses DOM APIs.
- Preserve GIF/APNG intake through Motion Worker behavior where it exists today.
- Preserve current error copy for GIF, APNG, and video intake failures unless a
  test exposes inconsistent existing behavior.

### Testing

- Test accepted GIF/APNG-like Motion Intake with a fake decoded Frame Sequence.
- Test accepted video Motion Intake with a fake decoded Frame Sequence.
- Test first-frame Source Image creation and Auto-Tune Analysis Sample presence.
- Test Output Size transition and Preview Viewport reset.
- Test Motion Export Settings defaults from Frame Sequence timing and loop data.
- Test rejected or failed intake sets error/status without applying stale source
  state.
- Test stale intake result is ignored after a newer Motion Load Command.

## Slice 2: Motion Cycle

### Requirements

- Add a Motion Cycle seam for reprocessing an accepted Frame Sequence when
  Editor Settings change.
- Own Motion Worker start/cancel wiring for `process-sequence`.
- Own job freshness checks so stale jobs cannot update processed frames, status,
  or errors.
- Own clearing processed frames before a new reprocess job.
- Own processed frame updates as worker frames arrive.
- Preserve current status transitions for active, successful, canceled, and
  failed motion processing.
- Keep Motion Intake separate: Motion Cycle starts from an accepted Frame
  Sequence and current Editor Settings, not from a file.
- Keep Motion Export Action out of this PRD; animated export orchestration can be
  deepened separately.

### Testing

- Test Motion Cycle starts processing when given a Frame Sequence and settings.
- Test processed frames are cleared at job start.
- Test incoming frames update the expected indexes.
- Test cancellation prevents stale frame/status/error updates.
- Test settings changes cancel the previous job and start a fresh job.
- Test worker failure maps to status error and existing failure copy.

## Slice 3: Motion Playback Wiring

### Requirements

- Keep Motion Playback focused on preview-local interaction state.
- Concentrate play/pause, timer stepping, previous frame, next frame, and direct
  frame selection policy outside the App Shell.
- Keep Motion Intake responsible only for initial frame selection.
- Keep Motion Cycle responsible for processed frame production, not playback.
- Clamp previous/next frame changes to the active Frame Sequence length.
- Preserve frame durations from the active Frame Sequence during playback.
- Stop playback behavior when no Frame Sequence exists or when a sequence has
  one frame.

### Testing

- Test play advances according to current frame duration.
- Test playback wraps from the final frame to the first frame.
- Test previous and next frame commands clamp correctly.
- Test no timer runs without a playable Frame Sequence.
- Test replacing the Frame Sequence resets playback-visible frame selection
  through Motion Intake behavior.

## Out of Scope

- Changing motion export formats or export behavior.
- Deepening Motion Export Action.
- Changing Frame Sequence data shape.
- Changing GIF, APNG, WebM, or video codec libraries.
- Changing Frame Cap, Uniform Frame Sampling, or Video Intake policy.
- Changing Preview Presentation, Slide Compare, Pixel Inspector, or Export
  Drawer UI.
- Changing still Source Intake Application behavior except for the Source Kind
  Switch needed when loading still after motion.
- Changing Settings JSON, Look Payload, or persistence schema.
- Adding arbitrary timeline editing, trimming, batch processing, or audio UI.

## Verification Evidence

Implementation must run `bun verify` after code changes. Documentation-only
changes do not require verification.

## Domain Language

The agreed terms are recorded in `CONTEXT.md`: Motion Load Command, Motion
Intake Application, Motion Cycle, Motion Playback, and Source Kind Switch.
