import { describe, expect, it } from "vitest"

import { createFrameSequence } from "./baseline-runner"
import { processImage } from "./process"
import { DEFAULT_SETTINGS } from "./settings"

describe("motion workload shape", () => {
  it("createFrameSequence creates valid FrameSequence with requested frame count", () => {
    const seq = createFrameSequence({ width: 32, height: 32, frameCount: 5 })
    expect(seq.frames).toHaveLength(5)
    expect(seq.durationsMs).toHaveLength(5)
    expect(seq.loopCount).toBe(1)
  })

  it("each frame in sequence has unique pixel data", () => {
    const seq = createFrameSequence({ width: 8, height: 8, frameCount: 3 })
    const f0 = seq.frames[0].data[0]
    const f1 = seq.frames[1].data[0]
    const f2 = seq.frames[2].data[0]
    const allSame = f0 === f1 && f1 === f2
    expect(allSame).toBe(false)
  })

  it("processes all frames in a sequence without throwing", () => {
    const seq = createFrameSequence({ width: 16, height: 16, frameCount: 3 })
    for (const frame of seq.frames) {
      const result = processImage(frame, {
        ...DEFAULT_SETTINGS,
        algorithm: "floyd-steinberg",
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 16,
          height: 16,
          fit: "stretch",
        },
      })
      expect(result.image.width).toBe(16)
      expect(result.image.height).toBe(16)
    }
  })

  it("processes frames with temporal-stability setting", () => {
    const seq = createFrameSequence({ width: 16, height: 16, frameCount: 3 })
    const results: number[] = []
    for (const frame of seq.frames) {
      const result = processImage(frame, {
        ...DEFAULT_SETTINGS,
        algorithm: "none",
        paletteId: "gray-4",
        temporalStability: "global-palette",
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 16,
          height: 16,
          fit: "stretch",
        },
      })
      results.push(result.image.data[0])
    }
    expect(results).toHaveLength(3)
  })

  it("measures sequential frame processing as synthetic motion workload", () => {
    const seq = createFrameSequence({ width: 240, height: 160, frameCount: 3 })
    const start = Date.now()
    for (const frame of seq.frames) {
      processImage(frame, {
        ...DEFAULT_SETTINGS,
        algorithm: "floyd-steinberg",
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 240,
          height: 160,
          fit: "stretch",
        },
      })
    }
    const totalMs = Date.now() - start
    expect(totalMs).toBeGreaterThan(0)
  })
})
