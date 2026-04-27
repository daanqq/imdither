import { describe, expect, it } from "vitest"

import {
  getViewportPointImageCoordinates,
  migrateViewScaleToViewport,
} from "./preview-viewport"
import { getPinchGestureViewport } from "./preview-gestures"

describe("preview gestures", () => {
  it("starts a manual viewport from Fit with the pinch midpoint anchored", () => {
    const startViewport = migrateViewScaleToViewport("fit")
    const image = { imageHeight: 300, imageWidth: 500 }
    const viewportBox = { viewportHeight: 200, viewportWidth: 300 }
    const startMidpoint = { x: 170, y: 80 }
    const currentMidpoint = { x: 170, y: 80 }
    const nextViewport = getPinchGestureViewport({
      currentPointers: {
        first: { x: 120, y: 80 },
        second: { x: 220, y: 80 },
      },
      ...image,
      startPointers: {
        first: { x: 140, y: 80 },
        second: { x: 200, y: 80 },
      },
      startViewport,
      ...viewportBox,
    })
    const startImagePoint = getViewportPointImageCoordinates({
      ...image,
      ...viewportBox,
      viewport: startViewport,
      viewportPoint: startMidpoint,
    })
    const currentImagePoint =
      nextViewport &&
      getViewportPointImageCoordinates({
        ...image,
        ...viewportBox,
        viewport: nextViewport,
        viewportPoint: currentMidpoint,
      })

    expect(nextViewport).toMatchObject({
      mode: "manual",
      zoom: 1.6666666666666667,
    })
    expect(currentImagePoint?.x).toBeCloseTo(startImagePoint?.x ?? 0)
    expect(currentImagePoint?.y).toBeCloseTo(startImagePoint?.y ?? 0)
  })

  it("keeps the start image midpoint under the moved touch midpoint", () => {
    const startViewport = {
      ...migrateViewScaleToViewport("actual"),
      zoom: 2,
      center: { x: 250, y: 150 },
    }
    const image = { imageHeight: 300, imageWidth: 500 }
    const viewportBox = { viewportHeight: 200, viewportWidth: 300 }
    const startMidpoint = { x: 150, y: 100 }
    const currentMidpoint = { x: 180, y: 120 }
    const nextViewport = getPinchGestureViewport({
      currentPointers: {
        first: { x: 130, y: 120 },
        second: { x: 230, y: 120 },
      },
      ...image,
      startPointers: {
        first: { x: 120, y: 100 },
        second: { x: 180, y: 100 },
      },
      startViewport,
      ...viewportBox,
    })
    const startImagePoint = getViewportPointImageCoordinates({
      ...image,
      ...viewportBox,
      viewport: startViewport,
      viewportPoint: startMidpoint,
    })
    const currentImagePoint =
      nextViewport &&
      getViewportPointImageCoordinates({
        ...image,
        ...viewportBox,
        viewport: nextViewport,
        viewportPoint: currentMidpoint,
      })

    expect(nextViewport?.zoom).toBeCloseTo(3.3333333333)
    expect(currentImagePoint?.x).toBeCloseTo(startImagePoint?.x ?? 0)
    expect(currentImagePoint?.y).toBeCloseTo(startImagePoint?.y ?? 0)
  })

  it("ignores tiny two-finger starts and clamps zoom", () => {
    const image = { imageHeight: 300, imageWidth: 500 }
    const viewportBox = { viewportHeight: 200, viewportWidth: 300 }

    expect(
      getPinchGestureViewport({
        currentPointers: {
          first: { x: 100, y: 100 },
          second: { x: 110, y: 100 },
        },
        ...image,
        startPointers: {
          first: { x: 100, y: 100 },
          second: { x: 110, y: 100 },
        },
        startViewport: migrateViewScaleToViewport("fit"),
        ...viewportBox,
      })
    ).toBeNull()

    expect(
      getPinchGestureViewport({
        currentPointers: {
          first: { x: -800, y: 100 },
          second: { x: 1100, y: 100 },
        },
        ...image,
        startPointers: {
          first: { x: 100, y: 100 },
          second: { x: 200, y: 100 },
        },
        startViewport: migrateViewScaleToViewport("fit"),
        ...viewportBox,
      })?.zoom
    ).toBe(16)
  })
})
