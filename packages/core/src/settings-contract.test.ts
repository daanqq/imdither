import { describe, expect, it } from "vitest"

import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  safeNormalizeSettings,
} from "./settings"

describe("Editor Settings public contract", () => {
  it("normalizes partial schema version 1 processing settings into schema version 3 and excludes UI preferences", () => {
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

    expect(settings.schemaVersion).toBe(5)
    expect(settings.algorithm).toBe("atkinson")
    expect(settings.resize.width).toBe(320)
    expect(settings).not.toHaveProperty("compareMode")
    expect(settings).not.toHaveProperty("exportFormat")
    expect(settings).not.toHaveProperty("exportQuality")
    expect(settings).not.toHaveProperty("recipeId")
    expect(settings).not.toHaveProperty("viewScale")
    expect(settings.effectStack).toHaveLength(2)
    expect(settings.effectStack[0].kind).toBe("quantize")
    expect(settings.effectStack[1].kind).toBe("dither")
  })

  it("normalizes schema version 2 settings into schema version 5 with compatibility stack", () => {
    const settings = normalizeSettings({
      algorithm: "atkinson",
      schemaVersion: 2,
    })

    expect(settings.schemaVersion).toBe(5)
    expect(settings.effectStack).toHaveLength(2)
  })

  it("rebuilds compatibility stack from current settings even when v3 effectStack is provided", () => {
    const settings = normalizeSettings({
      algorithm: "floyd-steinberg",
      paletteId: "gray-4",
      schemaVersion: 3,
      effectStack: [
        {
          instanceId: "qs-legacy",
          kind: "quantize" as const,
          enabled: false,
          params: { paletteId: "unknown" },
        },
      ],
    })

    expect(settings.schemaVersion).toBe(5)
    expect(settings.effectStack).toHaveLength(2)
    expect(settings.effectStack[0].kind).toBe("quantize")
    expect(settings.effectStack[0].params.matchingMode).toBe("rgb")
    expect(settings.effectStack[1].kind).toBe("dither")
    expect(settings.effectStack[1].params.algorithm).toBe("floyd-steinberg")
  })

  it("builds compatibility stack from v4 settings without explicit effectStack", () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      schemaVersion: 5,
    })

    expect(settings.schemaVersion).toBe(5)
    expect(settings.effectStack).toHaveLength(2)
  })

  it("preserves color depth and matching settings in schema v5", () => {
    const settings = normalizeSettings({
      algorithm: "bayer",
      bayerSize: 8,
      paletteId: "gray-4",
      colorDepth: { mode: "limit", count: 8 },
      matchingMode: "perceptual",
    })

    expect(settings.schemaVersion).toBe(5)
    expect(settings.colorDepth).toEqual({ mode: "limit", count: 8 })
    expect(settings.matchingMode).toBe("perceptual")
    expect(
      settings.effectStack.find((s) => s.kind === "quantize")?.params
        .matchingMode
    ).toBe("perceptual")
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

  it("rejects invalid effect stack with unknown stage kinds", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          { instanceId: "x", kind: "unknown", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("rejects effect stack with duplicate instance ids", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          { instanceId: "dup", kind: "quantize", enabled: true, params: {} },
          { instanceId: "dup", kind: "dither", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("rejects effect stack with group order violation", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          { instanceId: "ds-1", kind: "dither", enabled: true, params: {} },
          { instanceId: "qs-1", kind: "quantize", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("rejects pre stage with post effect id", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          {
            instanceId: "es-1",
            kind: "pre",
            enabled: true,
            params: { effect: "post.grain" },
          },
          { instanceId: "qs-1", kind: "quantize", enabled: true, params: {} },
          { instanceId: "ds-1", kind: "dither", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("rejects stage with unknown effect id", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          {
            instanceId: "es-1",
            kind: "pre",
            enabled: true,
            params: { effect: "pre.unknown" },
          },
          { instanceId: "qs-1", kind: "quantize", enabled: true, params: {} },
          { instanceId: "ds-1", kind: "dither", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("rejects pre stage with missing effect param", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          {
            instanceId: "es-1",
            kind: "pre",
            enabled: true,
            params: {},
          },
          { instanceId: "qs-1", kind: "quantize", enabled: true, params: {} },
          { instanceId: "ds-1", kind: "dither", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("rejects effect stage with out-of-range numeric param", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          {
            instanceId: "es-1",
            kind: "pre",
            enabled: true,
            params: { effect: "pre.blur", radius: 999 },
          },
          { instanceId: "qs-1", kind: "quantize", enabled: true, params: {} },
          { instanceId: "ds-1", kind: "dither", enabled: true, params: {} },
        ],
      })
    ).toBeNull()
  })

  it("round-trips Settings JSON preserving effectStack", () => {
    const first = normalizeSettings({
      algorithm: "floyd-steinberg",
      paletteId: "gray-4",
      colorDepth: { mode: "limit", count: 4 },
    })
    const second = normalizeSettings(first)

    expect(second.effectStack).toEqual(first.effectStack)
  })

  it("rejects effect stack stage params that are not plain values", () => {
    expect(
      safeNormalizeSettings({
        ...DEFAULT_SETTINGS,
        schemaVersion: 3,
        effectStack: [
          {
            instanceId: "qs-1",
            kind: "quantize",
            enabled: true,
            params: { paletteId: ["#ff0000"] },
          },
          {
            instanceId: "ds-1",
            kind: "dither",
            enabled: true,
            params: { algorithm: "bayer" },
          },
        ],
      })
    ).toBeNull()
  })
})
