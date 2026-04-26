import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

import { drawPixelBuffer, drawPixelBufferToCanvasSize } from "@/lib/image"
import {
  getPixelInspectorSample,
  type PixelInspectorSample,
} from "@/lib/pixel-inspector"
import {
  SLIDE_COMPARE_MAX,
  SLIDE_COMPARE_MIN,
  clampSlideDivider,
  getSlideDividerFromClientX,
  getSlideDividerFromKey,
} from "@/lib/slide-compare"
import { getPreviewFrameStyle } from "@/lib/preview-frame"
import {
  clampManualViewportCenter,
  getAnchoredZoomViewport,
  getDisplayPointImageCoordinates,
  getFramePointImageCoordinates,
  getManualViewportDisplayMetrics,
  getManualViewportScale,
  getViewportPointImageCoordinates,
  getWheelZoom,
} from "@/lib/preview-viewport"
import {
  areSlideComparePreviewPropsEqual,
  type SlideComparePreviewProps,
} from "@/components/preview-render-boundaries"

export const SlideComparePreview = React.memo(function SlideComparePreview({
  dividerPercent,
  displayHeight,
  displayWidth,
  original,
  pixelInspectorEnabled = true,
  processed,
  previewViewport,
  status,
  viewScale,
  onDividerChange,
  onViewportChange,
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
  const processedReady = Boolean(processed)
  const frameWidth = displayWidth ?? processed?.width ?? original.width
  const frameHeight = displayHeight ?? processed?.height ?? original.height
  const clampedDivider = clampSlideDivider(dividerPercent)
  const manualScale =
    previewViewport?.mode === "manual"
      ? getManualViewportScale({
          imageHeight: frameHeight,
          imageWidth: frameWidth,
          viewportHeight: viewportBox?.height ?? frameHeight,
          viewportWidth: viewportBox?.width ?? frameWidth,
          zoom: previewViewport.zoom,
        })
      : 1
  const manualDisplayMetrics =
    previewViewport?.mode === "manual"
      ? getManualViewportDisplayMetrics({
          imageHeight: frameHeight,
          imageWidth: frameWidth,
          viewportHeight: viewportBox?.height ?? frameHeight,
          viewportWidth: viewportBox?.width ?? frameWidth,
          zoom: previewViewport.zoom,
        })
      : null
  const frameStyle = getPreviewFrameStyle({
    sourceHeight: frameHeight,
    sourceWidth: frameWidth,
    viewScale,
  })
  const effectiveFrameStyle =
    previewViewport?.mode === "manual"
      ? {
          height: `${manualDisplayMetrics?.displayHeight ?? Math.max(1, Math.round(frameHeight * manualScale))}px`,
          left: "50%",
          marginLeft: `${-Math.round(previewViewport.center.x * (manualDisplayMetrics?.pixelScaleX ?? manualScale))}px`,
          marginTop: `${-Math.round(previewViewport.center.y * (manualDisplayMetrics?.pixelScaleY ?? manualScale))}px`,
          position: "absolute" as const,
          top: "50%",
          width: `${manualDisplayMetrics?.displayWidth ?? Math.max(1, Math.round(frameWidth * manualScale))}px`,
        }
      : frameStyle

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
  }, [processed])

  React.useEffect(() => {
    dividerPercentRef.current = clampedDivider
    pendingDividerPercentRef.current = clampedDivider
    applyDividerVisual(clampedDivider)
  }, [clampedDivider])

  React.useEffect(() => {
    return () => {
      if (dividerAnimationFrameRef.current !== null) {
        cancelAnimationFrame(dividerAnimationFrameRef.current)
      }

      if (panAnimationFrameRef.current !== null) {
        cancelAnimationFrame(panAnimationFrameRef.current)
      }
    }
  }, [])

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
        imageHeight: frameHeight,
        imageWidth: frameWidth,
        viewportHeight: viewportRect.height,
        viewportWidth: viewportRect.width,
        zoom: previewViewport.zoom,
      })

      frameRef.current.style.marginLeft = `${-Math.round(center.x * metrics.pixelScaleX)}px`
      frameRef.current.style.marginTop = `${-Math.round(center.y * metrics.pixelScaleY)}px`
    },
    [frameHeight, frameWidth, previewViewport]
  )

  const applyManualFrameViewport = React.useCallback(
    (viewport: NonNullable<typeof previewViewport>) => {
      if (viewport.mode !== "manual" || !frameRef.current) {
        return
      }

      const viewportRect = getFrameViewportRect(frameRef.current)
      const metrics = getManualViewportDisplayMetrics({
        imageHeight: frameHeight,
        imageWidth: frameWidth,
        viewportHeight: viewportRect.height,
        viewportWidth: viewportRect.width,
        zoom: viewport.zoom,
      })

      frameRef.current.style.height = `${metrics.displayHeight}px`
      frameRef.current.style.marginLeft = `${-Math.round(viewport.center.x * metrics.pixelScaleX)}px`
      frameRef.current.style.marginTop = `${-Math.round(viewport.center.y * metrics.pixelScaleY)}px`
      frameRef.current.style.width = `${metrics.displayWidth}px`
    },
    [frameHeight, frameWidth]
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

  function scheduleManualFramePosition(center: { x: number; y: number }) {
    if (panAnimationFrameRef.current !== null) {
      cancelAnimationFrame(panAnimationFrameRef.current)
    }

    panAnimationFrameRef.current = requestAnimationFrame(() => {
      panAnimationFrameRef.current = null
      applyManualFramePosition(center)
    })
  }

  function applyDividerVisual(percent: number) {
    const nextPercent = clampSlideDivider(percent)

    if (processedCanvasRef.current) {
      processedCanvasRef.current.style.clipPath = `inset(0 0 0 ${nextPercent}%)`
    }

    if (dividerLineRef.current) {
      dividerLineRef.current.style.left = `${nextPercent}%`
    }

    if (dividerHandleRef.current) {
      dividerHandleRef.current.style.left = `${nextPercent}%`
      dividerHandleRef.current.setAttribute(
        "aria-valuenow",
        String(Math.round(nextPercent))
      )
    }
  }

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

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const currentViewport = viewportRef.current ?? previewViewport

    if (!currentViewport || !frameRef.current) {
      return
    }

    event.preventDefault()

    const viewportRect =
      event.currentTarget.parentElement?.getBoundingClientRect() ??
      event.currentTarget.getBoundingClientRect()
    const anchorViewportPoint = {
      x: event.clientX - viewportRect.left,
      y: event.clientY - viewportRect.top,
    }
    const coordinates = getViewportPointImageCoordinates({
      imageHeight: frameHeight,
      imageWidth: frameWidth,
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
          imageHeight: frameHeight,
          imageWidth: frameWidth,
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

    onViewportChange?.({
      mode: "manual",
      zoom: nextViewport.zoom,
      center: nextViewport.center,
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
            imageHeight: frameHeight,
            imageWidth: frameWidth,
            viewportHeight: getFrameViewportRect(frameRef.current).height,
            viewportWidth: getFrameViewportRect(frameRef.current).width,
            zoom: previewViewport.zoom,
          })
        : getDisplayPointImageCoordinates({
            clientX: event.clientX,
            clientY: event.clientY,
            frameLeft: rect.left,
            frameTop: rect.top,
            imageHeight: frameHeight,
            imageWidth: frameWidth,
            viewport: previewViewport,
            viewportHeight: rect.height,
            viewportWidth: rect.width,
          })

    setInspector(
      coordinates
        ? getPixelInspectorSample({
            coordinates,
            original,
            processed,
          })
        : null
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 items-center justify-center",
          "overflow-hidden",
          viewScale === "actual" &&
            (previewViewport?.loupeEnabled
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing")
        )}
        style={viewScale === "fit" ? { containerType: "size" } : undefined}
      >
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
            viewScale === "fit" ? "shrink-0" : "h-fit w-fit max-w-none shrink-0"
          )}
          style={{ ...effectiveFrameStyle, touchAction: "none" }}
          onWheel={handleWheel}
          onPointerDown={(event) => {
            if (!processedReady) {
              return
            }

            event.currentTarget.setPointerCapture(event.pointerId)
            if (previewViewport?.mode === "manual") {
              panStateRef.current = {
                center: previewViewport.center,
                pointerX: event.clientX,
                pointerY: event.clientY,
              }
              return
            }

            updateDividerFromPointer(event.clientX)
          }}
          onPointerMove={(event) => {
            inspectPointer(event)

            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              if (previewViewport?.mode === "manual") {
                if (!panStateRef.current) {
                  return
                }

                const viewportRect =
                  event.currentTarget.parentElement?.getBoundingClientRect() ??
                  event.currentTarget.getBoundingClientRect()
                const scale = getManualViewportScale({
                  imageHeight: frameHeight,
                  imageWidth: frameWidth,
                  viewportHeight: viewportRect.height,
                  viewportWidth: viewportRect.width,
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
                  imageHeight: frameHeight,
                  imageWidth: frameWidth,
                  viewportHeight: viewportRect.height,
                  viewportWidth: viewportRect.width,
                  zoom: previewViewport.zoom,
                })

                panStateRef.current = {
                  center: nextCenter,
                  pointerX: event.clientX,
                  pointerY: event.clientY,
                }
                scheduleManualFramePosition(nextCenter)
                return
              }

              updateDividerFromPointer(event.clientX)
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }

            if (previewViewport?.mode !== "manual") {
              commitDividerFromPointer(event.clientX)
            }

            if (panStateRef.current) {
              onViewportChange?.({ center: panStateRef.current.center })
              panStateRef.current = null
            }
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }

            panStateRef.current = null
          }}
          onPointerLeave={() => setInspector(null)}
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
                clipPath: `inset(0 0 0 ${clampedDivider}%)`,
              }}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center justify-between gap-2 font-mono text-[10px] text-foreground/80">
            <span className="bg-background/80 px-1.5 py-0.5">Original</span>
            <span className="bg-background/80 px-1.5 py-0.5">Processed</span>
          </div>
          {processedReady ? (
            <>
              <div
                ref={dividerLineRef}
                className="pointer-events-none absolute inset-y-0 w-px bg-primary ring-1 ring-background/75"
                style={{ left: `${clampedDivider}%` }}
              />
              <button
                ref={dividerHandleRef}
                type="button"
                aria-label="Slide comparison divider"
                aria-valuemax={SLIDE_COMPARE_MAX}
                aria-valuemin={SLIDE_COMPARE_MIN}
                aria-valuenow={Math.round(clampedDivider)}
                className="absolute top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 border border-primary bg-background font-mono text-[10px] text-primary ring-2 ring-background/75 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                role="slider"
                style={{ left: `${clampedDivider}%`, touchAction: "none" }}
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
            </>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-background/80 p-2 font-mono text-[11px] text-muted-foreground">
              [{status ?? "processing"}]
            </div>
          )}
        </div>
        {pixelInspectorEnabled && inspector ? (
          <PixelInspector sample={inspector} />
        ) : null}
      </div>
    </div>
  )
}, areSlideComparePreviewPropsEqual)

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
