import * as React from "react"
import type { PixelBuffer } from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

import { drawPixelBuffer } from "@/lib/image"
import {
  SLIDE_COMPARE_MAX,
  SLIDE_COMPARE_MIN,
  clampSlideDivider,
  getSlideCompareDisplaySize,
  getSlideDividerFromClientX,
  getSlideDividerFromKey,
} from "@/lib/slide-compare"

const SLIDE_COMPARE_FIT_INSET = 12

export type SlideCompareViewScale = "fit" | "actual"

export function SlideComparePreview({
  dividerPercent,
  original,
  processed,
  status,
  viewScale,
  onDividerChange,
}: {
  dividerPercent: number
  original: PixelBuffer
  processed: PixelBuffer | null
  status?: string
  viewScale: SlideCompareViewScale
  onDividerChange: (percent: number) => void
}) {
  const originalCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const dividerLineRef = React.useRef<HTMLDivElement>(null)
  const dividerHandleRef = React.useRef<HTMLButtonElement>(null)
  const dividerPercentRef = React.useRef(clampSlideDivider(dividerPercent))
  const pendingDividerPercentRef = React.useRef(dividerPercentRef.current)
  const dividerAnimationFrameRef = React.useRef<number | null>(null)
  const processedReady = Boolean(processed)
  const frameWidth = processed?.width ?? original.width
  const frameHeight = processed?.height ?? original.height
  const clampedDivider = clampSlideDivider(dividerPercent)
  const [viewportSize, setViewportSize] = React.useState<{
    height: number
    width: number
  } | null>(null)
  const displaySize = getSlideCompareDisplaySize({
    containerHeight: viewportSize?.height,
    containerWidth: viewportSize?.width,
    fitInset: SLIDE_COMPARE_FIT_INSET,
    sourceHeight: frameHeight,
    sourceWidth: frameWidth,
    viewScale,
  })

  React.useEffect(() => {
    if (!originalCanvasRef.current) {
      return
    }

    drawPixelBuffer(originalCanvasRef.current, original)
  }, [original])

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
    }
  }, [])

  React.useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport || typeof ResizeObserver === "undefined") {
      return
    }

    const updateViewportSize = () => {
      const rect = viewport.getBoundingClientRect()
      setViewportSize((current) => {
        const next = {
          height: Math.floor(rect.height),
          width: Math.floor(rect.width),
        }

        if (
          current &&
          current.height === next.height &&
          current.width === next.width
        ) {
          return current
        }

        return next
      })
    }

    updateViewportSize()
    const frameId = requestAnimationFrame(updateViewportSize)

    const observer = new ResizeObserver(updateViewportSize)
    observer.observe(viewport)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [])

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

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <div
        ref={viewportRef}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 items-center justify-center",
          viewScale === "fit" ? "overflow-hidden" : "overflow-auto",
          viewScale === "actual" && "items-start justify-start"
        )}
      >
        <div
          ref={frameRef}
          className={cn(
            "relative overflow-hidden bg-background ring-1 ring-foreground/10",
            processedReady && "cursor-ew-resize",
            viewScale === "fit" ? "shrink-0" : "h-fit w-fit max-w-none"
          )}
          style={{
            height: `${displaySize.height}px`,
            width: `${displaySize.width}px`,
          }}
          onPointerDown={(event) => {
            if (!processedReady) {
              return
            }

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
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.1em] text-foreground/80 uppercase">
            <span className="bg-background/80 px-1.5 py-0.5">Original</span>
            <span className="bg-background/80 px-1.5 py-0.5">Processed</span>
          </div>
          {processedReady ? (
            <>
              <div
                ref={dividerLineRef}
                className="pointer-events-none absolute inset-y-0 w-px bg-foreground ring-1 ring-background/75"
                style={{ left: `${clampedDivider}%` }}
              />
              <button
                ref={dividerHandleRef}
                type="button"
                aria-label="Slide comparison divider"
                aria-valuemax={SLIDE_COMPARE_MAX}
                aria-valuemin={SLIDE_COMPARE_MIN}
                aria-valuenow={Math.round(clampedDivider)}
                className="absolute top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground bg-background font-mono text-[10px] text-foreground ring-2 ring-background/75 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                role="slider"
                style={{ left: `${clampedDivider}%` }}
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-background/80 p-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              [{status ?? "processing"}]
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
