# Motion Export Action Application PRD

Status: needs-triage

## Problem Statement

IMDITHER has a still-image Export Action Application, but motion export
orchestration still lives in the App Shell. The App Shell currently decides which
animated encoder to use, passes Frame Sequence data through motion export
processing, builds the Export File name, downloads the file, and maps export
success or failure onto shared Job Status.

That makes motion export shallow. The App Shell must know the ordering and
failure modes for GIF, APNG, and WebM export instead of delegating the Motion
Export Action to a focused browser-side seam.

## Outcome

Add a Motion Export Action Application that applies a Motion Export Action
through a command and runtime adapter. The App Shell should become a small
caller that supplies current motion state and editor settings.

## Acceptance Criteria

- GIF, APNG, and WebM export keep producing the same Export Files as today.
- Motion Export Action is separate from still-image Export Action.
- Motion Export Action Application owns Animated Export Format encoder
  selection.
- Motion Export Action always builds the Export File from the source Frame
  Sequence and current Editor Settings.
- Motion Cycle processed frames are not used as the export source of truth.
- Motion Export Action without a Frame Sequence is a safe no-op.
- WebM export with a closed WebCodecs Gate reports an explicit Encoder Failure.
- Motion Export Action uses the existing shared Job Status model.
- Successful Motion Export Action downloads the Export File, clears error state,
  and sets status to ready.
- Failed Motion Export Action reports the error and sets status to error.
- Motion Export Action does not write still-image Processing Metadata.
- App Shell no longer owns animated encoder selection, motion export naming,
  motion export status transitions, or motion export error mapping.

## Allowed Side Effects

- Add `apps/web/src/lib/motion-export-action-application.ts`.
- Add focused tests for the Motion Export Action Application seam.
- Update `App.tsx` export wiring to call the new seam.
- Reuse existing motion export helpers and Export File naming helpers.
- Update `CONTEXT.md` if terminology sharpens during implementation.

## Implementation Requirements

- Define a Motion Export Action command containing nullable Frame Sequence,
  source name, Editor Settings, Animated Export Format, Motion Export Settings,
  Video Export Settings, and WebCodecs Gate state.
- Define a Motion Export Action Runtime Adapter for status, error, and download
  side effects.
- Treat a missing Frame Sequence as a no-op with no status, error, encoder, or
  download side effects.
- Set status to exporting before starting a real Motion Export Action.
- Select the encoder inside Motion Export Action Application:
  `exportGifSequence`, `exportApngSequence`, or `exportWebMSequence`.
- Reject WebM export when WebCodecs Gate is closed before calling the WebM
  encoder.
- Generate the Export File name through existing motion export naming behavior.
- On success, download the Blob, clear error, and set status to ready.
- On failure, report the thrown Error message when available, fall back to
  format-specific export failure copy, and set status to error.
- Do not update still-image Processing Metadata.

## Testing Requirements

- Test missing Frame Sequence as a no-op.
- Test GIF export selects GIF encoder, downloads the generated Export File, clears
  error, and sets status to ready.
- Test APNG export selects APNG encoder and uses `.png` Export File naming.
- Test WebM export selects WebM encoder when WebCodecs Gate is open.
- Test WebM export with WebCodecs Gate closed reports Encoder Failure and does
  not call an encoder or download.
- Test encoder failure maps to status error and no download.
- Test non-Error thrown values use fallback failure copy.
- Test the command passes current Editor Settings, Motion Export Settings, and
  Video Export Settings to the selected encoder.
- Test Motion Cycle processed frames are not accepted by the command interface.

## Out of Scope

- Changing still-image Export Action Application.
- Changing Export Drawer UI.
- Changing supported Animated Export Formats.
- Changing GIF, APNG, WebM, or video codec internals.
- Changing Motion Cycle or Motion Intake Application.
- Adding motion export metadata.
- Splitting preview processing status and export status into separate models.
- Changing Frame Sequence shape, Frame Cap, or Video Intake policy.
- Changing Settings JSON, Look Payload, or persistence schema.

## Verification Evidence

Implementation must run `bun verify` after code changes. Documentation-only
changes do not require verification.

## Domain Language

The agreed terms are recorded in `CONTEXT.md`: Motion Export Action, Motion
Export Action Application, Animated Export Format, Motion Export Settings, Video
Export Settings, WebCodecs Gate, Encoder Failure, and Export File.
