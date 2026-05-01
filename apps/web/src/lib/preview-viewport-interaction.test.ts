import { describe, expect, it } from "vitest"

import {
  PreviewViewportInteraction,
  type PointerEventLike,
  type PreviewViewportInteractionOutcome,
} from "./preview-viewport-interaction"
import { DEFAULT_PREVIEW_VIEWPORT } from "./preview-viewport"

const defaultLayout = {
  width: 800,
  height: 600,
  left: 0,
  top: 0,
  imageWidth: 1600,
  imageHeight: 1200,
}

describe("PreviewViewportInteraction", () => {
  it("commits wheel zoom immediately", () => {
    const interaction = new PreviewViewportInteraction(
      { ...DEFAULT_PREVIEW_VIEWPORT, mode: "manual", zoom: 1 },
      defaultLayout
    )

    const outcome = interaction.wheel({
      clientX: 400,
      clientY: 300,
      deltaY: -100,
      preventDefault: () => {},
    })

    expect(outcome.type).toBe("commit-viewport")
    expect(viewportFrom(outcome).zoom).toBeGreaterThan(1)
  })

  it("ignores fit view mouse pointer down", () => {
    const interaction = new PreviewViewportInteraction(
      { ...DEFAULT_PREVIEW_VIEWPORT, mode: "fit" },
      defaultLayout
    )

    expect(
      interaction.startPointer(
        pointerEvent({ pointerType: "mouse" }),
        "viewport-enabled"
      )
    ).toEqual({ type: "ignore" })
    expect(interaction.getViewport().mode).toBe("fit")
  })

  it("returns live viewport during manual drag and commits on release", () => {
    const interaction = new PreviewViewportInteraction(
      {
        ...DEFAULT_PREVIEW_VIEWPORT,
        mode: "manual",
        zoom: 1,
        center: { x: 800, y: 600 },
      },
      defaultLayout
    )

    expect(
      interaction.startPointer(pointerEvent({ clientX: 400, clientY: 300 }))
    ).toEqual({
      type: "capture-pointer",
      pointerId: 1,
    })

    const move = interaction.movePointer(
      pointerEvent({ clientX: 500, clientY: 300 })
    )
    expect(move.type).toBe("live-viewport")
    expect(viewportFrom(move).center.x).toBeLessThan(800)

    const finish = interaction.finishPointer(
      pointerEvent({ clientX: 500, clientY: 300 })
    )
    expect(finish).toEqual({
      outcomes: [
        { pointerId: 1, type: "release-pointer" },
        { type: "commit-viewport", viewport: interaction.getViewport() },
      ],
      type: "batch",
    })
  })

  it("allows touch to begin a viewport session from fit view", () => {
    const interaction = new PreviewViewportInteraction(
      { ...DEFAULT_PREVIEW_VIEWPORT, mode: "fit" },
      defaultLayout
    )

    const outcome = interaction.startPointer(
      pointerEvent({ pointerType: "touch" })
    )

    expect(outcome).toEqual({
      type: "capture-pointer",
      pointerId: 1,
    })
    expect(interaction.getViewport()).toMatchObject({
      mode: "manual",
      center: { x: 800, y: 600 },
      zoom: 1,
    })
  })

  it("ignores pointer starts when viewport interaction is disabled", () => {
    const interaction = new PreviewViewportInteraction(
      { ...DEFAULT_PREVIEW_VIEWPORT, mode: "manual" },
      defaultLayout
    )

    expect(
      interaction.startPointer(pointerEvent(), "viewport-disabled")
    ).toEqual({ type: "ignore" })
  })
})

function pointerEvent(
  overrides: Partial<PointerEventLike> = {}
): PointerEventLike {
  return {
    clientX: 400,
    clientY: 300,
    pointerId: 1,
    pointerType: "mouse",
    ...overrides,
  }
}

function viewportFrom(outcome: PreviewViewportInteractionOutcome) {
  if (outcome.type !== "live-viewport" && outcome.type !== "commit-viewport") {
    throw new Error(`Expected viewport outcome, got ${outcome.type}`)
  }

  return outcome.viewport
}
