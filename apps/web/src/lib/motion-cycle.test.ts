import { DEFAULT_SETTINGS, type FrameSequence } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import { MotionCycle, type MotionCycleRuntimeAdapter } from "./motion-cycle"

describe("MotionCycle", () => {
  it("clears processed frames and applies incoming worker frames", async () => {
    const adapter = createAdapter()
    const cycle = new MotionCycle()
    const frameSequence = createFrameSequence()

    await cycle.start(frameSequence, DEFAULT_SETTINGS, adapter, {
      runFrameSequenceJob: async ({ onFrame }) => {
        onFrame(0, frameSequence.frames[0])
        onFrame(1, frameSequence.frames[1])
      },
    })

    expect(adapter.setStatus).toHaveBeenCalledWith("processing")
    expect(adapter.clearProcessedFrames).toHaveBeenCalled()
    expect(adapter.setProcessedFrame).toHaveBeenCalledWith(
      0,
      frameSequence.frames[0]
    )
    expect(adapter.setProcessedFrame).toHaveBeenCalledWith(
      1,
      frameSequence.frames[1]
    )
    expect(adapter.setStatus).toHaveBeenLastCalledWith("ready")
  })

  it("cancels stale worker updates when settings start a fresh cycle", async () => {
    const adapter = createAdapter()
    const cycle = new MotionCycle()
    const staleSequence = createFrameSequence(10)
    const currentSequence = createFrameSequence(20)
    let releaseStale!: () => void

    const stale = cycle.start(staleSequence, DEFAULT_SETTINGS, adapter, {
      runFrameSequenceJob: async ({ onFrame }) => {
        await new Promise<void>((resolve) => {
          releaseStale = resolve
        })
        onFrame(0, staleSequence.frames[0])
      },
    })

    await cycle.start(currentSequence, DEFAULT_SETTINGS, adapter, {
      runFrameSequenceJob: async ({ onFrame }) => {
        onFrame(0, currentSequence.frames[0])
      },
    })

    releaseStale()
    await stale

    expect(adapter.setProcessedFrame).toHaveBeenCalledTimes(1)
    expect(adapter.setProcessedFrame).toHaveBeenCalledWith(
      0,
      currentSequence.frames[0]
    )
  })

  it("maps worker failure to existing motion failure status and copy", async () => {
    const adapter = createAdapter()
    const cycle = new MotionCycle()

    await cycle.start(createFrameSequence(), DEFAULT_SETTINGS, adapter, {
      runFrameSequenceJob: async () => {
        throw new Error("worker failed")
      },
    })

    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
    expect(adapter.setError).toHaveBeenCalledWith("worker failed")
  })
})

function createAdapter(): MotionCycleRuntimeAdapter {
  return {
    clearProcessedFrames: vi.fn(),
    setError: vi.fn(),
    setProcessedFrame: vi.fn(),
    setStatus: vi.fn(),
  }
}

function createFrameSequence(seed = 0): FrameSequence {
  return {
    frames: [createBuffer(seed), createBuffer(seed + 1)],
    durationsMs: [100, 200],
    loopCount: 0,
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
