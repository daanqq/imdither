import { describe, expect, it } from "vitest"

import { buildCompatibilityStack } from "./effect-stack"
import { DEFAULT_SETTINGS } from "./settings"

describe("buildCompatibilityStack", () => {
  it("returns a stack with quantize and dither stages for default settings", () => {
    const stack = buildCompatibilityStack(DEFAULT_SETTINGS)

    expect(stack).toHaveLength(2)

    const quantize = stack[0]
    expect(quantize.kind).toBe("quantize")
    expect(quantize.enabled).toBe(true)
    expect(quantize.instanceId).toMatch(/^qs-[a-z0-9]+$/)
    expect(quantize.params).toEqual({
      paletteId: "gray-4",
      colorDepth: "full",
      matchingMode: "rgb",
    })

    const dither = stack[1]
    expect(dither.kind).toBe("dither")
    expect(dither.enabled).toBe(true)
    expect(dither.instanceId).toMatch(/^ds-[a-z0-9]+$/)
    expect(dither.params).toEqual({
      algorithm: "bayer",
      bayerSize: 8,
    })
  })

  it("reflects custom palette and limited color depth", () => {
    const stack = buildCompatibilityStack({
      ...DEFAULT_SETTINGS,
      paletteId: "custom",
      customPalette: ["#ff0000", "#00ff00"],
      colorDepth: { mode: "limit", count: 4 },
      matchingMode: "perceptual",
      algorithm: "floyd-steinberg",
    })

    expect(stack).toHaveLength(2)
    expect(stack[0].params).toEqual({
      paletteId: "custom",
      colorDepth: "limit:4",
      matchingMode: "perceptual",
    })
    expect(stack[1].params).toEqual({
      algorithm: "floyd-steinberg",
    })
  })

  it("omits bayerSize from dither params when algorithm does not use Bayer", () => {
    const stack = buildCompatibilityStack({
      ...DEFAULT_SETTINGS,
      algorithm: "atkinson",
    })

    expect(stack[1].params).toEqual({ algorithm: "atkinson" })
  })

  it("returns deterministic instance ids for the same settings", () => {
    const first = buildCompatibilityStack(DEFAULT_SETTINGS)
    const second = buildCompatibilityStack(DEFAULT_SETTINGS)

    expect(first[0].instanceId).toBe(second[0].instanceId)
    expect(first[1].instanceId).toBe(second[1].instanceId)
  })
})
