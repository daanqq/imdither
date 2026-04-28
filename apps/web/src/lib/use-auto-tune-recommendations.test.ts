import { describe, expect, it } from "vitest"

import { isAutoTuneGenerationReady } from "./use-auto-tune-recommendations"

describe("Auto-Tune recommendation readiness", () => {
  const source = {
    id: "source",
    buffer: {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([0, 0, 0, 255]),
    },
    autoTuneAnalysisSample: {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([0, 0, 0, 255]),
    },
  }

  it("waits until preview work has produced a visible output", () => {
    expect(
      isAutoTuneGenerationReady({
        enabled: false,
        source,
        sourceId: source.id,
      })
    ).toBe(false)

    expect(
      isAutoTuneGenerationReady({
        enabled: true,
        source,
        sourceId: source.id,
      })
    ).toBe(true)
  })

  it("does not generate recommendations without a Source Image", () => {
    expect(
      isAutoTuneGenerationReady({
        enabled: true,
        source: null,
        sourceId: null,
      })
    ).toBe(false)
  })
})
