import { describe, expect, it } from "vitest"

import { applyEffectStages, EFFECT_DEFINITIONS } from "./effect-registry"
import type { EffectStage } from "./effect-stack"
import type { PixelBuffer } from "./types"

function makeBuffer(
  width: number,
  height: number,
  fill: [number, number, number] = [128, 128, 128]
): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0]
    data[i + 1] = fill[1]
    data[i + 2] = fill[2]
    data[i + 3] = 255
  }

  return { width, height, data }
}

function buffersEqual(a: PixelBuffer, b: PixelBuffer): boolean {
  if (a.width !== b.width || a.height !== b.height) {
    return false
  }

  for (let i = 0; i < a.data.length; i += 1) {
    if (a.data[i] !== b.data[i]) {
      return false
    }
  }

  return true
}

describe("effect registry", () => {
  it("has definitions for all six first effects", () => {
    const ids = EFFECT_DEFINITIONS.map((d) => d.id)

    expect(ids).toContain("pre.blur")
    expect(ids).toContain("pre.contrast-shape")
    expect(ids).toContain("post.grain")
    expect(ids).toContain("post.edge-threshold")
    expect(ids).toContain("post.paper-noise")
    expect(ids).toContain("post.crt-bloom")
  })

  it("returns input unchanged when effect stack is empty", () => {
    const input = makeBuffer(4, 4)
    const result = applyEffectStages(input, [])

    expect(buffersEqual(result, input)).toBe(true)
  })

  it("returns input unchanged when all stages are disabled", () => {
    const input = makeBuffer(4, 4)
    const disabledStages: EffectStage[] = [
      {
        instanceId: "x",
        kind: "pre",
        enabled: false,
        params: { effect: "blur", radius: 2 },
      },
    ]

    const result = applyEffectStages(input, disabledStages)

    expect(buffersEqual(result, input)).toBe(true)
  })

  it("skips stages with unknown effect ids", () => {
    const input = makeBuffer(4, 4)
    const stages: EffectStage[] = [
      {
        instanceId: "x",
        kind: "pre",
        enabled: true,
        params: { effect: "unknown-effect", foo: "bar" },
      },
    ]

    const result = applyEffectStages(input, stages)

    expect(buffersEqual(result, input)).toBe(true)
  })

  it("applies enabled pre blur stage", () => {
    const input = makeBuffer(8, 8, [255, 0, 0])

    // Fill center pixel with different color
    input.data[input.data.length / 2] = 0

    const stages: EffectStage[] = [
      {
        instanceId: "blur-1",
        kind: "pre",
        enabled: true,
        params: { effect: "pre.blur", radius: 1.5 },
      },
    ]

    const result = applyEffectStages(input, stages)

    expect(buffersEqual(result, input)).toBe(false)
  })

  it("applies enabled post grain stage", () => {
    const input = makeBuffer(8, 8)
    const stages: EffectStage[] = [
      {
        instanceId: "grain-1",
        kind: "post",
        enabled: true,
        params: { effect: "post.grain", amount: 0.12, seed: 42 },
      },
    ]

    const result = applyEffectStages(input, stages)

    expect(buffersEqual(result, input)).toBe(false)
  })

  it("produces deterministic output for seeded noise effects", () => {
    const input = makeBuffer(8, 8)
    const stages: EffectStage[] = [
      {
        instanceId: "grain-1",
        kind: "post",
        enabled: true,
        params: { effect: "post.grain", amount: 0.5, seed: 42 },
      },
    ]

    const first = applyEffectStages(input, stages)
    const second = applyEffectStages(input, stages)

    expect(buffersEqual(first, second)).toBe(true)
  })
})
