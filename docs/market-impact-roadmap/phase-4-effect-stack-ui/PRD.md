# Phase 4.2 PRD: Effect Stack UI

Status: implemented
Last updated: 2026-05-02

## Problem Statement

After Effect Stack Core exists, users need a visible way to understand and edit
the stack. The UI must expose workstation-style look building without replacing
IMDITHER's current dithering-first flow or crowding existing Adjust and Palette
controls.

## Outcome

Add an Inspector `Stack` tab between `Looks` and `Adjust`.

The Stack tab shows grouped Effect Stages with compact enable controls, editable
Core stage mirrors for palette and dither controls, handle-only drag reorder
inside `pre` and `post`, and inline parameter controls for expanded optional
stages. The Preview remains the primary surface and existing controls remain
available for compatibility until a later tab-retirement slice.

## Requirements

1. Inspector tabs include `Stack` between `Looks` and `Adjust`.
2. Stack tab renders fixed groups: `Pre`, `Core`, and `Post`.
3. Core group shows palette/quantize and dither stages as editable mirrors of
   existing settings.
4. Optional stages show enable/disable controls.
5. Optional `pre` stages can be reordered only inside `Pre` using handle-only
   drag-and-drop with menu fallback actions.
6. Optional `post` stages can be reordered only inside `Post` using handle-only
   drag-and-drop with menu fallback actions.
7. Add-stage controls live inside `Pre` and `Post` groups.
8. Multiple expanded optional stages can show params inline inside the Stack
   tab.
9. Params use existing control patterns: toggles for boolean state, sliders or
   numeric fields for bounded numbers, menus for fixed options.
10. Stack edits are Editor Settings transitions and therefore use Settings
    History.
11. Stack edits clear Processing Preset and Auto-Tune applied markers using the
    same existing marker rules as other settings changes.
12. The UI avoids preview-surface effect sliders, a separate route, a node
    graph, and nested card layouts.
13. Drag-and-drop uses `@dnd-kit` sortable primitives and must not make slider,
    switch, select, or scroll gestures start a reorder.
14. Mobile layout keeps the preview usable and does not force the stage list to
    occupy the primary viewport.
15. Empty optional groups communicate add affordances without implying that
    dithering is disabled.

## Acceptance Criteria

- Users can open `Stack`, see canonical Pre/Core/Post groups, and understand the
  current processing order.
- Users can enable/disable optional stages once first effects exist.
- Users can reorder optional stages within their group and cannot drag them
  across fixed group boundaries.
- Core stages can edit palette and dither settings through existing Settings
  Transition commands without duplicating state.
- Stack transitions are undoable and redoable.
- Preview updates follow existing commit-on-release and processing job rules.
- Text and controls fit in desktop and mobile inspector layouts.

## Allowed Side Effects

- Inspector tab labels and tab order change.
- Store persistence may gain selected Stack tab or expanded-stage UI state if
  kept separate from Editor Settings.
- Component tests for Inspector and control wiring expand.
- Settings transition command vocabulary may gain stack-specific transitions.

## Verification Evidence

Implementation should provide:

- component tests for Stack tab rendering and locked groups;
- transition tests for add, remove, enable, disable, param change, and reorder;
- store/history tests for undo and redo of stack transitions;
- responsive inspection through existing component/browser test coverage where
  practical;
- `bun verify` after code changes.

## Out of Scope

- No new effect algorithms by itself.
- No node graph.
- No separate page or router change.
- No preview-surface effect controls.
- No arbitrary cross-group drag.
- No Auto-Tune stack authoring UI.
