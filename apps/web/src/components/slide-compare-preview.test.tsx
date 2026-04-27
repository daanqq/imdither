import { renderToStaticMarkup } from "react-dom/server"
import type { PixelBuffer } from "@workspace/core"
import { describe, expect, it } from "vitest"

import { areSlideComparePreviewPropsEqual } from "./preview-render-boundaries"
import { SlideComparePreview } from "./slide-compare-preview"

function makePixelBuffer(width: number, height: number): PixelBuffer {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    height,
    width,
  }
}

describe("SlideComparePreview", () => {
  it("keeps the original visible and disables the divider while processed output is missing", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={50}
        original={makePixelBuffer(4, 3)}
        processed={null}
        status="processing"
        viewScale="fit"
        onDividerChange={() => {}}
      />
    )

    expect(html).toContain("Original")
    expect(html).toContain("Processed")
    expect(html).toContain("[processing]")
    expect(html).not.toContain('role="slider"')
  })

  it("renders accessible divider controls when processed output is ready", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={37}
        original={makePixelBuffer(4, 3)}
        processed={makePixelBuffer(4, 3)}
        status="processing"
        viewScale="fit"
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
        original={makePixelBuffer(4, 3)}
        processed={makePixelBuffer(4, 3)}
        status="ready"
        viewScale="fit"
        onDividerChange={() => {}}
      />
    )

    expect(html.match(/touch-action:none/g)).toHaveLength(2)
  })

  it("keeps ready slide canvases stable across status-only updates", () => {
    const original = makePixelBuffer(4, 3)
    const processed = makePixelBuffer(4, 3)
    const onDividerChange = () => {}
    const baseProps = {
      dividerPercent: 37,
      original,
      processed,
      status: "ready",
      viewScale: "fit",
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
      displayHeight: 100,
      displayWidth: 120,
      original,
      processed,
      status: "ready",
      viewScale: "fit",
      onDividerChange,
    } as const

    expect(
      areSlideComparePreviewPropsEqual(baseProps, {
        ...baseProps,
        displayWidth: 121,
      })
    ).toBe(false)
  })

  it("keeps missing-processed status updates visible", () => {
    const original = makePixelBuffer(4, 3)
    const onDividerChange = () => {}
    const baseProps = {
      dividerPercent: 37,
      original,
      processed: null,
      status: "queued",
      viewScale: "fit",
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
        displayHeight={3000}
        displayWidth={4000}
        initialViewportBox={{ height: 600, width: 800 }}
        original={makePixelBuffer(4000, 3000)}
        processed={makePixelBuffer(4000, 3000)}
        status="ready"
        viewScale="actual"
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

  it("keeps manual slide controls and split clipped inside the visible viewport", () => {
    const html = renderToStaticMarkup(
      <SlideComparePreview
        dividerPercent={50}
        displayHeight={3000}
        displayWidth={4000}
        initialViewportBox={{ height: 600, width: 800 }}
        original={makePixelBuffer(4000, 3000)}
        processed={makePixelBuffer(4000, 3000)}
        status="ready"
        viewScale="actual"
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
    expect(html).toContain("left:2%")
    expect(html).toContain('aria-valuenow="50"')
  })
})
