import { describe, expect, it } from "vitest"

import { getNextPaletteColor } from "./palette-add-color"

describe("palette add color", () => {
  it("chooses a unique fallback color when white already exists", () => {
    expect(getNextPaletteColor(["#ffffff"])).toBe("#000000")
    expect(getNextPaletteColor(["#FFFFFF", "#000000"])).toBe("#ff0000")
  })
})
