import { describe, expect, it } from "vitest"

import {
  getPreviewPresentationDisplayModel,
  getPreviewPresentationDividerPercent,
  getPreviewPresentationFrame,
  getPreviewPresentationPanCenter,
  getPreviewPresentationViewportDividerPercent,
  getPreviewPresentationWheelViewport,
} from "./preview-presentation"
import { migrateViewScaleToViewport } from "./preview-viewport"

describe("preview presentation core", () => {
  it("derives display dimensions from preview state instead of caller geometry", () => {
    expect(
      getPreviewPresentationDisplayModel({
        fullOutputHeight: 3000,
        fullOutputWidth: 4000,
        previewTargetHeight: 450,
        previewTargetWidth: 600,
        viewport: viewport({ mode: "fit" }),
      })
    ).toMatchObject({
      frameHeight: 450,
      frameWidth: 600,
      manualFrameHeight: 3000,
      manualFrameWidth: 4000,
      viewScale: "fit",
    })

    expect(
      getPreviewPresentationDisplayModel({
        fullOutputHeight: 3000,
        fullOutputWidth: 4000,
        previewTargetHeight: 450,
        previewTargetWidth: 600,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 2000, y: 1500 },
        }),
      })
    ).toMatchObject({
      frameHeight: 3000,
      frameWidth: 4000,
      manualFrameHeight: 3000,
      manualFrameWidth: 4000,
      viewScale: "actual",
    })
  })

  it("uses fit framing for a centered 100 percent manual viewport", () => {
    const frame = getPreviewPresentationFrame({
      imageHeight: 400,
      imageWidth: 600,
      viewport: viewport({
        mode: "manual",
        zoom: 1,
        center: { x: 300, y: 200 },
      }),
      viewportBox: { height: 200, width: 300 },
      viewScale: "actual",
    })

    expect(frame.centeredManualViewport).toBe(true)
    expect(frame.style).toMatchObject({
      "--preview-aspect": "1.5",
      aspectRatio: "600 / 400",
      position: "absolute",
    })
  })

  it("returns manual frame metrics and CSS for an off-center manual viewport", () => {
    const frame = getPreviewPresentationFrame({
      imageHeight: 400,
      imageWidth: 600,
      viewport: viewport({
        mode: "manual",
        zoom: 2,
        center: { x: 200, y: 100 },
      }),
      viewportBox: { height: 200, width: 300 },
      viewScale: "actual",
    })

    expect(frame.centeredManualViewport).toBe(false)
    expect(frame.manualMetrics).toMatchObject({
      displayHeight: 376,
      displayWidth: 564,
      pixelScaleX: 0.94,
      pixelScaleY: 0.94,
    })
    expect(frame.style).toEqual({
      height: "376px",
      left: "50%",
      marginLeft: "-188px",
      marginTop: "-94px",
      position: "absolute",
      top: "50%",
      width: "564px",
    })
  })

  it("pans a manual viewport by pointer movement in image space", () => {
    expect(
      getPreviewPresentationPanCenter({
        imageHeight: 400,
        imageWidth: 600,
        pointerDeltaX: 47,
        pointerDeltaY: -23.5,
        startCenter: { x: 200, y: 100 },
        viewportBox: { height: 200, width: 300 },
        zoom: 2,
      })
    ).toEqual({ x: 150, y: 125 })
  })

  it("anchors wheel zoom around the cursor image point", () => {
    const nextViewport = getPreviewPresentationWheelViewport({
      deltaY: -100,
      imageHeight: 400,
      imageWidth: 600,
      pointer: { x: 190, y: 120 },
      viewport: viewport({
        mode: "manual",
        zoom: 2,
        center: { x: 200, y: 100 },
      }),
      viewportBox: { height: 200, width: 300 },
    })

    expect(nextViewport.mode).toBe("manual")
    expect(nextViewport.zoom).toBeCloseTo(2.378414230005442)
    expect(nextViewport.center.x).toBeCloseTo(206.77036530835255)
    expect(nextViewport.center.y).toBeCloseTo(103.38518265417626)
  })

  it("enters manual wheel zoom in full-output coordinates from a screen-sized fit preview", () => {
    const nextViewport = getPreviewPresentationWheelViewport({
      deltaY: -100,
      imageHeight: 2048,
      imageWidth: 2048,
      pointer: { x: 500, y: 500 },
      viewport: viewport({
        mode: "fit",
        zoom: 1,
        center: { x: 0, y: 0 },
      }),
      viewportBox: { height: 1000, width: 1000 },
    })

    expect(nextViewport.mode).toBe("manual")
    expect(nextViewport.zoom).toBeCloseTo(1.189207115002721)
    expect(nextViewport.center).toEqual({ x: 1024, y: 1024 })
  })

  it("maps image-space slide divider into the visible manual viewport", () => {
    expect(
      getPreviewPresentationViewportDividerPercent({
        dividerPercent: 50,
        imageHeight: 400,
        imageWidth: 600,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 200, y: 100 },
        }),
        viewportBox: { height: 200, width: 300 },
      })
    ).toBeCloseTo(81.3333333333)
  })

  it("maps fit slide divider handles to the display frame inside a letterboxed viewport", () => {
    expect(
      getPreviewPresentationViewportDividerPercent({
        dividerPercent: 2,
        imageHeight: 300,
        imageWidth: 400,
        viewport: viewport({ mode: "fit" }),
        viewportBox: { height: 600, width: 1000 },
      })
    ).toBeCloseTo(12.368)

    expect(
      getPreviewPresentationViewportDividerPercent({
        dividerPercent: 98,
        imageHeight: 300,
        imageWidth: 400,
        viewport: viewport({ mode: "fit" }),
        viewportBox: { height: 600, width: 1000 },
      })
    ).toBeCloseTo(87.632)
  })

  it("clamps the effective slide divider to the visible manual viewport range", () => {
    expect(
      getPreviewPresentationDividerPercent({
        dividerPercent: 90,
        imageHeight: 400,
        imageWidth: 600,
        viewport: viewport({
          mode: "manual",
          zoom: 2,
          center: { x: 200, y: 100 },
        }),
        viewportBox: { height: 200, width: 300 },
      })
    ).toBeCloseTo(58.86524822695035)
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
