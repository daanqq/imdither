import type { DitherAlgorithm, PixelBuffer } from "@workspace/core"

import type {
  AnimatedExportFormat,
  VideoExportSettings,
} from "@/lib/motion-types"
import type { ExportFormat } from "@/lib/export-image"
import type { PreviewViewport } from "@/lib/preview-viewport"
import type { CompareMode, JobStatus } from "@/store/editor-store"

export type PreviewStageInput = {
  algorithm: DitherAlgorithm
  compareMode: CompareMode
  isDesktopViewScale: boolean
  original: PixelBuffer | null
  outputHeight: number
  outputWidth: number
  preview: PixelBuffer | null
  previewRefiningPending: boolean
  previewTargetHeight: number
  previewTargetWidth: number
  status: JobStatus
  error: string | null
  previewViewport: PreviewViewport
  exportFormat: ExportFormat
  exportQuality: number
  canUndoSettingsChange: boolean
  canRedoSettingsChange: boolean
  isAnimated: boolean
  frameCount: number
  currentFrame: number
  isPlaying: boolean
  motionExportSettings?: { frameDurationMs: number; loopCount: number }
  animatedExportFormat: AnimatedExportFormat
  webCodecsAvailable: boolean
  videoExportSettings?: VideoExportSettings
}

export type PreviewProductState = {
  algorithm: DitherAlgorithm
  busy: boolean
  compareMode: CompareMode
  error: string | null
  isAnimated: boolean
  isDesktopViewScale: boolean
  original: PixelBuffer | null
  outputHeight: number
  outputWidth: number
  preview: PixelBuffer | null
  previewRefiningPending: boolean
  previewReduced: boolean
  previewRefining: boolean
  previewTargetHeight: number
  previewTargetWidth: number
  status: JobStatus
  previewViewport: PreviewViewport
}

export type ExportDisplayState = {
  format: ExportFormat
  quality: number
  animatedFormat: AnimatedExportFormat
  motionSettings?: { frameDurationMs: number; loopCount: number }
  webCodecsAvailable: boolean
  videoSettings?: VideoExportSettings
}

export type MotionPlaybackDisplayState = {
  frameCount: number
  currentFrame: number
  isPlaying: boolean
}

export type SettingsHistoryAffordances = {
  canUndo: boolean
  canRedo: boolean
}

export type PreviewStageModel = {
  product: PreviewProductState
  export: ExportDisplayState
  motion: MotionPlaybackDisplayState
  history: SettingsHistoryAffordances
}

function isBusy(status: JobStatus): boolean {
  return (
    status === "queued" || status === "processing" || status === "exporting"
  )
}

function isPreviewReduced(
  preview: PixelBuffer | null,
  previewTargetWidth: number,
  previewTargetHeight: number
): boolean {
  return preview
    ? preview.width !== previewTargetWidth ||
        preview.height !== previewTargetHeight
    : false
}

export type PreviewStageCommand =
  | { kind: "compare-mode-changed"; mode: CompareMode }
  | { kind: "preview-viewport-changed"; viewport: Partial<PreviewViewport> }
  | {
      kind: "preview-display-size-changed"
      size: { height: number; width: number }
    }
  | { kind: "display-frame-changed"; frame: number }
  | { kind: "source-replacement-intent"; file: File }
  | { kind: "invalid-drop"; message: string }
  | { kind: "export-intent" }
  | { kind: "export-format-changed"; format: ExportFormat }
  | { kind: "export-quality-changed"; quality: number }
  | {
      kind: "motion-export-settings-changed"
      settings: { frameDurationMs?: number; loopCount?: number }
    }
  | { kind: "animated-export-format-changed"; format: AnimatedExportFormat }
  | {
      kind: "video-export-settings-changed"
      settings: Partial<VideoExportSettings>
    }
  | { kind: "play-pause" }
  | { kind: "prev-frame" }
  | { kind: "next-frame" }
  | { kind: "undo-settings-change" }
  | { kind: "redo-settings-change" }

export type PreviewStageRuntimeAdapter = {
  setCompareMode: (mode: CompareMode) => void
  setPreviewViewport: (viewport: Partial<PreviewViewport>) => void
  setPreviewDisplaySize: (size: { height: number; width: number }) => void
  setCurrentFrameIndex: (frame: number) => void
  onFileSelected: (file: File) => void | Promise<void>
  onInvalidDrop: (message: string) => void
  onExport: () => void
  setExportFormat: (format: ExportFormat) => void
  setExportQuality: (quality: number) => void
  setMotionExportSettings: (settings: {
    frameDurationMs?: number
    loopCount?: number
  }) => void
  setAnimatedExportFormat: (format: AnimatedExportFormat) => void
  setVideoExportSettings: (settings: Partial<VideoExportSettings>) => void
  onPlayPause: () => void
  onPrevFrame: () => void
  onNextFrame: () => void
  undoSettingsChange: () => void
  redoSettingsChange: () => void
}

export type PreviewStageApplication = {
  buildModel: (input: PreviewStageInput) => PreviewStageModel
  dispatch: (command: PreviewStageCommand) => void
}

export function createPreviewStageApplication(
  adapter: PreviewStageRuntimeAdapter
): PreviewStageApplication {
  return {
    buildModel: buildPreviewStageModel,
    dispatch(command) {
      switch (command.kind) {
        case "compare-mode-changed":
          adapter.setCompareMode(command.mode)
          break
        case "preview-viewport-changed":
          adapter.setPreviewViewport(command.viewport)
          break
        case "preview-display-size-changed":
          adapter.setPreviewDisplaySize(command.size)
          break
        case "display-frame-changed":
          adapter.setCurrentFrameIndex(command.frame)
          break
        case "source-replacement-intent":
          void adapter.onFileSelected(command.file)
          break
        case "invalid-drop":
          adapter.onInvalidDrop(command.message)
          break
        case "export-intent":
          adapter.onExport()
          break
        case "export-format-changed":
          adapter.setExportFormat(command.format)
          break
        case "export-quality-changed":
          adapter.setExportQuality(command.quality)
          break
        case "motion-export-settings-changed":
          adapter.setMotionExportSettings(command.settings)
          break
        case "animated-export-format-changed":
          adapter.setAnimatedExportFormat(command.format)
          break
        case "video-export-settings-changed":
          adapter.setVideoExportSettings(command.settings)
          break
        case "play-pause":
          adapter.onPlayPause()
          break
        case "prev-frame":
          adapter.onPrevFrame()
          break
        case "next-frame":
          adapter.onNextFrame()
          break
        case "undo-settings-change":
          adapter.undoSettingsChange()
          break
        case "redo-settings-change":
          adapter.redoSettingsChange()
          break
      }
    },
  }
}

export function buildPreviewStageModel(
  input: PreviewStageInput
): PreviewStageModel {
  const cropBusy = isBusy(input.status)
  const cropPreviewReduced = isPreviewReduced(
    input.preview,
    input.previewTargetWidth,
    input.previewTargetHeight
  )
  const cropPreviewRefining = cropPreviewReduced && input.previewRefiningPending

  return {
    product: {
      algorithm: input.algorithm,
      busy: cropBusy,
      compareMode: input.compareMode,
      error: input.error,
      isAnimated: input.isAnimated,
      isDesktopViewScale: input.isDesktopViewScale,
      original: input.original,
      outputHeight: input.outputHeight,
      outputWidth: input.outputWidth,
      preview: input.preview,
      previewRefiningPending: input.previewRefiningPending,
      previewReduced: cropPreviewReduced,
      previewRefining: cropPreviewRefining,
      previewTargetHeight: input.previewTargetHeight,
      previewTargetWidth: input.previewTargetWidth,
      status: input.status,
      previewViewport: input.previewViewport,
    },
    export: {
      format: input.exportFormat,
      quality: input.exportQuality,
      animatedFormat: input.animatedExportFormat,
      motionSettings: input.motionExportSettings,
      webCodecsAvailable: input.webCodecsAvailable,
      videoSettings: input.videoExportSettings,
    },
    motion: {
      frameCount: input.frameCount,
      currentFrame: input.currentFrame,
      isPlaying: input.isPlaying,
    },
    history: {
      canUndo: input.canUndoSettingsChange,
      canRedo: input.canRedoSettingsChange,
    },
  }
}
