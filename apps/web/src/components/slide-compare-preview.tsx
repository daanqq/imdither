import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronsLeftRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PreviewPresentationSurface } from "@/components/preview-presentation"
import { drawPixelBuffer, drawPixelBufferToCanvasSize } from "@/lib/image"
import {
  SLIDE_COMPARE_MAX,
  SLIDE_COMPARE_MIN,
  clampSlideDivider,
  getSlideDividerFromClientX,
  getSlideDividerFromKey,
} from "@/lib/slide-compare"
import {
  getPreviewPresentationDividerPercent,
  getPreviewPresentationViewportDividerPercent,
} from "@/lib/preview-presentation"
import {
  areSlideComparePreviewPropsEqual,
  type SlideComparePreviewProps,
} from "@/components/preview-render-boundaries"
import {
  usePreviewCanvasRedrawBoundary,
  usePreviewSurfaceLifecycle,
} from "@/components/preview-surface-lifecycle"

const EDGE_LABEL_HIDE_THRESHOLD = 18

export const SlideComparePreview = React.memo(function SlideComparePreview({
  dividerPercent,
  displayModel,
  initialViewportBox,
  original,
  pixelInspectorEnabled = true,
  processed,
  previewViewport,
  status,
  onDividerChange,
  onViewportChange,
  onViewportBoxChange,
}: SlideComparePreviewProps) {
  const { t } = useTranslation()
  const surfaceLifecycle = usePreviewSurfaceLifecycle()
  const originalCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const viewportRef = React.useRef(previewViewport ?? null)
  const dividerLineRef = React.useRef<HTMLDivElement>(null)
  const dividerHandleRef = React.useRef<HTMLButtonElement>(null)
  const originalLabelRef = React.useRef<HTMLSpanElement>(null)
  const processedLabelRef = React.useRef<HTMLSpanElement>(null)
  const dividerPercentRef = React.useRef(clampSlideDivider(dividerPercent))
  const pendingDividerPercentRef = React.useRef(dividerPercentRef.current)
  const dividerAnimationFrameRef = React.useRef<number | null>(null)
  const isDividerDraggingRef = React.useRef(false)
  const [viewportBox, setViewportBox] = React.useState<{
    height: number
    width: number
  } | null>(initialViewportBox ?? surfaceLifecycle.initialViewportBox)
  const processedReady = Boolean(processed)
  const frameWidth = displayModel.frameWidth
  const frameHeight = displayModel.frameHeight
  const viewScale = displayModel.viewScale
  const clampedDivider = clampSlideDivider(dividerPercent)
  const effectiveDividerPercent = getPreviewPresentationDividerPercent({
    dividerPercent: clampedDivider,
    imageHeight: frameHeight,
    imageWidth: frameWidth,
    viewport: previewViewport,
    viewportBox,
  })
  const dividerViewportPercent = getPreviewPresentationViewportDividerPercent({
    dividerPercent: effectiveDividerPercent,
    imageHeight: frameHeight,
    imageWidth: frameWidth,
    viewport: previewViewport,
    viewportBox,
  })
  const hideOriginalLabel = dividerViewportPercent < EDGE_LABEL_HIDE_THRESHOLD
  const hideProcessedLabel =
    dividerViewportPercent > 100 - EDGE_LABEL_HIDE_THRESHOLD
  const dividerLine = processedReady ? (
    <div
      ref={dividerLineRef}
      className="pointer-events-none absolute inset-y-0 w-[1.5px] -translate-x-1/2 bg-primary shadow-[0_0_0_1px_color-mix(in_srgb,var(--background)_70%,transparent)]"
      style={{ left: `${effectiveDividerPercent}%` }}
    />
  ) : null
  const dividerHandle = processedReady ? (
    <button
      ref={dividerHandleRef}
      type="button"
      aria-label={t("compare.dividerAria")}
      aria-valuemax={SLIDE_COMPARE_MAX}
      aria-valuemin={SLIDE_COMPARE_MIN}
      aria-valuenow={Math.round(clampedDivider)}
      className="absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-border bg-[var(--surface-hud)] text-foreground shadow-[var(--shadow-hud)] backdrop-blur-md transition-[transform,border-color,color] duration-150 ease-out outline-none hover:scale-105 hover:border-primary/70 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
      role="slider"
      style={{ left: `${dividerViewportPercent}%`, touchAction: "none" }}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
        isDividerDraggingRef.current = true
        updateDividerFromPointer(event.clientX)
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          updateDividerFromPointer(event.clientX)
        }
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }

        isDividerDraggingRef.current = false
        commitDividerFromPointer(event.clientX)
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }

        isDividerDraggingRef.current = false
      }}
    >
      <ChevronsLeftRightIcon aria-hidden="true" className="size-4" />
    </button>
  ) : null
  const cornerLabels = processedReady ? (
    <>
      <span
        ref={originalLabelRef}
        aria-hidden="true"
        data-hidden={hideOriginalLabel}
        data-slot="slide-label-original"
        className={cn(
          "pointer-events-none absolute bottom-2.5 left-2.5 z-10 rounded-sm border border-border/80 bg-[var(--surface-hud)] px-1.5 py-0.5 font-sans text-[10px] leading-none font-medium text-foreground shadow-[var(--shadow-control)] backdrop-blur-sm transition-opacity duration-150",
          hideOriginalLabel && "opacity-0"
        )}
      >
        {t("compare.original")}
      </span>
      <span
        ref={processedLabelRef}
        aria-hidden="true"
        data-hidden={hideProcessedLabel}
        data-slot="slide-label-processed"
        className={cn(
          "pointer-events-none absolute right-2.5 bottom-2.5 z-10 rounded-sm border border-border/80 bg-[var(--surface-hud)] px-1.5 py-0.5 font-sans text-[10px] leading-none font-medium text-foreground shadow-[var(--shadow-control)] backdrop-blur-sm transition-opacity duration-150",
          hideProcessedLabel && "opacity-0"
        )}
      >
        {t("compare.result")}
      </span>
    </>
  ) : null
  const applyDividerVisual = React.useCallback(
    (percent: number) => {
      const nextPercent = clampSlideDivider(percent)
      const nextEffectivePercent = getPreviewPresentationDividerPercent({
        dividerPercent: nextPercent,
        imageHeight: frameHeight,
        imageWidth: frameWidth,
        viewport: viewportRef.current ?? previewViewport,
        viewportBox,
      })
      const nextViewportPercent = getPreviewPresentationViewportDividerPercent({
        dividerPercent: nextEffectivePercent,
        imageHeight: frameHeight,
        imageWidth: frameWidth,
        viewport: viewportRef.current ?? previewViewport,
        viewportBox,
      })

      if (processedCanvasRef.current) {
        processedCanvasRef.current.style.clipPath = `inset(0 0 0 ${nextEffectivePercent}%)`
      }

      if (dividerLineRef.current) {
        dividerLineRef.current.style.left = `${nextEffectivePercent}%`
      }

      if (dividerHandleRef.current) {
        dividerHandleRef.current.style.left = `${nextViewportPercent}%`
        dividerHandleRef.current.setAttribute(
          "aria-valuenow",
          String(Math.round(nextPercent))
        )
      }

      const shouldHideOriginal = nextViewportPercent < EDGE_LABEL_HIDE_THRESHOLD
      const shouldHideProcessed =
        nextViewportPercent > 100 - EDGE_LABEL_HIDE_THRESHOLD

      if (originalLabelRef.current) {
        originalLabelRef.current.style.opacity = shouldHideOriginal ? "0" : ""
        originalLabelRef.current.setAttribute(
          "data-hidden",
          String(shouldHideOriginal)
        )
      }

      if (processedLabelRef.current) {
        processedLabelRef.current.style.opacity = shouldHideProcessed ? "0" : ""
        processedLabelRef.current.setAttribute(
          "data-hidden",
          String(shouldHideProcessed)
        )
      }
    },
    // oxlint-disable-next-line react/exhaustive-deps -- viewport read via viewportRef
    [frameHeight, frameWidth, viewportBox]
  )

  const drawOriginalCanvas = React.useCallback(() => {
    if (!originalCanvasRef.current) {
      return
    }

    if (processedReady) {
      drawPixelBufferToCanvasSize(originalCanvasRef.current, original, {
        height: frameHeight,
        width: frameWidth,
      })
      return
    }

    drawPixelBuffer(originalCanvasRef.current, original)
  }, [frameHeight, frameWidth, original, processedReady])

  const drawProcessedCanvas = React.useCallback(() => {
    if (!processed || !processedCanvasRef.current) {
      return
    }

    drawPixelBuffer(processedCanvasRef.current, processed)
    applyDividerVisual(dividerPercentRef.current)
  }, [applyDividerVisual, processed])

  const redrawCanvases = React.useCallback(() => {
    drawOriginalCanvas()
    drawProcessedCanvas()
  }, [drawOriginalCanvas, drawProcessedCanvas])
  usePreviewCanvasRedrawBoundary(redrawCanvases)

  React.useEffect(() => {
    // Skip prop sync while dragging — visual is managed by pointer events
    if (isDividerDraggingRef.current) {
      return
    }

    dividerPercentRef.current = clampedDivider
    pendingDividerPercentRef.current = clampedDivider
    applyDividerVisual(clampedDivider)
  }, [applyDividerVisual, clampedDivider])

  React.useEffect(() => {
    return () => {
      if (dividerAnimationFrameRef.current !== null) {
        cancelAnimationFrame(dividerAnimationFrameRef.current)
      }
    }
  }, [])

  React.useLayoutEffect(() => {
    viewportRef.current = previewViewport ?? null
  }, [previewViewport])

  function scheduleDividerVisual(percent: number) {
    const clamped = clampSlideDivider(percent)
    pendingDividerPercentRef.current = clamped
    // Keep dividerPercentRef in sync during drag so canvas redraws use current position
    dividerPercentRef.current = clamped

    if (dividerAnimationFrameRef.current !== null) {
      return
    }

    dividerAnimationFrameRef.current = requestAnimationFrame(() => {
      dividerAnimationFrameRef.current = null
      applyDividerVisual(pendingDividerPercentRef.current)
    })
  }

  function commitDividerVisual(percent: number) {
    const nextPercent = clampSlideDivider(percent)
    dividerPercentRef.current = nextPercent
    pendingDividerPercentRef.current = nextPercent
    applyDividerVisual(nextPercent)
    onDividerChange(nextPercent)
  }

  function getDividerPercentFromPointer(clientX: number) {
    const frame = frameRef.current

    if (!frame || !processedReady) {
      return null
    }

    const rect = frame.getBoundingClientRect()
    return getSlideDividerFromClientX(clientX, rect.left, rect.width)
  }

  function updateDividerFromPointer(clientX: number) {
    const nextPercent = getDividerPercentFromPointer(clientX)

    if (nextPercent === null) {
      return
    }

    scheduleDividerVisual(nextPercent)
  }

  function commitDividerFromPointer(clientX: number) {
    const nextPercent = getDividerPercentFromPointer(clientX)

    if (nextPercent === null) {
      return
    }

    commitDividerVisual(nextPercent)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const nextPercent = getSlideDividerFromKey(
      clampedDivider,
      event.key,
      event.shiftKey
    )

    if (nextPercent === null) {
      return
    }

    event.preventDefault()
    commitDividerVisual(nextPercent)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <PreviewPresentationSurface
        className={cn(
          viewScale === "actual" &&
            (previewViewport?.loupeEnabled
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing")
        )}
        displayModel={displayModel}
        frameRef={frameRef}
        initialViewportBox={initialViewportBox}
        inspectorSource="slide-compare"
        buffers={{ original, processed }}
        capabilities={{
          slideDivider: {
            onCommit: commitDividerFromPointer,
            onUpdate: updateDividerFromPointer,
          },
        }}
        pixelInspectorEnabled={pixelInspectorEnabled}
        previewViewport={previewViewport}
        onManualFramePositionChange={(viewport) => {
          viewportRef.current = viewport

          if (previewViewport?.mode === "manual") {
            applyDividerVisual(dividerPercentRef.current)
          }
        }}
        onViewportBoxChange={(box) => {
          setViewportBox(box)
          onViewportBoxChange?.(box)
        }}
        onViewportChange={onViewportChange}
      >
        {({ frameStyle }) => {
          return (
            <>
              <div
                ref={frameRef}
                className={cn(
                  "relative overflow-hidden bg-background ring-1 ring-border",
                  processedReady &&
                    (previewViewport?.loupeEnabled
                      ? "cursor-default"
                      : previewViewport?.mode === "manual"
                        ? "cursor-grab active:cursor-grabbing"
                        : "cursor-ew-resize"),
                  viewScale === "fit"
                    ? "shrink-0"
                    : "h-fit w-fit max-w-none shrink-0"
                )}
                style={frameStyle}
              >
                <canvas
                  ref={originalCanvasRef}
                  className="absolute inset-0 block size-full bg-background"
                />
                {processedReady ? (
                  <canvas
                    ref={processedCanvasRef}
                    className="absolute inset-0 block size-full bg-background"
                    style={{
                      clipPath: `inset(0 0 0 ${effectiveDividerPercent}%)`,
                    }}
                  />
                ) : null}
                {processedReady ? (
                  dividerLine
                ) : (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-background/80 p-2 font-mono text-[11px] text-muted-foreground">
                    [
                    {t(`preview.status.${status ?? "processing"}`, {
                      defaultValue: status ?? "processing",
                    })}
                    ]
                  </div>
                )}
              </div>
              {cornerLabels}
              {dividerHandle}
            </>
          )
        }}
      </PreviewPresentationSurface>
    </div>
  )
}, areSlideComparePreviewPropsEqual)
