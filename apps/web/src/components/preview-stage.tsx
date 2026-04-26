import * as React from "react"
import type { DitherAlgorithm, PixelBuffer } from "@workspace/core"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
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
  type PreviewViewport,
} from "@/lib/preview-viewport"
import { SLIDE_COMPARE_DEFAULT } from "@/lib/slide-compare"
import type { CompareMode, JobStatus, ViewScale } from "@/store/editor-store"

const noop = () => {}

export type PreviewStageProps = {
  algorithm: DitherAlgorithm
  compareMode: CompareMode
  isDesktopViewScale: boolean
  original: PixelBuffer | null
  outputHeight?: number
  outputWidth?: number
  preview: PixelBuffer | null
  status: JobStatus
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
  previewViewport,
  exportFormat,
  exportQuality,
  canRedoSettingsChange = false,
  canUndoSettingsChange = false,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
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
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const showOriginal = compareMode === "original"
  const showProcessed = compareMode === "processed"
  const viewScale: ViewScale = previewViewport.mode === "fit" ? "fit" : "actual"
  const comparisonFrameWidth = preview?.width ?? original?.width
  const comparisonFrameHeight = preview?.height ?? original?.height
  const fullOutputWidth = outputWidth ?? previewTargetWidth
  const fullOutputHeight = outputHeight ?? previewTargetHeight
  const toolbarFrameWidth =
    showOriginal && comparisonFrameWidth
      ? comparisonFrameWidth
      : fullOutputWidth
  const toolbarFrameHeight =
    showOriginal && comparisonFrameHeight
      ? comparisonFrameHeight
      : fullOutputHeight
  const previewReduced = preview
    ? preview.width !== previewTargetWidth ||
      preview.height !== previewTargetHeight
    : false
  const busy =
    status === "queued" || status === "processing" || status === "exporting"
  const selectedExportFormat = getExportFormatOption(exportFormat)
  const displayedExportQuality = selectedExportFormat.supportsQuality
    ? exportQuality
    : 1
  const exportQualityPercent = Math.round(displayedExportQuality * 100)
  const previewDisplayRef = usePreviewDisplayMeasurement(
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
                    status={status}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onDividerChange={setSlideDividerPercent}
                    onViewportChange={onPreviewViewportChange}
                  />
                ) : null}
                {showOriginal ? (
                  <CanvasPanel
                    buffer={original}
                    label="Original"
                    expectedHeight={comparisonFrameHeight ?? original.height}
                    expectedWidth={comparisonFrameWidth ?? original.width}
                    pixelInspectorEnabled={isDesktopViewScale}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onViewportChange={onPreviewViewportChange}
                  />
                ) : null}
                {showProcessed ? (
                  <CanvasPanel
                    buffer={preview}
                    expectedHeight={previewTargetHeight}
                    expectedWidth={previewTargetWidth}
                    label="Processed"
                    missing={!preview}
                    pixelInspectorEnabled={isDesktopViewScale}
                    status={status}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onViewportChange={onPreviewViewportChange}
                  />
                ) : null}
              </div>
            )}
          </div>
          <div className="mx-2 grid shrink-0 grid-cols-1 justify-items-center gap-3">
            <div className="grid w-full min-w-0 items-center justify-center gap-2 md:relative md:flex md:h-full md:min-h-9">
              <Input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
              />
              <div className="grid h-8 w-full max-w-[30rem] grid-cols-[2fr_2fr_2fr_2fr] items-stretch gap-2 md:h-full md:w-[34rem] md:max-w-[34rem]">
                <Button
                  className="h-full w-full min-w-0"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon data-icon="inline-start" />
                  Upload
                </Button>
                <HistoryControls
                  canRedo={canRedoSettingsChange}
                  canUndo={canUndoSettingsChange}
                  onRedo={onRedoSettingsChange}
                  onUndo={onUndoSettingsChange}
                />
                <Button
                  className="h-full w-full min-w-0"
                  disabled={!original || status === "exporting"}
                  onClick={onExport}
                >
                  <DownloadIcon data-icon="inline-start" />
                  {status === "exporting" ? "Exporting" : "Export"}
                </Button>
                <div className="h-full min-w-0">
                  <Select
                    value={exportFormat}
                    onValueChange={(value) =>
                      onExportFormatChange(value as ExportFormat)
                    }
                  >
                    <SelectTrigger
                      aria-label="Export format"
                      className="!h-full min-h-0 w-full"
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
                </div>
              </div>
              <div className="hidden md:absolute md:top-1/2 md:left-[calc(50%+15.75rem)] md:w-48 md:-translate-y-1/2">
                {selectedExportFormat.supportsQuality ? (
                  <div className="min-w-0">
                    <label className="flex h-8 min-w-0 items-center gap-2 font-mono text-[10px] text-muted-foreground md:grid md:h-auto md:grid-cols-[minmax(0,1fr)_4ch] md:gap-x-2 md:gap-y-1">
                      <span>Quality</span>
                      <Slider
                        aria-label="Export quality"
                        className="min-w-0 flex-1 md:col-span-2 md:row-start-2 md:flex-none"
                        max={MAX_EXPORT_QUALITY}
                        min={MIN_EXPORT_QUALITY}
                        step={EXPORT_QUALITY_STEP}
                        value={[displayedExportQuality]}
                        onValueChange={(value) =>
                          onExportQualityChange(value[0] ?? exportQuality)
                        }
                      />
                      <span className="w-[4ch] text-right tabular-nums md:col-start-2 md:row-start-1">
                        {exportQualityPercent}%
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
            <PreviewViewportToolbar
              imageHeight={toolbarFrameHeight}
              imageWidth={toolbarFrameWidth}
              pixelInspectorEnabled={isDesktopViewScale}
              viewport={previewViewport}
              onViewportChange={onPreviewViewportChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

function HistoryControls({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
}: {
  canRedo: boolean
  canUndo: boolean
  onRedo?: () => void
  onUndo?: () => void
}) {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-2">
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
  const latestSizeRef = React.useRef<{ height: number; width: number } | null>(
    null
  )
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  return React.useCallback(
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
}

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
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className="h-3 w-3 animate-pulse bg-primary"
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewViewportToolbar({
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
        "grid h-full w-full max-w-[30rem] min-w-0 grid-cols-[repeat(4,minmax(0,1fr))] items-center gap-2 md:max-w-[34rem] md:grid-cols-[repeat(8,minmax(0,1fr))]"
      )}
    >
      <ToggleGroup
        type="single"
        value={viewport.mode}
        variant="outline"
        className="col-span-2 grid h-10 w-full max-w-full grid-cols-2 md:col-span-4"
        onValueChange={(value) => {
          if (value === "fit") {
            onViewportChange({ mode: "fit" })
          }

          if (value === "manual") {
            onViewportChange(centeredViewport)
          }
        }}
      >
        <ToggleGroupItem
          aria-label="Fit preview"
          value="fit"
          className="h-full min-w-10 px-2"
        >
          <MaximizeIcon data-icon="inline-start" />
          <span className="md:hidden">Fit</span>
          <span className="hidden md:inline">Screen Fit</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Inspect output pixels"
          value="manual"
          className="h-full min-w-10 px-2"
        >
          <ScanSearchIcon data-icon="inline-start" />
          <span className="md:hidden">Pixels</span>
          <span className="hidden md:inline">Real Pixels</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="col-span-2 grid h-full min-w-0 grid-cols-4 items-center gap-2 md:contents">
        <Button
          type="button"
          aria-label="Set output pixels to 1:1"
          variant="outline"
          className="h-full min-w-10 px-2 font-mono text-[10px] md:col-span-1"
          onClick={() => onViewportChange(centeredViewport)}
        >
          1:1
        </Button>
        <label className="col-span-3 mx-2 grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground md:col-span-2">
          <span className="col-start-1 row-start-1">Zoom</span>
          <Slider
            aria-label="Preview zoom"
            className="col-span-2 row-start-2 min-w-0"
            min={0.25}
            max={16}
            step={0.25}
            value={[viewport.zoom]}
            onValueChange={(value) =>
              onViewportChange({
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
          className="ml-1.5 h-full min-w-10 px-2 md:col-span-1 md:ml-0"
          onClick={() =>
            onViewportChange({
              loupeEnabled: !viewport.loupeEnabled,
              mode: "manual",
            })
          }
        >
          <CrosshairIcon data-icon="inline-start" />
        </Button>
      ) : null}
    </div>
  )
}

const CanvasPanel = React.memo(function CanvasPanel({
  buffer,
  expectedHeight,
  expectedWidth,
  label,
  missing = false,
  pixelInspectorEnabled = true,
  previewViewport,
  status,
  viewScale,
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
  const panAnimationFrameRef = React.useRef<number | null>(null)
  const [inspector, setInspector] = React.useState<PixelInspectorSample | null>(
    null
  )
  const [viewportBox, setViewportBox] = React.useState<{
    height: number
    width: number
  } | null>(null)
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
      setViewportBox({
        height: Math.max(1, Math.round(rect.height)),
        width: Math.max(1, Math.round(rect.width)),
      })
    }

    updateViewportBox()

    const observer = new ResizeObserver(updateViewportBox)
    observer.observe(viewportElement)

    return () => observer.disconnect()
  }, [])

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

  function panPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!previewViewport || previewViewport.mode !== "manual") {
      return
    }

    panStateRef.current = {
      center: previewViewport.center,
      pointerX: event.clientX,
      pointerY: event.clientY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
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
        style={
          previewViewport?.mode === "manual"
            ? {
                ...(viewScale === "fit" || centeredManualViewport
                  ? { containerType: "size" as const }
                  : null),
                touchAction: "none",
              }
            : viewScale === "fit" || centeredManualViewport
              ? { containerType: "size" }
              : undefined
        }
        onWheel={handleWheel}
        onPointerDown={panPointer}
        onPointerMove={(event) => {
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

          if (panStateRef.current) {
            onViewportChange({ center: panStateRef.current.center })
            panStateRef.current = null
          }
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

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
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center font-mono text-[10px] text-foreground/80">
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
