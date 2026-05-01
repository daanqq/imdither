import { getPreviewPresentationPanCenter } from "./preview-presentation"
import {
  getAnchoredZoomViewport,
  getDisplayPointImageCoordinates,
  getWheelZoom,
  type PreviewViewport,
  type ViewportCenter,
} from "./preview-viewport"
import { getPinchGestureViewport } from "./preview-gestures"

export type DisplayFrame = {
  width: number
  height: number
  left: number
  top: number
  imageWidth: number
  imageHeight: number
}

export type WheelEventLike = {
  clientX: number
  clientY: number
  deltaY: number
  preventDefault: () => void
}

export type PointerEventLike = {
  pointerId: number
  pointerType?: string
  clientX: number
  clientY: number
}

export type PreviewViewportInteractionMode =
  | "viewport-enabled"
  | "manual-only"
  | "viewport-disabled"

export type PreviewViewportInteractionOutcome =
  | { type: "ignore" }
  | { type: "capture-pointer"; pointerId: number }
  | { type: "release-pointer"; pointerId: number }
  | { type: "live-viewport"; viewport: PreviewViewport }
  | { type: "commit-viewport"; viewport: PreviewViewport }
  | { type: "batch"; outcomes: PreviewViewportInteractionOutcome[] }

type PointerPair = {
  first: ViewportCenter
  second: ViewportCenter
}

type GestureState =
  | { type: "idle" }
  | {
      type: "panning"
      pointerId: number
      pointerX: number
      pointerY: number
    }
  | {
      type: "pinching"
      startPointers: PointerPair
      startViewport: PreviewViewport
    }

export class PreviewViewportInteraction {
  private viewport: PreviewViewport
  private layout: DisplayFrame
  private gesture: GestureState = { type: "idle" }
  private activePointers = new Map<number, ViewportCenter>()

  constructor(initial: PreviewViewport, layout: DisplayFrame) {
    this.viewport = initial
    this.layout = layout
  }

  getViewport(): PreviewViewport {
    return this.viewport
  }

  wheel(event: WheelEventLike): PreviewViewportInteractionOutcome {
    event.preventDefault()

    const anchorImagePoint = getDisplayPointImageCoordinates({
      clientX: event.clientX,
      clientY: event.clientY,
      frameLeft: this.layout.left,
      frameTop: this.layout.top,
      imageHeight: this.layout.imageHeight,
      imageWidth: this.layout.imageWidth,
      viewport: this.viewport,
      viewportHeight: this.layout.height,
      viewportWidth: this.layout.width,
    })

    const nextZoom = getWheelZoom(this.viewport.zoom, event.deltaY)
    const viewport = anchorImagePoint
      ? getAnchoredZoomViewport({
          anchorImagePoint,
          anchorViewportPoint: {
            x: event.clientX - this.layout.left,
            y: event.clientY - this.layout.top,
          },
          imageHeight: this.layout.imageHeight,
          imageWidth: this.layout.imageWidth,
          nextZoom,
          viewport: this.viewport,
          viewportHeight: this.layout.height,
          viewportWidth: this.layout.width,
        })
      : {
          ...this.viewport,
          mode: "manual" as const,
          zoom: nextZoom,
        }

    this.viewport = viewport
    return { type: "commit-viewport", viewport }
  }

  startPointer(
    event: PointerEventLike,
    mode: PreviewViewportInteractionMode = "viewport-enabled"
  ): PreviewViewportInteractionOutcome {
    if (mode === "viewport-disabled") {
      return { type: "ignore" }
    }

    const isTouch = event.pointerType === "touch"
    const isManual = this.viewport.mode === "manual"

    if (!isManual && (!isTouch || mode === "manual-only")) {
      return { type: "ignore" }
    }

    this.activePointers.set(event.pointerId, {
      x: event.clientX - this.layout.left,
      y: event.clientY - this.layout.top,
    })

    if (!isManual) {
      this.viewport = {
        ...this.viewport,
        mode: "manual",
        center: {
          x: this.layout.imageWidth / 2,
          y: this.layout.imageHeight / 2,
        },
        zoom: 1,
      }
    }

    if (this.activePointers.size >= 2) {
      this.startPinchGesture()
    } else {
      this.gesture = {
        type: "panning",
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
      }
    }

    return { type: "capture-pointer", pointerId: event.pointerId }
  }

  movePointer(event: PointerEventLike): PreviewViewportInteractionOutcome {
    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, {
        x: event.clientX - this.layout.left,
        y: event.clientY - this.layout.top,
      })
    }

    if (this.gesture.type === "pinching") {
      return this.updatePinchGesture()
    }

    if (
      this.gesture.type !== "panning" ||
      this.gesture.pointerId !== event.pointerId
    ) {
      return { type: "ignore" }
    }

    const nextCenter = getPreviewPresentationPanCenter({
      imageHeight: this.layout.imageHeight,
      imageWidth: this.layout.imageWidth,
      pointerDeltaX: event.clientX - this.gesture.pointerX,
      pointerDeltaY: event.clientY - this.gesture.pointerY,
      startCenter: this.viewport.center,
      viewportBox: {
        height: this.layout.height,
        width: this.layout.width,
      },
      zoom: this.viewport.zoom,
    })

    this.gesture.pointerX = event.clientX
    this.gesture.pointerY = event.clientY
    this.viewport = {
      ...this.viewport,
      center: nextCenter,
    }

    return { type: "live-viewport", viewport: this.viewport }
  }

  finishPointer(event: PointerEventLike): PreviewViewportInteractionOutcome {
    const hadActivePointer = this.activePointers.has(event.pointerId)
    const wasPinching = this.gesture.type === "pinching"
    const wasPanning =
      this.gesture.type === "panning" &&
      this.gesture.pointerId === event.pointerId

    this.activePointers.delete(event.pointerId)

    if (wasPinching && this.activePointers.size === 1) {
      const [remainingId, remainingPos] = Array.from(
        this.activePointers.entries()
      )[0]
      this.gesture = {
        type: "panning",
        pointerId: remainingId,
        pointerX: remainingPos.x + this.layout.left,
        pointerY: remainingPos.y + this.layout.top,
      }
    } else if (wasPinching || wasPanning) {
      this.gesture = { type: "idle" }
    }

    if (!hadActivePointer) {
      return { type: "ignore" }
    }

    return {
      type: "batch",
      outcomes: [
        { type: "release-pointer", pointerId: event.pointerId },
        { type: "commit-viewport", viewport: this.viewport },
      ],
    }
  }

  cancelPointer(event: PointerEventLike): PreviewViewportInteractionOutcome {
    const hadActivePointer = this.activePointers.delete(event.pointerId)

    if (
      this.gesture.type === "pinching" ||
      (this.gesture.type === "panning" &&
        this.gesture.pointerId === event.pointerId)
    ) {
      this.gesture = { type: "idle" }
    }

    if (!hadActivePointer) {
      return { type: "ignore" }
    }

    return { type: "release-pointer", pointerId: event.pointerId }
  }

  syncLayout(layout: DisplayFrame): void {
    this.layout = layout
  }

  syncViewport(viewport: PreviewViewport): void {
    if (this.gesture.type === "idle") {
      this.viewport = viewport
    }
  }

  private startPinchGesture() {
    const pointerPair = this.getActivePointerPair()

    if (!pointerPair) {
      return
    }

    this.gesture = {
      type: "pinching",
      startPointers: pointerPair,
      startViewport: this.viewport,
    }
  }

  private updatePinchGesture(): PreviewViewportInteractionOutcome {
    if (this.gesture.type !== "pinching") {
      return { type: "ignore" }
    }

    const currentPointers = this.getActivePointerPair()

    if (!currentPointers) {
      return { type: "ignore" }
    }

    const nextViewport = getPinchGestureViewport({
      currentPointers,
      imageHeight: this.layout.imageHeight,
      imageWidth: this.layout.imageWidth,
      startPointers: this.gesture.startPointers,
      startViewport: this.gesture.startViewport,
      viewportHeight: this.layout.height,
      viewportWidth: this.layout.width,
    })

    if (!nextViewport) {
      return { type: "ignore" }
    }

    this.viewport = nextViewport
    return { type: "live-viewport", viewport: this.viewport }
  }

  private getActivePointerPair(): PointerPair | null {
    const values = Array.from(this.activePointers.values())

    if (values.length < 2) {
      return null
    }

    return { first: values[0], second: values[1] }
  }
}
