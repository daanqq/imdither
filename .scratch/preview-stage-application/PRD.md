# Preview Stage Application PRD

Status: done

## Outcome

Deepen the outer Preview Stage interface around a Preview Stage Application.
`App.tsx` should pass a Preview Stage Model and command dispatcher instead of
many loose preview, export, source replacement, motion playback, display
measurement, and history props.

## Problem Statement

Preview Stage is the correct product shell for preview layout, controls, drop
affordances, overlays, export entry, and history actions. Existing shell-module
work already split internal concerns such as controls, action strip, overlays,
export drawer content, and display measurement.

The remaining friction is the outer Interface. `PreviewStageProps` mirrors app
state atoms and callbacks: Compare Mode, Preview Viewport, Preview Product
State, export preferences, motion export preferences, source replacement,
invalid drop reporting, display measurement, Settings History, and Motion
Playback controls. That forces `App.tsx` and `PreviewStage` to share too much
knowledge about shell workflow.

## Solution

Introduce a Preview Stage Application under the Preview Stage shell.

The new Module should:

- build a Preview Stage Model from current preview, export, motion, history, and
  affordance state;
- expose Preview Stage Commands for shell user intents;
- map commands to caller effects without the React shell knowing individual app
  setter details;
- keep raw DOM event handling in the React shell or local UI adapters;
- preserve existing ownership of Source Replacement, Export Actions, Motion
  Playback, Preview Viewport Interaction, Preview Presentation Shell, and
  Processing Jobs.

The existing Preview Stage shell submodules may render slices of the model. This
PRD sits above `.scratch/preview-stage-shell-modules/PRD.md`; it does not
supersede that internal modularity work.

## Acceptance Criteria

1. Preview Stage Application exposes a renderable Preview Stage Model.
2. Preview Stage Model includes Preview Product State, Preview Refinement state,
   Processing Status, source error state, export display state, motion playback
   display state, Settings History affordances, drop affordance state, and
   allowed shell actions.
3. Preview Stage shell emits Preview Stage Commands instead of receiving many
   unrelated callbacks.
4. Raw DOM event objects for drag, drop, file input, and drawer interaction stay
   in React shell or local UI adapters.
5. Preview Stage Application may emit source replacement intent, but source-kind
   routing, Source Kind Switch, and intake behavior remain owned by Source
   Replacement Application.
6. Preview Stage Application may emit export intent and export preference
   commands, but still Export Action and Motion Export Action execution remain
   owned by their existing application seams.
7. Export preferences remain external editor runtime state; no duplicate Preview
   Stage persistence path is introduced.
8. Preview Stage Application may model Motion Playback affordances and emit
   playback commands, but frame-advance rules and playable-state policy remain
   owned by Motion Playback.
9. Preview Stage Application owns the shell command shape for Compare Mode,
   Preview Viewport patch, and Display Frame changes.
10. Gesture math, coordinate mapping, and interaction outcomes remain owned by
    Preview Viewport Interaction and Preview Presentation Shell.
11. Preview Presentation continues to render preview surfaces from Preview
    Product State without changing processing semantics.
12. Visual layout, copy, controls, drawer behavior, overlays, and Preview Stage
    shell submodule behavior remain unchanged.
13. The implementation does not change Source Replacement, Export Actions,
    Motion Playback, Preview Cycle, Processing Jobs, Settings JSON, persistence,
    or image processing semantics.

## Implementation Decisions

- Introduce a Preview Stage Application module in the web app layer.
- Introduce Preview Stage Model and Preview Stage Command types.
- Keep `PreviewStage` as the React shell and public rendering component.
- Keep Preview Stage shell submodules as renderers of model slices where useful.
- Keep DOM-specific event normalization in React code.
- Map Preview Stage Commands to caller effects at the app seam.
- Do not move Source Replacement Application, Export Action Application, Motion
  Export Action Application, Motion Playback, Preview Viewport Interaction, or
  Preview Presentation responsibilities into Preview Stage Application.
- Do not introduce new persisted state for Preview Stage.

## Test Plan

- Add focused Preview Stage Application tests.
- Test Preview Stage Model construction for still-image preview state.
- Test Preview Stage Model construction for motion playback state.
- Test Preview Stage Model construction for export drawer display state.
- Test Preview Stage Model construction for busy, error, and refinement states.
- Test command mapping for Compare Mode, Preview Viewport patch, Display Frame
  change, source replacement intent, invalid drop, export intent, export
  preference changes, motion playback commands, and Settings History commands.
- Test that commands are semantic and do not require DOM event objects.
- Preserve existing Preview Stage tests as behavior parity coverage.
- Update Preview Stage tests only where public prop wiring changes.

## Out Of Scope

- Redesigning Preview Stage layout.
- Refactoring Preview Presentation.
- Refactoring Preview Viewport Interaction.
- Refactoring Source Replacement Application or Source Intake.
- Refactoring Export Action or Motion Export Action behavior.
- Refactoring Motion Playback rules.
- Refactoring Preview Cycle or Processing Jobs.
- Changing export preferences persistence.
- Changing Settings JSON, Look Payload, persisted state, or processing
  semantics.

## Verification

Implementation must pass:

```sh
bun verify
```

Markdown-only edits to this PRD do not require `bun verify`.
