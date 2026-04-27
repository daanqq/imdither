import * as React from "react"
import type { DitherAlgorithm, PixelBuffer } from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Slider } from "@workspace/ui/components/slider"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"
import {
  CrosshairIcon,
  DownloadIcon,
  MaximizeIcon,
  Redo2Icon,
  ScanSearchIcon,
  Undo2Icon,
  UploadIcon,
} from "lucide-react"

import { SlideComparePreview } from "@/components/slide-compare-preview"
import {
  areCanvasPanelPropsEqual,
  type CanvasPanelProps,
} from "@/components/preview-render-boundaries"
import { ResponsiveDrawer } from "@/components/responsive-drawer"
import { drawPixelBuffer } from "@/lib/image"
import {
  getPixelInspectorSample,
  type PixelInspectorSample,
} from "@/lib/pixel-inspector"
import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_QUALITY_STEP,
  MAX_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
  getExportFormatOption,
  type ExportFormat,
} from "@/lib/export-image"
import { getPreviewFrameStyle } from "@/lib/preview-frame"
import { getPinchGestureViewport } from "@/lib/preview-gestures"
import {
  clampZoom,
  clampManualViewportCenter,
  getAnchoredZoomViewport,
  getDisplayPointImageCoordinates,
  getFramePointImageCoordinates,
  getManualViewportDisplayMetrics,
  getManualViewportScale,
  getViewportPointImageCoordinates,
  getWheelZoom,
  MIN_PREVIEW_ZOOM,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import { SLIDE_COMPARE_DEFAULT } from "@/lib/slide-compare"
import type { CompareMode, JobStatus, ViewScale } from "@/store/editor-store"

const noop = () => {}
const noopCompareModeChange = () => {}

export type PreviewStageProps = {
  algorithm: DitherAlgorithm
  compareMode: CompareMode
  isDesktopViewScale: boolean
  original: PixelBuffer | null
  outputHeight?: number
  outputWidth?: number
  preview: PixelBuffer | null
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
  onInvalidDrop: (message: string) => void
  onPreviewDisplaySizeChange: (size: { height: number; width: number }) => void
  onPreviewViewportChange: (viewport: Partial<PreviewViewport>) => void
  onRedoSettingsChange?: () => void
  onUndoSettingsChange?: () => void
}

export const PreviewStage = React.memo(function PreviewStage({
  algorithm,
  compareMode,
  isDesktopViewScale,
  original,
  outputHeight,
  outputWidth,
  preview,
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
  onCompareModeChange = noopCompareModeChange,
  onFileSelected,
  onInvalidDrop,
  onPreviewDisplaySizeChange,
  onPreviewViewportChange,
  onRedoSettingsChange,
  onUndoSettingsChange,
}: PreviewStageProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [slideDividerPercent, setSlideDividerPercent] = React.useState(
    SLIDE_COMPARE_DEFAULT
  )
  const [surfaceViewportBox, setSurfaceViewportBox] = React.useState<{
    height: number
    width: number
  } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const showOriginal = compareMode === "original"
  const showProcessed = compareMode === "processed"
  const viewScale: ViewScale = previewViewport.mode === "fit" ? "fit" : "actual"
  const previewFrameWidth = isDesktopViewScale
    ? (outputWidth ?? previewTargetWidth)
    : previewTargetWidth
  const previewFrameHeight = isDesktopViewScale
    ? (outputHeight ?? previewTargetHeight)
    : previewTargetHeight
  const controlsFrameWidth = previewFrameWidth
  const controlsFrameHeight = previewFrameHeight
  const previewReduced = preview
    ? preview.width !== previewTargetWidth ||
      preview.height !== previewTargetHeight
    : false
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
          previewReduced={isDesktopViewScale && previewReduced}
          status={status}
        />
        <SourceErrorOverlay error={error} status={status} />
        <CardContent className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden px-0">
          <div
            ref={previewDisplayRef}
            className={cn(
              "relative mx-2 mt-2 flex min-h-0 flex-1",
              previewViewport.mode === "fit"
                ? "items-center justify-center overflow-hidden"
                : "overflow-hidden"
            )}
          >
            {original ? (
              <PreviewSurfaceControls
                compareMode={compareMode}
                imageHeight={controlsFrameHeight}
                imageWidth={controlsFrameWidth}
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
              <div className="grid h-full min-h-0 w-full items-stretch gap-3">
                {compareMode === "slide" ? (
                  <SlideComparePreview
                    dividerPercent={slideDividerPercent}
                    original={original}
                    pixelInspectorEnabled={isDesktopViewScale}
                    processed={preview}
                    displayHeight={previewTargetHeight}
                    displayWidth={previewTargetWidth}
                    initialViewportBox={surfaceViewportBox}
                    status={status}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onDividerChange={setSlideDividerPercent}
                    onViewportChange={onPreviewViewportChange}
                    onViewportBoxChange={setSurfaceViewportBox}
                  />
                ) : null}
                {showOriginal ? (
                  <CanvasPanel
                    buffer={original}
                    label="Original"
                    expectedHeight={previewFrameHeight}
                    expectedWidth={previewFrameWidth}
                    initialViewportBox={surfaceViewportBox}
                    pixelInspectorEnabled={isDesktopViewScale}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onViewportBoxChange={setSurfaceViewportBox}
                    onViewportChange={onPreviewViewportChange}
                  />
                ) : null}
                {showProcessed ? (
                  <CanvasPanel
                    buffer={preview}
                    expectedHeight={previewTargetHeight}
                    expectedWidth={previewTargetWidth}
                    initialViewportBox={surfaceViewportBox}
                    label="Processed"
                    missing={!preview}
                    pixelInspectorEnabled={isDesktopViewScale}
                    status={status}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onViewportBoxChange={setSurfaceViewportBox}
                    onViewportChange={onPreviewViewportChange}
                  />
                ) : null}
              </div>
            )}
          </div>
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
                <div className="grid h-8 w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-2 md:h-full md:grid-cols-[auto_1fr_auto]">
                  <div className="grid min-w-0 grid-cols-2 gap-2 md:w-[20rem]">
                    <Button
                      className="h-full w-full min-w-0"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon data-icon="inline-start" />
                      Upload
                    </Button>
                    <DrawerTrigger asChild>
                      <Button
                        className="h-full w-full min-w-0 border border-primary"
                        disabled={!original || status === "exporting"}
                      >
                        <DownloadIcon data-icon="inline-start" />
                        {status === "exporting" ? "Exporting" : "Export"}
                      </Button>
                    </DrawerTrigger>
                  </div>
                  <div aria-hidden="true" className="hidden md:block" />
                  <HistoryControls
                    canRedo={canRedoSettingsChange}
                    canUndo={canUndoSettingsChange}
                    className="md:w-[10rem]"
                    onRedo={onRedoSettingsChange}
                    onUndo={onUndoSettingsChange}
                  />
                </div>
                <ExportDrawerContent
                  exportFormat={exportFormat}
                  exportQuality={exportQuality}
                  status={status}
                  onExport={onExport}
                  onExportFormatChange={onExportFormatChange}
                  onExportQualityChange={onExportQualityChange}
                />
              </ResponsiveDrawer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

function HistoryControls({
  canRedo,
  canUndo,
  className,
  onRedo,
  onUndo,
}: {
  canRedo: boolean
  canUndo: boolean
  className?: string
  onRedo?: () => void
  onUndo?: () => void
}) {
  return (
    <div className={cn("grid h-full w-full grid-cols-2 gap-2", className)}>
      <Button
        aria-label="Undo settings change"
        className="h-full w-full"
        disabled={!canUndo}
        size="icon"
        variant="outline"
        onClick={onUndo ?? noop}
      >
        <Undo2Icon />
      </Button>
      <Button
        aria-label="Redo settings change"
        className="h-full w-full"
        disabled={!canRedo}
        size="icon"
        variant="outline"
        onClick={onRedo ?? noop}
      >
        <Redo2Icon />
      </Button>
    </div>
  )
}

function usePreviewDisplayMeasurement(
  onPreviewDisplaySizeChange: (size: { height: number; width: number }) => void
) {
  const [previewDisplaySize, setPreviewDisplaySize] = React.useState<{
    height: number
    width: number
  } | null>(null)
  const latestSizeRef = React.useRef<{ height: number; width: number } | null>(
    null
  )
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const previewDisplayRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || typeof ResizeObserver === "undefined") {
        return
      }

      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect

        if (!rect) {
          return
        }

        const nextSize = {
          height: Math.max(1, Math.round(rect.height)),
          width: Math.max(1, Math.round(rect.width)),
        }
        const latestSize = latestSizeRef.current

        if (
          latestSize &&
          Math.abs(latestSize.width - nextSize.width) < 16 &&
          Math.abs(latestSize.height - nextSize.height) < 16
        ) {
          return
        }

        latestSizeRef.current = nextSize
        setPreviewDisplaySize(nextSize)

        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
          onPreviewDisplaySizeChange(nextSize)
        }, 120)
      })

      observer.observe(node)

      return () => {
        observer.disconnect()

        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    },
    [onPreviewDisplaySizeChange]
  )

  return { previewDisplayRef, previewDisplaySize }
}

const PROCESSING_OVERLAY_PULSE_STEPS = Array.from(
  { length: 10 },
  (_, index) => ({
    delayMs: index * 70,
    id: `pulse-${index}`,
  })
)

function ProcessingOverlay({
  algorithm,
  busy,
  previewReduced,
  status,
}: {
  algorithm: DitherAlgorithm
  busy: boolean
  previewReduced: boolean
  status: JobStatus
}) {
  if (!busy && !previewReduced) {
    return null
  }

  const title =
    status === "exporting"
      ? "EXPORTING"
      : busy
        ? "PROCESSING PREVIEW"
        : "PREVIEW ONLY"
  const detail =
    status === "exporting"
      ? "Preparing full-size export."
      : previewReduced
        ? `Showing reduced preview while full ${algorithm} output catches up.`
        : status === "queued"
          ? "Queued. Controls remain editable."
          : `${algorithm} worker is running. New changes replace queued preview.`

  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-20 border border-primary bg-background/95 p-2 shadow-none">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-xl leading-none tracking-[-0.03em]">
            {title}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {detail}
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-5 gap-1" aria-hidden="true">
          {PROCESSING_OVERLAY_PULSE_STEPS.map((step) => (
            <span
              key={step.id}
              className="h-3 w-3 animate-pulse bg-primary"
              style={{ animationDelay: `${step.delayMs}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SourceErrorOverlay({
  error,
  status,
}: {
  error?: string | null
  status: JobStatus
}) {
  if (status !== "error" || !error) {
    return null
  }

  return (
    <div
      role="alert"
      className="pointer-events-none absolute inset-x-2 top-2 z-30 border border-destructive bg-background/95 p-2 shadow-none"
    >
      <div className="min-w-0">
        <div className="font-display text-xl leading-none tracking-[-0.03em] text-destructive">
          SOURCE REJECTED
        </div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {error}
        </div>
      </div>
    </div>
  )
}

function PreviewSurfaceControls({
  compareMode,
  imageHeight,
  imageWidth,
  pixelInspectorEnabled,
  viewport,
  onCompareModeChange,
  onViewportChange,
}: {
  compareMode: CompareMode
  imageHeight: number
  imageWidth: number
  pixelInspectorEnabled: boolean
  viewport: PreviewViewport
  onCompareModeChange: (mode: CompareMode) => void
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const nextCompareMode = getNextCompareMode(compareMode)

  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-30 flex items-start justify-between gap-2">
      <Button
        type="button"
        aria-label={`Switch compare mode to ${getCompareModeLabel(nextCompareMode)}`}
        className="pointer-events-auto h-8 border-transparent bg-background/80 px-2.5 text-xs shadow-none backdrop-blur-md"
        variant="outline"
        onClick={() => onCompareModeChange(nextCompareMode)}
      >
        {getCompareModeLabel(compareMode)}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            aria-label="Open preview view controls"
            className="pointer-events-auto h-8 border-transparent bg-background/80 px-2.5 font-mono text-xs shadow-none backdrop-blur-md"
            variant="outline"
          >
            {viewport.mode === "fit"
              ? "Fit"
              : `Pixels ${Math.round(viewport.zoom * 100)}%`}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="border-transparent bg-background/90 backdrop-blur-md"
        >
          <PreviewViewControls
            imageHeight={imageHeight}
            imageWidth={imageWidth}
            pixelInspectorEnabled={pixelInspectorEnabled}
            viewport={viewport}
            onViewportChange={onViewportChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PreviewViewControls({
  imageHeight,
  imageWidth,
  pixelInspectorEnabled,
  viewport,
  onViewportChange,
}: {
  imageHeight: number
  imageWidth: number
  pixelInspectorEnabled: boolean
  viewport: PreviewViewport
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const zoomPercent = Math.round(viewport.zoom * 100)
  const centeredViewport = React.useMemo(
    () => ({
      center: {
        x: Math.max(1, imageWidth) / 2,
        y: Math.max(1, imageHeight) / 2,
      },
      mode: "manual" as const,
      zoom: 1,
    }),
    [imageHeight, imageWidth]
  )
  return (
    <div
      className={cn(
        "grid h-full w-full min-w-0 grid-cols-4 items-center gap-2"
      )}
    >
      <ToggleGroup
        type="single"
        value={viewport.mode}
        variant="outline"
        className="col-span-4 grid h-10 w-full max-w-full grid-cols-2"
      >
        <ToggleGroupItem
          aria-label="Fit preview"
          value="fit"
          className="h-full min-w-10 px-2"
          onClick={() =>
            onViewportChange({
              center: centeredViewport.center,
              mode: "fit",
              zoom: 1,
            })
          }
        >
          <MaximizeIcon data-icon="inline-start" />
          <span className="md:hidden">Fit</span>
          <span className="hidden md:inline">Screen Fit</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Inspect output pixels"
          value="manual"
          className="h-full min-w-10 px-2"
          onClick={() => onViewportChange(centeredViewport)}
        >
          <ScanSearchIcon data-icon="inline-start" />
          <span className="md:hidden">Pixels</span>
          <span className="hidden md:inline">Real Pixels</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="col-span-4 grid h-10 min-w-0 grid-cols-4 items-center gap-2">
        <Button
          type="button"
          aria-label="Set output pixels to 1:1"
          variant="outline"
          className="h-full min-w-10 px-2 font-mono text-[10px]"
          onClick={() => onViewportChange(centeredViewport)}
        >
          1:1
        </Button>
        <label className="col-span-3 mx-2 grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <span className="col-start-1 row-start-1">Zoom</span>
          <Slider
            aria-label="Preview zoom"
            className="col-span-2 row-start-2 min-w-0"
            min={MIN_PREVIEW_ZOOM}
            max={16}
            step={0.25}
            value={[viewport.zoom]}
            onValueChange={(value) =>
              onViewportChange({
                ...(viewport.mode === "fit"
                  ? { center: centeredViewport.center }
                  : null),
                mode: "manual",
                zoom: clampZoom(value[0] ?? viewport.zoom),
              })
            }
          />
          <span className="col-start-2 row-start-1 text-right tabular-nums">
            {zoomPercent}%
          </span>
        </label>
      </div>
      {pixelInspectorEnabled ? (
        <Button
          type="button"
          aria-label="Toggle pixel inspector"
          aria-pressed={viewport.loupeEnabled}
          variant={viewport.loupeEnabled ? "default" : "outline"}
          className="col-span-4 h-9 min-w-10 px-2"
          onClick={() =>
            onViewportChange({
              ...(viewport.mode === "manual"
                ? null
                : { center: centeredViewport.center }),
              loupeEnabled: !viewport.loupeEnabled,
              mode: "manual",
            })
          }
        >
          <CrosshairIcon data-icon="inline-start" />
          Inspector
        </Button>
      ) : null}
    </div>
  )
}

function ExportDrawerContent({
  exportFormat,
  exportQuality,
  status,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
}: {
  exportFormat: ExportFormat
  exportQuality: number
  status: JobStatus
  onExport: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportQualityChange: (quality: number) => void
}) {
  const selectedExportFormat = getExportFormatOption(exportFormat)
  const exportQualityPercent = Math.round(exportQuality * 100)
  const displayedExportQuality = selectedExportFormat.supportsQuality
    ? exportQuality
    : 1

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Export</DrawerTitle>
        <DrawerDescription>
          Format and quality for final image download.
        </DrawerDescription>
      </DrawerHeader>
      <div className="grid min-w-0 gap-3 p-3">
        <div className="grid min-w-0 grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)] gap-3">
          <label
            className="grid min-w-0 content-start gap-1.5 pr-3 text-sm font-medium"
            htmlFor="export-format"
          >
            Export Format
            <Select
              value={exportFormat}
              onValueChange={(value) =>
                onExportFormatChange(value as ExportFormat)
              }
            >
              <SelectTrigger
                aria-label="Export format"
                className="min-w-0"
                id="export-format"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] gap-x-2 gap-y-1 border-l border-border pl-3 font-mono text-[10px] text-muted-foreground">
            <span className="font-sans text-sm font-medium text-foreground">
              Export Quality
            </span>
            <Slider
              aria-label="Export quality"
              className="col-span-2 row-start-2 min-w-0"
              disabled={!selectedExportFormat.supportsQuality}
              max={MAX_EXPORT_QUALITY}
              min={MIN_EXPORT_QUALITY}
              step={EXPORT_QUALITY_STEP}
              value={[displayedExportQuality]}
              onValueChange={(value) =>
                onExportQualityChange(value[0] ?? exportQuality)
              }
            />
            <span className="col-start-2 row-start-1 text-right tabular-nums">
              {selectedExportFormat.supportsQuality
                ? exportQualityPercent
                : 100}
              %
            </span>
          </label>
        </div>
        {exportFormat === "png" ? (
          <p className="text-xs text-muted-foreground">
            PNG exports remain lossless at 100%.
          </p>
        ) : null}
      </div>
      <DrawerFooter>
        <Button disabled={status === "exporting"} onClick={onExport}>
          <DownloadIcon data-icon="inline-start" />
          Download {selectedExportFormat.label}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  )
}

function getNextCompareMode(compareMode: CompareMode): CompareMode {
  if (compareMode === "slide") {
    return "processed"
  }

  if (compareMode === "processed") {
    return "original"
  }

  return "slide"
}

function getCompareModeLabel(compareMode: CompareMode) {
  return compareMode === "slide"
    ? "Slide"
    : compareMode === "processed"
      ? "Processed"
      : "Original"
}

const CanvasPanel = React.memo(function CanvasPanel({
  buffer,
  expectedHeight,
  expectedWidth,
  initialViewportBox,
  label,
  missing = false,
  pixelInspectorEnabled = true,
  previewViewport,
  status,
  viewScale,
  onViewportBoxChange,
  onViewportChange,
}: CanvasPanelProps & {
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const viewportRef = React.useRef<PreviewViewport | null>(
    previewViewport ?? null
  )
  const panStateRef = React.useRef<{
    center: { x: number; y: number }
    pointerX: number
    pointerY: number
  } | null>(null)
  const activePointersRef = React.useRef(
    new Map<number, { x: number; y: number }>()
  )
  const pinchStateRef = React.useRef<{
    latestViewport: PreviewViewport | null
    startPointers: {
      first: { x: number; y: number }
      second: { x: number; y: number }
    }
    startViewport: PreviewViewport
  } | null>(null)
  const panAnimationFrameRef = React.useRef<number | null>(null)
  const [inspector, setInspector] = React.useState<PixelInspectorSample | null>(
    null
  )
  const [viewportBox, setViewportBox] = React.useState<{
    height: number
    width: number
  } | null>(initialViewportBox ?? null)
  const centeredManualViewport =
    previewViewport?.mode === "manual" &&
    previewViewport.zoom === 1 &&
    Math.round(previewViewport.center.x) === Math.round(expectedWidth / 2) &&
    Math.round(previewViewport.center.y) === Math.round(expectedHeight / 2)
  const manualScale =
    previewViewport?.mode === "manual"
      ? getManualViewportScale({
          imageHeight: expectedHeight,
          imageWidth: expectedWidth,
          viewportHeight: viewportBox?.height ?? expectedHeight,
          viewportWidth: viewportBox?.width ?? expectedWidth,
          zoom: previewViewport.zoom,
        })
      : 1
  const manualDisplayMetrics =
    previewViewport?.mode === "manual"
      ? getManualViewportDisplayMetrics({
          imageHeight: expectedHeight,
          imageWidth: expectedWidth,
          viewportHeight: viewportBox?.height ?? expectedHeight,
          viewportWidth: viewportBox?.width ?? expectedWidth,
          zoom: previewViewport.zoom,
        })
      : null
  const frameStyle = getPreviewFrameStyle({
    sourceHeight: expectedHeight,
    sourceWidth: expectedWidth,
    viewScale: centeredManualViewport ? "fit" : viewScale,
  })
  const manualFrameStyle =
    previewViewport?.mode === "manual" && !centeredManualViewport
      ? {
          height: `${manualDisplayMetrics?.displayHeight ?? Math.max(1, Math.round(expectedHeight * manualScale))}px`,
          left: "50%",
          marginLeft: `${-Math.round(previewViewport.center.x * (manualDisplayMetrics?.pixelScaleX ?? manualScale))}px`,
          marginTop: `${-Math.round(previewViewport.center.y * (manualDisplayMetrics?.pixelScaleY ?? manualScale))}px`,
          position: "absolute" as const,
          top: "50%",
          width: `${manualDisplayMetrics?.displayWidth ?? Math.max(1, Math.round(expectedWidth * manualScale))}px`,
        }
      : frameStyle

  React.useEffect(() => {
    if (!buffer || !canvasRef.current) {
      return
    }

    drawPixelBuffer(canvasRef.current, buffer)
  }, [buffer])

  const applyManualFramePosition = React.useCallback(
    (center: { x: number; y: number }) => {
      if (
        !previewViewport ||
        previewViewport.mode !== "manual" ||
        !frameRef.current
      ) {
        return
      }

      const viewportRect = getFrameViewportRect(frameRef.current)
      const metrics = getManualViewportDisplayMetrics({
        imageHeight: expectedHeight,
        imageWidth: expectedWidth,
        viewportHeight: viewportRect.height,
        viewportWidth: viewportRect.width,
        zoom: previewViewport.zoom,
      })

      frameRef.current.style.marginLeft = `${-Math.round(center.x * metrics.pixelScaleX)}px`
      frameRef.current.style.marginTop = `${-Math.round(center.y * metrics.pixelScaleY)}px`
    },
    [expectedHeight, expectedWidth, previewViewport]
  )

  const applyManualFrameViewport = React.useCallback(
    (viewport: PreviewViewport) => {
      if (viewport.mode !== "manual" || !frameRef.current) {
        return
      }

      const viewportRect = getFrameViewportRect(frameRef.current)
      const metrics = getManualViewportDisplayMetrics({
        imageHeight: expectedHeight,
        imageWidth: expectedWidth,
        viewportHeight: viewportRect.height,
        viewportWidth: viewportRect.width,
        zoom: viewport.zoom,
      })

      frameRef.current.style.height = `${metrics.displayHeight}px`
      frameRef.current.style.marginLeft = `${-Math.round(viewport.center.x * metrics.pixelScaleX)}px`
      frameRef.current.style.marginTop = `${-Math.round(viewport.center.y * metrics.pixelScaleY)}px`
      frameRef.current.style.width = `${metrics.displayWidth}px`
    },
    [expectedHeight, expectedWidth]
  )

  React.useLayoutEffect(() => {
    const viewportElement = frameRef.current?.parentElement

    if (!viewportElement) {
      return
    }

    const updateViewportBox = () => {
      const rect = viewportElement.getBoundingClientRect()
      const nextViewportBox = {
        height: Math.max(1, Math.round(rect.height)),
        width: Math.max(1, Math.round(rect.width)),
      }

      setViewportBox(nextViewportBox)
      onViewportBoxChange?.(nextViewportBox)
    }

    updateViewportBox()

    const observer = new ResizeObserver(updateViewportBox)
    observer.observe(viewportElement)

    return () => observer.disconnect()
  }, [onViewportBoxChange])

  React.useLayoutEffect(() => {
    viewportRef.current = previewViewport ?? null
  }, [previewViewport])

  React.useLayoutEffect(() => {
    if (
      previewViewport?.mode !== "manual" ||
      centeredManualViewport ||
      !viewportBox
    ) {
      return
    }

    applyManualFrameViewport(previewViewport)
  }, [
    applyManualFrameViewport,
    centeredManualViewport,
    previewViewport,
    viewportBox,
  ])

  React.useEffect(() => {
    return () => {
      if (panAnimationFrameRef.current !== null) {
        cancelAnimationFrame(panAnimationFrameRef.current)
      }
    }
  }, [])

  function scheduleManualFramePosition(center: { x: number; y: number }) {
    if (panAnimationFrameRef.current !== null) {
      cancelAnimationFrame(panAnimationFrameRef.current)
    }

    panAnimationFrameRef.current = requestAnimationFrame(() => {
      panAnimationFrameRef.current = null
      applyManualFramePosition(center)
    })
  }

  function inspectPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (
      !pixelInspectorEnabled ||
      !previewViewport?.loupeEnabled ||
      !frameRef.current
    ) {
      return
    }

    const rect = frameRef.current.getBoundingClientRect()
    const coordinates =
      previewViewport.mode === "manual"
        ? getFramePointImageCoordinates({
            clientX: event.clientX,
            clientY: event.clientY,
            frameLeft: rect.left,
            frameTop: rect.top,
            imageHeight: expectedHeight,
            imageWidth: expectedWidth,
            viewportHeight: getFrameViewportRect(frameRef.current).height,
            viewportWidth: getFrameViewportRect(frameRef.current).width,
            zoom: previewViewport.zoom,
          })
        : getDisplayPointImageCoordinates({
            clientX: event.clientX,
            clientY: event.clientY,
            frameLeft: rect.left,
            frameTop: rect.top,
            imageHeight: expectedHeight,
            imageWidth: expectedWidth,
            viewport: previewViewport,
            viewportHeight: rect.height,
            viewportWidth: rect.width,
          })

    setInspector(
      coordinates
        ? getPixelInspectorSample({
            coordinates,
            original: label === "Original" ? buffer : null,
            processed: label === "Processed" ? buffer : null,
          })
        : null
    )
  }

  const startPinchGesture = React.useCallback(() => {
    const currentViewport = viewportRef.current ?? previewViewport
    const pointerPair = getActivePointerPair(activePointersRef.current)

    if (!currentViewport || !pointerPair) {
      return
    }

    pinchStateRef.current = {
      latestViewport: null,
      startPointers: pointerPair,
      startViewport: currentViewport,
    }
    panStateRef.current = null
  }, [previewViewport])

  function panPointer(event: React.PointerEvent<HTMLDivElement>) {
    const currentViewport = viewportRef.current ?? previewViewport

    event.currentTarget.setPointerCapture(event.pointerId)
    activePointersRef.current.set(
      event.pointerId,
      getPointerViewportPoint(event.currentTarget, event)
    )

    if (activePointersRef.current.size >= 2) {
      startPinchGesture()
      return
    }

    if (!currentViewport || currentViewport.mode !== "manual") {
      return
    }

    panStateRef.current = {
      center: currentViewport.center,
      pointerX: event.clientX,
      pointerY: event.clientY,
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const currentViewport = viewportRef.current ?? previewViewport

    if (!currentViewport || !frameRef.current) {
      return
    }

    event.preventDefault()

    const viewportRect = event.currentTarget.getBoundingClientRect()
    const anchorViewportPoint = {
      x: event.clientX - viewportRect.left,
      y: event.clientY - viewportRect.top,
    }
    const coordinates = getViewportPointImageCoordinates({
      imageHeight: expectedHeight,
      imageWidth: expectedWidth,
      viewport: currentViewport,
      viewportHeight: viewportRect.height,
      viewportPoint: anchorViewportPoint,
      viewportWidth: viewportRect.width,
    })

    const nextZoom = getWheelZoom(currentViewport.zoom, event.deltaY)
    const nextViewport = coordinates
      ? getAnchoredZoomViewport({
          anchorImagePoint: coordinates,
          anchorViewportPoint,
          imageHeight: expectedHeight,
          imageWidth: expectedWidth,
          nextZoom,
          viewport: currentViewport,
          viewportHeight: viewportRect.height,
          viewportWidth: viewportRect.width,
        })
      : {
          ...currentViewport,
          mode: "manual" as const,
          zoom: nextZoom,
        }

    viewportRef.current = nextViewport
    applyManualFrameViewport(nextViewport)

    onViewportChange({
      mode: "manual",
      zoom: nextViewport.zoom,
      center: nextViewport.center,
    })
  }

  function updatePinchGesture(element: HTMLElement) {
    if (activePointersRef.current.size < 2) {
      return
    }

    if (!pinchStateRef.current) {
      startPinchGesture()
    }

    const pointerPair = getActivePointerPair(activePointersRef.current)
    const pinchState = pinchStateRef.current

    if (!pointerPair || !pinchState) {
      return
    }

    const rect = element.getBoundingClientRect()
    const nextViewport = getPinchGestureViewport({
      currentPointers: pointerPair,
      imageHeight: expectedHeight,
      imageWidth: expectedWidth,
      startPointers: pinchState.startPointers,
      startViewport: pinchState.startViewport,
      viewportHeight: rect.height,
      viewportWidth: rect.width,
    })

    if (!nextViewport) {
      return
    }

    viewportRef.current = nextViewport
    pinchState.latestViewport = nextViewport
    applyManualFrameViewport(nextViewport)
  }

  function commitGestureViewport() {
    const latestViewport = pinchStateRef.current?.latestViewport

    if (latestViewport) {
      onViewportChange({
        mode: "manual",
        zoom: latestViewport.zoom,
        center: latestViewport.center,
      })
    }

    pinchStateRef.current = null
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 items-center justify-center",
          viewScale === "fit" ? "overflow-hidden" : "overflow-hidden",
          viewScale === "actual" &&
            (previewViewport?.loupeEnabled
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing")
        )}
        style={{
          ...(viewScale === "fit" || centeredManualViewport
            ? { containerType: "size" as const }
            : null),
          touchAction: "none",
        }}
        onWheel={handleWheel}
        onPointerDown={panPointer}
        onPointerMove={(event) => {
          if (activePointersRef.current.has(event.pointerId)) {
            activePointersRef.current.set(
              event.pointerId,
              getPointerViewportPoint(event.currentTarget, event)
            )
            updatePinchGesture(event.currentTarget)
          }

          if (activePointersRef.current.size >= 2 || pinchStateRef.current) {
            return
          }

          inspectPointer(event)

          if (
            !previewViewport ||
            previewViewport.mode !== "manual" ||
            !event.currentTarget.hasPointerCapture(event.pointerId) ||
            !panStateRef.current
          ) {
            return
          }

          const rect = event.currentTarget.getBoundingClientRect()
          const scale = getManualViewportScale({
            imageHeight: expectedHeight,
            imageWidth: expectedWidth,
            viewportHeight: rect.height,
            viewportWidth: rect.width,
            zoom: previewViewport.zoom,
          })
          const nextCenter = clampManualViewportCenter({
            center: {
              x:
                panStateRef.current.center.x -
                (event.clientX - panStateRef.current.pointerX) / scale,
              y:
                panStateRef.current.center.y -
                (event.clientY - panStateRef.current.pointerY) / scale,
            },
            imageHeight: expectedHeight,
            imageWidth: expectedWidth,
            viewportHeight: rect.height,
            viewportWidth: rect.width,
            zoom: previewViewport.zoom,
          })

          panStateRef.current = {
            center: nextCenter,
            pointerX: event.clientX,
            pointerY: event.clientY,
          }
          scheduleManualFramePosition(nextCenter)
        }}
        onPointerLeave={() => setInspector(null)}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          activePointersRef.current.delete(event.pointerId)
          if (pinchStateRef.current) {
            commitGestureViewport()
            return
          }

          if (panStateRef.current) {
            onViewportChange({ center: panStateRef.current.center })
            panStateRef.current = null
          }
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          activePointersRef.current.delete(event.pointerId)
          pinchStateRef.current = null
          panStateRef.current = null
        }}
      >
        <div
          ref={frameRef}
          className={cn(
            "relative shrink-0 overflow-hidden bg-background ring-1 ring-border",
            missing && "border border-dashed border-border ring-0",
            viewScale === "actual" && "h-fit w-fit max-w-none",
            previewViewport?.mode === "manual" && "shrink-0"
          )}
          style={manualFrameStyle}
        >
          {missing ? (
            <PreviewPlaceholder
              height={expectedHeight}
              status={status}
              width={expectedWidth}
            />
          ) : (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block size-full bg-background"
            />
          )}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center font-mono text-[10px] text-foreground/80">
            <span className="bg-background/80 px-1.5 py-0.5">{label}</span>
          </div>
        </div>
        {pixelInspectorEnabled && inspector ? (
          <PixelInspector sample={inspector} />
        ) : null}
      </div>
    </div>
  )
}, areCanvasPanelPropsEqual)

function getFrameViewportRect(frame: HTMLElement) {
  const rect = frame.parentElement?.getBoundingClientRect()

  return {
    height: Math.max(1, Math.round(rect?.height ?? frame.clientHeight)),
    width: Math.max(1, Math.round(rect?.width ?? frame.clientWidth)),
  }
}

function getPointerViewportPoint(
  element: HTMLElement,
  event: Pick<React.PointerEvent, "clientX" | "clientY">
) {
  const rect = element.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function getActivePointerPair(pointers: Map<number, { x: number; y: number }>) {
  const [first, second] = [...pointers.values()]

  if (!first || !second) {
    return null
  }

  return { first, second }
}

function PixelInspector({ sample }: { sample: PixelInspectorSample }) {
  return (
    <div className="pointer-events-none absolute right-2 bottom-2 border border-foreground/15 bg-background/95 px-2 py-1 font-mono text-[10px] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="tabular-nums">
        x{sample.x} y{sample.y}
      </div>
      <div className="text-muted-foreground">
        O {sample.originalHex ?? "--"} P {sample.processedHex ?? "--"}
      </div>
    </div>
  )
}

function PreviewPlaceholder({
  height,
  status,
  width,
}: {
  height: number
  status?: string
  width: number
}) {
  return (
    <div className="dot-grid-subtle flex size-full items-center justify-center bg-background text-center">
      <div className="flex flex-col gap-1 font-mono text-[11px] text-muted-foreground">
        <span>[{status ?? "processing"}]</span>
        <span>
          {width}x{height}
        </span>
      </div>
    </div>
  )
}
