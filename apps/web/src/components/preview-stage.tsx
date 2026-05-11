import * as React from "react"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { PreviewPresentation } from "@/components/preview-presentation"
import { ResponsiveDrawer } from "@/components/responsive-drawer"
import {
  ProcessingOverlay,
  SourceErrorOverlay,
} from "@/components/preview-status-overlays"
import { PreviewSurfaceControls } from "@/components/preview-surface-controls"
import { ExportDrawerContent } from "@/components/export-drawer-content"
import { PreviewActionStrip } from "@/components/preview-action-strip"
import { FrameStrip } from "@/components/frame-strip"
import type {
  AnimatedExportFormat,
  VideoExportSettings,
} from "@/lib/motion-types"
import { type ExportFormat } from "@/lib/export-image"
import { type PreviewViewport } from "@/lib/preview-viewport"
import { usePreviewDisplayMeasurement } from "@/lib/use-preview-display-measurement"
import type { CompareMode } from "@/store/editor-store"
import {
  type PreviewStageModel,
  type PreviewStageCommand,
} from "@/lib/preview-stage-application"

export type PreviewStageProps = {
  model: PreviewStageModel
  onCommand: (command: PreviewStageCommand) => void
}

export const PreviewStage = React.memo(function PreviewStage({
  model,
  onCommand,
}: PreviewStageProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const {
    algorithm,
    busy,
    compareMode,
    error,
    isAnimated,
    isDesktopViewScale,
    original,
    outputHeight,
    outputWidth,
    preview,
    previewRefining,
    previewTargetHeight,
    previewTargetWidth,
    status,
    previewViewport,
  } = model.product

  const {
    format: exportFormat,
    quality: exportQuality,
    animatedFormat: animatedExportFormat,
    motionSettings: motionExportSettings,
    webCodecsAvailable,
    videoSettings: videoExportSettings,
  } = model.export

  const { frameCount, currentFrame, isPlaying } = model.motion
  const { canUndo: canUndoSettingsChange, canRedo: canRedoSettingsChange } =
    model.history

  const fullOutputHeight = outputHeight ?? previewTargetHeight
  const fullOutputWidth = outputWidth ?? previewTargetWidth

  const handlePreviewDisplaySizeChange = React.useCallback(
    (size: { height: number; width: number }) =>
      onCommand({ kind: "preview-display-size-changed", size }),
    [onCommand]
  )

  const { previewDisplayRef } = usePreviewDisplayMeasurement(
    handlePreviewDisplaySizeChange
  )

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (file) {
      onCommand({ kind: "source-replacement-intent", file })
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files[0]

    if (file?.type.startsWith("image/") || file?.type.startsWith("video/")) {
      onCommand({ kind: "source-replacement-intent", file })
      return
    }

    onCommand({ kind: "invalid-drop", message: "Drop an image or video file" })
  }

  const handleCompareModeChange = React.useCallback(
    (mode: CompareMode) => onCommand({ kind: "compare-mode-changed", mode }),
    [onCommand]
  )

  const handlePreviewViewportChange = React.useCallback(
    (viewport: Partial<PreviewViewport>) =>
      onCommand({ kind: "preview-viewport-changed", viewport }),
    [onCommand]
  )

  const handleExport = React.useCallback(
    () => onCommand({ kind: "export-intent" }),
    [onCommand]
  )

  const handleExportFormatChange = React.useCallback(
    (format: ExportFormat) =>
      onCommand({ kind: "export-format-changed", format }),
    [onCommand]
  )

  const handleExportQualityChange = React.useCallback(
    (quality: number) => onCommand({ kind: "export-quality-changed", quality }),
    [onCommand]
  )

  const handleMotionExportSettingsChange = React.useCallback(
    (settings: { frameDurationMs?: number; loopCount?: number }) =>
      onCommand({ kind: "motion-export-settings-changed", settings }),
    [onCommand]
  )

  const handleAnimatedExportFormatChange = React.useCallback(
    (format: AnimatedExportFormat) =>
      onCommand({ kind: "animated-export-format-changed", format }),
    [onCommand]
  )

  const handleVideoExportSettingsChange = React.useCallback(
    (settings: Partial<VideoExportSettings>) =>
      onCommand({ kind: "video-export-settings-changed", settings }),
    [onCommand]
  )

  const handleUndoSettingsChange = React.useCallback(
    () => onCommand({ kind: "undo-settings-change" }),
    [onCommand]
  )

  const handleRedoSettingsChange = React.useCallback(
    () => onCommand({ kind: "redo-settings-change" }),
    [onCommand]
  )

  const handlePlayPause = React.useCallback(
    () => onCommand({ kind: "play-pause" }),
    [onCommand]
  )

  const handleFrameChange = React.useCallback(
    (frame: number) => onCommand({ kind: "display-frame-changed", frame }),
    [onCommand]
  )

  const handlePrevFrame = React.useCallback(
    () => onCommand({ kind: "prev-frame" }),
    [onCommand]
  )

  const handleNextFrame = React.useCallback(
    () => onCommand({ kind: "next-frame" }),
    [onCommand]
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      <Card
        className={cn(
          "relative h-full min-h-0 min-w-0 flex-1 overflow-hidden border-border bg-[var(--surface-preview)] py-2",
          dragActive && "border-destructive"
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div
          aria-hidden="true"
          className="dot-grid-subtle pointer-events-none absolute inset-0 z-0"
        />
        <ProcessingOverlay
          algorithm={algorithm}
          busy={busy}
          previewReduced={isDesktopViewScale && previewRefining}
          status={status}
        />
        <SourceErrorOverlay error={error} status={status} />
        <CardContent className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden px-0">
          <div
            ref={previewDisplayRef}
            className={cn(
              "relative mx-2 flex min-h-0 flex-1",
              previewViewport.mode === "fit"
                ? "items-center justify-center overflow-hidden"
                : "overflow-hidden"
            )}
          >
            {original ? (
              <PreviewSurfaceControls
                compareMode={compareMode}
                imageHeight={fullOutputHeight}
                imageWidth={fullOutputWidth}
                pixelInspectorEnabled={isDesktopViewScale}
                viewport={previewViewport}
                onCompareModeChange={handleCompareModeChange}
                onViewportChange={handlePreviewViewportChange}
              />
            ) : null}
            {!original ? (
              <Empty className="border-0">
                <EmptyHeader>
                  <EmptyTitle>[WAITING FOR IMAGE]</EmptyTitle>
                  <EmptyDescription>
                    Drop, paste, upload, or load the bundled demo.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2">
                <div className="min-h-0 min-w-0 flex-1">
                  <PreviewPresentation
                    compareMode={compareMode}
                    desktopPrecisionEnabled={isDesktopViewScale}
                    fullOutputHeight={fullOutputHeight}
                    fullOutputWidth={fullOutputWidth}
                    original={original}
                    preview={preview}
                    previewTargetHeight={previewTargetHeight}
                    previewTargetWidth={previewTargetWidth}
                    previewViewport={previewViewport}
                    status={status}
                    onDisplayFrameChange={handlePreviewDisplaySizeChange}
                    onViewportChange={handlePreviewViewportChange}
                  />
                </div>
              </div>
            )}
          </div>
          {frameCount > 0 ? (
            <div className="mx-2 shrink-0">
              <FrameStrip
                frameCount={frameCount}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onFrameChange={handleFrameChange}
                onPrevFrame={handlePrevFrame}
                onNextFrame={handleNextFrame}
              />
            </div>
          ) : null}
          <div className="mx-2 grid shrink-0 grid-cols-1 gap-3 px-1">
            <div className="grid w-full min-w-0 items-center gap-2 md:relative md:flex md:h-full md:min-h-9">
              <Input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*,.mp4,.webm,.mov,.mkv,.avi,.mpeg,.mpg,.ts"
                onChange={handleFileInput}
              />
              <ResponsiveDrawer>
                <PreviewActionStrip
                  canRedoSettingsChange={canRedoSettingsChange}
                  canUndoSettingsChange={canUndoSettingsChange}
                  fileInputRef={fileInputRef}
                  original={original}
                  status={status}
                  onRedoSettingsChange={handleRedoSettingsChange}
                  onUndoSettingsChange={handleUndoSettingsChange}
                />
                <ExportDrawerContent
                  isAnimated={isAnimated}
                  animatedExportFormat={animatedExportFormat}
                  exportFormat={exportFormat}
                  exportQuality={exportQuality}
                  status={status}
                  frameCount={frameCount}
                  webCodecsAvailable={webCodecsAvailable}
                  videoExportSettings={videoExportSettings}
                  motionExportSettings={motionExportSettings}
                  onExport={handleExport}
                  onExportFormatChange={handleExportFormatChange}
                  onExportQualityChange={handleExportQualityChange}
                  onAnimatedExportFormatChange={
                    handleAnimatedExportFormatChange
                  }
                  onVideoExportSettingsChange={handleVideoExportSettingsChange}
                  onMotionExportSettingsChange={
                    handleMotionExportSettingsChange
                  }
                />
              </ResponsiveDrawer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
