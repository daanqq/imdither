import { describe, expect, it } from "vitest"

import { createPaletteMatcher } from "./palette-matcher"
import type { Palette } from "./types"

describe("palette matcher", () => {
  const palette: Palette = {
    id: "primary",
    name: "Primary",
    defaultColorMode: "color-preserve",
    colors: [
      { name: "Red", hex: "#ff0000", rgb: [255, 0, 0] },
      { name: "Green", hex: "#00ff00", rgb: [0, 255, 0] },
      { name: "Blue", hex: "#0000ff", rgb: [0, 0, 255] },
    ],
  }

  it("keeps RGB matching as encoded-channel distance", () => {
    const matcher = createPaletteMatcher(palette, "rgb")

    expect(matcher.nearest([0, 5, 0])).toEqual([0, 255, 0])
  })

  it("supports perceptual matching with Oklab distance", () => {
    const matcher = createPaletteMatcher(palette, "perceptual")

    expect(matcher.nearest([0, 5, 0])).toEqual([0, 0, 255])
  })
})
