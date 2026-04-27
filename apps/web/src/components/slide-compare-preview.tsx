import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

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

export const SlideComparePreview = React.memo(function SlideComparePreview({
  dividerPercent,
  displayHeight,
  displayWidth,
  manualDisplayHeight,
  manualDisplayWidth,
  initialViewportBox,
  original,
  pixelInspectorEnabled = true,
  processed,
  previewViewport,
  status,
  viewScale,
  onDividerChange,
  onViewportChange,
  onViewportBoxChange,
}: SlideComparePreviewProps) {
  const originalCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const viewportRef = React.useRef(previewViewport ?? null)
  const dividerLineRef = React.useRef<HTMLDivElement>(null)
  const dividerHandleRef = React.useRef<HTMLButtonElement>(null)
  const dividerPercentRef = React.useRef(clampSlideDivider(dividerPercent))
  const pendingDividerPercentRef = React.useRef(dividerPercentRef.current)
  const dividerAnimationFrameRef = React.useRef<number | null>(null)
  const [viewportBox, setViewportBox] = React.useState<{
    height: number
    width: number
  } | null>(initialViewportBox ?? null)
  const processedReady = Boolean(processed)
  const frameWidth = displayWidth ?? processed?.width ?? original.width
  const frameHeight = displayHeight ?? processed?.height ?? original.height
  const manualFrameWidth = manualDisplayWidth ?? frameWidth
  const manualFrameHeight = manualDisplayHeight ?? frameHeight
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
  const dividerLine = processedReady ? (
    <div
      ref={dividerLineRef}
      className="pointer-events-none absolute inset-y-0 w-px bg-primary ring-1 ring-background/75"
      style={{ left: `${effectiveDividerPercent}%` }}
    />
  ) : null
  const dividerHandle = processedReady ? (
    <button
      ref={dividerHandleRef}
      type="button"
      aria-label="Slide comparison divider"
      aria-valuemax={SLIDE_COMPARE_MAX}
      aria-valuemin={SLIDE_COMPARE_MIN}
      aria-valuenow={Math.round(clampedDivider)}
      className="absolute top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 border border-primary bg-background font-mono text-[10px] text-primary ring-2 ring-background/75 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      role="slider"
      style={{ left: `${dividerViewportPercent}%`, touchAction: "none" }}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
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

        commitDividerFromPointer(event.clientX)
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
    >
      ||
    </button>
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
    },
    [frameHeight, frameWidth, previewViewport, viewportBox]
  )

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!processed || !processedCanvasRef.current) {
      return
    }

    drawPixelBuffer(processedCanvasRef.current, processed)
    applyDividerVisual(dividerPercentRef.current)
  }, [applyDividerVisual, processed])

  React.useEffect(() => {
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
    pendingDividerPercentRef.current = clampSlideDivider(percent)

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
        frameRef={frameRef}
        imageHeight={frameHeight}
        imageWidth={frameWidth}
        initialViewportBox={initialViewportBox}
        manualImageHeight={manualFrameHeight}
        manualImageWidth={manualFrameWidth}
        inspectorBuffers={{ original, processed }}
        nativeWheel
        pixelInspectorEnabled={pixelInspectorEnabled}
        pointerInteractionEnabled={processedReady}
        previewViewport={previewViewport}
        viewScale={viewScale}
        onManualFramePositionChange={(viewport) => {
          viewportRef.current = viewport
          applyDividerVisual(dividerPercentRef.current)
        }}
        fitPointerInteraction={{
          onCommit: commitDividerFromPointer,
          onUpdate: updateDividerFromPointer,
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
                    [{status ?? "processing"}]
                  </div>
                )}
              </div>
              {dividerHandle}
            </>
          )
        }}
      </PreviewPresentationSurface>
    </div>
  )
}, areSlideComparePreviewPropsEqual)
