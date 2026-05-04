import * as React from "react"
import type { DitherAlgorithm, PixelBuffer } from "@workspace/core"
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
import { type ExportFormat } from "@/lib/export-image"
import { type PreviewViewport } from "@/lib/preview-viewport"
import { usePreviewDisplayMeasurement } from "@/lib/use-preview-display-measurement"
import type { CompareMode, JobStatus } from "@/store/editor-store"

export type PreviewStageProps = {
  algorithm: DitherAlgorithm
  compareMode: CompareMode
  isDesktopViewScale: boolean
  original: PixelBuffer | null
  outputHeight?: number
  outputWidth?: number
  preview: PixelBuffer | null
  previewRefiningPending?: boolean
  status: JobStatus
  error?: string | null
  previewTargetHeight: number
  previewTargetWidth: number
  previewViewport: PreviewViewport
  exportFormat: ExportFormat
  exportQuality: number
  canRedoSettingsChange?: boolean
  canUndoSettingsChange?: boolean
  onExport: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportQualityChange: (quality: number) => void
  onCompareModeChange?: (mode: CompareMode) => void
  onFileSelected: (file: File) => void | Promise<void>
  motionExportSettings?: { frameDurationMs: number; loopCount: number }
  onMotionExportSettingsChange?: (settings: {
    frameDurationMs?: number
    loopCount?: number
  }) => void
  onInvalidDrop: (message: string) => void
  onPreviewDisplaySizeChange: (size: { height: number; width: number }) => void
  onPreviewViewportChange: (viewport: Partial<PreviewViewport>) => void
  onRedoSettingsChange?: () => void
  onUndoSettingsChange?: () => void
  isAnimated?: boolean
  frameCount?: number
  currentFrame?: number
  isPlaying?: boolean
  onPlayPause?: () => void
  onFrameChange?: (frame: number) => void
  onPrevFrame?: () => void
  onNextFrame?: () => void
}

export const PreviewStage = React.memo(function PreviewStage({
  algorithm,
  compareMode,
  isDesktopViewScale,
  original,
  outputHeight,
  outputWidth,
  preview,
  previewRefiningPending = false,
  previewTargetHeight,
  previewTargetWidth,
  status,
  error,
  previewViewport,
  exportFormat,
  exportQuality,
  canRedoSettingsChange = false,
  canUndoSettingsChange = false,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
  motionExportSettings,
  onMotionExportSettingsChange,
  onCompareModeChange = () => {},
  onFileSelected,
  onInvalidDrop,
  onPreviewDisplaySizeChange,
  onPreviewViewportChange,
  onRedoSettingsChange,
  onUndoSettingsChange,
  isAnimated = false,
  frameCount = 0,
  currentFrame = 0,
  isPlaying = false,
  onPlayPause,
  onFrameChange,
  onPrevFrame,
  onNextFrame,
}: PreviewStageProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const fullOutputHeight = outputHeight ?? previewTargetHeight
  const fullOutputWidth = outputWidth ?? previewTargetWidth
  const previewReduced = preview
    ? preview.width !== previewTargetWidth ||
      preview.height !== previewTargetHeight
    : false
  const previewRefining = previewReduced && previewRefiningPending
  const busy =
    status === "queued" || status === "processing" || status === "exporting"
  const { previewDisplayRef } = usePreviewDisplayMeasurement(
    onPreviewDisplaySizeChange
  )

  async function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (file) {
      await onFileSelected(file)
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files[0]

    if (file?.type.startsWith("image/")) {
      await onFileSelected(file)
      return
    }

    onInvalidDrop("Drop an image file")
  }

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
                onCompareModeChange={onCompareModeChange}
                onViewportChange={onPreviewViewportChange}
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
                    onDisplayFrameChange={onPreviewDisplaySizeChange}
                    onViewportChange={onPreviewViewportChange}
                  />
                </div>
              </div>
            )}
          </div>
          {frameCount > 0 &&
          onPlayPause &&
          onFrameChange &&
          onPrevFrame &&
          onNextFrame ? (
            <div className="mx-2 shrink-0">
              <FrameStrip
                frameCount={frameCount}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
                onPlayPause={onPlayPause}
                onFrameChange={onFrameChange}
                onPrevFrame={onPrevFrame}
                onNextFrame={onNextFrame}
              />
            </div>
          ) : null}
          <div className="mx-2 grid shrink-0 grid-cols-1 gap-3 px-1">
            <div className="grid w-full min-w-0 items-center gap-2 md:relative md:flex md:h-full md:min-h-9">
              <Input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
              />
              <ResponsiveDrawer>
                <PreviewActionStrip
                  canRedoSettingsChange={canRedoSettingsChange}
                  canUndoSettingsChange={canUndoSettingsChange}
                  fileInputRef={fileInputRef}
                  original={original}
                  status={status}
                  onRedoSettingsChange={onRedoSettingsChange}
                  onUndoSettingsChange={onUndoSettingsChange}
                />
                <ExportDrawerContent
                  isAnimated={isAnimated}
                  exportFormat={exportFormat}
                  exportQuality={exportQuality}
                  status={status}
                  motionExportSettings={motionExportSettings}
                  onExport={onExport}
                  onExportFormatChange={onExportFormatChange}
                  onExportQualityChange={onExportQualityChange}
                  onMotionExportSettingsChange={onMotionExportSettingsChange}
                />
              </ResponsiveDrawer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
