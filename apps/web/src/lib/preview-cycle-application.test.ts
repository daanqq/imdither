import { DEFAULT_SETTINGS, type EditorSettings } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  createPreviewCycleApplication,
  getPreviewTarget,
  type PreviewCycleRuntimeAdapter,
} from "./preview-cycle-application"
import { createProcessingJobs } from "./processing-jobs"
import type { DitherJobResult } from "./worker-client"

const source = {
  id: "source-1",
  name: "test source",
  buffer: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
  autoTuneAnalysisSample: {
    width: 1,
    height: 1,
    data: new Uint8ClampedArray(4),
  },
  originalWidth: 2,
  originalHeight: 2,
}

const instantTimings = {
  queueDelayMs: 1,
  refineDelayMs: 3,
  interactivePixelBudget: 100,
  previewPixelBudget: 400,
}

function createAdapter(): PreviewCycleRuntimeAdapter {
  return {
    replacePreview: vi.fn(),
    replacePreviewRefining: vi.fn(),
    replaceStatus: vi.fn(),
    replaceError: vi.fn(),
    replaceMetadata: vi.fn(),
  }
}

function resizeSettings(width: number, height: number): EditorSettings {
  return {
    ...DEFAULT_SETTINGS,
    resize: { ...DEFAULT_SETTINGS.resize, width, height },
  }
}

function createResult(
  jobId: number,
  settings: EditorSettings
): DitherJobResult {
  return {
    type: "complete",
    jobId,
    image: { width: 1, height: 1, data: new Uint8ClampedArray(4) },
    metadata: {
      sourceWidth: source.buffer.width,
      sourceHeight: source.buffer.height,
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

describe("preview cycle application", () => {
  it("reduced-preview-ready applies preview, metadata, cleared error, ready status, and pending refinement", async () => {
    const adapter = createAdapter()
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })
    const app = createPreviewCycleApplication({
      processingJobs: jobs,
      adapter,
    })
    const settings = resizeSettings(10, 10)

    app.refreshPreview({
      source,
      settings,
      previewViewportMode: "actual",
      displaySize: null,
    })

    await wait(20)

    expect(adapter.replacePreview).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1, height: 1 })
    )
    expect(adapter.replacePreviewRefining).toHaveBeenCalledWith(false)
    expect(adapter.replaceMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ outputWidth: 10, outputHeight: 10 })
    )
    expect(adapter.replaceError).toHaveBeenCalledWith(null)
    expect(adapter.replaceStatus).toHaveBeenCalledWith("ready")
  })

  it("queued and processing status events precede the ready event", async () => {
    const adapter = createAdapter()
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })
    const app = createPreviewCycleApplication({
      processingJobs: jobs,
      adapter,
    })

    app.refreshPreview({
      source,
      settings: resizeSettings(10, 10),
      previewViewportMode: "actual",
      displaySize: null,
    })

    await wait(20)

    const statusCalls = adapter.replaceStatus.mock.calls.map((call) => call[0])

    expect(statusCalls).toContain("queued")
    expect(statusCalls).toContain("processing")
    expect(statusCalls).toContain("ready")
    expect(statusCalls.indexOf("queued")).toBeLessThan(
      statusCalls.indexOf("ready")
    )
  })

  it("refined-preview-ready applies preview, clears refinement, and reports ready", async () => {
    const adapter = createAdapter()
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })
    const app = createPreviewCycleApplication({
      processingJobs: jobs,
      adapter,
    })
    const settings = resizeSettings(20, 20)

    app.refreshPreview({
      source,
      settings,
      previewViewportMode: "actual",
      displaySize: null,
    })

    await wait(20)

    const refinedCalls = adapter.replacePreviewRefining.mock.calls.filter(
      (call) => call[0] === false
    )
    expect(refinedCalls.length).toBeGreaterThanOrEqual(1)
    expect(adapter.replacePreview).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1, height: 1 })
    )
    expect(adapter.replaceMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ outputWidth: 20, outputHeight: 20 })
    )
    expect(adapter.replaceStatus).toHaveBeenCalledWith("ready")
  })

  it("failed event preserves preview, clears refinement, and reports error", async () => {
    const adapter = createAdapter()
    const runJob = vi.fn().mockRejectedValue(new Error("processing failed"))
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })
    const app = createPreviewCycleApplication({
      processingJobs: jobs,
      adapter,
    })

    app.refreshPreview({
      source,
      settings: resizeSettings(10, 10),
      previewViewportMode: "actual",
      displaySize: null,
    })

    await wait(20)

    expect(adapter.replaceError).toHaveBeenCalledWith("processing failed")
    expect(adapter.replaceStatus).toHaveBeenCalledWith("error")
    expect(adapter.replacePreviewRefining).toHaveBeenCalledWith(false)
    expect(adapter.replacePreview).not.toHaveBeenCalled()
  })

  it("reset cancels active preview, clears preview output, and clears refinement", async () => {
    const adapter = createAdapter()
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, params.settings)
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })
    const app = createPreviewCycleApplication({
      processingJobs: jobs,
      adapter,
    })

    app.refreshPreview({
      source,
      settings: resizeSettings(10, 10),
      previewViewportMode: "actual",
      displaySize: null,
    })

    app.reset()

    expect(adapter.replacePreview).toHaveBeenCalledWith(null)
    expect(adapter.replacePreviewRefining).toHaveBeenCalledWith(false)

    await wait(20)
  })

  it("ignores stale events from superseded refreshPreview calls", async () => {
    const adapter = createAdapter()
    const runJob = vi.fn(async (params) =>
      createResult(params.jobId, resizeSettings(10, 10))
    )
    const jobs = createProcessingJobs({ runJob, timings: instantTimings })
    const app = createPreviewCycleApplication({
      processingJobs: jobs,
      adapter,
    })

    app.refreshPreview({
      source,
      settings: resizeSettings(10, 10),
      previewViewportMode: "actual",
      displaySize: null,
    })

    vi.clearAllMocks()

    app.refreshPreview({
      source,
      settings: resizeSettings(20, 20),
      previewViewportMode: "actual",
      displaySize: null,
    })

    await wait(20)

    expect(adapter.replaceStatus).toHaveBeenCalledWith("queued")
    expect(adapter.replaceStatus).toHaveBeenCalledWith("ready")
    expect(adapter.replaceMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ outputWidth: 20, outputHeight: 20 })
    )
  })

  it("calculates screen preview target for fit viewport mode", () => {
    const target = getPreviewTarget({
      displaySize: { height: 300, width: 500 },
      outputHeight: 800,
      outputWidth: 1200,
      viewportMode: "fit",
    })

    expect(target).toEqual({ height: 576, width: 864 })
  })

  it("returns null preview target for actual viewport mode", () => {
    const target = getPreviewTarget({
      displaySize: { height: 300, width: 500 },
      outputHeight: 800,
      outputWidth: 1200,
      viewportMode: "actual",
    })

    expect(target).toBeNull()
  })

  it("returns null preview target when display size is unknown", () => {
    const target = getPreviewTarget({
      displaySize: null,
      outputHeight: 800,
      outputWidth: 1200,
      viewportMode: "fit",
    })

    expect(target).toBeNull()
  })
})
