import { describe, it, expect } from "vitest"
import {
  type PointerEventLike,
  ViewportInteractionController,
} from "./viewport-interaction-controller"
import {
  DEFAULT_PREVIEW_VIEWPORT,
  type PreviewViewport,
} from "./preview-viewport"

function createPointerTarget(): PointerEventLike["currentTarget"] {
  return {
    hasPointerCapture: () => true,
    releasePointerCapture: () => {},
    setPointerCapture: () => {},
  }
}

function createPointerEvent(
  event: Omit<PointerEventLike, "currentTarget"> &
    Partial<Pick<PointerEventLike, "currentTarget">>
): PointerEventLike {
  return {
    currentTarget: createPointerTarget(),
    ...event,
  }
}

describe("ViewportInteractionController", () => {
  const defaultLayout = {
    width: 800,
    height: 600,
    left: 0,
    top: 0,
    imageWidth: 1600,
    imageHeight: 1200,
  }

  it("should initialize with the provided viewport", () => {
    const controller = new ViewportInteractionController(
      DEFAULT_PREVIEW_VIEWPORT,
      defaultLayout
    )
    expect(controller.getViewport()).toEqual(DEFAULT_PREVIEW_VIEWPORT)
  })

  it("should update zoom when handling wheel events", () => {
    const controller = new ViewportInteractionController(
      { ...DEFAULT_PREVIEW_VIEWPORT, mode: "manual", zoom: 1 },
      defaultLayout
    )

    controller.handleWheel({
      clientX: 400,
      clientY: 300,
      deltaY: -100, // Zoom in
      preventDefault: () => {},
    })

    expect(controller.getViewport().zoom).toBeGreaterThan(1)
  })

  it("should perform anchored zoom (center moves to keep point stable)", () => {
    const initialViewport = {
      mode: "manual" as const,
      zoom: 1,
      center: { x: 800, y: 600 }, // Center of 1600x1200 image
      gridEnabled: false,
      loupeEnabled: false,
    }
    const controller = new ViewportInteractionController(
      initialViewport,
      defaultLayout // 800x600 display frame
    )

    // Wheel zoom at cursor point (400, 300) which is image center
    controller.handleWheel({
      clientX: 400,
      clientY: 300,
      deltaY: -100, // Zoom in
      preventDefault: () => {},
    })

    const updated = controller.getViewport()
    expect(updated.zoom).toBeGreaterThan(1)
    // Since we zoomed in at the center, the center should stay approximately the same
    // but the math should be executed.
    expect(updated.center.x).toBeCloseTo(800, 1)
    expect(updated.center.y).toBeCloseTo(600, 1)

    // Now zoom at an offset cursor point
    controller.handleWheel({
      clientX: 200, // 25% from left of 800px width
      clientY: 150, // 25% from top of 600px height
      deltaY: -100, // Zoom in further
      preventDefault: () => {},
    })

    const furtherUpdated = controller.getViewport()
    // The center should have shifted to keep the point (200, 150) stable
    expect(furtherUpdated.center.x).not.toBe(800)
    expect(furtherUpdated.center.y).not.toBe(600)
  })

  it("should clamp zoom within domain limits (25% to 1600%)", () => {
    const controller = new ViewportInteractionController(
      { ...DEFAULT_PREVIEW_VIEWPORT, zoom: 0.25 },
      defaultLayout
    )

    // Try to zoom out further
    controller.handleWheel({
      clientX: 400,
      clientY: 300,
      deltaY: 100, // Zoom out
      preventDefault: () => {},
    })

    expect(controller.getViewport().zoom).toBe(0.25)

    // Try to zoom in past 1600%
    const maxController = new ViewportInteractionController(
      { ...DEFAULT_PREVIEW_VIEWPORT, zoom: 16 },
      defaultLayout
    )

    maxController.handleWheel({
      clientX: 400,
      clientY: 300,
      deltaY: -100, // Zoom in
      preventDefault: () => {},
    })

    expect(maxController.getViewport().zoom).toBe(16)
  })

  it("should fire onUpdate when the viewport changes", () => {
    const controller = new ViewportInteractionController(
      DEFAULT_PREVIEW_VIEWPORT,
      defaultLayout
    )
    let updateCount = 0
    let lastViewport: PreviewViewport | null = null

    controller.onUpdate((viewport) => {
      updateCount++
      lastViewport = viewport
    })

    controller.handleWheel({
      clientX: 400,
      clientY: 300,
      deltaY: -100,
      preventDefault: () => {},
    })

    expect(updateCount).toBe(1)
    expect(lastViewport).toBe(controller.getViewport())
  })

  it("should pan when dragging with a single pointer and switch to manual mode", () => {
    const controller = new ViewportInteractionController(
      { ...DEFAULT_PREVIEW_VIEWPORT, mode: "fit" },
      defaultLayout
    )

    // Pointer down at center
    controller.handlePointerDown(
      createPointerEvent({
        pointerId: 1,
        clientX: 400,
        clientY: 300,
      })
    )

    // Drag right/down
    controller.handlePointerMove(
      createPointerEvent({
        pointerId: 1,
        clientX: 500,
        clientY: 400,
      })
    )

    const viewport = controller.getViewport()
    expect(viewport.mode).toBe("manual")
    expect(viewport.center.x).not.toBe(DEFAULT_PREVIEW_VIEWPORT.center.x)
    expect(viewport.center.y).not.toBe(DEFAULT_PREVIEW_VIEWPORT.center.y)
  })

  it("should support continuous dragging over multiple pointer move events", () => {
    const controller = new ViewportInteractionController(
      {
        ...DEFAULT_PREVIEW_VIEWPORT,
        mode: "manual",
        zoom: 1,
        center: { x: 800, y: 600 },
      },
      defaultLayout
    )

    // Pointer down at center
    controller.handlePointerDown(
      createPointerEvent({
        pointerId: 1,
        clientX: 400,
        clientY: 300,
      })
    )

    // First move: drag right by 100px
    controller.handlePointerMove(
      createPointerEvent({
        pointerId: 1,
        clientX: 500,
        clientY: 300,
      })
    )

    const centerAfterFirstMove = controller.getViewport().center
    expect(centerAfterFirstMove.x).toBeLessThan(800) // Image moves left when we drag right

    // Second move: drag right by another 100px (to 600px total)
    controller.handlePointerMove(
      createPointerEvent({
        pointerId: 1,
        clientX: 600,
        clientY: 300,
      })
    )

    const centerAfterSecondMove = controller.getViewport().center
    // In current implementation, if we drag 200px from start (400 to 600),
    // it should be 200px total movement.
    // If it's relative, it would only move 100px from centerAfterFirstMove.
    expect(centerAfterSecondMove.x).toBeLessThan(centerAfterFirstMove.x)
  })

  it("should pinch-zoom when dragging with two pointers", () => {
    const controller = new ViewportInteractionController(
      {
        ...DEFAULT_PREVIEW_VIEWPORT,
        mode: "manual",
        zoom: 1,
        center: { x: 800, y: 600 },
      },
      defaultLayout
    )

    // First finger down
    controller.handlePointerDown(
      createPointerEvent({
        pointerId: 1,
        clientX: 300,
        clientY: 300,
      })
    )

    // Second finger down
    controller.handlePointerDown(
      createPointerEvent({
        pointerId: 2,
        clientX: 500,
        clientY: 300,
      })
    )

    // Spread fingers apart (zoom in)
    controller.handlePointerMove(
      createPointerEvent({
        pointerId: 1,
        clientX: 200,
        clientY: 300,
      })
    )

    controller.handlePointerMove(
      createPointerEvent({
        pointerId: 2,
        clientX: 600,
        clientY: 300,
      })
    )

    const viewport = controller.getViewport()
    expect(viewport.zoom).toBeGreaterThan(1)
  })
})
