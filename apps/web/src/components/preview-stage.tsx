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
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"
import { DownloadIcon, UploadIcon } from "lucide-react"

import { SlideComparePreview } from "@/components/slide-compare-preview"
import {
  areCanvasPanelPropsEqual,
  type CanvasPanelProps,
} from "@/components/preview-render-boundaries"
import { drawPixelBuffer } from "@/lib/image"
import { getPreviewFrameStyle } from "@/lib/preview-frame"
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
  viewScale: ViewScale
  onExportPng: () => void
  onFileSelected: (file: File) => void | Promise<void>
  onInvalidDrop: (message: string) => void
  onPreviewDisplaySizeChange: (size: { height: number; width: number }) => void
  onViewScaleChange: (scale: ViewScale) => void
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
  viewScale,
  onExportPng,
  onFileSelected,
  onInvalidDrop,
  onPreviewDisplaySizeChange,
  onViewScaleChange,
}: PreviewStageProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [slideDividerPercent, setSlideDividerPercent] = React.useState(
    SLIDE_COMPARE_DEFAULT
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const showOriginal = compareMode === "original"
  const showProcessed = compareMode === "processed"
  const comparisonFrameWidth = preview?.width ?? original?.width
  const comparisonFrameHeight = preview?.height ?? original?.height
  const previewReduced = preview
    ? preview.width !== previewTargetWidth ||
      preview.height !== previewTargetHeight
    : false
  const busy =
    status === "queued" || status === "processing" || status === "exporting"
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
          "relative h-full min-h-0 min-w-0 flex-1 overflow-hidden border-border bg-card py-3",
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
        <ProcessingOverlay
          algorithm={algorithm}
          busy={busy}
          previewReduced={isDesktopViewScale && previewReduced}
          status={status}
        />
        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden px-0">
          <div
            ref={previewDisplayRef}
            className={cn(
              "dot-grid-subtle m-3 flex min-h-0 flex-1 bg-background ring-1 ring-foreground/10",
              viewScale === "fit"
                ? "items-center justify-center overflow-hidden"
                : "overflow-auto"
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
                    processed={preview}
                    displayHeight={preview ? preview.height : undefined}
                    displayWidth={preview ? preview.width : undefined}
                    status={status}
                    viewScale={viewScale}
                    onDividerChange={setSlideDividerPercent}
                  />
                ) : null}
                {showOriginal ? (
                  <CanvasPanel
                    buffer={original}
                    label="Original"
                    expectedHeight={comparisonFrameHeight ?? original.height}
                    expectedWidth={comparisonFrameWidth ?? original.width}
                    viewScale={viewScale}
                  />
                ) : null}
                {showProcessed ? (
                  <CanvasPanel
                    buffer={preview}
                    expectedHeight={previewTargetHeight}
                    expectedWidth={previewTargetWidth}
                    label="Processed"
                    missing={!preview}
                    status={status}
                    viewScale={viewScale}
                  />
                ) : null}
              </div>
            )}
          </div>
          <div className="mx-3 mb-3 grid shrink-0 grid-cols-1 items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="order-1 flex min-w-0 items-center gap-2 md:order-2 md:justify-center">
              <Input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
              />
              <Button
                className="min-w-0 flex-1 md:w-36 md:flex-none"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon data-icon="inline-start" />
                Upload
              </Button>
              <Button
                className="min-w-0 flex-1 md:w-36 md:flex-none"
                disabled={!original || status === "exporting"}
                onClick={onExportPng}
              >
                <DownloadIcon data-icon="inline-start" />
                {status === "exporting" ? "[EXPORTING]" : "Export PNG"}
              </Button>
            </div>
            <ToggleGroup
              type="single"
              value={viewScale}
              variant="outline"
              className="order-2 hidden h-full w-full md:order-1 md:flex md:max-w-72"
              onValueChange={(value) => {
                if (value) {
                  onViewScaleChange(value as ViewScale)
                }
              }}
            >
              <ToggleGroupItem value="fit" className="h-full flex-1">
                Fit
              </ToggleGroupItem>
              <ToggleGroupItem value="actual" className="h-full flex-1">
                1:1
              </ToggleGroupItem>
            </ToggleGroup>
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
      ? "EXPORTING PNG"
      : busy
        ? "PROCESSING PREVIEW"
        : "PREVIEW ONLY"
  const detail =
    status === "exporting"
      ? "Preparing full-size PNG export."
      : previewReduced
        ? `Showing reduced preview while full ${algorithm} output catches up.`
        : status === "queued"
          ? "Queued. Controls remain editable."
          : `${algorithm} worker is running. New changes replace queued preview.`

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 rounded-xl border border-primary bg-background/95 p-3 shadow-none">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-2xl leading-none tracking-[-0.04em] uppercase">
            {title}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
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

const CanvasPanel = React.memo(function CanvasPanel({
  buffer,
  expectedHeight,
  expectedWidth,
  label,
  missing = false,
  status,
  viewScale,
}: CanvasPanelProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameStyle = getPreviewFrameStyle({
    sourceHeight: expectedHeight,
    sourceWidth: expectedWidth,
    viewScale,
  })

  React.useEffect(() => {
    if (!buffer || !canvasRef.current) {
      return
    }

    drawPixelBuffer(canvasRef.current, buffer)
  }, [buffer])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 items-center justify-center",
          viewScale === "fit" ? "overflow-hidden" : "overflow-auto",
          viewScale === "actual" && "items-start justify-start"
        )}
        style={viewScale === "fit" ? { containerType: "size" } : undefined}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-background ring-1 ring-foreground/10",
            missing && "border border-dashed border-border ring-0",
            viewScale === "actual" && "h-fit w-fit max-w-none"
          )}
          style={frameStyle}
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
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center font-mono text-[10px] tracking-[0.1em] text-foreground/80 uppercase">
            <span className="bg-background/80 px-1.5 py-0.5">{label}</span>
          </div>
        </div>
      </div>
    </div>
  )
}, areCanvasPanelPropsEqual)

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
      <div className="flex flex-col gap-1 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        <span>[{status ?? "processing"}]</span>
        <span>
          {width}x{height}
        </span>
      </div>
    </div>
  )
}
