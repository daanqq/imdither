import { DEFAULT_SETTINGS, type EditorSettings } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import { createProcessingJobs, type PreviewJobEvent } from "./processing-jobs"
import type { DitherJobResult } from "./worker-client"

const source = {
  sourceKey: "source-1",
  image: {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray(16),
  },
}

const instantTimings = {
  queueDelayMs: 1,
  refineDelayMs: 3,
  interactivePixelBudget: 100,
  previewPixelBudget: 400,
}

describe("processing jobs", () => {
  it("emits preview lifecycle events and corrects preview metadata to full output size", async () => {
    const settings = resizeSettings(10, 10)
    const events: PreviewJobEvent[] = []
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })

    jobs.startPreviewJob({
      ...source,
      settings,
      onEvent: (event) => events.push(event),
    })

    await wait(20)

    expect(events.map((event) => event.type)).toEqual([
      "queued",
      "processing",
      "reduced-preview-ready",
    ])
    expect(runJob).toHaveBeenCalledTimes(1)
    expect(events[2]).toMatchObject({
      type: "reduced-preview-ready",
      willRefine: false,
      result: {
        metadata: {
          outputWidth: 10,
          outputHeight: 10,
        },
      },
    })
  })

  it("emits refined Preview Job output after the first Reduced Preview", async () => {
    const settings = resizeSettings(20, 20)
    const events: PreviewJobEvent[] = []
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })

    jobs.startPreviewJob({
      ...source,
      settings,
      onEvent: (event) => events.push(event),
    })

    await wait(20)

    expect(events.map((event) => event.type)).toEqual([
      "queued",
      "processing",
      "reduced-preview-ready",
      "refined-preview-ready",
    ])
    expect(runJob).toHaveBeenCalledTimes(2)
    expect(runJob.mock.calls[0]?.[0].settings.resize).toMatchObject({
      width: 10,
      height: 10,
    })
    expect(runJob.mock.calls[1]?.[0].settings.resize).toMatchObject({
      width: 20,
      height: 20,
    })
    expect(events[2]).toMatchObject({ willRefine: true })
    expect(events[3]).toMatchObject({
      result: {
        metadata: {
          outputWidth: 20,
          outputHeight: 20,
        },
      },
    })
  })

  it("cancels stale Preview Jobs before their worker call starts", async () => {
    const firstEvents: PreviewJobEvent[] = []
    const secondEvents: PreviewJobEvent[] = []
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })

    jobs.startPreviewJob({
      ...source,
      settings: resizeSettings(20, 20),
      onEvent: (event) => firstEvents.push(event),
    })
    jobs.startPreviewJob({
      ...source,
      settings: resizeSettings(10, 10),
      onEvent: (event) => secondEvents.push(event),
    })

    await wait(20)

    expect(firstEvents.map((event) => event.type)).toEqual(["queued"])
    expect(secondEvents.map((event) => event.type)).toEqual([
      "queued",
      "processing",
      "reduced-preview-ready",
    ])
    expect(runJob).toHaveBeenCalledTimes(1)
    expect(runJob.mock.calls[0]?.[0].settings.resize).toMatchObject({
      width: 10,
      height: 10,
    })
  })

  it("cancels Preview Job and runs Export Job at Full Output size", async () => {
    const events: PreviewJobEvent[] = []
    const exportSettings = resizeSettings(2_000, 1_000)
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })

    jobs.startPreviewJob({
      ...source,
      settings: exportSettings,
      onEvent: (event) => events.push(event),
    })
    const result = await jobs.runExportJob({
      ...source,
      settings: exportSettings,
    })
    await wait(20)

    expect(events.map((event) => event.type)).toEqual(["queued"])
    expect(runJob).toHaveBeenCalledTimes(1)
    expect(runJob.mock.calls[0]?.[0]).toMatchObject({
      settings: {
        resize: {
          width: 2_000,
          height: 1_000,
        },
      },
    })
    expect(runJob.mock.calls[0]?.[0].signal).toBeUndefined()
    expect(result.metadata.outputWidth).toBe(2_000)
    expect(result.metadata.outputHeight).toBe(1_000)
  })
})

function resizeSettings(width: number, height: number): EditorSettings {
  return {
    ...DEFAULT_SETTINGS,
    resize: {
      ...DEFAULT_SETTINGS.resize,
      width,
      height,
    },
  }
}

function createResult(
  jobId: number,
  settings: EditorSettings
): DitherJobResult {
  return {
    type: "complete",
    jobId,
    image: {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    },
    metadata: {
      sourceWidth: source.image.width,
      sourceHeight: source.image.height,
      outputWidth: settings.resize.width,
      outputHeight: settings.resize.height,
      paletteSize: 2,
      algorithmName: "Bayer 4x4",
      processingTimeMs: 1,
      exportFormat: "PNG",
    },
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
