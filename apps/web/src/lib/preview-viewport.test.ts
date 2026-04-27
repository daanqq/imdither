import { describe, expect, it } from "vitest"

import {
  clampManualViewportCenter,
  clampViewportCenter,
  getAnchoredZoomViewport,
  getDisplayPointImageCoordinates,
  getFramePointImageCoordinates,
  getManualViewportDisplayMetrics,
  getManualViewportTransform,
  getViewportPointImageCoordinates,
  getViewportDisplaySize,
  getWheelZoom,
  MIN_PREVIEW_ZOOM,
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
    ).toEqual({ height: 314, width: 628 })
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
      displayHeight: 376,
      displayWidth: 564,
      translateX: -38,
      translateY: 0,
    })
  })

  it("treats 100 percent manual zoom as the fitted display size", () => {
    expect(
      getViewportDisplaySize({
        imageHeight: 500,
        imageWidth: 1000,
        viewportHeight: 480,
        viewportWidth: 640,
        viewport: viewport({
          mode: "manual",
          zoom: 1,
          center: { x: 500, y: 250 },
        }),
      })
    ).toEqual({ height: 314, width: 628 })
  })

  it("reports the effective pixel scale after manual frame rounding", () => {
    expect(
      getManualViewportDisplayMetrics({
        imageHeight: 10,
        imageWidth: 10,
        viewportHeight: 22,
        viewportWidth: 22,
        zoom: 15.5,
      })
    ).toMatchObject({
      displayHeight: 155,
      displayWidth: 155,
      pixelScaleX: 15.5,
      pixelScaleY: 15.5,
    })

    expect(
      getManualViewportDisplayMetrics({
        imageHeight: 9,
        imageWidth: 10,
        viewportHeight: 21,
        viewportWidth: 22,
        zoom: 15.5,
      })
    ).toMatchObject({
      displayHeight: 140,
      displayWidth: 155,
      pixelScaleX: 15.5,
      pixelScaleY: 15.555555555555555,
    })
  })

  it("maps display-space pointer coordinates to image pixels", () => {
    expect(
      getDisplayPointImageCoordinates({
        clientX: 190,
        clientY: 114,
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
    const coordinates = getFramePointImageCoordinates({
      clientX: 148,
      clientY: 92,
      frameLeft: 100,
      frameTop: 60,
      imageHeight: 200,
      imageWidth: 300,
      viewportHeight: 200,
      viewportWidth: 300,
      zoom: 4,
    })

    expect(coordinates?.x).toBeCloseTo(12.7659574468)
    expect(coordinates?.y).toBeCloseTo(8.5106382979)
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
    ).toEqual({ x: 242.5531914893617, y: 121.27659574468085 })
  })

  it("clamps the center to image bounds", () => {
    expect(
      clampViewportCenter({ x: -20, y: 999 }, { height: 50, width: 100 })
    ).toEqual({ x: 0, y: 49 })
  })

  it("clamps manual pan so image edges can reach viewport edges", () => {
    const center = clampManualViewportCenter({
      center: { x: 0, y: 999 },
      imageHeight: 400,
      imageWidth: 600,
      viewportHeight: 200,
      viewportWidth: 300,
      zoom: 2,
    })

    expect(center.x).toBeCloseTo(159.5744680851)
    expect(center.y).toBeCloseTo(293.6170212766)
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
    const nextViewport = getAnchoredZoomViewport({
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

    expect(nextViewport).toMatchObject({
      mode: "manual",
      zoom: 4,
      gridEnabled: false,
      loupeEnabled: false,
    })
    expect(nextViewport.center.x).toBeCloseTo(112.5)
    expect(nextViewport.center.y).toBeCloseTo(62.5)
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
      center: { x: 189.23611111111111, y: 107.63888888888889 },
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

  it("scales wheel zoom by fixed factors and clamps the result", () => {
    expect(getWheelZoom(1, -100)).toBeCloseTo(2 ** 0.25)
    expect(getWheelZoom(1, 100)).toBeCloseTo(2 ** -0.25)
    expect(getWheelZoom(1.5, -100)).toBeCloseTo(1.5 * 2 ** 0.25)
    expect(getWheelZoom(1.5, 100)).toBeCloseTo(1.5 * 2 ** -0.25)
    expect(getWheelZoom(8, -100)).toBeCloseTo(8 * 2 ** 0.25)
    expect(getWheelZoom(8, 100)).toBeCloseTo(8 * 2 ** -0.25)
    expect(getWheelZoom(16, -100)).toBe(16)
    expect(getWheelZoom(0.5, -100)).toBeCloseTo(0.5 * 2 ** 0.25)
    expect(getWheelZoom(MIN_PREVIEW_ZOOM, 100)).toBe(MIN_PREVIEW_ZOOM)
  })

  it("returns from maximum wheel zoom-out to 100 percent", () => {
    let zoom = 1

    for (let index = 0; index < 20; index += 1) {
      zoom = getWheelZoom(zoom, 100)
    }

    expect(zoom).toBeCloseTo(MIN_PREVIEW_ZOOM)

    for (let index = 0; index < 8; index += 1) {
      zoom = getWheelZoom(zoom, -100)
    }

    expect(zoom).toBeCloseTo(1)
  })

  it("returns from maximum wheel zoom-in to 100 percent", () => {
    let zoom = 1

    for (let index = 0; index < 20; index += 1) {
      zoom = getWheelZoom(zoom, -100)
    }

    expect(zoom).toBeCloseTo(16)

    for (let index = 0; index < 16; index += 1) {
      zoom = getWheelZoom(zoom, 100)
    }

    expect(zoom).toBeCloseTo(1)
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
