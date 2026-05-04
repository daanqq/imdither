import { DEFAULT_SETTINGS, type FrameSequence } from "@workspace/core"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { MotionWorkerResponse } from "@/workers/motion-protocol"

const frameSequence: FrameSequence = {
  frames: [
    {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([0, 0, 0, 255]),
    },
  ],
  durationsMs: [100],
  loopCount: 0,
  sourceWidth: 1,
  sourceHeight: 1,
}

describe("motion worker client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("routes GIF decode and frame processing through the motion worker", async () => {
    const workers: FakeMotionWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeMotionWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runMotionFrameSequenceJob, runMotionGifJob } =
      await import("./motion-worker-client")
    const decoded = vi.fn()
    const frame = vi.fn()

    const decodeJob = runMotionGifJob({
      jobId: 1,
      file: new File(["gif"], "motion.gif", { type: "image/gif" }),
      settings: DEFAULT_SETTINGS,
      onDecoded: decoded,
      onFrame: frame,
    })

    expect(workers[0]?.messages[0]?.type).toBe("process-gif")

    workers[0]?.decoded(1)
    workers[0]?.complete(1)

    await expect(decodeJob).resolves.toBeUndefined()
    expect(decoded).toHaveBeenCalledWith(frameSequence)

    const processJob = runMotionFrameSequenceJob({
      jobId: 2,
      frameSequence,
      settings: DEFAULT_SETTINGS,
      onFrame: frame,
    })

    expect(workers[0]?.messages[1]?.type).toBe("process-sequence")

    workers[0]?.frame(2)
    workers[0]?.complete(2)

    await expect(processJob).resolves.toBeUndefined()
    expect(frame).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ width: 1, height: 1 })
    )
    expect(Object.keys(frame.mock.calls[0][1])).toEqual(["width", "height"])
  })

  it("cancels an active motion job without terminating the worker", async () => {
    const workers: FakeMotionWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeMotionWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runMotionFrameSequenceJob } = await import("./motion-worker-client")
    const controller = new AbortController()
    const job = runMotionFrameSequenceJob({
      jobId: 3,
      frameSequence,
      settings: DEFAULT_SETTINGS,
      signal: controller.signal,
      onFrame: vi.fn(),
    })

    controller.abort()

    await expect(job).rejects.toMatchObject({ name: "AbortError" })
    expect(workers[0]?.terminated).toBe(false)
    expect(workers[0]?.messages.at(-1)).toEqual({
      type: "cancel",
      jobId: 3,
    })
  })
})

class FakeMotionWorker extends EventTarget {
  messages: unknown[] = []
  terminated = false

  postMessage(message: unknown) {
    this.messages.push(message)
  }

  terminate() {
    this.terminated = true
  }

  decoded(jobId: number) {
    this.dispatch({
      type: "decoded",
      jobId,
      frameSequence,
    })
  }

  frame(jobId: number) {
    this.dispatch({
      type: "frame",
      jobId,
      frameIndex: 0,
      image: {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      },
    })
  }

  complete(jobId: number) {
    this.dispatch({
      type: "complete",
      jobId,
    })
  }

  private dispatch(data: MotionWorkerResponse) {
    this.dispatchEvent(new MessageEvent("message", { data }))
  }
}
