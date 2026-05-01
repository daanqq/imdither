# PRD: Viewport Interaction Controller

Status: superseded

Superseded by `.scratch/preview-viewport-interaction/PRD.md`.

## Problem Statement

The `PreviewPresentationSurface` component is currently a "shallow" and oversized module (approx. 600 lines) that handles too many responsibilities. It directly manages complex pointer state machines for **Touch Pinch Zoom** and **Touch Pan**, coordinate mapping between screen and image space, and interaction-driven mode transitions (e.g., switching from **Fit View** to **Manual View**). This coupling makes the gesture logic difficult to test in isolation, hard to reason about, and prone to regressions when modifying the UI structure.

## Solution

Extract a deep, stateful, and non-React `ViewportInteractionController` module. This module will encapsulate all gesture state, coordinate mapping, and domain rules for viewport interaction. The `PreviewPresentationSurface` will be refactored into a thin "Shell" (adapter) that merely pipes raw browser events into the controller and synchronizes its UI with the controller's emitted viewport updates.

## User Stories

1. As a developer, I want gesture logic to be independent of the React lifecycle, so that I can test complex interactions (like simultaneous pinch and pan) without a browser environment.
2. As a developer, I want a single source of truth for coordinate mapping, so that **Pixel Inspector** and viewport gestures use consistent math.
3. As a user, I want the preview to automatically switch to **Manual View** when I start zooming or panning, so that my interaction feels direct and responsive.
4. As a user, I want smooth zooming anchored to my cursor or pinch center, so that I can easily inspect specific regions of the image.
5. As a user, I want my pan gestures to stay clamped within the image bounds, so that I don't lose the image off-screen.
6. As a developer, I want to be able to add future features like inertia/flick or snap-to-grid in one class without touching UI components.

## Implementation Decisions

### Modules

- **ViewportInteractionController**: A stateful class that owns the **Preview Viewport** and the gesture state machine.
- **PreviewPresentationShell**: A refactored React component that acts as a shallow adapter for the controller.

### Interfaces

- The `ViewportInteractionController` will expose a small interface for inputs:
  - `handlePointerDown(event: PointerEvent)`
  - `handlePointerMove(event: PointerEvent)`
  - `handlePointerUp(event: PointerEvent)`
  - `handleWheel(event: WheelEvent)`
  - `updateLayout(layout: DisplayFrame)`
- The controller will emit updates via an `onUpdate` callback:
  - `onUpdate(callback: (viewport: PreviewViewport) => void)`

### Architectural Decisions

- **Statefulness**: The controller is stateful to hide the complexity of multi-pointer tracking (Pinch/Pan).
- **Mode-Awareness**: The controller encapsulates the transition rule from **Fit View** to **Manual View**.
- **Coordinate Sovereignty**: The controller handles raw `clientX/Y` and performs its own mapping based on the provided `Display Frame` dimensions.
- **Encapsulation**: Math for `getPinchGestureViewport`, `getWheelZoom`, and `getPreviewPresentationPanCenter` will be concentrated inside the controller or its direct helpers.

## Implementation Slices

1. **Slice 1: Controller Foundation & Wheel Zoom (Tracer Bullet)**
   - Implement the `ViewportInteractionController` class structure.
   - Move `handleWheel` logic and coordinate mapping for wheel zoom into the controller.
   - Add unit tests for wheel zoom anchored to a cursor point.
   - **Goal**: Establish the seam and verify the controller-to-viewport update flow.

2. **Slice 2: Pan & Multi-Touch Gestures (Deepening)**
   - Implement the internal state machine (Idle, Panning, Pinching).
   - Migrate `handlePointerDown/Move/Up` logic from the shell into the controller.
   - Integrate `getPinchGestureViewport` and `getPreviewPresentationPanCenter` math.
   - Add unit tests for complex pointer sequences (e.g., secondary finger down during active pan).
   - **Goal**: Move all "shallow" interaction math out of React.

3. **Slice 3: Shell Refactor & Adapter Implementation**
   - Refactor `PreviewPresentationSurface` (The Shell) to use an instance of the controller.
   - Replace 200+ lines of pointer/animation frame state with simple event-to-controller piping.
   - Remove legacy interaction hooks and direct DOM marginLeft/Top manipulations in favor of controller-emitted center updates.
   - **Goal**: Clean up the UI component and verify end-to-end integration.

## Testing Decisions

- A good test will simulate a sequence of `PointerEvents` (e.g., Down at P1, Down at P2, Move P1, Move P2) and verify the resulting `PreviewViewport` zoom and center.
- Tests will focus on external behavior (viewport updates) rather than internal state machine transitions.
- The `ViewportInteractionController` will be the primary test surface.
- Prior art: `apps/web/src/lib/preview-viewport.test.ts` and `apps/web/src/lib/preview-gestures.test.ts`.

## Out of Scope

- Implementation of inertia/flick scrolling (reserved for a future deepening).
- Changes to the core image processing workers or `processImage` logic.
- Redesign of the floating preview controls.

## Further Notes

- This refactor directly supports the **Visual Contract** goal by making the most complex interactive part of the app deterministically testable.
