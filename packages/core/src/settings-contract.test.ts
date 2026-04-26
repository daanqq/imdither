import { describe, expect, it } from "vitest"

import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  safeNormalizeSettings,
} from "./settings"

describe("Editor Settings public contract", () => {
  it("normalizes partial schema version 1 processing settings into schema version 2 and excludes UI preferences", () => {
    const settings = normalizeSettings({
      schemaVersion: 1,
      algorithm: "atkinson",
      compareMode: "slide",
      exportFormat: "jpeg",
      exportQuality: 0.65,
      recipeId: "sea-glass-atkinson",
      resize: {
        width: 320,
      },
      viewScale: "actual",
    })

    expect(settings).toEqual({
      ...DEFAULT_SETTINGS,
      schemaVersion: 2,
      algorithm: "atkinson",
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 320,
      },
    })
    expect(settings).not.toHaveProperty("compareMode")
    expect(settings).not.toHaveProperty("exportFormat")
    expect(settings).not.toHaveProperty("exportQuality")
    expect(settings).not.toHaveProperty("recipeId")
    expect(settings).not.toHaveProperty("viewScale")
  })

  it("preserves schema version 2 color depth and matching settings", () => {
    expect(
      normalizeSettings({
        ...DEFAULT_SETTINGS,
        colorDepth: { mode: "limit", count: 8 },
        matchingMode: "perceptual",
      })
    ).toMatchObject({
      schemaVersion: 2,
      colorDepth: { mode: "limit", count: 8 },
      matchingMode: "perceptual",
    })
  })

  it("rejects unsupported color depth counts and matching modes", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        colorDepth: { mode: "limit", count: 3 },
      })
    ).toBeNull()
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        matchingMode: "cie-lab",
      })
    ).toBeNull()
  })

  it("rejects invalid pasted settings instead of entering an unsupported state", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        algorithm: "unknown",
      })
    ).toBeNull()
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          gamma: 10,
        },
      })
    ).toBeNull()
  })
})
