import { renderToStaticMarkup } from "react-dom/server"
import type { PixelBuffer } from "@workspace/core"
import { describe, expect, it } from "vitest"

import { areSlideComparePreviewPropsEqual } from "./preview-render-boundaries"
import { SlideComparePreview } from "./slide-compare-preview"
import type { PreviewSurfaceDisplayModel } from "@/lib/preview-presentation"

function makePixelBuffer(width: number, height: number): PixelBuffer {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    height,
    width,
  }
}

function fitDisplayModel(
  overrides?: Partial<{ frameWidth: number; frameHeight: number }>
): PreviewSurfaceDisplayModel {
  return {
    frameHeight: overrides?.frameHeight ?? 3,
    frameWidth: overrides?.frameWidth ?? 4,
    manualFrameHeight: overrides?.frameHeight ?? 3,
    manualFrameWidth: overrides?.frameWidth ?? 4,
    viewScale: "fit" as const,
  }
}

function actualDisplayModel(
  frameWidth: number,
  frameHeight: number
): PreviewSurfaceDisplayModel {
  return {
    frameHeight,
    frameWidth,
    manualFrameHeight: frameHeight,
    manualFrameWidth: frameWidth,
    viewScale: "actual" as const,
  }
}

describe("SlideComparePreview", () => {
  it("keeps the placeholder visible and disables the divider while processed output is missing", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={50}
        displayModel={fitDisplayModel()}
        original={makePixelBuffer(4, 3)}
        processed={null}
        status="processing"
        onDividerChange={() => {}}
      />
    )

    expect(html).toContain("[processing]")
    expect(html).not.toContain('role="slider"')
  })

  it("renders accessible divider controls when processed output is ready", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={37}
        displayModel={fitDisplayModel()}
        original={makePixelBuffer(4, 3)}
        processed={makePixelBuffer(4, 3)}
        status="processing"
        onDividerChange={() => {}}
      />
    )

    expect(html).toContain('role="slider"')
    expect(html).toContain('aria-label="Slide comparison divider"')
    expect(html).toContain('aria-valuenow="37"')
    expect(html).toContain('aria-valuemin="2"')
    expect(html).toContain('aria-valuemax="98"')
    expect(html).not.toContain("[processing]")
  })

  it("keeps mobile drag gestures reserved for slide comparison", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={37}
        displayModel={fitDisplayModel()}
        original={makePixelBuffer(4, 3)}
        processed={makePixelBuffer(4, 3)}
        status="ready"
        onDividerChange={() => {}}
      />
    )

    expect(html.match(/touch-action:none/g)).toHaveLength(2)
  })

  it("keeps ready slide canvases stable across status-only updates", () => {
    const original = makePixelBuffer(4, 3)
    const processed = makePixelBuffer(4, 3)
    const onDividerChange = () => {}
    const baseDisplayModel = fitDisplayModel()
    const baseProps = {
      dividerPercent: 37,
      displayModel: baseDisplayModel,
      original,
      processed,
      status: "ready",
      onDividerChange,
    } as const

    expect(
      areSlideComparePreviewPropsEqual(baseProps, {
        ...baseProps,
        status: "processing",
      })
    ).toBe(true)

    expect(
      areSlideComparePreviewPropsEqual(baseProps, {
        ...baseProps,
        processed: makePixelBuffer(4, 3),
      })
    ).toBe(false)
  })

  it("redraws ready slide canvases when their shared display dimensions change", () => {
    const original = makePixelBuffer(4, 3)
    const processed = makePixelBuffer(2, 2)
    const onDividerChange = () => {}
    const baseProps = {
      dividerPercent: 37,
      displayModel: fitDisplayModel({ frameWidth: 120, frameHeight: 100 }),
      original,
      processed,
      status: "ready",
      onDividerChange,
    } as const

    expect(
      areSlideComparePreviewPropsEqual(baseProps, {
        ...baseProps,
        displayModel: fitDisplayModel({ frameWidth: 121, frameHeight: 100 }),
      })
    ).toBe(false)
  })

  it("keeps missing-processed status updates visible", () => {
    const original = makePixelBuffer(4, 3)
    const onDividerChange = () => {}
    const baseProps = {
      dividerPercent: 37,
      displayModel: fitDisplayModel(),
      original,
      processed: null,
      status: "queued",
      onDividerChange,
    } as const

    expect(
      areSlideComparePreviewPropsEqual(baseProps, {
        ...baseProps,
        status: "processing",
      })
    ).toBe(false)
  })

  it("uses the initial viewport box for non-default real-pixels slide frames", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={37}
        displayModel={actualDisplayModel(4000, 3000)}
        initialViewportBox={{ height: 600, width: 800 }}
        original={makePixelBuffer(4000, 3000)}
        processed={makePixelBuffer(4000, 3000)}
        status="ready"
        previewViewport={{
          mode: "manual",
          zoom: 3,
          center: { x: 1200, y: 900 },
          gridEnabled: false,
          loupeEnabled: false,
        }}
        onDividerChange={() => {}}
      />
    )

    expect(html).toContain("height:1764px")
    expect(html).toContain("width:2352px")
    expect(html).toContain("margin-left:-706px")
    expect(html).toContain("margin-top:-529px")
    expect(html).not.toContain("visibility:hidden")
  })

  it("keeps manual slide controls aligned with the clipped split", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={50}
        displayModel={actualDisplayModel(4000, 3000)}
        initialViewportBox={{ height: 600, width: 800 }}
        original={makePixelBuffer(4000, 3000)}
        processed={makePixelBuffer(4000, 3000)}
        status="ready"
        previewViewport={{
          mode: "manual",
          zoom: 3,
          center: { x: 3990, y: 1500 },
          gridEnabled: false,
          loupeEnabled: false,
        }}
        onDividerChange={() => {}}
      />
    )

    expect(html).toContain("clip-path:inset(0 0 0 83.4234693877551%)")
    expect(html).toContain("left:83.4234693877551%")
    expect(html).toContain('aria-valuenow="50"')
  })

  it("keeps fit slide handles aligned to the display frame, not the preview window", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={2}
        displayModel={fitDisplayModel({ frameWidth: 400, frameHeight: 300 })}
        initialViewportBox={{ height: 600, width: 1000 }}
        original={makePixelBuffer(400, 300)}
        processed={makePixelBuffer(400, 300)}
        status="ready"
        previewViewport={{
          mode: "fit",
          zoom: 1,
          center: { x: 200, y: 150 },
          gridEnabled: false,
          loupeEnabled: false,
        }}
        onDividerChange={() => {}}
      />
    )

    expect(html).toContain("clip-path:inset(0 0 0 2%)")
    expect(html).toContain("left:12.368000000000002%")
    expect(html).toContain('aria-valuenow="2"')
  })
})
