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
  Grid3X3Icon,
  MaximizeIcon,
  ScanSearchIcon,
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
  getViewportPointImageCoordinates,
  getWheelZoom,
  isPixelGridVisible,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import { SLIDE_COMPARE_DEFAULT } from "@/lib/slide-compare"
import type { CompareMode, JobStatus, ViewScale } from "@/store/editor-store"

export type PreviewStageProps = {
  algorithm: DitherAlgorithm
  compareMode: CompareMode
  isDesktopViewScale: boolean
  original: PixelBuffer | null
  preview: PixelBuffer | null
  status: JobStatus
  previewTargetHeight: number
  previewTargetWidth: number
  previewViewport: PreviewViewport
  exportFormat: ExportFormat
  exportQuality: number
  onExport: () => void
  onExportFormatChange: (format: ExportFormat) => void
  onExportQualityChange: (quality: number) => void
  onFileSelected: (file: File) => void | Promise<void>
  onInvalidDrop: (message: string) => void
  onPreviewDisplaySizeChange: (size: { height: number; width: number }) => void
  onPreviewViewportChange: (viewport: Partial<PreviewViewport>) => void
}

export const PreviewStage = React.memo(function PreviewStage({
  algorithm,
  compareMode,
  isDesktopViewScale,
  original,
  preview,
  previewTargetHeight,
  previewTargetWidth,
  status,
  previewViewport,
  exportFormat,
  exportQuality,
  onExport,
  onExportFormatChange,
  onExportQualityChange,
  onFileSelected,
  onInvalidDrop,
  onPreviewDisplaySizeChange,
  onPreviewViewportChange,
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
                    pixelGridHidden={previewReduced}
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
                    pixelGridHidden={previewReduced}
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
                    pixelGridHidden={previewReduced}
                    status={status}
                    previewViewport={previewViewport}
                    viewScale={viewScale}
                    onViewportChange={onPreviewViewportChange}
                  />
                ) : null}
              </div>
            )}
          </div>
          <div className="mx-2 grid shrink-0 grid-cols-1 items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="order-1 grid min-w-0 grid-cols-2 items-center gap-2 md:relative md:order-2 md:flex md:h-full md:min-h-9 md:justify-center">
              <Input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
              />
              <div className="contents md:grid md:h-full md:grid-cols-[9rem_9rem] md:gap-2">
                <Button
                  className="min-w-0 md:h-full"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon data-icon="inline-start" />
                  Upload
                </Button>
                <div className="grid h-8 min-w-0 grid-cols-[minmax(0,1fr)_5.25rem] md:contents">
                  <Button
                    className="h-8 min-w-0 rounded-r-none border-r-0 border-input md:h-full md:rounded-r-md md:border-r"
                    disabled={!original || status === "exporting"}
                    onClick={onExport}
                  >
                    <DownloadIcon data-icon="inline-start" />
                    {status === "exporting" ? "Exporting" : "Export"}
                  </Button>
                  <div className="min-w-0 md:hidden">
                    <Select
                      value={exportFormat}
                      onValueChange={(value) =>
                        onExportFormatChange(value as ExportFormat)
                      }
                    >
                      <SelectTrigger
                        aria-label="Export format"
                        className="h-8 w-full rounded-l-none"
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
              </div>
              <div className="contents md:absolute md:top-1/2 md:left-[calc(50%+9.75rem)] md:grid md:w-80 md:-translate-y-1/2 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center md:gap-2">
                <div className="hidden min-w-0 md:block">
                  <Select
                    value={exportFormat}
                    onValueChange={(value) =>
                      onExportFormatChange(value as ExportFormat)
                    }
                  >
                    <SelectTrigger
                      aria-label="Export format"
                      className="h-8 w-full md:h-full"
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
                {selectedExportFormat.supportsQuality ? (
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <label className="flex h-8 min-w-0 items-center gap-2 font-mono text-[10px] text-muted-foreground md:h-full">
                      <span>Quality</span>
                      <Slider
                        aria-label="Export quality"
                        className="min-w-0 flex-1"
                        max={MAX_EXPORT_QUALITY}
                        min={MIN_EXPORT_QUALITY}
                        step={EXPORT_QUALITY_STEP}
                        value={[displayedExportQuality]}
                        onValueChange={(value) =>
                          onExportQualityChange(value[0] ?? exportQuality)
                        }
                      />
                      <span className="w-[4ch] text-right tabular-nums">
                        {exportQualityPercent}%
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
            <PreviewViewportToolbar
              pixelInspectorEnabled={isDesktopViewScale}
              viewport={previewViewport}
              onViewportChange={onPreviewViewportChange}
            />
            <div
              aria-hidden="true"
              className="order-3 hidden min-w-0 md:block"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

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
  pixelInspectorEnabled,
  viewport,
  onViewportChange,
}: {
  pixelInspectorEnabled: boolean
  viewport: PreviewViewport
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}) {
  const zoomPercent = Math.round(viewport.zoom * 100)
  const zoomControlsVisible = viewport.mode === "manual"
  const gridColumns = zoomControlsVisible
    ? pixelInspectorEnabled
      ? "grid-cols-[auto_auto_minmax(6rem,1fr)_auto_auto]"
      : "grid-cols-[auto_auto_minmax(6rem,1fr)_auto]"
    : "grid-cols-[auto]"

  return (
    <div
      className={cn(
        "order-2 grid h-full min-w-0 items-center gap-1.5 md:order-1 md:max-w-[26rem]",
        gridColumns
      )}
    >
      <ToggleGroup
        type="single"
        value={viewport.mode}
        variant="outline"
        className="h-full"
        onValueChange={(value) => {
          if (value === "fit") {
            onViewportChange({ mode: "fit" })
          }

          if (value === "manual") {
            onViewportChange({ mode: "manual", zoom: 1 })
          }
        }}
      >
        <ToggleGroupItem
          aria-label="Fit preview"
          value="fit"
          className="h-full min-w-10"
        >
          <MaximizeIcon data-icon="inline-start" />
          <span className="hidden lg:inline">Fit</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label="Manual zoom"
          value="manual"
          className="h-full min-w-10"
        >
          <ScanSearchIcon data-icon="inline-start" />
          <span className="hidden lg:inline">Zoom</span>
        </ToggleGroupItem>
      </ToggleGroup>
      {zoomControlsVisible ? (
        <>
          <Button
            type="button"
            aria-label="Set zoom to 100 percent"
            variant="outline"
            className="h-full min-w-10 px-2 font-mono text-[10px]"
            onClick={() => onViewportChange({ mode: "manual", zoom: 1 })}
          >
            100%
          </Button>
          <label className="grid min-w-0 grid-cols-[minmax(0,1fr)_4ch] items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <Slider
              aria-label="Preview zoom"
              className="min-w-0"
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
            <span className="text-right tabular-nums">{zoomPercent}%</span>
          </label>
          <Button
            type="button"
            aria-label="Toggle pixel grid"
            aria-pressed={viewport.gridEnabled}
            variant={viewport.gridEnabled ? "default" : "outline"}
            className="ml-1.5 h-full min-w-10 px-2"
            onClick={() =>
              onViewportChange({ gridEnabled: !viewport.gridEnabled })
            }
          >
            <Grid3X3Icon data-icon="inline-start" />
          </Button>
        </>
      ) : null}
      {zoomControlsVisible && pixelInspectorEnabled ? (
        <Button
          type="button"
          aria-label="Toggle pixel inspector"
          aria-pressed={viewport.loupeEnabled}
          variant={viewport.loupeEnabled ? "default" : "outline"}
          className="h-full min-w-10 px-2"
          onClick={() =>
            onViewportChange({ loupeEnabled: !viewport.loupeEnabled })
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
  pixelGridHidden = false,
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
  const frameStyle = getPreviewFrameStyle({
    sourceHeight: expectedHeight,
    sourceWidth: expectedWidth,
    viewScale,
  })
  const manualFrameStyle =
    previewViewport?.mode === "manual"
      ? {
          height: `${Math.max(1, Math.round(expectedHeight * previewViewport.zoom))}px`,
          left: "50%",
          marginLeft: `${-Math.round(previewViewport.center.x * previewViewport.zoom)}px`,
          marginTop: `${-Math.round(previewViewport.center.y * previewViewport.zoom)}px`,
          position: "absolute" as const,
          top: "50%",
          width: `${Math.max(1, Math.round(expectedWidth * previewViewport.zoom))}px`,
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

      frameRef.current.style.marginLeft = `${-Math.round(center.x * previewViewport.zoom)}px`
      frameRef.current.style.marginTop = `${-Math.round(center.y * previewViewport.zoom)}px`
    },
    [previewViewport]
  )

  const applyManualFrameViewport = React.useCallback(
    (viewport: PreviewViewport) => {
      if (viewport.mode !== "manual" || !frameRef.current) {
        return
      }

      frameRef.current.style.height = `${Math.max(1, Math.round(expectedHeight * viewport.zoom))}px`
      frameRef.current.style.left = "50%"
      frameRef.current.style.marginLeft = `${-Math.round(viewport.center.x * viewport.zoom)}px`
      frameRef.current.style.marginTop = `${-Math.round(viewport.center.y * viewport.zoom)}px`
      frameRef.current.style.position = "absolute"
      frameRef.current.style.top = "50%"
      frameRef.current.style.width = `${Math.max(1, Math.round(expectedWidth * viewport.zoom))}px`
    },
    [expectedHeight, expectedWidth]
  )

  React.useEffect(() => {
    viewportRef.current = previewViewport ?? null

    if (previewViewport?.mode === "manual") {
      applyManualFrameViewport(previewViewport)
    }
  }, [applyManualFrameViewport, previewViewport])

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
        style={viewScale === "fit" ? { containerType: "size" } : undefined}
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
          const nextCenter = clampManualViewportCenter({
            center: {
              x:
                panStateRef.current.center.x -
                (event.clientX - panStateRef.current.pointerX) /
                  previewViewport.zoom,
              y:
                panStateRef.current.center.y -
                (event.clientY - panStateRef.current.pointerY) /
                  previewViewport.zoom,
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
          {previewViewport &&
          !pixelGridHidden &&
          isPixelGridVisible(previewViewport) ? (
            <PixelGridOverlay zoom={previewViewport.zoom} />
          ) : null}
        </div>
        {pixelInspectorEnabled && inspector ? (
          <PixelInspector sample={inspector} />
        ) : null}
      </div>
    </div>
  )
}, areCanvasPanelPropsEqual)

function PixelGridOverlay({ zoom }: { zoom: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-45 mix-blend-difference"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)",
        backgroundSize: `${zoom}px ${zoom}px`,
      }}
    />
  )
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
