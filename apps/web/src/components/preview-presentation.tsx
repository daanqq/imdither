import * as React from "react"
import type { PixelBuffer } from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

import { SlideComparePreview } from "@/components/slide-compare-preview"
import {
  areCanvasPanelPropsEqual,
  type CanvasPanelProps,
} from "@/components/preview-render-boundaries"
import {
  PreviewSurfaceLifecycleProvider,
  usePreviewCanvasRedrawBoundary,
  usePreviewSurfaceLifecycle,
  type PreviewSurfaceViewportBox,
} from "@/components/preview-surface-lifecycle"
import { drawPixelBuffer } from "@/lib/image"
import {
  getPreviewPresentationDisplayModel,
  getPreviewPresentationFrame,
} from "@/lib/preview-presentation"
import {
  getDisplayPointImageCoordinates,
  getFramePointImageCoordinates,
  getManualViewportDisplayMetrics,
  type PreviewViewport,
} from "@/lib/preview-viewport"
import {
  getPixelInspectorSample,
  type PixelInspectorSample,
} from "@/lib/pixel-inspector"
import { SLIDE_COMPARE_DEFAULT } from "@/lib/slide-compare"
import type { CompareMode, JobStatus, ViewScale } from "@/store/editor-store"
import {
  PreviewViewportInteraction,
  type PreviewViewportInteractionOutcome,
} from "@/lib/preview-viewport-interaction"

type ViewportBox = PreviewSurfaceViewportBox

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

export type PreviewPresentationProps = {
  compareMode: CompareMode
  desktopPrecisionEnabled: boolean
  fullOutputHeight: number
  fullOutputWidth: number
  original: PixelBuffer
  preview: PixelBuffer | null
  previewTargetHeight: number
  previewTargetWidth: number
  previewViewport: PreviewViewport
  status: JobStatus
  onDisplayFrameChange?: (box: ViewportBox) => void
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
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
  const surfaceLifecycle = usePreviewSurfaceLifecycle()
  const viewportElementRef = React.useRef<HTMLDivElement>(null)
  const fallbackFrameRef = React.useRef<HTMLDivElement>(null)
  const frameRef = externalFrameRef ?? fallbackFrameRef
  const [inspector, setInspector] = React.useState<PixelInspectorSample | null>(
    null
  )
  const [viewportBox, setViewportBox] = React.useState<ViewportBox | null>(
    initialViewportBox ?? surfaceLifecycle.initialViewportBox
  )
  const onViewportBoxChangeRef = React.useRef(onViewportBoxChange)
  const lastNotifiedViewportBoxRef = React.useRef<ViewportBox | null>(null)
  const panAnimationFrameRef = React.useRef<number | null>(null)
  const fitInteractionPointerIdRef = React.useRef<number | null>(null)

  const [controller] = React.useState(() => {
    const initial = previewViewport ?? {
      mode: "fit",
      zoom: 1,
      center: { x: imageWidth / 2, y: imageHeight / 2 },
      gridEnabled: false,
      loupeEnabled: false,
    }
    const layout = {
      width: viewportBox?.width ?? imageWidth,
      height: viewportBox?.height ?? imageHeight,
      left: 0,
      top: 0,
      imageWidth,
      imageHeight,
    }

    return new PreviewViewportInteraction(initial, layout)
  })

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
    const viewport = previewViewport ?? {
      mode: "fit",
      zoom: 1,
      center: { x: imageWidth / 2, y: imageHeight / 2 },
      gridEnabled: false,
      loupeEnabled: false,
    }

    controller.syncViewport(viewport)

    if (viewport.mode === "manual") {
      applyManualFrameViewport(viewport)
    }
  }, [
    controller,
    previewViewport,
    imageWidth,
    imageHeight,
    applyManualFrameViewport,
  ])

  React.useLayoutEffect(() => {
    const rect = viewportElementRef.current?.getBoundingClientRect()
    if (rect) {
      controller.syncLayout({
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        imageWidth,
        imageHeight,
      })
    }
  }, [controller, imageWidth, imageHeight, viewportBox])

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
    surfaceLifecycle.onViewportBoxChange?.(viewportBox)
    onViewportBoxChangeRef.current?.(viewportBox)
  }, [surfaceLifecycle, viewportBox])

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

  const presentationFrame = getPreviewPresentationFrame({
    imageHeight,
    imageWidth,
    viewport: previewViewport,
    viewportBox,
    viewScale,
  })
  const centeredManualViewport = presentationFrame.centeredManualViewport

  const scheduleManualFrameViewport = React.useCallback(
    (viewport: PreviewViewport) => {
      if (panAnimationFrameRef.current !== null) {
        cancelAnimationFrame(panAnimationFrameRef.current)
      }

      panAnimationFrameRef.current = requestAnimationFrame(() => {
        panAnimationFrameRef.current = null
        applyManualFrameViewport(viewport)
      })
    },
    [applyManualFrameViewport]
  )

  const applyInteractionOutcome = React.useCallback(
    (
      outcome: PreviewViewportInteractionOutcome,
      target: Pick<
        HTMLElement,
        "hasPointerCapture" | "releasePointerCapture" | "setPointerCapture"
      >
    ) => {
      const pending = [outcome]

      while (pending.length > 0) {
        const nextOutcome = pending.shift()

        switch (nextOutcome?.type) {
          case undefined:
          case "ignore":
            break
          case "capture-pointer":
            target.setPointerCapture(nextOutcome.pointerId)
            break
          case "release-pointer":
            if (target.hasPointerCapture(nextOutcome.pointerId)) {
              target.releasePointerCapture(nextOutcome.pointerId)
            }
            break
          case "live-viewport":
            scheduleManualFrameViewport(nextOutcome.viewport)
            break
          case "commit-viewport":
            onViewportChange?.(nextOutcome.viewport)
            break
          case "batch":
            pending.unshift(...nextOutcome.outcomes)
            break
        }
      }
    },
    [onViewportChange, scheduleManualFrameViewport]
  )

  React.useEffect(() => {
    const viewportElement = viewportElementRef.current

    if (!nativeWheel || !viewportElement) {
      return
    }

    const handleNativeWheel = (event: WheelEvent) => {
      applyInteractionOutcome(controller.wheel(event), viewportElement)
    }

    viewportElement.addEventListener("wheel", handleNativeWheel, {
      passive: false,
    })

    return () => {
      viewportElement.removeEventListener("wheel", handleNativeWheel)
    }
  }, [controller, nativeWheel, applyInteractionOutcome])

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
        "relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl",
        className
      )}
      style={{
        ...(viewScale === "fit" || centeredManualViewport
          ? { containerType: "size" as const }
          : null),
        ...style,
        touchAction: "none",
      }}
      onWheel={
        nativeWheel
          ? undefined
          : (event) => {
              applyInteractionOutcome(
                controller.wheel(event),
                event.currentTarget
              )
            }
      }
      onPointerDown={(event) => {
        if (!pointerInteractionEnabled) {
          return
        }

        if (previewViewport?.mode !== "manual") {
          if (fitPointerInteraction) {
            event.currentTarget.setPointerCapture(event.pointerId)
            fitInteractionPointerIdRef.current = event.pointerId
            fitPointerInteraction.onUpdate(event.clientX)
          } else if (event.pointerType === "touch") {
            applyInteractionOutcome(
              controller.startPointer(event),
              event.currentTarget
            )
          }

          return
        }

        applyInteractionOutcome(
          controller.startPointer(event),
          event.currentTarget
        )
      }}
      onPointerMove={(event) => {
        inspectPointer(event)

        if (fitInteractionPointerIdRef.current === event.pointerId) {
          fitPointerInteraction?.onUpdate(event.clientX)
          return
        }

        applyInteractionOutcome(
          controller.movePointer(event),
          event.currentTarget
        )
      }}
      onPointerLeave={() => setInspector(null)}
      onPointerUp={(event) => {
        if (fitInteractionPointerIdRef.current === event.pointerId) {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          fitInteractionPointerIdRef.current = null
          fitPointerInteraction?.onCommit(event.clientX)
          return
        }

        if (
          previewViewport?.mode !== "manual" &&
          event.pointerType !== "touch"
        ) {
          return
        }

        applyInteractionOutcome(
          controller.finishPointer(event),
          event.currentTarget
        )
      }}
      onPointerCancel={(event) => {
        if (fitInteractionPointerIdRef.current === event.pointerId) {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          fitInteractionPointerIdRef.current = null
          return
        }

        if (
          previewViewport?.mode !== "manual" &&
          event.pointerType !== "touch"
        ) {
          return
        }

        applyInteractionOutcome(
          controller.cancelPointer(event),
          event.currentTarget
        )
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

export function PreviewPresentation({
  compareMode,
  desktopPrecisionEnabled,
  fullOutputHeight,
  fullOutputWidth,
  original,
  preview,
  previewTargetHeight,
  previewTargetWidth,
  previewViewport,
  status,
  onDisplayFrameChange,
  onViewportChange,
}: PreviewPresentationProps) {
  const [slideDividerState, setSlideDividerState] = React.useState<{
    percent: number
    source: PixelBuffer
  } | null>(null)
  const [displayFrame, setDisplayFrame] = React.useState<ViewportBox | null>(
    null
  )
  const slideDividerPercent =
    slideDividerState?.source === original
      ? slideDividerState.percent
      : SLIDE_COMPARE_DEFAULT
  const displayModel = getPreviewPresentationDisplayModel({
    fullOutputHeight,
    fullOutputWidth,
    previewTargetHeight,
    previewTargetWidth,
    viewport: previewViewport,
  })
  const handleDisplayFrameChange = React.useCallback(
    (box: ViewportBox) => {
      setDisplayFrame((current) =>
        current?.height === box.height && current.width === box.width
          ? current
          : box
      )
      onDisplayFrameChange?.(box)
    },
    [onDisplayFrameChange]
  )

  if (compareMode === "slide") {
    return (
      <PreviewSurfaceLifecycleProvider
        initialViewportBox={displayFrame}
        onViewportBoxChange={handleDisplayFrameChange}
      >
        <SlideComparePreview
          dividerPercent={slideDividerPercent}
          original={original}
          pixelInspectorEnabled={desktopPrecisionEnabled}
          processed={preview}
          displayHeight={displayModel.frameHeight}
          displayWidth={displayModel.frameWidth}
          manualDisplayHeight={displayModel.manualFrameHeight}
          manualDisplayWidth={displayModel.manualFrameWidth}
          status={status}
          previewViewport={previewViewport}
          viewScale={displayModel.viewScale}
          onDividerChange={(percent) =>
            setSlideDividerState({ percent, source: original })
          }
          onViewportChange={onViewportChange}
        />
      </PreviewSurfaceLifecycleProvider>
    )
  }

  const buffer = compareMode === "original" ? original : preview
  const label = compareMode === "original" ? "Original" : "Processed"

  return (
    <PreviewSurfaceLifecycleProvider
      initialViewportBox={displayFrame}
      onViewportBoxChange={handleDisplayFrameChange}
    >
      <CanvasPanel
        buffer={buffer}
        label={label}
        expectedHeight={displayModel.frameHeight}
        expectedWidth={displayModel.frameWidth}
        manualExpectedHeight={displayModel.manualFrameHeight}
        manualExpectedWidth={displayModel.manualFrameWidth}
        missing={compareMode === "processed" && !preview}
        pixelInspectorEnabled={desktopPrecisionEnabled}
        previewViewport={previewViewport}
        status={status}
        viewScale={displayModel.viewScale}
        onViewportChange={onViewportChange}
      />
    </PreviewSurfaceLifecycleProvider>
  )
}

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

const CanvasPanel = React.memo(function CanvasPanel({
  buffer,
  expectedHeight,
  expectedWidth,
  label,
  manualExpectedHeight,
  manualExpectedWidth,
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

  const redrawCanvas = React.useCallback(() => {
    if (!buffer || !canvasRef.current) {
      return
    }

    drawPixelBuffer(canvasRef.current, buffer)
  }, [buffer])
  usePreviewCanvasRedrawBoundary(redrawCanvas)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col p-1">
      <PreviewPresentationSurface
        className={cn(
          viewScale === "actual" &&
            (previewViewport?.loupeEnabled
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing")
        )}
        imageHeight={expectedHeight}
        imageWidth={expectedWidth}
        manualImageHeight={manualExpectedHeight}
        manualImageWidth={manualExpectedWidth}
        inspectorBuffers={{
          original: label === "Original" ? buffer : null,
          processed: label === "Processed" ? buffer : null,
        }}
        pixelInspectorEnabled={pixelInspectorEnabled}
        previewViewport={previewViewport}
        viewScale={viewScale}
        onViewportChange={onViewportChange}
      >
        {({ frameRef, frameStyle }) => (
          <div
            ref={frameRef}
            className={cn(
              "relative shrink-0 overflow-hidden bg-background ring-1 ring-border",
              missing && "border border-dashed border-border ring-0",
              viewScale === "actual" && "h-fit w-fit max-w-none",
              previewViewport?.mode === "manual" && "shrink-0"
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
          </div>
        )}
      </PreviewPresentationSurface>
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
      <div className="flex flex-col gap-1 font-mono text-[11px] text-muted-foreground">
        <span>[{status ?? "processing"}]</span>
        <span>
          {width}x{height}
        </span>
      </div>
    </div>
  )
}
