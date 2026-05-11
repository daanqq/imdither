import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  buildPreviewStageModel,
  createPreviewStageApplication,
  type PreviewStageCommand,
  type PreviewStageInput,
  type PreviewStageRuntimeAdapter,
} from "./preview-stage-application"

function inputFixture(
  overrides?: Partial<PreviewStageInput>
): PreviewStageInput {
  return {
    algorithm: DEFAULT_SETTINGS.algorithm,
    compareMode: "processed",
    isDesktopViewScale: true,
    original: { width: 400, height: 300, data: new Uint8ClampedArray(0) },
    outputHeight: 200,
    outputWidth: 200,
    preview: { width: 200, height: 200, data: new Uint8ClampedArray(0) },
    previewRefiningPending: false,
    previewTargetHeight: 200,
    previewTargetWidth: 200,
    status: "ready",
    error: null,
    previewViewport: {
      mode: "fit",
      zoom: 1,
      center: { x: 0, y: 0 },
      gridEnabled: false,
      loupeEnabled: false,
    },
    exportFormat: "png",
    exportQuality: 0.9,
    canUndoSettingsChange: false,
    canRedoSettingsChange: false,
    isAnimated: false,
    frameCount: 0,
    currentFrame: 0,
    isPlaying: false,
    animatedExportFormat: "gif",
    webCodecsAvailable: false,
    ...overrides,
  }
}

describe("buildPreviewStageModel", () => {
  it("builds model for still-image preview state", () => {
    const input = inputFixture()
    const model = buildPreviewStageModel(input)

    expect(model.product.algorithm).toBe(DEFAULT_SETTINGS.algorithm)
    expect(model.product.compareMode).toBe("processed")
    expect(model.product.isDesktopViewScale).toBe(true)
    expect(model.product.original).toEqual(input.original)
    expect(model.product.preview).toEqual(input.preview)
    expect(model.product.outputHeight).toBe(200)
    expect(model.product.outputWidth).toBe(200)
    expect(model.product.previewTargetHeight).toBe(200)
    expect(model.product.previewTargetWidth).toBe(200)
    expect(model.product.status).toBe("ready")
    expect(model.product.error).toBeNull()
    expect(model.product.isAnimated).toBe(false)
    expect(model.product.previewRefiningPending).toBe(false)
    expect(model.product.previewViewport.mode).toBe("fit")

    expect(model.product.busy).toBe(false)
    expect(model.product.previewReduced).toBe(false)
    expect(model.product.previewRefining).toBe(false)

    expect(model.motion.frameCount).toBe(0)
    expect(model.motion.currentFrame).toBe(0)
    expect(model.motion.isPlaying).toBe(false)

    expect(model.history.canUndo).toBe(false)
    expect(model.history.canRedo).toBe(false)

    expect(model.export.format).toBe("png")
    expect(model.export.quality).toBe(0.9)
    expect(model.export.animatedFormat).toBe("gif")
    expect(model.export.webCodecsAvailable).toBe(false)
  })

  it("builds model for motion playback state", () => {
    const input = inputFixture({
      isAnimated: true,
      frameCount: 24,
      currentFrame: 5,
      isPlaying: true,
    })
    const model = buildPreviewStageModel(input)

    expect(model.product.isAnimated).toBe(true)
    expect(model.motion.frameCount).toBe(24)
    expect(model.motion.currentFrame).toBe(5)
    expect(model.motion.isPlaying).toBe(true)
  })

  it("builds model for export drawer display state", () => {
    const input = inputFixture({
      exportFormat: "jpeg",
      exportQuality: 0.5,
      animatedExportFormat: "webm",
      webCodecsAvailable: true,
      motionExportSettings: { frameDurationMs: 50, loopCount: 3 },
      videoExportSettings: { crf: 24 },
    })
    const model = buildPreviewStageModel(input)

    expect(model.export.format).toBe("jpeg")
    expect(model.export.quality).toBe(0.5)
    expect(model.export.animatedFormat).toBe("webm")
    expect(model.export.webCodecsAvailable).toBe(true)
    expect(model.export.motionSettings).toEqual({
      frameDurationMs: 50,
      loopCount: 3,
    })
    expect(model.export.videoSettings).toEqual({ crf: 24 })
  })

  it("builds model for busy status", () => {
    for (const status of ["queued", "processing", "exporting"] as const) {
      const model = buildPreviewStageModel(inputFixture({ status }))
      expect(model.product.busy).toBe(true)
    }
  })

  it("builds model for idle and ready as not busy", () => {
    for (const status of ["idle", "ready"] as const) {
      const model = buildPreviewStageModel(inputFixture({ status }))
      expect(model.product.busy).toBe(false)
    }
  })

  it("builds model with error state", () => {
    const model = buildPreviewStageModel(
      inputFixture({ error: "processing failed" })
    )

    expect(model.product.error).toBe("processing failed")
  })

  it("builds model with preview reduced and refining", () => {
    const model = buildPreviewStageModel(
      inputFixture({
        preview: { width: 100, height: 100, data: new Uint8ClampedArray(0) },
        previewTargetWidth: 200,
        previewTargetHeight: 200,
        previewRefiningPending: true,
      })
    )

    expect(model.product.previewReduced).toBe(true)
    expect(model.product.previewRefining).toBe(true)
  })

  it("builds model without preview reduced when preview matches target", () => {
    const model = buildPreviewStageModel(
      inputFixture({
        preview: { width: 200, height: 200, data: new Uint8ClampedArray(0) },
        previewTargetWidth: 200,
        previewTargetHeight: 200,
        previewRefiningPending: true,
      })
    )

    expect(model.product.previewReduced).toBe(false)
    expect(model.product.previewRefining).toBe(false)
  })
})

describe("createPreviewStageApplication", () => {
  function createAdapter(): PreviewStageRuntimeAdapter {
    return {
      setCompareMode: vi.fn(),
      setPreviewViewport: vi.fn(),
      setPreviewDisplaySize: vi.fn(),
      setCurrentFrameIndex: vi.fn(),
      onFileSelected: vi.fn(),
      onInvalidDrop: vi.fn(),
      onExport: vi.fn(),
      setExportFormat: vi.fn(),
      setExportQuality: vi.fn(),
      setMotionExportSettings: vi.fn(),
      setAnimatedExportFormat: vi.fn(),
      setVideoExportSettings: vi.fn(),
      onPlayPause: vi.fn(),
      onPrevFrame: vi.fn(),
      onNextFrame: vi.fn(),
      undoSettingsChange: vi.fn(),
      redoSettingsChange: vi.fn(),
    }
  }

  it("dispatches compare-mode-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "compare-mode-changed", mode: "original" })

    expect(adapter.setCompareMode).toHaveBeenCalledWith("original")
  })

  it("dispatches preview-viewport-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({
      kind: "preview-viewport-changed",
      viewport: { zoom: 2 },
    })

    expect(adapter.setPreviewViewport).toHaveBeenCalledWith({ zoom: 2 })
  })

  it("dispatches preview-display-size-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({
      kind: "preview-display-size-changed",
      size: { height: 400, width: 600 },
    })

    expect(adapter.setPreviewDisplaySize).toHaveBeenCalledWith({
      height: 400,
      width: 600,
    })
  })

  it("dispatches display-frame-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "display-frame-changed", frame: 3 })

    expect(adapter.setCurrentFrameIndex).toHaveBeenCalledWith(3)
  })

  it("dispatches source-replacement-intent", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)
    const file = new File([], "test.png")

    app.dispatch({ kind: "source-replacement-intent", file })

    expect(adapter.onFileSelected).toHaveBeenCalledWith(file)
  })

  it("dispatches invalid-drop", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "invalid-drop", message: "bad file" })

    expect(adapter.onInvalidDrop).toHaveBeenCalledWith("bad file")
  })

  it("dispatches export-intent", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "export-intent" })

    expect(adapter.onExport).toHaveBeenCalled()
  })

  it("dispatches export-format-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "export-format-changed", format: "jpeg" })

    expect(adapter.setExportFormat).toHaveBeenCalledWith("jpeg")
  })

  it("dispatches export-quality-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "export-quality-changed", quality: 0.5 })

    expect(adapter.setExportQuality).toHaveBeenCalledWith(0.5)
  })

  it("dispatches motion-export-settings-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({
      kind: "motion-export-settings-changed",
      settings: { frameDurationMs: 50, loopCount: 3 },
    })

    expect(adapter.setMotionExportSettings).toHaveBeenCalledWith({
      frameDurationMs: 50,
      loopCount: 3,
    })
  })

  it("dispatches animated-export-format-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({
      kind: "animated-export-format-changed",
      format: "webm",
    })

    expect(adapter.setAnimatedExportFormat).toHaveBeenCalledWith("webm")
  })

  it("dispatches video-export-settings-changed", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({
      kind: "video-export-settings-changed",
      settings: { crf: 28 },
    })

    expect(adapter.setVideoExportSettings).toHaveBeenCalledWith({ crf: 28 })
  })

  it("dispatches play-pause", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "play-pause" })

    expect(adapter.onPlayPause).toHaveBeenCalled()
  })

  it("dispatches prev-frame", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "prev-frame" })

    expect(adapter.onPrevFrame).toHaveBeenCalled()
  })

  it("dispatches next-frame", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "next-frame" })

    expect(adapter.onNextFrame).toHaveBeenCalled()
  })

  it("dispatches undo-settings-change", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "undo-settings-change" })

    expect(adapter.undoSettingsChange).toHaveBeenCalled()
  })

  it("dispatches redo-settings-change", () => {
    const adapter = createAdapter()
    const app = createPreviewStageApplication(adapter)

    app.dispatch({ kind: "redo-settings-change" })

    expect(adapter.redoSettingsChange).toHaveBeenCalled()
  })

  it("commands do not contain DOM event objects", () => {
    const commands: PreviewStageCommand[] = [
      { kind: "compare-mode-changed", mode: "slide" },
      { kind: "preview-viewport-changed", viewport: { mode: "fit" } },
      {
        kind: "preview-display-size-changed",
        size: { height: 300, width: 400 },
      },
      { kind: "display-frame-changed", frame: 0 },
      { kind: "source-replacement-intent", file: new File([], "x.png") },
      { kind: "invalid-drop", message: "x" },
      { kind: "export-intent" },
      { kind: "export-format-changed", format: "png" },
      { kind: "export-quality-changed", quality: 1 },
      {
        kind: "motion-export-settings-changed",
        settings: { frameDurationMs: 100, loopCount: 0 },
      },
      { kind: "animated-export-format-changed", format: "gif" },
      { kind: "video-export-settings-changed", settings: { crf: 24 } },
      { kind: "play-pause" },
      { kind: "prev-frame" },
      { kind: "next-frame" },
      { kind: "undo-settings-change" },
      { kind: "redo-settings-change" },
    ]

    for (const cmd of commands) {
      expect(anyNestedDomEvent(cmd)).toBe(false)
    }
  })
})

function anyNestedDomEvent(obj: unknown): boolean {
  if (obj === null || obj === undefined) return false
  if (typeof obj === "object") {
    if ("nativeEvent" in obj || "target" in obj || "currentTarget" in obj) {
      return true
    }
    return Object.values(obj as Record<string, unknown>).some(anyNestedDomEvent)
  }
  return false
}
