import { describe, expect, it } from "vitest"

import { DITHER_ALGORITHM_OPTIONS, DEFAULT_SETTINGS, PRESET_PALETTES } from "."
import {
  PROCESSING_PRESET_OPTIONS,
  findProcessingPreset,
  getProcessingPreset,
  matchProcessingPreset,
} from "./processing-presets"

describe("Processing Presets", () => {
  it("exposes curated v1 recipes that reference supported palettes and algorithms", () => {
    expect(PROCESSING_PRESET_OPTIONS.map((preset) => preset.id)).toEqual([
      "fine-mono-bayer",
      "mono-bayer",
      "sea-glass-atkinson",
      "redline-floyd",
      "poster-blocks",
      "blue-ink-noise",
      "halftone-mono",
      "game-boy-sierra",
    ])

    const paletteIds = new Set(PRESET_PALETTES.map((palette) => palette.id))
    const algorithmIds = new Set(
      DITHER_ALGORITHM_OPTIONS.map((algorithm) => algorithm.id)
    )

    for (const preset of PROCESSING_PRESET_OPTIONS) {
      expect(preset.label).not.toHaveLength(0)
      expect(paletteIds.has(preset.recipe.paletteId)).toBe(true)
      expect(algorithmIds.has(preset.recipe.algorithm)).toBe(true)
    }
  })

  it("looks up recipes by id and rejects unknown ids", () => {
    expect(getProcessingPreset("mono-bayer").label).toBe("Mono Bayer")
    expect(findProcessingPreset("missing")).toBeNull()
    expect(() => getProcessingPreset("missing")).toThrow(
      "Unknown processing preset: missing"
    )
  })

  it("matches settings from recipe-controlled fields while ignoring irrelevant Bayer size", () => {
    expect(
      matchProcessingPreset({
        ...DEFAULT_SETTINGS,
        paletteId: "black-white",
        algorithm: "bayer",
        bayerSize: 4,
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          colorMode: "grayscale-first",
        },
      })?.id
    ).toBe("mono-bayer")

    expect(
      matchProcessingPreset({
        ...DEFAULT_SETTINGS,
        paletteId: "sea-glass",
        algorithm: "atkinson",
        bayerSize: 8,
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          colorMode: "color-preserve",
        },
      })?.id
    ).toBe("sea-glass-atkinson")
  })

  it("returns null when settings no longer match a recipe or use a custom palette", () => {
    const monoBayerSettings = {
      ...DEFAULT_SETTINGS,
      paletteId: "black-white",
      algorithm: "bayer" as const,
      bayerSize: 4 as const,
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        colorMode: "grayscale-first" as const,
      },
    }

    expect(
      matchProcessingPreset({ ...monoBayerSettings, paletteId: "gray-4" })
    ).toBeNull()
    expect(
      matchProcessingPreset({
        ...monoBayerSettings,
        algorithm: "floyd-steinberg",
      })
    ).toBeNull()
    expect(
      matchProcessingPreset({ ...monoBayerSettings, bayerSize: 8 })
    ).toBeNull()
    expect(
      matchProcessingPreset({
        ...monoBayerSettings,
        preprocess: {
          ...monoBayerSettings.preprocess,
          colorMode: "color-preserve",
        },
      })
    ).toBeNull()
    expect(
      matchProcessingPreset({
        ...monoBayerSettings,
        customPalette: ["#000000", "#ffffff"],
      })
    ).toBeNull()
  })

  it("keeps recipe matching deterministic with unique signatures", () => {
    const ids = new Set(PROCESSING_PRESET_OPTIONS.map((preset) => preset.id))
    expect(ids.size).toBe(PROCESSING_PRESET_OPTIONS.length)

    const signatures = new Set(
      PROCESSING_PRESET_OPTIONS.map((preset) => {
        const bayerPart =
          preset.recipe.algorithm === "bayer"
            ? `:${preset.recipe.bayerSize ?? "missing"}`
            : ""

        return [
          preset.recipe.paletteId,
          preset.recipe.algorithm,
          preset.recipe.colorMode,
          bayerPart,
        ].join(":")
      })
    )

    expect(signatures.size).toBe(PROCESSING_PRESET_OPTIONS.length)
  })
})
