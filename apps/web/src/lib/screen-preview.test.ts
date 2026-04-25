import { describe, expect, it } from "vitest"

import { getScreenPreviewTarget } from "./screen-preview"

describe("screen preview sizing", () => {
  it("uses measured CSS pixels for Fit preview without device-pixel scaling", () => {
    expect(
      getScreenPreviewTarget({
        displayHeight: 300,
        displayWidth: 500,
        fitInset: 0,
        outputHeight: 800,
        outputWidth: 1200,
        viewScale: "fit",
      })
    ).toEqual({ height: 300, width: 450 })
  })

  it("matches the inset used by the rendered Fit frame", () => {
    expect(
      getScreenPreviewTarget({
        displayHeight: 300,
        displayWidth: 500,
        outputHeight: 800,
        outputWidth: 1200,
        viewScale: "fit",
      })
    ).toEqual({ height: 288, width: 432 })
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
