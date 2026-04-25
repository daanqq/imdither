import { DEFAULT_SETTINGS, clampOutputSize } from "@workspace/core"
import { describe, expect, it } from "vitest"

import { applySettingsTransition } from "./editor-settings-transition"

describe("Editor Settings transitions", () => {
  it("changes output width with the current Source Image aspect ratio and reports Output Cap clamping", () => {
    const result = applySettingsTransition(
      DEFAULT_SETTINGS,
      { type: "set-output-width", width: 4096 },
      { sourceDimensions: { width: 4096, height: 3072 } }
    )

    expect(result.settings.resize).toMatchObject({
      width: 4000,
      height: 3000,
    })
    expect(result.sourceNotice).toBe("[OUTPUT CLAMPED: 4000x3000 / 12MP]")
  })

  it("applies a selected palette's default color mode while manual color mode keeps the palette", () => {
    const paletteResult = applySettingsTransition(DEFAULT_SETTINGS, {
      type: "set-palette",
      paletteId: "sea-glass",
    })

    expect(paletteResult.settings.paletteId).toBe("sea-glass")
    expect(paletteResult.settings.preprocess.colorMode).toBe("color-preserve")

    const manualResult = applySettingsTransition(paletteResult.settings, {
      type: "set-color-mode",
      colorMode: "grayscale-first",
    })

    expect(manualResult.settings.paletteId).toBe("sea-glass")
    expect(manualResult.settings.preprocess.colorMode).toBe("grayscale-first")
  })

  it("applies normalized Settings JSON through current Source Image aspect rules", () => {
    const pastedSettings = {
      ...DEFAULT_SETTINGS,
      algorithm: "atkinson" as const,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1200,
        height: 1200,
      },
    }

    const result = applySettingsTransition(
      DEFAULT_SETTINGS,
      { type: "apply-settings", settings: pastedSettings },
      { sourceDimensions: { width: 2000, height: 1000 } }
    )

    expect(result.settings.algorithm).toBe("atkinson")
    expect(result.settings.resize).toMatchObject({
      width: 1200,
      height: 600,
    })
  })

  it("resets to defaults with the current Source Image aspect ratio", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      algorithm: "atkinson" as const,
      paletteId: "sea-glass",
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        brightness: 40,
        colorMode: "color-preserve" as const,
      },
    }

    const result = applySettingsTransition(
      current,
      { type: "reset-defaults" },
      { sourceDimensions: { width: 1600, height: 1200 } }
    )

    expect(result.settings.algorithm).toBe(DEFAULT_SETTINGS.algorithm)
    expect(result.settings.paletteId).toBe(DEFAULT_SETTINGS.paletteId)
    expect(result.settings.preprocess).toEqual(DEFAULT_SETTINGS.preprocess)
    expect(result.settings.resize).toMatchObject({
      width: DEFAULT_SETTINGS.resize.width,
      height: 720,
    })
  })

  it("keeps unrelated settings unchanged for targeted transitions", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1024,
        height: 768,
      },
      preprocess: {
        ...DEFAULT_SETTINGS.preprocess,
        brightness: 10,
      },
    }

    const brightnessResult = applySettingsTransition(current, {
      type: "set-preprocess",
      patch: { brightness: -20 },
    })
    expect(brightnessResult.settings.preprocess).toEqual({
      ...current.preprocess,
      brightness: -20,
    })
    expect(brightnessResult.settings.resize).toEqual(current.resize)

    const algorithmResult = applySettingsTransition(current, {
      type: "set-algorithm",
      algorithm: "floyd-steinberg",
    })
    expect(algorithmResult.settings).toEqual({
      ...current,
      algorithm: "floyd-steinberg",
    })

    const alphaResult = applySettingsTransition(current, {
      type: "set-alpha-background",
      alphaBackground: "black",
    })
    expect(alphaResult.settings).toEqual({
      ...current,
      alphaBackground: "black",
    })

    const bayerResult = applySettingsTransition(current, {
      type: "set-bayer-size",
      bayerSize: 8,
    })
    expect(bayerResult.settings).toEqual({
      ...current,
      bayerSize: 8,
    })

    const resizeModeResult = applySettingsTransition(current, {
      type: "set-resize-mode",
      mode: "nearest",
    })
    expect(resizeModeResult.settings.resize).toEqual({
      ...current.resize,
      mode: "nearest",
    })
  })

  it("applies requested Output Size through Output Cap policy", () => {
    const expectedSize = clampOutputSize(4096, 4096)
    const result = applySettingsTransition(DEFAULT_SETTINGS, {
      type: "set-output-size",
      width: 4096,
      height: 4096,
    })

    expect(result.settings.resize).toMatchObject({
      width: expectedSize.width,
      height: expectedSize.height,
    })
    expect(result.sourceNotice).toBe(
      `[OUTPUT CLAMPED: ${expectedSize.width}x${expectedSize.height} / 12MP]`
    )
  })
})
