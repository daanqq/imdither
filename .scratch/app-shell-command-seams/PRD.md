# App Shell Command Seams PRD

Status: needs-triage

## Problem Statement

The App Shell has already become lighter after Source Intake Application and
Export Action Application, but it still owns several command workflows directly:
Settings JSON clipboard actions, Look Payload copy/paste and URL apply, Palette
asset import/export/copy, palette extraction, Settings Transition marker
clearing, reset, width changes, and Auto-Tune recommendation application.

From the user's perspective, these workflows work today. The problem is
maintainability: App Shell remains a place where product actions, runtime state
side effects, domain transitions, clipboard/browser effects, notices, and error
handling meet. Future changes to one command risk touching unrelated shell
composition.

From the maintainer's perspective, the codebase has a clear direction: command
workflows should live behind deep browser-side seams, while App Shell composes
state, panels, and preview. App Shell should not keep being the owner of every
workflow's ordering.

## Solution

Deepen remaining App Shell workflows into command seams, while preserving
existing user-facing behavior:

- Clipboard Settings Application: Settings JSON and Look Payload copy/paste,
  including URL-applied Look Payload
- Palette Action Application: palette import, clipboard import, JSON/GPL export,
  palette copy, and palette extraction
- Editor Settings Command Application: reset, output-width change, generic
  Settings Transition wrapper, and Auto-Tune applied-marker clearing policy
- Auto-Tune Apply Application: applying an Auto-Tune Recommendation as normal
  Editor Settings plus marker/notice/error behavior

These may be implemented as one slice only if interfaces stay small. If the work
starts broadening, split into separate implementation PRDs before coding.

## User Stories

1. As an IMDITHER user, I want copying Settings JSON to keep working, so that I
   can reproduce Editor Settings.
2. As an IMDITHER user, I want pasting Settings JSON to keep applying normal
   Settings Transitions, so that pasted settings respect current Source Image
   constraints.
3. As an IMDITHER user, I want copying a Look Payload to keep producing a
   shareable URL, so that I can share a look without sharing Source Image data.
4. As an IMDITHER user, I want pasting a Look Payload to keep applying a normal
   Look Snapshot, so that imported looks remain editable Editor Settings.
5. As an IMDITHER user, I want URL-applied Look Payloads to keep applying after a
   Source Image is available, so that shared looks still work.
6. As an IMDITHER user, I want palette import from file to keep accepting
   supported palette text, so that custom palette workflows remain unchanged.
7. As an IMDITHER user, I want palette import from clipboard to keep working, so
   that clipboard palette workflows remain unchanged.
8. As an IMDITHER user, I want copying custom palette JSON to keep working, so
   that I can move palettes between tools.
9. As an IMDITHER user, I want exporting palette JSON and GPL to keep downloading
   the same assets, so that palette file workflows remain unchanged.
10. As an IMDITHER user, I want palette extraction to keep using the current
    Source Image, so that extracted colors still match the loaded image.
11. As an IMDITHER user, I want palette extraction without a Source Image to keep
    showing a clear error, so that I know why extraction cannot run.
12. As an IMDITHER user, I want reset and output width changes to keep clearing
    Auto-Tune applied markers, so that applied recommendation state remains
    truthful.
13. As an IMDITHER user, I want applying an Auto-Tune Recommendation to keep
    applying normal Editor Settings, so that the recommendation remains editable.
14. As an IMDITHER user, I want notices and errors to stay unchanged, so that
    command feedback remains familiar.
15. As a maintainer, I want App Shell to compose command applications, so that it
    no longer owns clipboard, palette, settings, and Auto-Tune command ordering.
16. As a maintainer, I want Clipboard Settings Application to own browser
    clipboard effects and Settings JSON/Look Payload notices, so that those
    workflows are testable without App Shell.
17. As a maintainer, I want Palette Action Application to own palette import,
    export, copy, and extraction behavior, so that palette side effects have
    locality.
18. As a maintainer, I want Editor Settings Command Application to own repeated
    clear-marker plus Settings Transition ordering, so that this pattern is not
    duplicated across handlers.
19. As a maintainer, I want Auto-Tune Apply Application to own recommendation
    apply behavior, so that Auto-Tune Panel and App Shell do not duplicate
    marker/notice/error rules.
20. As a maintainer, I want each command seam to use runtime adapters, so that
    tests can fake clipboard, download, source, Settings Transition, notices,
    and errors.
21. As a maintainer, I want command seams to preserve Settings JSON boundaries,
    so that Export Preferences and runtime UI state remain excluded.
22. As a maintainer, I want App Shell tests to shrink to wiring checks, so that
    command behavior tests live beside the command modules.

## Implementation Decisions

- Keep App Shell as the single-screen composition module for Preview Stage and
  Inspector Panel.
- Do not move Product UI layout or panel composition out of App Shell in this
  slice.
- Build command seams around existing domain workflows rather than generic
  utility wrappers.
- Reuse the existing Clipboard Settings Adapter behavior, but deepen the
  application seam if App Shell still owns ordering or runtime coupling.
- Build or deepen Palette Action Application around palette import/export/copy
  and palette extraction.
- Build or deepen Editor Settings Command Application around reset,
  output-width change, generic Settings Transition, and applied-marker clearing.
- Build or deepen Auto-Tune Apply Application around applying an Auto-Tune
  Recommendation through Settings Transition and updating marker, notice, and
  error state.
- Use runtime adapters for browser effects and editor runtime state.
- Preserve current notice strings and error fallback strings.
- Preserve Settings History semantics.
- Preserve Source Image availability checks for palette extraction.
- Preserve Look Payload URL apply behavior and hash cleanup.
- If this scope becomes more than one implementation slice, split into separate
  PRDs before implementation.

## Testing Decisions

- Good tests should cover each command seam through its public command interface
  and fake runtime adapters.
- Preserve existing Clipboard Settings Adapter tests and move/add coverage only
  where behavior becomes owned by a deeper application seam.
- Add Palette Action Application tests for import file, import clipboard, copy
  JSON, export JSON/GPL, extract success, and extract without Source Image.
- Add Editor Settings Command Application tests for reset, output width, generic
  Settings Transition, and applied-marker clearing.
- Add Auto-Tune Apply Application tests for recommendation apply, marker update,
  notice, error clearing, and use of normal Settings Transition.
- Keep App Shell tests focused on wiring commands to Inspector Panel props.
- Existing clipboard-settings-adapter, auto-tune-application, editor-store, and
  editor-settings-transition tests are prior art.
- Run `bun check` after implementation.

## Out of Scope

- Redesigning App Shell layout.
- Adding routes or a multi-page shell.
- Changing Settings JSON schema.
- Changing Look Payload format.
- Changing palette text formats.
- Changing Auto-Tune ranking or recommendation generation.
- Changing Source Intake Application.
- Changing Export Action Application.
- Changing Preview Stage, Preview Presentation, or Preview Cycle.
- Changing user-facing notice strings unless required by failing tests.

## Further Notes

This PRD intentionally excludes Auto-Tune Candidate Creation architecture work.
It focuses on App Shell workflow ownership and command seam depth.
