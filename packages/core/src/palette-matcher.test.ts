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

  it("keeps ties resolved by palette order", () => {
    const tiePalette: Palette = {
      ...palette,
      colors: [
        { name: "First", hex: "#7f0000", rgb: [127, 0, 0] },
        { name: "Second", hex: "#800000", rgb: [128, 0, 0] },
      ],
    }

    expect(
      createPaletteMatcher(tiePalette, "rgb").nearest([127.5, 0, 0])
    ).toEqual([127, 0, 0])
  })

  it("does not cache fractional or out-of-range RGB inputs", () => {
    const edgePalette: Palette = {
      ...palette,
      colors: [
        { name: "Black", hex: "#000000", rgb: [0, 0, 0] },
        { name: "Red", hex: "#ff0000", rgb: [255, 0, 0] },
      ],
    }
    const matcher = createPaletteMatcher(edgePalette, "rgb")

    expect(matcher.nearest([255, 0, 0])).toEqual([255, 0, 0])
    expect(matcher.nearest([256, 0, 0])).toEqual([255, 0, 0])
    expect(matcher.nearest([-1, 0, 0])).toEqual([0, 0, 0])
  })

  it("checks the full RGB key after a cache collision", () => {
    const collisionPalette: Palette = {
      ...palette,
      colors: [
        { name: "Black", hex: "#000000", rgb: [0, 0, 0] },
        { name: "Blue", hex: "#001055", rgb: [0, 16, 85] },
      ],
    }
    const matcher = createPaletteMatcher(collisionPalette, "rgb")

    expect(matcher.nearest([0, 0, 0])).toEqual([0, 0, 0])
    expect(matcher.nearest([0, 16, 85])).toEqual([0, 16, 85])
    expect(matcher.nearest([0, 0, 0])).toEqual([0, 0, 0])
  })

  it("isolates caches between palettes and matching modes", () => {
    const otherPalette: Palette = {
      ...palette,
      colors: [
        { name: "Black", hex: "#000000", rgb: [0, 0, 0] },
        { name: "White", hex: "#ffffff", rgb: [255, 255, 255] },
      ],
    }

    const rgbMatcher = createPaletteMatcher(otherPalette, "rgb")
    const perceptualMatcher = createPaletteMatcher(palette, "perceptual")

    expect(rgbMatcher.nearest([0, 5, 0])).toEqual([0, 0, 0])
    expect(perceptualMatcher.nearest([0, 5, 0])).toEqual([0, 0, 255])
  })
})
