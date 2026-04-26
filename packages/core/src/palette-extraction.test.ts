import { describe, expect, it } from "vitest"

import type { PixelBuffer, Rgb } from "./types"
import { extractPaletteFromSource } from "./palette-extraction"

describe("source palette extraction", () => {
  it("returns deterministic light-to-dark colors from the original Source Image buffer", () => {
    const source = makeBuffer([
      [255, 255, 255],
      [0, 0, 0],
      [255, 0, 0],
      [0, 0, 255],
      [0, 255, 0],
      [255, 255, 0],
      [0, 255, 255],
      [255, 0, 255],
    ])

    expect(extractPaletteFromSource(source, 4)).toEqual([
      "#00ff80",
      "#ff8080",
      "#0000ff",
      "#000000",
    ])
    expect(extractPaletteFromSource(source, 4)).toEqual(
      extractPaletteFromSource(source, 4)
    )
  })

  it("supports the Phase 1 extraction sizes and removes duplicate source colors", () => {
    const colors = Array.from(
      { length: 40 },
      (_, index) =>
        [index * 6, 255 - index * 5, (index * 17) % 256] as const satisfies Rgb
    )
    const source = makeBuffer([[0, 0, 0], [0, 0, 0], ...colors])

    for (const size of [2, 4, 8, 16, 32] as const) {
      expect(extractPaletteFromSource(source, size)).toHaveLength(size)
    }
  })

  it("spreads extracted colors across the source tonal range", () => {
    const colors = Array.from(
      { length: 256 },
      (_, value) => [value, value, value] as const satisfies Rgb
    )

    expect(extractPaletteFromSource(makeBuffer(colors), 8)).toEqual([
      "#f0f0f0",
      "#d0d0d0",
      "#b0b0b0",
      "#909090",
      "#707070",
      "#505050",
      "#303030",
      "#101010",
    ])
  })
})

function makeBuffer(colors: readonly Rgb[]): PixelBuffer {
  const data = new Uint8ClampedArray(colors.length * 4)

  colors.forEach((color, index) => {
    data[index * 4] = color[0]
    data[index * 4 + 1] = color[1]
    data[index * 4 + 2] = color[2]
    data[index * 4 + 3] = 255
  })

  return {
    width: colors.length,
    height: 1,
    data,
  }
}
