# PRD: Mobile Preview Gestures

Status: done
Last updated: 2026-04-27

## Problem Statement

Mobile users can open and inspect the preview, but the preview does not behave
like a modern image surface. A user cannot pinch to zoom into a visible region
or move the zoomed image with a natural touch gesture. The current preview has
the underlying Fit, Manual, zoom, center, pan, and slide-compare viewport model,
but its gesture layer is still mostly mouse and wheel oriented.

This makes mobile inspection feel incomplete. Dithered output is often judged at
pixel level, so mobile users need direct touch gestures that preserve the same
trustworthy preview semantics as desktop: Fit remains a whole-image reset,
Manual remains the controlled inspection mode, original and processed previews
stay aligned, and slide compare keeps its divider behavior.

## Solution

Add a unified preview gesture layer on top of the existing canvas renderer and
preview viewport model. The feature keeps the current renderer and introduces a
small gesture module that handles wheel zoom, mouse drag pan, one-finger touch
pan, and two-finger touch pinch/pan through the same viewport contract.

Pinching from Fit switches the preview into Manual mode and anchors the zoom
around the midpoint between the user's fingers. A two-finger gesture changes
zoom and center together: distance changes control zoom, and midpoint movement
controls pan. In Manual mode, one-finger drag pans original-only and
processed-only previews. In slide compare, the divider handle keeps priority;
dragging the non-divider preview area pans the locked viewport in Manual mode.

The preview viewport remains UI-only state. It is not part of processing
settings, copied settings JSON, exported image data, or look payloads. The
toolbar Fit, 1:1, and Zoom controls remain available as explicit fallbacks.

## User Stories

1. As a mobile IMDITHER user, I want to pinch the preview to zoom, so that I can
   inspect dither pixels without opening a desktop device.
2. As a mobile IMDITHER user, I want pinch zoom to start from Fit mode, so that I
   can zoom directly from the whole-image view.
3. As a mobile IMDITHER user, I want the area between my fingers to stay under my
   fingers while zooming, so that the preview does not jump away from my target.
4. As a mobile IMDITHER user, I want two-finger movement to pan the zoomed
   preview, so that I can inspect nearby regions without changing controls.
5. As a mobile IMDITHER user, I want two-finger pinch and two-finger pan to work
   at the same time, so that the gesture feels like a normal image app.
6. As a mobile IMDITHER user, I want one-finger drag to pan while the preview is
   in Manual mode, so that moving around a zoomed image is direct.
7. As a mobile IMDITHER user, I want Fit to remain a reset control, so that I can
   return to the whole image after zooming.
8. As a mobile IMDITHER user, I want 1:1 to remain a precise control, so that I
   can inspect output pixels at exact size without relying on a gesture.
9. As a mobile IMDITHER user, I want the zoom slider to remain available, so that
   I can set zoom deliberately when gestures are inconvenient.
10. As a mobile IMDITHER user, I want original-only preview to support the same
    pinch and pan behavior as processed preview, so that source inspection feels
    consistent.
11. As a mobile IMDITHER user, I want processed-only preview to support pinch and
    pan, so that output inspection feels consistent.
12. As a mobile IMDITHER user, I want slide compare to preserve the divider
    handle, so that before/after comparison does not break.
13. As a mobile IMDITHER user, I want the slide divider handle to keep priority
    over pan, so that grabbing the handle always changes the divider.
14. As a mobile IMDITHER user, I want dragging non-divider slide preview areas in
    Manual mode to pan both layers together, so that original and processed
    pixels stay aligned.
15. As a mobile IMDITHER user, I want slide compare in Fit mode to keep its
    familiar divider behavior, so that the default comparison mode stays simple.
16. As a mobile IMDITHER user, I want accidental tiny two-finger movements to be
    ignored, so that zoom does not jump when my fingers land close together.
17. As a mobile IMDITHER user, I want zoom limits to remain bounded, so that I
    cannot zoom into unusable or unstable states.
18. As a mobile IMDITHER user, I want pan limits to remain bounded, so that I
    cannot lose the image outside the viewport.
19. As a mobile IMDITHER user, I want preview gestures to feel responsive, so
    that the image tracks my fingers without visible React lag.
20. As a desktop IMDITHER user, I want wheel zoom to keep working, so that the
    gesture refactor does not regress desktop inspection.
21. As a desktop IMDITHER user, I want mouse drag pan to keep working in Manual
    mode, so that existing inspection behavior remains intact.
22. As a keyboard or explicit-control user, I want toolbar controls to remain
    first-class, so that gestures are not the only way to inspect output.
23. As a user sharing settings, I want preview gesture state excluded from copied
    settings, so that shared settings remain about deterministic output.
24. As a user applying a look, I want preview gesture state to remain local, so
    that applying a look does not unexpectedly move my viewport.
25. As an IMDITHER user, I want mobile gestures to work without new visible
    tutorial text, so that the preview surface remains focused on the image.
26. As an IMDITHER user, I want no inertial or rubber-band motion in this slice,
    so that inspection remains precise rather than decorative.
27. As an IMDITHER user, I want no double-tap zoom in this slice, so that the
    first mobile gesture pass stays predictable.
28. As a maintainer, I want gesture behavior unified across preview modes, so
    that Original, Processed, and Slide do not drift apart.
29. As a maintainer, I want gesture math isolated from React component markup, so
    that pinch, pan, clamping, and anchoring can be tested directly.
30. As a maintainer, I want the existing canvas renderer retained, so that the
    feature does not become a Konva, Fabric, Pixi, or tiled-viewer migration.
31. As a maintainer, I want the gesture layer to reuse existing viewport helpers,
    so that Fit, Manual, center, zoom, and clamp semantics stay consistent.
32. As a maintainer, I want gesture-time updates to avoid React rerender loops,
    so that mobile preview motion remains responsive.
33. As a maintainer, I want store commits to happen at stable gesture boundaries,
    so that viewport state remains durable without writing on every pointermove.
34. As a maintainer, I want slide compare divider priority captured as a contract,
    so that future gesture changes do not break comparison.
35. As a maintainer, I want manual QA cases written down, so that real device
    behavior is checked where unit tests cannot fully simulate multi-touch.

## Implementation Decisions

- The current canvas renderer remains in place.
- The feature does not adopt a full canvas scene library.
- The feature does not adopt a ready-made zoom-pan transform component.
- The first implementation uses a small custom pointer engine rather than an
  external gesture dependency.
- A future dependency such as a React gesture library may be reconsidered only if
  the custom pointer engine grows beyond a small, testable module.
- `@use-gesture/react` is the preferred fallback dependency if the custom pointer
  engine becomes too large or browser edge cases make low-level pointer tracking
  expensive to maintain.
- If `@use-gesture/react` is adopted later, it should replace only event
  recognition and gesture state plumbing; the app should keep its own
  image-space viewport math, clamping, anchoring, and store commit policy.
- The feature introduces a unified preview gesture module that can be consumed
  by regular preview surfaces and slide compare.
- The gesture module owns pointer tracking, wheel handling, one-pointer pan, and
  two-pointer pinch/pan behavior.
- The gesture module stores active pointer positions by pointer id.
- One pointer pans only when the viewport is in Manual mode.
- Two pointers start a pinch/pan gesture when their distance passes a small
  minimum threshold.
- Pinch from Fit switches the viewport to Manual mode.
- Pinch uses the midpoint between the two pointers as the viewport anchor.
- Two-finger distance ratio updates zoom.
- Two-finger midpoint movement updates center.
- Pinch and pan are applied together in a single viewport calculation.
- Zoom is clamped by the existing preview zoom limits.
- Center is clamped by the existing manual viewport center rules.
- The gesture module reuses the existing image-space coordinate model rather
  than storing pan offsets in CSS pixels.
- The gesture module reuses existing viewport-point coordinate helpers for
  stable anchoring.
- A new pure viewport helper should express two-pointer transform behavior behind
  a simple interface.
- Gesture-time visual updates may continue to apply direct DOM style updates on
  animation frames.
- Store updates for drag and pinch gestures should be committed when the gesture
  ends.
- Wheel zoom may continue to commit immediately because it is a discrete desktop
  action.
- The toolbar zoom label is allowed to update after a pinch gesture ends in the
  first implementation.
- Original-only and processed-only previews share the same gesture behavior.
- Slide compare keeps divider handle priority.
- In slide compare, pointer activity that starts on the divider handle controls
  the divider.
- In slide compare Manual mode, pointer activity that starts outside the divider
  handle controls viewport pan or pinch.
- In slide compare Fit mode, non-handle one-pointer drag keeps the existing
  divider behavior.
- If a second pointer joins a non-handle slide interaction, the gesture becomes a
  viewport pinch/pan gesture.
- Existing Fit, 1:1, and Zoom toolbar controls remain unchanged.
- No visible instructional copy is added to the preview surface.
- No inertial pan is added.
- No rubber-band overscroll is added.
- No double-tap zoom is added.
- Preview viewport state remains UI-only app state.
- Preview viewport state remains outside processing settings.
- Preview viewport state remains outside copied settings JSON.
- Preview viewport state remains outside export output.
- Preview viewport state remains outside look payloads.

## Testing Decisions

- Good tests should assert stable user-facing behavior and geometry contracts,
  not private hook internals.
- Pure viewport geometry tests are the primary automated coverage for this
  feature.
- The new two-pointer transform helper should be tested in isolation.
- Geometry tests should cover Fit-to-Manual anchored pinch.
- Geometry tests should cover Manual-to-Manual anchored pinch.
- Geometry tests should cover midpoint movement changing center.
- Geometry tests should cover distance changes changing zoom.
- Geometry tests should cover simultaneous midpoint and distance changes.
- Geometry tests should cover minimum distance guard behavior.
- Geometry tests should cover minimum zoom clamping.
- Geometry tests should cover maximum zoom clamping.
- Geometry tests should cover center clamping at image edges.
- Geometry tests should cover large and small viewport boxes.
- Geometry tests should cover aspect-ratio differences between image and
  viewport.
- Component tests should stay light because JSDOM does not fully represent real
  multi-touch behavior.
- Preview component tests should preserve the mobile touch-action contract.
- Preview component tests should preserve existing Fit, Manual, and zoom control
  behavior.
- Slide compare tests should preserve divider handle priority.
- Slide compare tests should preserve locked original/processed viewport
  behavior where practical.
- Store tests should continue to verify that preview viewport state is excluded
  from public settings payloads.
- Existing viewport geometry tests are prior art for coordinate conversion,
  clamping, and anchored zoom.
- Existing preview stage tests are prior art for toolbar and preview contract
  assertions.
- Existing slide compare tests are prior art for divider pointer behavior.
- Manual QA is required after implementation because real device multi-touch is
  the acceptance path.
- Manual QA should cover pinch from Fit on a mobile viewport.
- Manual QA should cover two-finger pan while zoomed.
- Manual QA should cover one-finger pan in Manual mode.
- Manual QA should cover Fit reset after gesture zoom.
- Manual QA should cover 1:1 reset after gesture zoom.
- Manual QA should cover Original preview gestures.
- Manual QA should cover Processed preview gestures.
- Manual QA should cover Slide divider handle movement.
- Manual QA should cover Slide non-handle panning in Manual mode.
- Manual QA should cover that no page scroll or browser zoom takes over the
  preview gesture.

## Out of Scope

- Replacing the existing canvas renderer with Konva, Fabric, Pixi, OpenSeadragon,
  or another rendering stack is out of scope.
- Adding an external gesture dependency is out of scope for the first
  implementation.
- Reworking preview export behavior is out of scope.
- Reworking processing jobs or preview target generation is out of scope.
- Adding visible tutorial text or gesture instructions to the preview surface is
  out of scope.
- Adding inertial pan is out of scope.
- Adding rubber-band overscroll is out of scope.
- Adding double-tap zoom is out of scope.
- Adding native browser page zoom integration is out of scope.
- Adding URL-shared viewport state is out of scope.
- Adding viewport state to copied settings JSON is out of scope.
- Adding viewport state to look payloads is out of scope.
- Adding pixel inspector behavior changes is out of scope except where required
  to keep gestures from regressing existing inspector behavior.
- Adding keyboard panning shortcuts is out of scope.
- Adding E2E automation for real multi-touch is out of scope for the first
  implementation slice.

## Further Notes

The core product decision is to improve the preview interaction model without
changing the rendering model. IMDITHER already owns the important viewport
semantics: Fit versus Manual, image-space center, bounded zoom, clamped pan,
slide compare locking, and separation between preview state and deterministic
processing settings. A ready-made transform surface would still need to be
adapted back into those semantics.

The preferred implementation path is to deepen the preview interaction boundary:
keep rendering components thin, move pointer gesture state into one reusable
module, and keep pure viewport math independently testable. This should make the
mobile feature useful immediately while reducing the current duplication between
regular preview and slide compare gesture handling.
