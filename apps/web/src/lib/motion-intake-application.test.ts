import { DEFAULT_SETTINGS, type FrameSequence } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  MotionIntakeApplication,
  type MotionIntakeRuntimeAdapter,
} from "./motion-intake-application"

describe("MotionIntakeApplication", () => {
  it("applies accepted GIF/APNG-like intake through the runtime adapter", async () => {
    const adapter = createAdapter()
    const app = new MotionIntakeApplication()
    const frameSequence = createFrameSequence()

    await app.execute(
      { kind: "gif", file: createFile("clip.gif") },
      adapter,
      DEFAULT_SETTINGS,
      {
        runAnimatedJob: async ({ onDecoded, onFrame }) => {
          onDecoded(frameSequence)
          onFrame(1, frameSequence.frames[1])
        },
        decodeVideo: vi.fn(),
      }
    )

    expect(adapter.setSource).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "clip.gif",
        buffer: frameSequence.frames[0],
        originalWidth: 2,
        originalHeight: 1,
      })
    )
    expect(adapter.applyMotionSource).toHaveBeenCalledWith(
      frameSequence,
      "clip.gif"
    )
    expect(adapter.applyOutputSizeWithoutHistory).toHaveBeenCalledWith(2, 1)
    expect(adapter.resetPreviewViewport).toHaveBeenCalled()
    expect(adapter.setProcessedFrame).toHaveBeenCalledWith(
      1,
      frameSequence.frames[1]
    )
    expect(adapter.setStatus).toHaveBeenLastCalledWith("ready")
  })

  it("applies accepted video intake without a worker decode step", async () => {
    const adapter = createAdapter()
    const app = new MotionIntakeApplication()
    const frameSequence = createFrameSequence()
    const decodeVideo = vi.fn(async () => frameSequence)

    await app.execute(
      { kind: "video", file: createFile("clip.webm") },
      adapter,
      DEFAULT_SETTINGS,
      { runAnimatedJob: vi.fn(), decodeVideo }
    )

    expect(decodeVideo).toHaveBeenCalledWith(createFile("clip.webm"))
    expect(adapter.applyMotionSource).toHaveBeenCalledWith(
      frameSequence,
      "clip.webm"
    )
    expect(adapter.setSource).toHaveBeenCalledWith(
      expect.objectContaining({
        autoTuneAnalysisSample: expect.objectContaining({
          width: 2,
          height: 1,
        }),
      })
    )
    expect(adapter.setMotionExportSettings).toHaveBeenCalledWith({
      frameDurationMs: 120,
      loopCount: 2,
    })
  })

  it("ignores stale intake results after a newer command starts", async () => {
    const adapter = createAdapter()
    const app = new MotionIntakeApplication()
    const staleSequence = createFrameSequence(10)
    const currentSequence = createFrameSequence(20)
    let releaseStale!: () => void

    const stale = app.execute(
      { kind: "gif", file: createFile("stale.gif") },
      adapter,
      DEFAULT_SETTINGS,
      {
        runAnimatedJob: async ({ onDecoded }) => {
          await new Promise<void>((resolve) => {
            releaseStale = resolve
          })
          onDecoded(staleSequence)
        },
        decodeVideo: vi.fn(),
      }
    )

    await app.execute(
      { kind: "video", file: createFile("current.webm") },
      adapter,
      DEFAULT_SETTINGS,
      {
        runAnimatedJob: vi.fn(),
        decodeVideo: async () => currentSequence,
      }
    )

    releaseStale()
    await stale

    expect(adapter.applyMotionSource).toHaveBeenCalledTimes(1)
    expect(adapter.applyMotionSource).toHaveBeenCalledWith(
      currentSequence,
      "current.webm"
    )
    expect(adapter.setError).not.toHaveBeenCalledWith("stale failure")
  })
})

function createAdapter(): MotionIntakeRuntimeAdapter {
  return {
    applyMotionSource: vi.fn(),
    applyOutputSizeWithoutHistory: vi.fn(),
    resetPreviewViewport: vi.fn(),
    setError: vi.fn(),
    setMotionExportSettings: vi.fn(),
    setProcessedFrame: vi.fn(),
    setSource: vi.fn(),
    setStatus: vi.fn(),
  }
}

function createFrameSequence(seed = 0): FrameSequence {
  return {
    frames: [createBuffer(seed), createBuffer(seed + 1)],
    durationsMs: [120, 80],
    loopCount: 2,
    sourceWidth: 2,
    sourceHeight: 1,
  }
}

function createBuffer(seed: number) {
  return {
    width: 2,
    height: 1,
    data: new Uint8ClampedArray([seed, 0, 0, 255, seed + 1, 0, 0, 255]),
  }
}

function createFile(name: string) {
  return new File(["motion"], name)
}
