import {
  DEFAULT_SETTINGS,
  type EditorSettings,
  type FrameSequence,
  type MotionExportSettings,
} from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  applyMotionExportAction,
  type MotionExportActionCommand,
  type MotionExportActionRuntimeAdapter,
} from "./motion-export-action-application"
import type { VideoExportSettings } from "./motion-types"

describe("applyMotionExportAction", () => {
  it("does nothing when there is no Frame Sequence", async () => {
    const adapter = createAdapter()
    const gifEncoder = vi.fn()

    await applyMotionExportAction(
      {
        frameSequence: null,
        sourceName: "clip.gif",
        settings: DEFAULT_SETTINGS,
        animatedExportFormat: "gif",
        motionExportSettings: { frameDurationMs: 100, loopCount: 0 },
        videoExportSettings: { crf: 30 },
        webCodecsAvailable: true,
      },
      adapter,
      { exportGifSequence: gifEncoder }
    )

    expect(gifEncoder).not.toHaveBeenCalled()
    expect(adapter.setStatus).not.toHaveBeenCalled()
    expect(adapter.setError).not.toHaveBeenCalled()
    expect(adapter.downloadBlob).not.toHaveBeenCalled()
  })

  it("exports GIF, downloads the Export File, clears errors, and finishes ready", async () => {
    const adapter = createAdapter()
    const frameSequence = createFrameSequence()
    const settings = createSettings()
    const motionExportSettings = createMotionExportSettings()
    const blob = new Blob(["gif"], { type: "image/gif" })
    const exportGifSequence = vi.fn(async () => blob)

    await applyMotionExportAction(
      {
        frameSequence,
        sourceName: "source.png",
        settings,
        animatedExportFormat: "gif",
        motionExportSettings,
        videoExportSettings: { crf: 30 },
        webCodecsAvailable: true,
      },
      adapter,
      { exportGifSequence }
    )

    expect(exportGifSequence).toHaveBeenCalledWith(
      frameSequence,
      settings,
      motionExportSettings,
      undefined
    )
    expect(adapter.downloadBlob).toHaveBeenCalledWith(blob, "source.gif")
    expect(adapter.setError).toHaveBeenCalledWith(null)
    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "exporting")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("ready")
  })

  it("exports APNG with PNG Export File naming", async () => {
    const adapter = createAdapter()
    const frameSequence = createFrameSequence()
    const blob = new Blob(["apng"], { type: "image/png" })
    const exportApngSequence = vi.fn(async () => blob)

    await applyMotionExportAction(
      {
        frameSequence,
        sourceName: "source.gif",
        settings: DEFAULT_SETTINGS,
        animatedExportFormat: "apng",
        motionExportSettings: { frameDurationMs: 90, loopCount: 1 },
        videoExportSettings: { crf: 30 },
        webCodecsAvailable: true,
      },
      adapter,
      { exportApngSequence }
    )

    expect(exportApngSequence).toHaveBeenCalled()
    expect(adapter.downloadBlob).toHaveBeenCalledWith(blob, "source.png")
  })

  it("exports WebM only when the WebCodecs Gate is open", async () => {
    const adapter = createAdapter()
    const frameSequence = createFrameSequence()
    const videoExportSettings: VideoExportSettings = { crf: 24 }
    const blob = new Blob(["webm"], { type: "video/webm" })
    const exportWebMSequence = vi.fn(async () => blob)

    await applyMotionExportAction(
      {
        frameSequence,
        sourceName: "source.gif",
        settings: DEFAULT_SETTINGS,
        animatedExportFormat: "webm",
        motionExportSettings: { frameDurationMs: 90, loopCount: 1 },
        videoExportSettings,
        webCodecsAvailable: true,
      },
      adapter,
      { exportWebMSequence }
    )

    expect(exportWebMSequence).toHaveBeenCalledWith(
      frameSequence,
      DEFAULT_SETTINGS,
      { frameDurationMs: 90, loopCount: 1 },
      videoExportSettings
    )
    expect(adapter.downloadBlob).toHaveBeenCalledWith(blob, "source.webm")
  })

  it("reports Encoder Failure when WebM is requested with a closed WebCodecs Gate", async () => {
    const adapter = createAdapter()
    const exportWebMSequence = vi.fn()

    await applyMotionExportAction(
      {
        frameSequence: createFrameSequence(),
        sourceName: "source.gif",
        settings: DEFAULT_SETTINGS,
        animatedExportFormat: "webm",
        motionExportSettings: { frameDurationMs: 90, loopCount: 1 },
        videoExportSettings: { crf: 30 },
        webCodecsAvailable: false,
      },
      adapter,
      { exportWebMSequence }
    )

    expect(exportWebMSequence).not.toHaveBeenCalled()
    expect(adapter.downloadBlob).not.toHaveBeenCalled()
    expect(adapter.setError).toHaveBeenCalledWith(
      "WebM export requires WebCodecs support in this browser"
    )
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
  })

  it("maps encoder failures to status error without download", async () => {
    const adapter = createAdapter()

    await applyMotionExportAction(
      {
        frameSequence: createFrameSequence(),
        sourceName: "source.gif",
        settings: DEFAULT_SETTINGS,
        animatedExportFormat: "gif",
        motionExportSettings: { frameDurationMs: 90, loopCount: 1 },
        videoExportSettings: { crf: 30 },
        webCodecsAvailable: true,
      },
      adapter,
      {
        exportGifSequence: async () => {
          throw new Error("encoder exploded")
        },
      }
    )

    expect(adapter.downloadBlob).not.toHaveBeenCalled()
    expect(adapter.setError).toHaveBeenCalledWith("encoder exploded")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
  })

  it("uses format-specific fallback copy for non-Error failures", async () => {
    const adapter = createAdapter()

    await applyMotionExportAction(
      {
        frameSequence: createFrameSequence(),
        sourceName: "source.gif",
        settings: DEFAULT_SETTINGS,
        animatedExportFormat: "apng",
        motionExportSettings: { frameDurationMs: 90, loopCount: 1 },
        videoExportSettings: { crf: 30 },
        webCodecsAvailable: true,
      },
      adapter,
      {
        exportApngSequence: async () => {
          throw "nope"
        },
      }
    )

    expect(adapter.setError).toHaveBeenCalledWith("APNG export failed")
  })

  it("does not accept Motion Cycle processed frames in the command interface", async () => {
    const adapter = createAdapter()
    const frameSequence = createFrameSequence()
    const exportGifSequence = vi.fn(async () => new Blob(["gif"]))
    const command = {
      frameSequence,
      sourceName: "source.gif",
      settings: DEFAULT_SETTINGS,
      animatedExportFormat: "gif",
      motionExportSettings: { frameDurationMs: 90, loopCount: 1 },
      videoExportSettings: { crf: 30 },
      webCodecsAvailable: true,
      // @ts-expect-error Motion Export Action must use source Frame Sequence only.
      processedFrames: [createBuffer(99)],
    } satisfies MotionExportActionCommand

    await applyMotionExportAction(command, adapter, { exportGifSequence })

    expect(exportGifSequence).toHaveBeenCalledWith(
      frameSequence,
      DEFAULT_SETTINGS,
      { frameDurationMs: 90, loopCount: 1 },
      undefined
    )
  })
})

function createAdapter(): MotionExportActionRuntimeAdapter {
  return {
    downloadBlob: vi.fn(),
    setError: vi.fn(),
    setStatus: vi.fn(),
  }
}

function createSettings(): EditorSettings {
  return {
    ...DEFAULT_SETTINGS,
    resize: {
      ...DEFAULT_SETTINGS.resize,
      width: 2,
      height: 1,
    },
  }
}

function createMotionExportSettings(): MotionExportSettings {
  return { frameDurationMs: 120, loopCount: 2 }
}

function createFrameSequence(): FrameSequence {
  return {
    frames: [createBuffer(0), createBuffer(10)],
    durationsMs: [100, 150],
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
