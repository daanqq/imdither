# Source Replacement Application PRD

Status: done

## Outcome

Deepen source replacement around one browser-side Source Replacement
Application. The App Shell and Preview Stage should normalize raw browser events
to a file or demo intent, then the Source Replacement Application owns
source-kind detection, Source Kind Switch, cross-kind cancellation, and
freshness ordering.

## Problem Statement

`App.tsx` still owns routing between still Source Image loading and motion
loading. It classifies video, GIF, APNG, and still files; probes PNG files for
APNG chunks; cancels motion intake and motion processing when a still Source
Image is loaded; clears motion state; and delegates to either Source Intake
Application or Motion Intake Application.

That keeps the caller aware of too many replacement rules. Source Intake
Application and Motion Intake Application are useful Modules, but the current
outer Interface leaves Source Kind Switch and stale-work prevention spread
through App Shell orchestration.

## Solution

Add a Source Replacement Application above Source Intake Application and Motion
Intake Application.

The new Module accepts a replacement command after raw browser events have been
normalized to either:

- replace with Demo Image;
- replace with file.

For file-backed replacement, it decides whether the file is still, GIF, APNG, or
video. It delegates still-specific work to Source Intake Application and
motion-specific work to Motion Intake Application. It exposes one Source
Replacement Runtime Adapter so callers do not need to know the Source Intake and
Motion Intake adapter shapes.

## Acceptance Criteria

1. App Shell no longer imports or calls source-kind detection helpers for
   uploaded, pasted, or dropped files.
2. App Shell and Preview Stage still own DOM event normalization only: file
   input, paste, and drop become file-backed replacement intent.
3. Demo Image loading goes through Source Replacement Application.
4. Still file replacement goes through Source Replacement Application and
   preserves existing Source Intake behavior.
5. GIF, APNG, and video replacement go through Source Replacement Application
   and preserve existing Motion Intake behavior.
6. Source Replacement Application owns APNG detection before selecting still or
   motion intake.
7. Loading a still Source Image after motion cancels in-flight Motion Intake and
   Motion Cycle work before applying the still source.
8. Loading a still Source Image after motion clears Frame Sequence,
   Processed Frames, current frame index, animated source name, and Motion
   Playback state.
9. Loading a motion source after a still Source Image resets the still Preview
   Cycle before Motion Intake decode work can publish a first-frame Source
   Image.
10. Rejected still Source Intake remains non-destructive to the current source,
    Preview Viewport, Editor Settings, and Preview Cycle.
11. Failed motion replacement reports the existing motion intake error behavior
    without introducing new persisted state.
12. Load-time Output Size transitions still avoid Settings History.
13. The implementation does not change Settings JSON, Look Payload, persistence
    schema, export behavior, Preview Stage props beyond replacement wiring, or
    processing semantics.

## Implementation Decisions

- Introduce Source Replacement Application as the outer Module.
- Keep Source Intake Application and Motion Intake Application as internal
  Modules instead of merging them.
- Keep Source Load Command still-image specific.
- Keep Motion Load Command motion-source specific.
- Add a Source Replacement command with demo and file-backed variants.
- Add a Source Replacement Runtime Adapter that can apply still-source,
  motion-source, Preview Cycle, Preview Viewport, Output Size, status, notice,
  error, and cancellation effects.
- Adapt the Source Replacement Runtime Adapter internally to the existing Source
  Intake Runtime Adapter and Motion Intake Runtime Adapter.
- Move video detection, GIF detection, and APNG chunk probing out of `App.tsx`
  and behind Source Replacement Application.
- Preserve the browser-local product boundary.

## Test Plan

- Add focused Source Replacement Application tests with fake runtime adapters and
  fake intake dependencies.
- Test Demo Image replacement delegates to Source Intake behavior.
- Test still file replacement cancels motion work and clears motion state.
- Test GIF file replacement delegates to Motion Intake as GIF.
- Test APNG file replacement probes PNG files and delegates to Motion Intake as
  APNG when the APNG chunk is present.
- Test non-APNG PNG file replacement delegates to Source Intake as still.
- Test video file replacement delegates to Motion Intake as video.
- Test stale or rejected still Source Intake does not clear current work.
- Update App Shell tests only where public wiring changes.

## Out Of Scope

- Refactoring Source Intake Application internals.
- Refactoring Motion Intake Application internals.
- Refactoring Motion Cycle.
- Refactoring Preview Cycle internals.
- Refactoring Preview Stage controls or props beyond source replacement wiring.
- Changing APNG, GIF, or video decode behavior.
- Changing Output Size Policy or Output Cap.
- Changing Auto-Tune behavior.
- Adding new input types.

## Verification

Implementation must pass:

```sh
bun verify
```

Markdown-only edits to this PRD do not require `bun verify`.
