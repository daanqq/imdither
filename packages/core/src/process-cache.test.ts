import { afterEach, describe, expect, it, vi } from "vitest"

import { createStageCache } from "./cache"
import * as effects from "./effect-registry"
import { processImage } from "./process"
import { normalizeSettings } from "./settings"
import type { EditorSettings, PixelBuffer } from "./types"

const input: PixelBuffer = {
  width: 8,
  height: 8,
  data: Uint8ClampedArray.from({ length: 256 }, (_, i) => (i * 31) % 256),
}
const settings = normalizeSettings({
  algorithm: "none",
  resize: { width: 8, height: 8 },
  effectStack: [
    {
      instanceId: "blur",
      kind: "pre",
      enabled: true,
      params: { effect: "pre.blur", radius: 2 },
    },
  ],
})

afterEach(() => vi.restoreAllMocks())

describe("palette-independent preparation cache", () => {
  it("reuses pre-effects and preprocessing when only the palette changes", () => {
    const cache = createStageCache(16)
    const applyEffects = vi.spyOn(effects, "applyEffectStages")
    const set = vi.spyOn(cache, "set")
    processImage(input, settings, { cache })
    applyEffects.mockClear()
    set.mockClear()

    const next = { ...settings, paletteId: "pico-8" }
    const cached = processImage(input, next, { cache })

    expect(applyEffects).toHaveBeenCalledTimes(1)
    expect(applyEffects.mock.calls[0][1]).toEqual([])
    expect(set).not.toHaveBeenCalled()
    expect(cached.image).toEqual(processImage(input, next).image)
  })

  it("does not invalidate preparation when only post-effects change", () => {
    const cache = createStageCache(16)
    processImage(input, settings, { cache })
    const set = vi.spyOn(cache, "set")
    const next = normalizeSettings({
      ...settings,
      effectStack: [
        ...settings.effectStack,
        {
          instanceId: "grain",
          kind: "post",
          enabled: true,
          params: { effect: "post.grain", amount: 0.5, seed: 42 },
        },
      ],
    })
    const cached = processImage(input, next, { cache })

    expect(set).not.toHaveBeenCalled()
    expect(cached.image).toEqual(processImage(input, next).image)
  })

  it.each([
    ["background", { alphaBackground: "black" }],
    ["resize", { resize: { ...settings.resize, width: 4 } }],
    ["preprocess", { preprocess: { ...settings.preprocess, contrast: 40 } }],
    ["pre-effects", { effectStack: [] }],
  ] satisfies [string, Partial<EditorSettings>][])(
    "invalidates affected preparation after changing %s",
    (_, patch) => {
      const cache = createStageCache(16)
      processImage(input, settings, { cache })
      const set = vi.spyOn(cache, "set")
      const next = { ...settings, ...patch }
      const cached = processImage(input, next, { cache })

      expect(set).toHaveBeenCalled()
      expect(cached.image).toEqual(processImage(input, next).image)
    }
  )

  it("does not reuse preparation from another source", () => {
    const cache = createStageCache(16)
    processImage(input, settings, { cache, sourceKey: "first" })
    const next = { ...input, data: new Uint8ClampedArray(256).fill(255) }

    expect(
      processImage(next, settings, { cache, sourceKey: "second" }).image
    ).toEqual(processImage(next, settings).image)
  })
})
