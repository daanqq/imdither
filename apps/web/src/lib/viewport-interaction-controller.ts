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
  clientX: number
  clientY: number
  currentTarget: {
    setPointerCapture: (id: number) => void
    hasPointerCapture: (id: number) => boolean
    releasePointerCapture: (id: number) => void
  }
}

type PointerPair = {
  first: ViewportCenter
  second: ViewportCenter
}

type GestureState =
  | { type: "idle" }
  | {
      type: "panning"
      pointerId: number
      startCenter: ViewportCenter
      pointerX: number
      pointerY: number
    }
  | {
      type: "pinching"
      startPointers: PointerPair
      startViewport: PreviewViewport
    }

export class ViewportInteractionController {
  private viewport: PreviewViewport
  private layout: DisplayFrame
  private onUpdateCallback: ((viewport: PreviewViewport) => void) | null = null
  private gesture: GestureState = { type: "idle" }
  private activePointers = new Map<number, ViewportCenter>()

  constructor(initial: PreviewViewport, layout: DisplayFrame) {
    this.viewport = initial
    this.layout = layout
  }

  getViewport(): PreviewViewport {
    return this.viewport
  }

  handleWheel(event: WheelEventLike): void {
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

    if (!anchorImagePoint) {
      this.updateViewport({
        ...this.viewport,
        mode: "manual",
        zoom: nextZoom,
      })
      return
    }

    this.updateViewport(
      getAnchoredZoomViewport({
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
    )
  }

  handlePointerDown(event: PointerEventLike): void {
    event.currentTarget.setPointerCapture(event.pointerId)
    this.activePointers.set(event.pointerId, {
      x: event.clientX - this.layout.left,
      y: event.clientY - this.layout.top,
    })

    if (this.viewport.mode === "fit") {
      this.updateViewport({
        ...this.viewport,
        mode: "manual",
        center: {
          x: this.layout.imageWidth / 2,
          y: this.layout.imageHeight / 2,
        },
        zoom: 1,
      })
    }

    if (this.activePointers.size >= 2) {
      this.startPinchGesture()
    } else {
      this.gesture = {
        type: "panning",
        pointerId: event.pointerId,
        startCenter: this.viewport.center,
        pointerX: event.clientX,
        pointerY: event.clientY,
      }
    }
  }

  handlePointerMove(event: PointerEventLike): void {
    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, {
        x: event.clientX - this.layout.left,
        y: event.clientY - this.layout.top,
      })
    }

    if (this.gesture.type === "pinching") {
      this.updatePinchGesture()
    } else if (
      this.gesture.type === "panning" &&
      this.gesture.pointerId === event.pointerId
    ) {
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

      this.updateViewport({
        ...this.viewport,
        center: nextCenter,
      })
    }
  }

  handlePointerUp(event: PointerEventLike): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const wasPinching = this.gesture.type === "pinching"
    this.activePointers.delete(event.pointerId)

    if (wasPinching) {
      if (this.activePointers.size === 1) {
        // Fall back to panning with the remaining pointer
        const [remainingId, remainingPos] = Array.from(
          this.activePointers.entries()
        )[0]
        this.gesture = {
          type: "panning",
          pointerId: remainingId,
          startCenter: this.viewport.center,
          pointerX: remainingPos.x + this.layout.left,
          pointerY: remainingPos.y + this.layout.top,
        }
      } else {
        this.gesture = { type: "idle" }
      }
    } else if (
      this.gesture.type === "panning" &&
      this.gesture.pointerId === event.pointerId
    ) {
      this.gesture = { type: "idle" }
    }
  }

  syncLayout(layout: DisplayFrame): void {
    this.layout = layout
  }

  syncViewport(viewport: PreviewViewport): void {
    // Only sync if we're not currently interacting, to avoid fighting with gestures
    if (this.gesture.type === "idle") {
      this.viewport = viewport
    }
  }

  onUpdate(callback: (viewport: PreviewViewport) => void): void {
    this.onUpdateCallback = callback
  }

  private startPinchGesture() {
    const pointerPair = this.getActivePointerPair()
    if (!pointerPair) return

    this.gesture = {
      type: "pinching",
      startPointers: pointerPair,
      startViewport: this.viewport,
    }
  }

  private updatePinchGesture() {
    if (this.gesture.type !== "pinching") return

    const currentPointers = this.getActivePointerPair()
    if (!currentPointers) return

    const nextViewport = getPinchGestureViewport({
      currentPointers,
      imageHeight: this.layout.imageHeight,
      imageWidth: this.layout.imageWidth,
      startPointers: this.gesture.startPointers,
      startViewport: this.gesture.startViewport,
      viewportHeight: this.layout.height,
      viewportWidth: this.layout.width,
    })

    if (nextViewport) {
      this.updateViewport(nextViewport)
    }
  }

  private getActivePointerPair(): PointerPair | null {
    const values = Array.from(this.activePointers.values())
    if (values.length < 2) return null
    return { first: values[0], second: values[1] }
  }

  private updateViewport(viewport: PreviewViewport): void {
    this.viewport = viewport
    this.onUpdateCallback?.(this.viewport)
  }
}
