import { DEFAULT_SETTINGS, createLookSnapshot } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  applyAutoTuneLookSettings,
  applyAutoTuneRecommendation,
} from "./auto-tune-application"
import type { AutoTuneRecommendation } from "@workspace/core"

function createAdapter() {
  return {
    markApplied: vi.fn(),
    setError: vi.fn(),
    setSourceNotice: vi.fn(),
  }
}

function createRecommendation(
  overrides: Partial<AutoTuneRecommendation> = {}
): AutoTuneRecommendation {
  return {
    id: "vibrant-duo" as AutoTuneRecommendation["id"],
    label: "Vibrant Duo",
    intent: "vibrant look",
    rank: 1,
    recommended: true,
    snapshot: createLookSnapshot({
      settings: {
        ...DEFAULT_SETTINGS,
        algorithm: "floyd-steinberg" as const,
        paletteId: "vibrant-2",
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 960,
          height: 960,
        },
      },
    }),
    ...overrides,
  }
}

describe("applyAutoTuneLookSettings", () => {
  it("preserves the current output dimensions when applying a look", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        height: 720,
        width: 1280,
      },
    }
    const recommended = {
      ...DEFAULT_SETTINGS,
      algorithm: "blue-noise" as const,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        height: 960,
        width: 960,
      },
    }

    expect(
      applyAutoTuneLookSettings({ current, recommended }).resize
    ).toMatchObject({
      height: 720,
      width: 1280,
    })
  })

  it("preserves the current effect stack when applying a look", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      effectStack: [
        {
          instanceId: "pre-1",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.blur", radius: 2 },
        },
        ...DEFAULT_SETTINGS.effectStack,
        {
          instanceId: "post-1",
          kind: "post" as const,
          enabled: true,
          params: { effect: "post.grain", amount: 0.2, seed: 99 },
        },
      ],
    }
    const recommended = {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg" as const,
    }

    const result = applyAutoTuneLookSettings({ current, recommended })

    expect(result.effectStack).toEqual(current.effectStack)
  })
})

describe("applyAutoTuneRecommendation", () => {
  it("merges recommendation settings preserving current output dimensions, applies transition, marks applied, and reports notice", () => {
    const adapter = createAdapter()
    const transitionSettings = vi.fn(() => ({
      settings: DEFAULT_SETTINGS,
    }))
    const current = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1280,
        height: 720,
      },
    }
    const recommendation = createRecommendation()

    applyAutoTuneRecommendation(
      { recommendation, currentSettings: current },
      adapter,
      { transitionSettings }
    )

    expect(transitionSettings).toHaveBeenCalledWith(
      {
        type: "apply-settings",
        settings: expect.objectContaining({
          algorithm: "floyd-steinberg",
          resize: expect.objectContaining({
            width: 1280,
            height: 720,
          }),
        }),
      },
      undefined
    )
    expect(adapter.markApplied).toHaveBeenCalledWith("vibrant-duo")
    expect(adapter.setError).toHaveBeenCalledWith(null)
    expect(adapter.setSourceNotice).toHaveBeenCalledWith(
      "[AUTO-TUNE APPLIED: Vibrant Duo]"
    )
  })

  it("uses injected merge function when provided", () => {
    const adapter = createAdapter()
    const transitionSettings = vi.fn(() => ({
      settings: DEFAULT_SETTINGS,
    }))
    const mergeLookSettings = vi.fn(
      ({
        recommended,
      }: {
        current: typeof DEFAULT_SETTINGS
        recommended: typeof DEFAULT_SETTINGS
      }) => recommended
    )

    applyAutoTuneRecommendation(
      {
        recommendation: createRecommendation(),
        currentSettings: DEFAULT_SETTINGS,
      },
      adapter,
      { transitionSettings, mergeLookSettings }
    )

    expect(mergeLookSettings).toHaveBeenCalledTimes(1)
  })

  it("preserves current effect stack when applying recommendation", () => {
    const adapter = createAdapter()
    const transitionSettings = vi.fn(() => ({
      settings: DEFAULT_SETTINGS,
    }))
    const userPreStage = {
      instanceId: "pre-grain-1",
      kind: "pre" as const,
      enabled: true,
      params: { effect: "pre.blur", radius: 2 },
    }
    const current = {
      ...DEFAULT_SETTINGS,
      resize: { ...DEFAULT_SETTINGS.resize, width: 1280, height: 720 },
      effectStack: [userPreStage, ...DEFAULT_SETTINGS.effectStack],
    }

    applyAutoTuneRecommendation(
      { recommendation: createRecommendation(), currentSettings: current },
      adapter,
      { transitionSettings }
    )

    expect(transitionSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "apply-settings",
        settings: expect.objectContaining({
          effectStack: expect.arrayContaining([
            expect.objectContaining({ instanceId: "pre-grain-1" }),
          ]),
        }),
      }),
      undefined
    )
  })

  it("reports transition source notice in the applied notice", () => {
    const adapter = createAdapter()
    const transitionSettings = vi.fn(() => ({
      settings: DEFAULT_SETTINGS,
      sourceNotice: "[OUTPUT CLAMPED: 4000x3000 / 12MP]",
    }))

    applyAutoTuneRecommendation(
      {
        recommendation: createRecommendation({ label: "Cool Mono" }),
        currentSettings: DEFAULT_SETTINGS,
      },
      adapter,
      { transitionSettings }
    )

    expect(adapter.setSourceNotice).toHaveBeenCalledWith(
      "[AUTO-TUNE APPLIED: Cool Mono] [OUTPUT CLAMPED: 4000x3000 / 12MP]"
    )
  })

  it("reports error when transition throws", () => {
    const adapter = createAdapter()
    const transitionSettings = vi.fn(() => {
      throw new Error("transition failed")
    })

    applyAutoTuneRecommendation(
      {
        recommendation: createRecommendation(),
        currentSettings: DEFAULT_SETTINGS,
      },
      adapter,
      { transitionSettings }
    )

    expect(adapter.setError).toHaveBeenCalledWith("transition failed")
    expect(adapter.markApplied).not.toHaveBeenCalled()
  })
})
