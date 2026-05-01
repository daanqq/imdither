# Source Intake Application Command PRD

Status: needs-triage

## Problem Statement

Source Intake Application is named as the browser-side seam for applying Source
Intake results, but its current interface is still shallow. The App Shell knows
too much about Source Load ordering, demo versus file-backed intake, Preview
Cycle reset, Preview Viewport reset, Output Size transition, Source Notice,
status, and error updates.

This makes Source Intake behavior harder to reason about because the accepted
and rejected flows are partly encoded in orchestration code rather than behind a
deep, testable module interface.

## Solution

Deepen Source Intake Application around a single Source Load Command interface.
The App Shell and Preview Stage normalize raw browser events into a file or demo
intent, then Source Intake Application owns command execution and accepted or
rejected result application.

Source Intake Application should receive a Source Intake Runtime Adapter instead
of many loose callbacks. The adapter lets the module update editor runtime state
without exposing individual React or store setters as the module interface.

The user-facing behavior must remain unchanged: accepted sources replace the
current Source Image and reset preview state; rejected sources report an error
without clearing the current work.

## User Stories

1. As a user, I want upload, paste, drop, and demo loading to behave
   consistently, so that every Source Image enters the editor through the same
   Source Intake policy.
2. As a user, I want a rejected Source Image to leave my current work visible,
   so that a bad file or oversized file does not destroy my current session.
3. As a user, I want a successful Source Image load to reset the Preview
   Viewport, so that the new image starts from a predictable Fit View baseline.
4. As a user, I want a successful Source Image load to update Output Size
   according to Source Intake policy, so that processing starts from valid
   browser-friendly dimensions.
5. As a user, I want load-time Output Size changes to avoid polluting Settings
   History, so that Undo and Redo remain focused on my deliberate Editor
   Settings changes.
6. As a user, I want Source Notices to keep explaining load-time outcomes, so
   that I understand demo loading, output auto-size, and rejection-adjacent
   policy feedback.
7. As a maintainer, I want Source Intake Application to expose one Source Load
   Command interface, so that upload, drop, paste, and demo flows converge
   before the seam.
8. As a maintainer, I want Source Intake Application to own the ordering of
   accepted Source Intake side effects, so that ordering bugs are fixed in one
   place.
9. As a maintainer, I want Source Intake Application to own the ordering of
   rejected Source Intake side effects, so that rejection remains explicitly
   non-destructive.
10. As a maintainer, I want raw browser events to stay outside Source Intake
    Application, so that the module does not become a DOM event adapter.
11. As a maintainer, I want upload, drop, and paste to pass file-backed Source
    Load Commands, so that browser-specific input handling stays in the UI shell.
12. As a maintainer, I want demo loading to pass a demo Source Load Command, so
    that demo and file-backed loads share the same application flow.
13. As a maintainer, I want Source Intake Runtime Adapter to replace loose state
    callbacks, so that tests can fake the editor runtime through one adapter.
14. As a maintainer, I want Source Intake Application tests to assert external
    behavior, so that refactors do not depend on private implementation details.
15. As a maintainer, I want Auto-Tune applied-marker state to stay outside Source
    Intake Application, so that Source Intake does not couple to Auto-Tune UI
    runtime state.
16. As a maintainer, I want mobile Preview Viewport enforcement to stay outside
    Source Intake Application, so that responsive view policy remains separate
    from Source Image loading.
17. As a maintainer, I want Source Intake to continue supplying the Auto-Tune
    Analysis Sample, so that recommendation generation keeps its current
    runtime input contract.
18. As a maintainer, I want the App Shell to stop importing separate demo and
    file intake runners, so that Source Load behavior has one entrypoint.
19. As a maintainer, I want rejected Source Intake to preserve Preview Cycle
    state, so that failed loads do not trigger unnecessary processing resets.
20. As a maintainer, I want accepted Source Intake to reset Preview Cycle state,
    so that stale preview buffers cannot survive a Source Image replacement.

## Implementation Decisions

- Build or modify Source Intake Application as the deep module for Source Load
  Commands and Source Intake result application.
- Introduce a Source Load Command interface with demo and file-backed variants.
- Keep raw browser events outside the Source Load Command interface; the App
  Shell and Preview Stage normalize those events before calling Source Intake
  Application.
- Replace the current loose callback interface with a Source Intake Runtime
  Adapter.
- Keep Source Intake Application responsible for setting loading state before
  command execution.
- Keep Source Intake Application responsible for applying accepted results:
  replace Source Image, reset Preview Cycle, reset Preview Viewport, clear
  error, set Source Notice, apply load-time Output Size transition, and update
  status through existing preview processing flow.
- Keep Source Intake Application responsible for applying rejected results:
  report error and set error status without clearing Source Image, Preview Cycle,
  Preview Viewport, or Editor Settings.
- Keep load-time Output Size transitions out of Settings History.
- Keep Auto-Tune applied-marker lifecycle inside Auto-Tune runtime state.
- Keep responsive Preview Viewport enforcement, such as mobile Fit View forcing,
  outside Source Intake Application.
- Preserve existing Source Intake policy, including oversized source rejection,
  output auto-size notices, and Auto-Tune Analysis Sample creation.
- This is one implementation slice. It does not require a multi-slice PRD split.

## Testing Decisions

- Good tests should exercise Source Intake Application through Source Load
  Commands and a fake Source Intake Runtime Adapter.
- Tests should assert externally observable ordering and outcomes, not internal
  helper function structure.
- Source Intake Application tests should cover accepted demo command behavior.
- Source Intake Application tests should cover accepted file-backed command
  behavior.
- Source Intake Application tests should cover rejected Source Intake preserving
  current work.
- Source Intake Application tests should cover command failures reporting decode
  or demo-load errors.
- Tests should verify accepted Source Intake applies load-time Output Size
  without recording Settings History.
- Tests should verify Source Load Commands do not require DOM event objects.
- Existing Source Intake tests are prior art for accepted and rejected Source
  behavior.
- Existing Source Intake Application tests are prior art if present; otherwise
  add focused tests around the module interface.
- Existing App Shell tests may be updated only where the public wiring changes.

## Out of Scope

- Moving mobile Preview Viewport enforcement into a new Preview Viewport policy
  module.
- Changing Auto-Tune applied-marker behavior.
- Changing Auto-Tune Analysis Sample creation rules.
- Changing oversized source rejection limits or copy.
- Changing Output Size Policy.
- Refactoring Export Layer.
- Refactoring Preview Presentation, Preview Stage controls, or Export Drawer.
- Changing Settings JSON, Look Payload, or persistence schema.
- Adding new Source Image input types.

## Further Notes

The accepted terminology is now recorded in the domain context: Source Load
Command, Source Intake Application, and Source Intake Runtime Adapter.

This refactor should preserve current behavior while improving locality around
Source Image loading. The expected verification after implementation is
`bun check`.
