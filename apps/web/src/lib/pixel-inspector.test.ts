import type { PixelBuffer } from "@workspace/core"
import { describe, expect, it } from "vitest"

import { getPixelInspectorSample, samplePixelHex } from "./pixel-inspector"

describe("pixel inspector sampling", () => {
  it("samples valid coordinates as uppercase hex colors", () => {
    expect(samplePixelHex(makeBuffer(2, 1), { x: 1, y: 0 })).toBe("#102030")
  })

  it("returns null for out-of-bounds coordinates", () => {
    expect(samplePixelHex(makeBuffer(2, 1), { x: 2, y: 0 })).toBeNull()
    expect(samplePixelHex(makeBuffer(2, 1), { x: 0, y: -1 })).toBeNull()
  })

  it("reports original and processed values independently", () => {
    expect(
      getPixelInspectorSample({
        coordinates: { x: 0, y: 0 },
        original: makeBuffer(1, 1, [9, 8, 7, 255]),
        processed: null,
      })
    ).toEqual({
      x: 0,
      y: 0,
      originalHex: "#090807",
      processedHex: null,
    })
  })
})

function makeBuffer(
  width: number,
  height: number,
  rgba = [0, 0, 0, 255, 16, 32, 48, 255]
): PixelBuffer {
  return {
    data: new Uint8ClampedArray(rgba),
    height,
    width,
  }
}
