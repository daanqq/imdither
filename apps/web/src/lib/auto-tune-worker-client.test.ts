import { DEFAULT_SETTINGS, type AutoTuneRecommendation } from "@workspace/core"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AutoTuneWorkerResponse } from "@/workers/auto-tune-protocol"

const analysisSample = {
  width: 1,
  height: 1,
  data: new Uint8ClampedArray([0, 0, 0, 255]),
}

const recommendation = {
  id: "clean-reduction",
  label: "Clean Reduction",
  intent: "Simplify the source into a compact palette.",
  rank: 1,
  recommended: true,
  snapshot: {
    format: "imdither-look",
    version: 1,
    kind: "look-snapshot",
    createdAt: "2026-04-26T00:00:00.000Z",
    name: "Clean Reduction",
    settings: DEFAULT_SETTINGS,
  },
} satisfies AutoTuneRecommendation

describe("Auto-Tune worker client", () => {
  afterEach(async () => {
    const { resetAutoTuneWorkerClient } =
      await import("./auto-tune-worker-client")

    resetAutoTuneWorkerClient()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("runs recommendations through a dedicated worker with a bounded sample", async () => {
    const workers: FakeAutoTuneWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeAutoTuneWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runAutoTuneJob } = await import("./auto-tune-worker-client")
    const job = runAutoTuneJob({
      jobId: 1,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 320, height: 240 },
    })

    expect(workers).toHaveLength(1)
    expect(workers[0]?.messages[0]).toMatchObject({
      type: "recommend",
      jobId: 1,
      sourceId: "source",
      analysisSample: {
        width: 1,
        height: 1,
      },
    })
    expect(workers[0]?.messages[0]?.sourceImage).toBeUndefined()

    workers[0]?.complete(1, "source")

    await expect(job).resolves.toEqual([recommendation])
  })

  it("reuses the persistent worker and its sample cache for later jobs", async () => {
    const workers: FakeAutoTuneWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeAutoTuneWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runAutoTuneJob } = await import("./auto-tune-worker-client")

    const first = runAutoTuneJob({
      jobId: 1,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 320, height: 240 },
    })

    workers[0]?.complete(1, "source")
    await first

    const second = runAutoTuneJob({
      jobId: 2,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 160, height: 120 },
    })

    expect(workers).toHaveLength(1)
    expect(workers[0]?.messages).toHaveLength(2)
    expect(workers[0]?.messages[1]?.analysisSample).toBeUndefined()

    workers[0]?.complete(2, "source")

    await expect(second).resolves.toEqual([recommendation])
  })

  it("retries once with the sample when the worker cache is missing", async () => {
    const workers: FakeAutoTuneWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeAutoTuneWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runAutoTuneJob } = await import("./auto-tune-worker-client")

    const first = runAutoTuneJob({
      jobId: 1,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 320, height: 240 },
    })

    workers[0]?.complete(1, "source")
    await first

    const second = runAutoTuneJob({
      jobId: 2,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 160, height: 120 },
    })

    expect(workers[0]?.messages[1]?.analysisSample).toBeUndefined()

    workers[0]?.missingSample(2, "source")

    expect(workers[0]?.messages[2]?.analysisSample).toBeDefined()

    workers[0]?.complete(2, "source")

    await expect(second).resolves.toEqual([recommendation])
  })

  it("surfaces worker scoring errors without falling back", async () => {
    const workers: FakeAutoTuneWorker[] = []

    vi.stubGlobal(
      "Worker",
      class FakeWorker extends FakeAutoTuneWorker {
        constructor() {
          super()
          workers.push(this)
        }
      }
    )

    const { runAutoTuneJob } = await import("./auto-tune-worker-client")
    const job = runAutoTuneJob({
      jobId: 1,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 320, height: 240 },
    })

    workers[0]?.fail(1, "source", "Auto-Tune scoring failed")

    await expect(job).rejects.toThrow("Auto-Tune scoring failed")
  })

  it("falls back on the main thread when workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined)

    const { runAutoTuneJob } = await import("./auto-tune-worker-client")
    const recommendations = await runAutoTuneJob({
      jobId: 1,
      sourceId: "source",
      analysisSample,
      settings: DEFAULT_SETTINGS,
      outputDimensions: { width: 1, height: 1 },
    })

    expect(recommendations.length).toBeGreaterThanOrEqual(3)
    expect(
      recommendations.filter(
        (nextRecommendation) => nextRecommendation.recommended
      )
    ).toHaveLength(1)
  })
})

class FakeAutoTuneWorker extends EventTarget {
  messages: Array<{
    analysisSample?: unknown
    sourceImage?: unknown
  }> = []
  terminated = false

  postMessage(message: { analysisSample?: unknown; sourceImage?: unknown }) {
    this.messages.push(message)
  }

  terminate() {
    this.terminated = true
  }

  complete(jobId: number, sourceId: string) {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "complete",
          jobId,
          sourceId,
          recommendations: [recommendation],
        } satisfies AutoTuneWorkerResponse,
      })
    )
  }

  missingSample(jobId: number, sourceId: string) {
    this.fail(
      jobId,
      sourceId,
      "Auto-Tune analysis sample is not loaded in worker"
    )
  }

  fail(jobId: number, sourceId: string, message: string) {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "error",
          jobId,
          sourceId,
          message,
        } satisfies AutoTuneWorkerResponse,
      })
    )
  }
}
