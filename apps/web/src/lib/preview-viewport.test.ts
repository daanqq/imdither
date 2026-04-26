import { describe, expect, it } from "vitest"

import {
  clampManualViewportCenter,
  clampViewportCenter,
  getAnchoredZoomViewport,
  getDisplayPointImageCoordinates,
  getFramePointImageCoordinates,
  getManualViewportTransform,
  getViewportPointImageCoordinates,
  getViewportDisplaySize,
  getWheelZoom,
  isPixelGridVisible,
  migrateViewScaleToViewport,
} from "./preview-viewport"

describe("preview viewport geometry", () => {
  it("fits an image inside the measured preview area", () => {
    expect(
      getViewportDisplaySize({
        imageHeight: 500,
        imageWidth: 1000,
        viewportHeight: 480,
        viewportWidth: 640,
        viewport: viewport({
          mode: "fit",
          zoom: 1,
          center: { x: 500, y: 250 },
        }),
      })
    ).toEqual({ height: 320, width: 640 })
  })

  it("calculates manual transforms from zoom and image-space center", () => {
    expect(
      getManualViewportTransform({
        imageHeight: 400,
        imageWidth: 600,
        viewportHeight: 200,
        viewportWidth: 300,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 200, y: 100 },
        }),
      })
    ).toEqual({
      displayHeight: 800,
      displayWidth: 1200,
      translateX: -250,
      translateY: -100,
    })
  })

  it("maps display-space pointer coordinates to image pixels", () => {
    expect(
      getDisplayPointImageCoordinates({
        clientX: 190,
        clientY: 120,
        frameLeft: 40,
        frameTop: 20,
        imageHeight: 400,
        imageWidth: 600,
        viewportHeight: 200,
        viewportWidth: 300,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 200, y: 100 },
        }),
      })
    ).toEqual({ x: 200, y: 100 })
  })

  it("maps manual frame coordinates directly to image pixels", () => {
    expect(
      getFramePointImageCoordinates({
        clientX: 148,
        clientY: 92,
        frameLeft: 100,
        frameTop: 60,
        imageHeight: 200,
        imageWidth: 300,
        zoom: 4,
      })
    ).toEqual({ x: 12, y: 8 })
  })

  it("maps viewport coordinates to manual image pixels without reading frame layout", () => {
    expect(
      getViewportPointImageCoordinates({
        imageHeight: 400,
        imageWidth: 600,
        viewportHeight: 200,
        viewportPoint: { x: 190, y: 120 },
        viewportWidth: 300,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 200, y: 100 },
        }),
      })
    ).toEqual({ x: 220, y: 110 })
  })

  it("clamps the center to image bounds", () => {
    expect(
      clampViewportCenter({ x: -20, y: 999 }, { height: 50, width: 100 })
    ).toEqual({ x: 0, y: 49 })
  })

  it("clamps manual pan so image edges can reach viewport edges", () => {
    expect(
      clampManualViewportCenter({
        center: { x: 0, y: 999 },
        imageHeight: 400,
        imageWidth: 600,
        viewportHeight: 200,
        viewportWidth: 300,
        zoom: 2,
      })
    ).toEqual({ x: 75, y: 350 })
  })

  it("locks manual center when zoomed image fits inside the viewport", () => {
    expect(
      clampManualViewportCenter({
        center: { x: 0, y: 999 },
        imageHeight: 400,
        imageWidth: 600,
        viewportHeight: 400,
        viewportWidth: 800,
        zoom: 1,
      })
    ).toEqual({ x: 300, y: 200 })
  })

  it("anchors zoom around the inspected image point", () => {
    expect(
      getAnchoredZoomViewport({
        anchorImagePoint: { x: 125, y: 75 },
        imageHeight: 200,
        imageWidth: 300,
        nextZoom: 4,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 100, y: 50 },
        }),
        viewportHeight: 100,
        viewportWidth: 100,
      })
    ).toEqual({
      mode: "manual",
      zoom: 4,
      center: { x: 112.5, y: 62.5 },
      gridEnabled: false,
      loupeEnabled: false,
    })
  })

  it("anchors zoom around the cursor point when entering manual mode from fit", () => {
    expect(
      getAnchoredZoomViewport({
        anchorImagePoint: { x: 250, y: 125 },
        anchorViewportPoint: { x: 220, y: 120 },
        imageHeight: 300,
        imageWidth: 500,
        nextZoom: 2,
        viewport: viewport({
          mode: "fit",
          zoom: 1,
          center: { x: 0, y: 0 },
        }),
        viewportHeight: 200,
        viewportWidth: 300,
      })
    ).toMatchObject({
      mode: "manual",
      zoom: 2,
      center: { x: 215, y: 115 },
    })
  })

  it("migrates old view scale values into viewport state", () => {
    expect(migrateViewScaleToViewport("fit")).toMatchObject({ mode: "fit" })
    expect(migrateViewScaleToViewport("actual")).toEqual({
      mode: "manual",
      zoom: 1,
      center: { x: 0, y: 0 },
      gridEnabled: false,
      loupeEnabled: false,
    })
  })

  it("shows the pixel grid only in manual mode at 400 percent and above", () => {
    expect(
      isPixelGridVisible({
        mode: "manual",
        zoom: 4,
        center: { x: 0, y: 0 },
        gridEnabled: true,
        loupeEnabled: false,
      })
    ).toBe(true)
    expect(
      isPixelGridVisible({
        mode: "manual",
        zoom: 3.99,
        center: { x: 0, y: 0 },
        gridEnabled: true,
        loupeEnabled: false,
      })
    ).toBe(false)
    expect(
      isPixelGridVisible({
        mode: "fit",
        zoom: 8,
        center: { x: 0, y: 0 },
        gridEnabled: true,
        loupeEnabled: false,
      })
    ).toBe(false)
  })

  it("steps wheel zoom in both directions and clamps the result", () => {
    expect(getWheelZoom(1, -100)).toBe(1.5)
    expect(getWheelZoom(1, 100)).toBe(0.5)
    expect(getWheelZoom(1.5, -100)).toBe(2)
    expect(getWheelZoom(1.5, 100)).toBe(1)
    expect(getWheelZoom(8, -100)).toBe(10)
    expect(getWheelZoom(8, 100)).toBe(6.5)
    expect(getWheelZoom(16, -100)).toBe(16)
    expect(getWheelZoom(0.5, -100)).toBe(1)
    expect(getWheelZoom(0.25, 100)).toBe(0.25)
  })
})

function viewport(
  overrides: Partial<ReturnType<typeof migrateViewScaleToViewport>>
) {
  return {
    ...migrateViewScaleToViewport("fit"),
    ...overrides,
    center: {
      ...migrateViewScaleToViewport("fit").center,
      ...overrides.center,
    },
  }
}
