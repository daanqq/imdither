import {
  clampOutputSize,
  DEFAULT_SETTINGS,
  type FrameSequence,
} from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  SourceReplacementApplication,
  type SourceReplacementRuntimeAdapter,
  type SourceReplacementDependencies,
} from "./source-replacement-application"
import type { LoadedSource } from "./source-intake"

describe("SourceReplacementApplication", () => {
  it("executes a demo command through Source Intake behavior", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const acceptedSource = sourceWithSize(4096, 4096)
    const outputSize = clampOutputSize(4096, 4096)

    await app.execute(
      { kind: "demo" },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        createDemoSourceIntake: async () => ({
          type: "accepted",
          source: acceptedSource,
          outputSize,
          notices: [{ kind: "demo-loaded", message: "[DEMO SOURCE LOADED]" }],
        }),
      })
    )

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setSource).toHaveBeenCalledWith(acceptedSource)
    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.resetPreviewViewport).toHaveBeenCalledTimes(1)
    expect(adapter.setError).toHaveBeenCalledWith(null)
    expect(adapter.setSourceNotice).toHaveBeenCalledWith("[DEMO SOURCE LOADED]")
  })

  it("executes a still file command through Source Intake behavior", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const acceptedSource = sourceWithSize(1920, 1080)
    const outputSize = clampOutputSize(1920, 1080)
    const file = new File(["pixels"], "photo.jpg", { type: "image/jpeg" })

    await app.execute(
      { kind: "file", file },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        intakeImageFile: async () => ({
          type: "accepted",
          source: acceptedSource,
          outputSize,
          notices: [],
        }),
      })
    )

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setSource).toHaveBeenCalledWith(acceptedSource)
    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.resetPreviewViewport).toHaveBeenCalledTimes(1)
    expect(adapter.setError).toHaveBeenCalledWith(null)
    expect(adapter.applyOutputSizeWithoutHistory).toHaveBeenCalledWith(
      outputSize.width,
      outputSize.height
    )
  })

  it("cancels motion intake and cycle and clears motion state when loading a still file", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const acceptedSource = sourceWithSize(800, 600)
    const outputSize = clampOutputSize(800, 600)

    await app.execute(
      {
        kind: "file",
        file: new File(["data"], "still.png", { type: "image/png" }),
      },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        intakeImageFile: async () => ({
          type: "accepted",
          source: acceptedSource,
          outputSize,
          notices: [],
        }),
      })
    )

    expect(adapter.cancelMotionCycle).toHaveBeenCalledTimes(1)
    expect(adapter.clearMotionState).toHaveBeenCalledTimes(1)
    expect(adapter.setSource).toHaveBeenCalledWith(acceptedSource)
  })

  it("resets preview cycle and delegates to motion intake for video files", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const frameSequence = createFrameSequence()

    await app.execute(
      {
        kind: "file",
        file: new File(["video"], "clip.webm", { type: "video/webm" }),
      },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        decodeVideo: async () => frameSequence,
      })
    )

    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.applyMotionSource).toHaveBeenCalledWith(
      frameSequence,
      "clip.webm"
    )
  })

  it("resets preview cycle and delegates to motion intake for GIF files", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const frameSequence = createFrameSequence()

    await app.execute(
      {
        kind: "file",
        file: new File(["gif"], "anim.gif", { type: "image/gif" }),
      },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        runMotionGifJob: async ({ onDecoded }) => {
          onDecoded(frameSequence)
        },
      })
    )

    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.applyMotionSource).toHaveBeenCalledWith(
      frameSequence,
      "anim.gif"
    )
  })

  it("probes APNG chunk and delegates to motion intake for animated PNG files", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const frameSequence = createFrameSequence()
    const file = new File(["png"], "anim.png", { type: "image/png" })

    await app.execute(
      { kind: "file", file },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        hasAcTlChunk: async () => true,
        runMotionApngJob: async ({ onDecoded }) => {
          onDecoded(frameSequence)
        },
      })
    )

    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.applyMotionSource).toHaveBeenCalledWith(
      frameSequence,
      "anim.png"
    )
  })

  it("falls through to source intake for PNG files without APNG chunk", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const acceptedSource = sourceWithSize(640, 480)
    const outputSize = clampOutputSize(640, 480)
    const file = new File(["png"], "still.png", { type: "image/png" })

    await app.execute(
      { kind: "file", file },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        hasAcTlChunk: async () => false,
        intakeImageFile: async () => ({
          type: "accepted",
          source: acceptedSource,
          outputSize,
          notices: [],
        }),
      })
    )

    expect(adapter.cancelMotionCycle).toHaveBeenCalledTimes(1)
    expect(adapter.clearMotionState).toHaveBeenCalledTimes(1)
    expect(adapter.setSource).toHaveBeenCalledWith(acceptedSource)
  })

  it("reports rejected still intake without changing current source or preview state", async () => {
    const adapter = createAdapter()
    const app = new SourceReplacementApplication()
    const file = new File(["huge"], "oversized.jpg", { type: "image/jpeg" })

    await app.execute(
      { kind: "file", file },
      adapter,
      DEFAULT_SETTINGS,
      createDependencies({
        intakeImageFile: async () => ({
          type: "rejected",
          message: "Image is too large.",
        }),
      })
    )

    expect(adapter.setError).toHaveBeenCalledWith("Image is too large.")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
    expect(adapter.setSource).not.toHaveBeenCalled()
    expect(adapter.resetPreviewCycle).not.toHaveBeenCalled()
    expect(adapter.resetPreviewViewport).not.toHaveBeenCalled()
    expect(adapter.applyOutputSizeWithoutHistory).not.toHaveBeenCalled()
  })
})

function createAdapter(): SourceReplacementRuntimeAdapter {
  return {
    setStatus: vi.fn(),
    setSource: vi.fn(),
    setSourceNotice: vi.fn(),
    setError: vi.fn(),
    resetPreviewCycle: vi.fn(),
    resetPreviewViewport: vi.fn(),
    applyOutputSizeWithoutHistory: vi.fn(),
    applyMotionSource: vi.fn(),
    setMotionExportSettings: vi.fn(),
    setProcessedFrame: vi.fn(),
    cancelMotionCycle: vi.fn(),
    clearMotionState: vi.fn(),
  }
}

function createDependencies(
  overrides: Partial<SourceReplacementDependencies> = {}
): SourceReplacementDependencies {
  return {
    runMotionGifJob: vi.fn(),
    runMotionApngJob: vi.fn(),
    decodeVideo: vi.fn(),
    ...overrides,
  }
}

function createFrameSequence(): FrameSequence {
  return {
    frames: [
      {
        width: 2,
        height: 1,
        data: new Uint8ClampedArray([0, 0, 0, 255, 1, 0, 0, 255]),
      },
      {
        width: 2,
        height: 1,
        data: new Uint8ClampedArray([2, 0, 0, 255, 3, 0, 0, 255]),
      },
    ],
    durationsMs: [100, 100],
    loopCount: 0,
    sourceWidth: 2,
    sourceHeight: 1,
  }
}

function sourceWithSize(width: number, height: number): LoadedSource {
  return {
    id: "source",
    name: "source.png",
    buffer: { width, height, data: new Uint8ClampedArray(0) },
    autoTuneAnalysisSample: { width, height, data: new Uint8ClampedArray(0) },
    originalWidth: width,
    originalHeight: height,
  }
}
