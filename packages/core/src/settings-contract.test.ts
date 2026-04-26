import { describe, expect, it } from "vitest"

import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  safeNormalizeSettings,
} from "./settings"

describe("Editor Settings public contract", () => {
  it("normalizes partial schema version 1 processing settings and excludes UI preferences", () => {
    const settings = normalizeSettings({
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
