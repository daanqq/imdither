import { describe, expect, it } from "vitest"

import { getScreenPreviewTarget } from "./screen-preview"

describe("screen preview sizing", () => {
  it("uses a 2x CSS pixel target for Fit preview without device-pixel scaling", () => {
    expect(
      getScreenPreviewTarget({
        displayHeight: 300,
        displayWidth: 500,
        fitInset: 0,
        outputHeight: 800,
        outputWidth: 1200,
        viewScale: "fit",
      })
    ).toEqual({ height: 600, width: 900 })
  })

  it("matches the inset used by the rendered Fit frame before doubling", () => {
    expect(
      getScreenPreviewTarget({
        displayHeight: 300,
        displayWidth: 500,
        outputHeight: 800,
        outputWidth: 1200,
        viewScale: "fit",
      })
    ).toEqual({ height: 576, width: 864 })
  })

  it("clamps Fit preview to final output dimensions", () => {
    expect(
      getScreenPreviewTarget({
        displayHeight: 900,
        displayWidth: 900,
        outputHeight: 300,
        outputWidth: 400,
        viewScale: "fit",
      })
    ).toEqual({ height: 300, width: 400 })
  })

  it("does not override preview work in 1:1 mode", () => {
    expect(
      getScreenPreviewTarget({
        displayHeight: 300,
        displayWidth: 500,
        outputHeight: 800,
        outputWidth: 1200,
        viewScale: "actual",
      })
    ).toBeNull()
  })
})
