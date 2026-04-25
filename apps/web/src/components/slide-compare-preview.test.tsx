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
})
