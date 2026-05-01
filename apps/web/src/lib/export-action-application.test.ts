import type { EditorSettings } from "@workspace/core"

import { describe, expect, it, vi } from "vitest"

import {
  applyExportAction,
  type ExportActionRuntimeAdapter,
} from "./export-action-application"
import type { LoadedSource } from "./source-intake"
import type { DitherJobResult } from "./worker-client"

describe("applyExportAction", () => {
  function createAdapter(overrides: Partial<ExportActionRuntimeAdapter> = {}) {
    return {
      setStatus: vi.fn(),
      setError: vi.fn(),
      setMetadata: vi.fn(),
      downloadBlob: vi.fn(),
      ...overrides,
    } satisfies ExportActionRuntimeAdapter
  }

  function createSource(): LoadedSource {
    return {
      id: "src-1",
      name: "photo.png",
      buffer: { width: 800, height: 600, data: new Uint8ClampedArray(0) },
      autoTuneAnalysisSample: {
        width: 800,
        height: 600,
        data: new Uint8ClampedArray(0),
      },
      originalWidth: 800,
      originalHeight: 600,
    }
  }

  function createResult(): DitherJobResult {
    return {
      type: "complete",
      jobId: 42,
      image: { width: 800, height: 600, data: new Uint8ClampedArray(0) },
      metadata: {
        sourceWidth: 800,
        sourceHeight: 600,
        outputWidth: 800,
        outputHeight: 600,
        paletteSize: 8,
        algorithmName: "atkinson",
        processingTimeMs: 100,
        exportFormat: "PNG",
      },
    }
  }

  it("does nothing when there is no source image", async () => {
    const adapter = createAdapter()

    await applyExportAction(
      {
        source: null,
        settings: {} as EditorSettings,
        format: "png",
        quality: 0.9,
      },
      adapter,
      { runExportJob: vi.fn(), encodePixelBuffer: vi.fn() }
    )

    expect(adapter.setStatus).not.toHaveBeenCalled()
    expect(adapter.setError).not.toHaveBeenCalled()
    expect(adapter.setMetadata).not.toHaveBeenCalled()
    expect(adapter.downloadBlob).not.toHaveBeenCalled()
  })

  it("exports successfully: sets export status, runs job, encodes, downloads, updates metadata, and finishes ready", async () => {
    const adapter = createAdapter()
    const callOrder: string[] = []
    const spySetStatus = vi.fn((status: string) => {
      callOrder.push(`status:${status}`)
    })
    const spyAdapter = {
      ...adapter,
      setStatus: spySetStatus,
      setMetadata: vi.fn(() => {
        callOrder.push("metadata")
      }),
      downloadBlob: vi.fn(() => {
        callOrder.push("download")
      }),
    }
    const source = createSource()
    const result = createResult()
    const runExportJob = vi.fn(async () => {
      callOrder.push("job")
      return result
    })
    const blob = new Blob(["pixels"], { type: "image/png" })
    const encodePixelBuffer = vi.fn(async () => {
      callOrder.push("encode")
      return blob
    })

    await applyExportAction(
      {
        source,
        settings: { alphaBackground: "white" } as EditorSettings,
        format: "png",
        quality: 0.9,
      },
      spyAdapter,
      { runExportJob, encodePixelBuffer }
    )

    expect(runExportJob).toHaveBeenCalledWith({
      sourceKey: source.id,
      image: source.buffer,
      settings: { alphaBackground: "white" } as EditorSettings,
    })
    expect(encodePixelBuffer).toHaveBeenCalledWith(result.image, {
      alphaBackground: "white",
      format: "png",
      quality: 0.9,
    })
    expect(spyAdapter.downloadBlob).toHaveBeenCalledWith(
      blob,
      "imdither-photo.png"
    )
    expect(spyAdapter.setMetadata).toHaveBeenCalledWith({
      ...result.metadata,
      exportFormat: "PNG",
    })
    expect(spyAdapter.setError).toHaveBeenCalledWith(null)
    expect(callOrder).toEqual([
      "status:exporting",
      "job",
      "encode",
      "download",
      "metadata",
      "status:ready",
    ])
  })

  it("handles export job failure: sets exporting, reports error, sets status to error, skips encoder and download", async () => {
    const adapter = createAdapter()
    const callOrder: string[] = []
    const spySetStatus = vi.fn((status: string) => {
      callOrder.push(`status:${status}`)
    })
    const spyAdapter = { ...adapter, setStatus: spySetStatus }
    const runExportJob = vi.fn(async () => {
      throw new Error("dither worker crashed")
    })
    const encodePixelBuffer = vi.fn()

    await applyExportAction(
      {
        source: createSource(),
        settings: {} as EditorSettings,
        format: "webp",
        quality: 0.8,
      },
      spyAdapter,
      { runExportJob, encodePixelBuffer }
    )

    expect(callOrder).toEqual(["status:exporting", "status:error"])
    expect(spyAdapter.setError).toHaveBeenCalledWith("dither worker crashed")
    expect(encodePixelBuffer).not.toHaveBeenCalled()
    expect(spyAdapter.downloadBlob).not.toHaveBeenCalled()
    expect(spyAdapter.setMetadata).not.toHaveBeenCalled()
  })

  it("handles browser encoder failure: sets exporting, runs job, reports error, sets status to error, skips download", async () => {
    const adapter = createAdapter()
    const callOrder: string[] = []
    const spySetStatus = vi.fn((status: string) => {
      callOrder.push(`status:${status}`)
    })
    const spyAdapter = { ...adapter, setStatus: spySetStatus }
    const result = createResult()
    const runExportJob = vi.fn(async () => result)
    const encodePixelBuffer = vi.fn(async () => {
      throw new Error("PNG export failed")
    })

    await applyExportAction(
      {
        source: createSource(),
        settings: {} as EditorSettings,
        format: "png",
        quality: 0.9,
      },
      spyAdapter,
      { runExportJob, encodePixelBuffer }
    )

    expect(callOrder).toEqual(["status:exporting", "status:error"])
    expect(runExportJob).toHaveBeenCalledTimes(1)
    expect(spyAdapter.setError).toHaveBeenCalledWith("PNG export failed")
    expect(spyAdapter.downloadBlob).not.toHaveBeenCalled()
    expect(spyAdapter.setMetadata).not.toHaveBeenCalled()
  })

  it("uses fallback error message when a non-Error value is thrown", async () => {
    const adapter = createAdapter()
    const runExportJob = vi.fn(async () => {
      throw "something went wrong" as unknown
    })
    const encodePixelBuffer = vi.fn()

    await applyExportAction(
      {
        source: createSource(),
        settings: {} as EditorSettings,
        format: "jpeg",
        quality: 0.7,
      },
      adapter,
      { runExportJob, encodePixelBuffer }
    )

    expect(adapter.setError).toHaveBeenCalledWith("Export failed")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
  })
})
