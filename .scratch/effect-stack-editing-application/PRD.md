# Effect Stack Editing Application PRD

Status: done

## Outcome

Deepen Effect Stack editing around one browser-side Effect Stack Editing
Application. The Manual tab should render an Effect Stack Editing Model and send
Effect Stack Editing Commands instead of deriving group rules, row actions, and
low-level Settings Transitions directly in JSX.

## Problem Statement

The Effect Stack storage decision is already accepted in ADR-0001: Effect Stack
lives inside Editor Settings with fixed group ordering and locked Core stages.
The current editing surface still has a shallow Interface. `manual-tab.tsx`
splits `effectStack` into `pre`, Core, and `post`; derives row labels,
reorderability, and allowed actions; converts drag results to stage indices; and
constructs low-level Settings Transitions for optional stages and locked Core
settings.

That spreads Effect Stack editing rules across the UI and the Settings
Transition module. It makes tests either render the full Manual tab or duplicate
Stage Kind and Core-stage rules.

## Solution

Introduce an Effect Stack Editing Application above Settings Transition.

The new Module should:

- build an Effect Stack Editing Model for the Manual tab;
- expose Effect Stack Editing Commands for user editing intents;
- validate semantic reorder and parameter-edit commands against Stage Kind rules
  and effect definitions;
- adapt valid commands to existing Settings Transitions;
- preserve Effect Stack storage inside Editor Settings.

The Manual tab should keep UI mechanics such as expansion state, drag-and-drop
library integration, and rendering. It should not own Effect Stack grouping,
locked Core descriptors, allowed action derivation, or command-to-transition
mapping.

## Acceptance Criteria

1. Effect Stack Editing Application exposes a renderable Effect Stack Editing
   Model for `Pre`, `Core`, and `Post` groups.
2. The model includes visible locked Core stages for Palette and Dither without
   introducing duplicate Core settings state.
3. Optional `pre` and `post` stage rows include labels, enabled state,
   reorderability, removability, parameter metadata, and allowed actions.
4. Core stage edits still map to existing Settings Transition commands for
   palette, color depth, matching mode, Dither Algorithm, Bayer size, Halftone
   Screen, and Temporal Stability.
5. Palette import, export, extraction, and clipboard side effects remain owned
   by Palette Action Application.
6. Look Recipe save, apply, rename, and delete remain outside Effect Stack
   Editing Application.
7. Drag-and-drop mechanics remain in the UI; the UI sends semantic reorder
   Effect Stack Editing Commands.
8. Reorder commands are validated against fixed Stage Kind group rules before a
   Settings Transition is emitted.
9. User-edit parameter commands are guarded by effect definitions and parameter
   bounds before Settings Transitions are emitted.
10. Core Effect Stack validation remains the canonical persistence/import gate.
11. ADR-0001 remains intact: Effect Stack stays inside Editor Settings and this
    work does not introduce a parallel filter or layer model.
12. The implementation does not change Settings JSON, Look Payload, persistence
    schema, processing semantics, Effect Stack execution order, Palette Action
    behavior, or Look Recipe behavior.

## Implementation Decisions

- Introduce an Effect Stack Editing Application module in the web app layer.
- Introduce an Effect Stack Editing Model type for Manual tab rendering.
- Introduce Effect Stack Editing Commands for stage add, remove, enable,
  parameter edit, semantic reorder, and locked Core setting edits.
- Adapt Effect Stack Editing Commands internally to existing Settings
  Transitions.
- Keep `SettingsTransition` as the state-change mechanism; do not replace
  Editor Settings Command Application.
- Keep drag-and-drop sensors, DOM interaction details, and expansion state in
  React UI code.
- Keep palette side-effect commands routed through Palette Action Application.
- Keep Look Recipe library commands routed through existing Look Recipe store
  actions.
- Keep Output, Tone, and Utility sections out of this slice.

## Test Plan

- Add focused Effect Stack Editing Application tests.
- Test model construction for empty optional groups plus locked Core stages.
- Test model construction for `pre` and `post` optional stages with labels,
  allowed actions, and reorderability.
- Test adding an optional stage maps to a valid Settings Transition.
- Test removing and enabling an optional stage map to valid Settings
  Transitions.
- Test semantic reorder commands preserve fixed group ordering and reject invalid
  cross-group moves.
- Test parameter edits clamp or reject values outside effect definition bounds
  before emitting a Settings Transition.
- Test locked Core palette and dither edits map to existing Settings
  Transitions.
- Update Manual tab tests only where public rendering or wiring changes.

## Out Of Scope

- Changing Effect Stack storage or schema.
- Changing Effect Stack processing order.
- Allowing cross-group ordering, multiple dither stages, or arbitrary graphs.
- Moving resize or alpha flattening into the Effect Stack.
- Refactoring Palette Action Application.
- Refactoring Look Recipes.
- Refactoring Output, Tone, Utility, or drawer UI beyond wiring the stack editing
  seam.
- Changing visual design of the Manual tab.
- Changing Settings JSON, Look Payload, or persisted state.

## Verification

Implementation must pass:

```sh
bun verify
```

Markdown-only edits to this PRD do not require `bun verify`.
