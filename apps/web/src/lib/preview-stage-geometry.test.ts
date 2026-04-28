import { describe, expect, it } from "vitest"

import { getPreviewStageFrameDimensions } from "./preview-stage-geometry"

describe("preview stage geometry", () => {
  it("keeps mobile fit preview reduced while manual gestures use full output dimensions", () => {
    expect(
      getPreviewStageFrameDimensions({
        isDesktopViewScale: false,
        outputHeight: 3000,
        outputWidth: 4000,
        previewTargetHeight: 450,
        previewTargetWidth: 600,
        realPixelsMode: false,
      })
    ).toEqual({
      controlsFrameHeight: 3000,
      controlsFrameWidth: 4000,
      manualFrameHeight: 3000,
      manualFrameWidth: 4000,
      previewFrameHeight: 450,
      previewFrameWidth: 600,
    })
  })
})
