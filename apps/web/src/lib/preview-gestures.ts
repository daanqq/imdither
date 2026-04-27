import {
  getAnchoredZoomViewport,
  getViewportPointImageCoordinates,
  type PreviewViewport,
  type ViewportCenter,
} from "./preview-viewport"

export const MIN_PINCH_DISTANCE = 16

type PointerPair = {
  first: ViewportCenter
  second: ViewportCenter
}

export function getPinchGestureViewport({
  currentPointers,
  imageHeight,
  imageWidth,
  startPointers,
  startViewport,
  viewportHeight,
  viewportWidth,
}: {
  currentPointers: PointerPair
  imageHeight: number
  imageWidth: number
  startPointers: PointerPair
  startViewport: PreviewViewport
  viewportHeight: number
  viewportWidth: number
}): PreviewViewport | null {
  const startDistance = getPointerDistance(startPointers)

  if (startDistance < MIN_PINCH_DISTANCE) {
    return null
  }

  const startMidpoint = getPointerMidpoint(startPointers)
  const currentMidpoint = getPointerMidpoint(currentPointers)
  const anchorImagePoint = getViewportPointImageCoordinates({
    imageHeight,
    imageWidth,
    viewport: startViewport,
    viewportHeight,
    viewportPoint: startMidpoint,
    viewportWidth,
  })

  if (!anchorImagePoint) {
    return null
  }

  return getAnchoredZoomViewport({
    anchorImagePoint,
    anchorViewportPoint: currentMidpoint,
    imageHeight,
    imageWidth,
    nextZoom:
      startViewport.zoom *
      (getPointerDistance(currentPointers) / startDistance),
    viewport: startViewport,
    viewportHeight,
    viewportWidth,
  })
}

function getPointerDistance(pointers: PointerPair) {
  return Math.hypot(
    pointers.second.x - pointers.first.x,
    pointers.second.y - pointers.first.y
  )
}

function getPointerMidpoint(pointers: PointerPair) {
  return {
    x: (pointers.first.x + pointers.second.x) / 2,
    y: (pointers.first.y + pointers.second.y) / 2,
  }
}
