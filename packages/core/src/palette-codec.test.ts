import { describe, expect, it } from "vitest"

import { DEFAULT_SETTINGS } from "./settings"
import {
  exportPaletteGpl,
  exportPaletteJson,
  normalizePaletteColors,
  parsePaletteText,
} from "./palette-codec"

describe("palette codec", () => {
  it("normalizes hex colors with shorthand expansion, lowercase output, and duplicate removal", () => {
    expect(normalizePaletteColors(["fff", "#0A0B0C", "#ffffff"])).toEqual([
      "#ffffff",
      "#0a0b0c",
    ])
  })

  it("rejects invalid, alpha, undersized, and oversized palettes clearly", () => {
    expect(() => normalizePaletteColors(["#000", "#ffff"])).toThrow(
      "Alpha palette colors are not supported"
    )
    expect(() => normalizePaletteColors(["#000000", "tomato"])).toThrow(
      "Unsupported palette color"
    )
    expect(() => normalizePaletteColors(["#000000", "#000000"])).toThrow(
      "at least 2 unique colors"
    )
    expect(() =>
      normalizePaletteColors(
        Array.from(
          { length: 257 },
          (_, index) => `#${index.toString(16).padStart(6, "0")}`
        )
      )
    ).toThrow("no more than 256 colors")
  })

  it("parses plain HEX text without treating #ffffff as a comment", () => {
    expect(
      parsePaletteText(`
        # comment
        #ffffff, 000000
        # another comment
        0a0b0c
      `).colors
    ).toEqual(["#ffffff", "#000000", "#0a0b0c"])
  })

  it("imports JSON palette payloads, hex arrays, and Settings JSON custom palettes", () => {
    expect(
      parsePaletteText(
        JSON.stringify({ format: "imdither-palette", colors: ["#fff", "#000"] })
      ).colors
    ).toEqual(["#ffffff", "#000000"])

    expect(parsePaletteText(JSON.stringify(["#123", "#456"])).colors).toEqual([
      "#112233",
      "#445566",
    ])

    expect(
      parsePaletteText(
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          paletteId: "custom",
          customPalette: ["#abc", "#def"],
        })
      ).colors
    ).toEqual(["#aabbcc", "#ddeeff"])
  })

  it("imports and exports GPL palettes", () => {
    const parsed = parsePaletteText(`
      GIMP Palette
      Name: Sample
      Columns: 2
      # note
      255 255 255 White
      0 0 0 Black
    `)

    expect(parsed.colors).toEqual(["#ffffff", "#000000"])
    expect(exportPaletteGpl(parsed.colors, "Sample")).toContain("GIMP Palette")
    expect(exportPaletteGpl(parsed.colors, "Sample")).toContain(
      "255 255 255\t#ffffff"
    )
  })

  it("exports a small IMDITHER palette JSON payload", () => {
    expect(JSON.parse(exportPaletteJson(["#ffffff", "#000000"]))).toEqual({
      format: "imdither-palette",
      version: 1,
      colors: ["#ffffff", "#000000"],
    })
  })
})
