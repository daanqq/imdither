import * as React from "react"
import type { PixelBuffer } from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

import { getPinchGestureViewport } from "@/lib/preview-gestures"
import {
  getPreviewPresentationFrame,
  getPreviewPresentationPanCenter,
  getPreviewPresentationWheelViewport,
} from "@/lib/preview-presentation"
import {
  getDisplayPointImageCoordinates,
  getFramePointImageCoordinates,
  getManualViewportDisplayMetrics,
  type PreviewViewport,
  type ViewportCenter,
} from "@/lib/preview-viewport"
import {
  getPixelInspectorSample,
  type PixelInspectorSample,
} from "@/lib/pixel-inspector"
import type { ViewScale } from "@/store/editor-store"

type ViewportBox = {
  height: number
  width: number
}

type PointerPair = {
  first: ViewportCenter
  second: ViewportCenter
}

type PreviewPresentationSurfaceRenderProps = {
  centeredManualViewport: boolean
  frameRef: React.RefObject<HTMLDivElement | null>
  frameStyle: React.CSSProperties
  viewportBox: ViewportBox | null
}

type PreviewPresentationFitPointerInteraction = {
  onCommit: (clientX: number) => void
  onUpdate: (clientX: number) => void
}

export type PreviewPresentationSurfaceProps = {
  children: (props: PreviewPresentationSurfaceRenderProps) => React.ReactNode
  className?: string
  frameRef?: React.RefObject<HTMLDivElement | null>
  imageHeight: number
  imageWidth: number
  initialViewportBox?: ViewportBox | null
  manualImageHeight?: number
  manualImageWidth?: number
  inspectorBuffers: {
    original: PixelBuffer | null
    processed: PixelBuffer | null
  }
  fitPointerInteraction?: PreviewPresentationFitPointerInteraction
  nativeWheel?: boolean
  pixelInspectorEnabled?: boolean
  pointerInteractionEnabled?: boolean
  previewViewport?: PreviewViewport | null
  style?: React.CSSProperties
  viewScale: ViewScale
  onManualFramePositionChange?: (viewport: PreviewViewport) => void
  onViewportBoxChange?: (box: ViewportBox) => void
  onViewportChange?: (viewport: Partial<PreviewViewport>) => void
}

export function PreviewPresentationSurface({
  children,
  className,
  frameRef: externalFrameRef,
  imageHeight,
  imageWidth,
  initialViewportBox,
  manualImageHeight = imageHeight,
  manualImageWidth = imageWidth,
  inspectorBuffers,
  fitPointerInteraction,
  nativeWheel = false,
  pixelInspectorEnabled = true,
  pointerInteractionEnabled = true,
  previewViewport,
  style,
  viewScale,
  onManualFramePositionChange,
  onViewportBoxChange,
  onViewportChange,
}: PreviewPresentationSurfaceProps) {
  const viewportElementRef = React.useRef<HTMLDivElement>(null)
  const fallbackFrameRef = React.useRef<HTMLDivElement>(null)
  const frameRef = externalFrameRef ?? fallbackFrameRef
  const viewportRef = React.useRef<PreviewViewport | null>(
    previewViewport ?? null
  )
  const panStateRef = React.useRef<{
    center: ViewportCenter
    pointerX: number
    pointerY: number
  } | null>(null)
  const activePointersRef = React.useRef(new Map<number, ViewportCenter>())
  const pinchStateRef = React.useRef<{
    latestViewport: PreviewViewport | null
    startPointers: PointerPair
    startViewport: PreviewViewport
  } | null>(null)
  const panAnimationFrameRef = React.useRef<number | null>(null)
  const [inspector, setInspector] = React.useState<PixelInspectorSample | null>(
    null
  )
  const [viewportBox, setViewportBox] = React.useState<ViewportBox | null>(
    initialViewportBox ?? null
  )
  const onViewportBoxChangeRef = React.useRef(onViewportBoxChange)
  const lastNotifiedViewportBoxRef = React.useRef<ViewportBox | null>(null)
  const presentationFrame = getPreviewPresentationFrame({
    imageHeight,
    imageWidth,
    viewport: previewViewport,
    viewportBox,
    viewScale,
  })
  const centeredManualViewport = presentationFrame.centeredManualViewport

  const applyManualFramePosition = React.useCallback(
    (center: ViewportCenter) => {
      if (
        !previewViewport ||
        previewViewport.mode !== "manual" ||
        !frameRef.current
      ) {
        return
      }

      const viewportRect = getFrameViewportRect(frameRef.current)
      const metrics = getManualViewportDisplayMetrics({
        imageHeight: manualImageHeight,
        imageWidth: manualImageWidth,
        viewportHeight: viewportRect.height,
        viewportWidth: viewportRect.width,
        zoom: previewViewport.zoom,
      })

      frameRef.current.style.marginLeft = `${-Math.round(center.x * metrics.pixelScaleX)}px`
      frameRef.current.style.marginTop = `${-Math.round(center.y * metrics.pixelScaleY)}px`
      onManualFramePositionChange?.({
        ...previewViewport,
        center,
      })
    },
    [
      frameRef,
      manualImageHeight,
      manualImageWidth,
      onManualFramePositionChange,
      previewViewport,
    ]
  )

  const applyManualFrameViewport = React.useCallback(
    (viewport: PreviewViewport) => {
      if (viewport.mode !== "manual" || !frameRef.current) {
        return
      }

      const viewportRect = getFrameViewportRect(frameRef.current)
      const metrics = getManualViewportDisplayMetrics({
        imageHeight: manualImageHeight,
        imageWidth: manualImageWidth,
        viewportHeight: viewportRect.height,
        viewportWidth: viewportRect.width,
        zoom: viewport.zoom,
      })

      frameRef.current.style.height = `${metrics.displayHeight}px`
      frameRef.current.style.marginLeft = `${-Math.round(viewport.center.x * metrics.pixelScaleX)}px`
      frameRef.current.style.marginTop = `${-Math.round(viewport.center.y * metrics.pixelScaleY)}px`
      frameRef.current.style.width = `${metrics.displayWidth}px`
      onManualFramePositionChange?.(viewport)
    },
    [frameRef, manualImageHeight, manualImageWidth, onManualFramePositionChange]
  )

  React.useLayoutEffect(() => {
    onViewportBoxChangeRef.current = onViewportBoxChange
  }, [onViewportBoxChange])

  React.useLayoutEffect(() => {
    if (!viewportBox) {
      return
    }

    const lastNotifiedViewportBox = lastNotifiedViewportBoxRef.current

    if (
      lastNotifiedViewportBox?.height === viewportBox.height &&
      lastNotifiedViewportBox.width === viewportBox.width
    ) {
      return
    }

    lastNotifiedViewportBoxRef.current = viewportBox
    onViewportBoxChangeRef.current?.(viewportBox)
  }, [viewportBox])

  React.useLayoutEffect(() => {
    const viewportElement = viewportElementRef.current

    if (!viewportElement) {
      return
    }

    const updateViewportBox = () => {
      const rect = viewportElement.getBoundingClientRect()
      const nextViewportBox = {
        height: Math.max(1, Math.round(rect.height)),
        width: Math.max(1, Math.round(rect.width)),
      }

      setViewportBox((currentViewportBox) => {
        if (
          currentViewportBox?.height === nextViewportBox.height &&
          currentViewportBox.width === nextViewportBox.width
        ) {
          return currentViewportBox
        }

        return nextViewportBox
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

  const handleWheel = React.useCallback(
    (
      event: Pick<
        WheelEvent,
        "clientX" | "clientY" | "deltaY" | "preventDefault"
      >
    ) => {
      const currentViewport = viewportRef.current ?? previewViewport
      const viewportElement = viewportElementRef.current

      if (!currentViewport || !frameRef.current || !viewportElement) {
        return
      }

      event.preventDefault()

      const viewportRect = viewportElement.getBoundingClientRect()
      const anchorViewportPoint = {
        x: event.clientX - viewportRect.left,
        y: event.clientY - viewportRect.top,
      }
      const nextViewport = getPreviewPresentationWheelViewport({
        deltaY: event.deltaY,
        imageHeight: manualImageHeight,
        imageWidth: manualImageWidth,
        pointer: anchorViewportPoint,
        viewport: currentViewport,
        viewportBox: viewportRect,
      })

      viewportRef.current = nextViewport
      applyManualFrameViewport(nextViewport)

      onViewportChange?.({
        mode: "manual",
        zoom: nextViewport.zoom,
        center: nextViewport.center,
      })
    },
    [
      applyManualFrameViewport,
      frameRef,
      manualImageHeight,
      manualImageWidth,
      onViewportChange,
      previewViewport,
    ]
  )

  React.useEffect(() => {
    const viewportElement = viewportElementRef.current

    if (!nativeWheel || !viewportElement) {
      return
    }

    const handleNativeWheel = (event: WheelEvent) => {
      handleWheel(event)
    }

    viewportElement.addEventListener("wheel", handleNativeWheel, {
      passive: false,
    })

    return () => {
      viewportElement.removeEventListener("wheel", handleNativeWheel)
    }
  }, [handleWheel, nativeWheel])

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

  function scheduleManualFramePosition(center: ViewportCenter) {
    if (panAnimationFrameRef.current !== null) {
      cancelAnimationFrame(panAnimationFrameRef.current)
    }

    panAnimationFrameRef.current = requestAnimationFrame(() => {
      panAnimationFrameRef.current = null
      applyManualFramePosition(center)
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

    const viewportRect = element.getBoundingClientRect()
    const nextViewport = getPinchGestureViewport({
      currentPointers: pointerPair,
      imageHeight: manualImageHeight,
      imageWidth: manualImageWidth,
      startPointers: pinchState.startPointers,
      startViewport: pinchState.startViewport,
      viewportHeight: viewportRect.height,
      viewportWidth: viewportRect.width,
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
      onViewportChange?.({
        mode: "manual",
        zoom: latestViewport.zoom,
        center: latestViewport.center,
      })
    }

    pinchStateRef.current = null
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
            imageHeight,
            imageWidth,
            viewportHeight: getFrameViewportRect(frameRef.current).height,
            viewportWidth: getFrameViewportRect(frameRef.current).width,
            zoom: previewViewport.zoom,
          })
        : getDisplayPointImageCoordinates({
            clientX: event.clientX,
            clientY: event.clientY,
            frameLeft: rect.left,
            frameTop: rect.top,
            imageHeight,
            imageWidth,
            viewport: previewViewport,
            viewportHeight: rect.height,
            viewportWidth: rect.width,
          })

    setInspector(
      coordinates
        ? getPixelInspectorSample({
            coordinates,
            ...inspectorBuffers,
          })
        : null
    )
  }

  return (
    <div
      ref={viewportElementRef}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden",
        className
      )}
      style={{
        ...(viewScale === "fit" || centeredManualViewport
          ? { containerType: "size" as const }
          : null),
        ...style,
        touchAction: "none",
      }}
      onWheel={nativeWheel ? undefined : handleWheel}
      onPointerDown={(event) => {
        if (!pointerInteractionEnabled) {
          return
        }

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

        if (currentViewport?.mode === "manual") {
          panStateRef.current = {
            center: currentViewport.center,
            pointerX: event.clientX,
            pointerY: event.clientY,
          }
          return
        }

        fitPointerInteraction?.onUpdate(event.clientX)
      }}
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

        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return
        }

        if (previewViewport?.mode === "manual") {
          if (!panStateRef.current) {
            return
          }

          const viewportRect = event.currentTarget.getBoundingClientRect()
          const nextCenter = getPreviewPresentationPanCenter({
            imageHeight,
            imageWidth,
            pointerDeltaX: event.clientX - panStateRef.current.pointerX,
            pointerDeltaY: event.clientY - panStateRef.current.pointerY,
            startCenter: panStateRef.current.center,
            viewportBox: viewportRect,
            zoom: previewViewport.zoom,
          })

          panStateRef.current = {
            center: nextCenter,
            pointerX: event.clientX,
            pointerY: event.clientY,
          }
          viewportRef.current = {
            ...previewViewport,
            center: nextCenter,
          }
          scheduleManualFramePosition(nextCenter)
          return
        }

        fitPointerInteraction?.onUpdate(event.clientX)
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

        if (previewViewport?.mode !== "manual") {
          fitPointerInteraction?.onCommit(event.clientX)
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

        activePointersRef.current.delete(event.pointerId)
        pinchStateRef.current = null
        panStateRef.current = null
      }}
    >
      {children({
        centeredManualViewport,
        frameRef,
        frameStyle: presentationFrame.style,
        viewportBox,
      })}
      {pixelInspectorEnabled && inspector ? (
        <PixelInspector sample={inspector} />
      ) : null}
    </div>
  )
}

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
  const rect =
    element.parentElement?.getBoundingClientRect() ??
    element.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function getActivePointerPair(pointers: Map<number, ViewportCenter>) {
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
