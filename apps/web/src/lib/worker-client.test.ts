import { DEFAULT_SETTINGS } from "@workspace/core"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ProcessWorkerResponse } from "@/workers/protocol"

const source = {
  sourceKey: "source",
  image: {
    width: 1,
    height: 1,
    data: new Uint8ClampedArray([0, 0, 0, 255]),
  },
}

describe("worker client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("keeps the worker source cache when active Preview Jobs are aborted", async () => {
    const workers: FakeDitherWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeDitherWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runDitherJob } = await import("./worker-client")
    const controller = new AbortController()
    const staleJob = runDitherJob({
      ...source,
      jobId: 1,
      settings: DEFAULT_SETTINGS,
      signal: controller.signal,
    })

    controller.abort()

    const nextJob = runDitherJob({
      ...source,
      jobId: 2,
      settings: DEFAULT_SETTINGS,
      signal: new AbortController().signal,
    })

    await expect(staleJob).rejects.toMatchObject({ name: "AbortError" })
    expect(workers).toHaveLength(1)
    expect(workers[0]?.terminated).toBe(false)

    workers[0]?.complete(1)
    workers[0]?.complete(2)

    await expect(nextJob).resolves.toMatchObject({
      type: "complete",
      jobId: 2,
    })
    const result = await nextJob

    expect(result.image.data).toBeInstanceOf(Uint8ClampedArray)
    expect(Object.keys(result.image)).toEqual(["width", "height"])
    expect(workers[0]?.messages).toHaveLength(2)
    expect(workers[0]?.messages[0]?.image).toBeDefined()
    expect(workers[0]?.messages[1]?.image).toBeUndefined()
  })
})

class FakeDitherWorker extends EventTarget {
  messages: Array<{ image?: unknown }> = []
  terminated = false

  postMessage(message: { image?: unknown }) {
    this.messages.push(message)
  }

  terminate() {
    this.terminated = true
  }

  complete(jobId: number) {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "complete",
          jobId,
          image: {
            width: 1,
            height: 1,
            data: new Uint8ClampedArray([0, 0, 0, 255]),
          },
          metadata: {
            sourceWidth: 1,
            sourceHeight: 1,
            outputWidth: 1,
            outputHeight: 1,
            paletteSize: 2,
            algorithmName: "Bayer 4x4",
            processingTimeMs: 1,
            exportFormat: "PNG",
          },
        } satisfies ProcessWorkerResponse,
      })
    )
  }
}
