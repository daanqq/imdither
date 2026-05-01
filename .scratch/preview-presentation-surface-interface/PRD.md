# Preview Presentation Surface Interface PRD

Status: needs-triage

## Problem Statement

Preview Presentation is the accepted seam for preview rendering and interaction,
but the current Preview Presentation Surface interface exposes too many
implementation details to surface adapters. Callers pass separate display and
manual image dimensions, inspector buffers, pointer interaction switches, wheel
mode, lifecycle callbacks, frame refs, style props, and render-prop frame state.

From the user's perspective, this creates risk: preview bugs often come from
coordinate-space mismatches, pointer lifecycle regressions, display-frame
mapping drift, and Pixel Inspector sampling differences. A wide interface makes
those regressions easier to introduce.

From the maintainer's perspective, the seam is real, but its interface is not yet
deep enough. Surface adapters still need to know too much about the
implementation inside Preview Presentation Surface.

## Solution

Deepen Preview Presentation Surface around a smaller, more semantic interface.
The goal is not to change preview behavior; the goal is to hide more mechanics
behind the Preview Presentation Surface module so Canvas and Slide Compare
adapters provide product inputs instead of implementation wiring.

The refactor should preserve the established boundaries:

- Preview Viewport remains view-local state outside Preview Presentation.
- Preview Presentation Core owns pure sizing, viewport movement, coordinate
  mapping, and divider mapping.
- Preview Presentation Shell owns measurement, pointer capture, gestures, wheel
  zoom, and Pixel Inspector sampling.
- Preview Surface Adapters own buffers, labels, canvas drawing, and unique
  composition behavior.

## User Stories

1. As an IMDITHER user, I want Fit View to keep displaying a clean Screen
   Preview, so that preview artifacts do not return.
2. As an IMDITHER user, I want Real Pixels to keep inspecting Full Output
   coordinates, so that zoomed inspection remains truthful.
3. As an IMDITHER user, I want Slide Compare divider behavior to remain stable,
   so that before/after comparison does not drift.
4. As an IMDITHER user, I want Pixel Inspector to keep showing original and
   processed values under the cursor, so that inspection remains useful.
5. As an IMDITHER user, I want wheel zoom and drag/pan to keep working, so that
   preview interaction remains natural.
6. As an IMDITHER user, I want touch pan and pinch behavior to keep working
   where supported, so that mobile preview behavior does not regress.
7. As a maintainer, I want Preview Presentation Surface callers to pass semantic
   preview surface inputs, so that they do not manage low-level frame mechanics.
8. As a maintainer, I want display/manual dimension rules hidden behind the
   surface interface, so that coordinate-space policy has locality.
9. As a maintainer, I want Pixel Inspector sampling setup hidden behind the
   surface interface, so that adapters do not duplicate buffer semantics.
10. As a maintainer, I want fit-pointer interaction to be represented as a
    surface adapter capability, so that Slide Compare remains the only adapter
    with divider-specific behavior.
11. As a maintainer, I want native wheel handling to become internal policy
    rather than a broad caller switch where possible.
12. As a maintainer, I want render props narrowed, so that callers do not need
    frame refs and style objects unless truly adapter-specific.
13. As a maintainer, I want Preview Surface Adapter tests to prove behavior
    through the public seam, so that future pointer and coordinate fixes remain
    local.
14. As a maintainer, I want CanvasPanel and Slide Compare to stay separate
    adapters, so that single-buffer and two-layer composition concerns remain
    clear.
15. As a maintainer, I want no Preview Viewport persistence changes, so that this
    refactor stays inside preview presentation.
16. As a maintainer, I want no rendering algorithm changes, so that preview
    output remains visually equivalent.

## Implementation Decisions

- Preserve Preview Presentation as the public module that receives Preview
  Product State and renders Preview Surface Adapters.
- Preserve Preview Viewport as view-local state outside Preview Presentation.
- Introduce a narrower Preview Surface Interface that groups display model,
  viewport state, inspector source, and adapter capabilities into semantic
  objects.
- Keep Preview Presentation Core pure and continue testing coordinate math there.
- Keep Preview Presentation Shell responsible for pointer capture, wheel zoom,
  display measurement, live viewport updates, commit-on-release, and Pixel
  Inspector sampling.
- Keep Canvas and Slide Compare as separate Preview Surface Adapters.
- Hide frame positioning and manual-frame DOM mutation behind the Preview
  Presentation Surface interface where practical.
- Hide Pixel Inspector buffer selection behind a semantic inspector source
  interface where practical.
- Keep Slide Compare divider interaction as an adapter capability, not general
  behavior forced onto all surfaces.
- Avoid changing user-facing labels, preview controls, Compare Mode behavior, or
  Preview Stage layout.
- Avoid introducing a new renderer or replacing canvas drawing.

## Testing Decisions

- Good tests should assert preview behavior through Preview Presentation Core,
  Preview Presentation Shell, Canvas adapter, and Slide Compare adapter seams,
  not internal React state.
- Preserve existing Preview Presentation tests around display model and viewport
  mapping.
- Preserve existing Slide Compare tests around divider mapping, pointer behavior,
  redraw, and canvas composition.
- Add tests for the narrowed Preview Surface Interface to prove Canvas and Slide
  Compare adapters receive the same observable behavior after refactor.
- Test Pixel Inspector coordinate mapping for processed-only, original-only, and
  Slide Compare where existing coverage is insufficient.
- Test Fit View and Real Pixels behavior around Display Frame and Full Output
  coordinate spaces.
- Test that live drag/pan feedback remains live and persistent viewport updates
  still commit only at the accepted boundary.
- Existing preview-presentation, slide-compare-preview, preview-viewport,
  preview-viewport-interaction, pixel-inspector, and preview-frame tests are
  prior art.
- Run `bun check` after implementation.

## Out of Scope

- Changing Preview Stage controls.
- Changing Compare Mode product behavior.
- Moving Preview Viewport into Preview Presentation persisted state.
- Changing Source Intake, Preview Cycle, Export Action, or Auto-Tune.
- Replacing canvas with WebGL, WebGPU, SVG, or another renderer.
- Changing Screen Preview target calculation.
- Changing Export Output behavior.
- Redesigning Pixel Inspector UI.

## Further Notes

This is the highest-risk refactor in this batch because the current preview
surface has many historical bug fixes. Implementation should be test-first and
small-step, preserving behavior before deleting compatibility paths.
