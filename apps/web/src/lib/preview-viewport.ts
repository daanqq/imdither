export type PreviewViewportMode = "fit" | "manual"

export type PreviewViewport = {
  mode: PreviewViewportMode
  zoom: number
  center: ViewportCenter
  gridEnabled: boolean
  loupeEnabled: boolean
}

export type ViewportCenter = {
  x: number
  y: number
}

export const DEFAULT_PREVIEW_VIEWPORT: PreviewViewport = {
  mode: "fit",
  zoom: 1,
  center: { x: 0, y: 0 },
  gridEnabled: false,
  loupeEnabled: false,
}

export const MIN_PREVIEW_ZOOM = 0.25
export const MAX_PREVIEW_ZOOM = 16
export const PIXEL_GRID_MIN_ZOOM = 4
export const WHEEL_ZOOM_IN_FACTOR = 1.25
export const WHEEL_ZOOM_OUT_FACTOR = 0.8
export const WHEEL_ZOOM_PERCENT_STEP = 50

type ImageDimensions = {
  imageHeight: number
  imageWidth: number
}

type BufferDimensions = {
  height: number
  width: number
}

type ViewportBox = {
  viewportHeight: number
  viewportWidth: number
}

export function migrateViewScaleToViewport(value: unknown): PreviewViewport {
  if (value === "actual") {
    return {
      ...DEFAULT_PREVIEW_VIEWPORT,
      mode: "manual",
      zoom: 1,
    }
  }

  return DEFAULT_PREVIEW_VIEWPORT
}

export function normalizePreviewViewport(value: unknown): PreviewViewport {
  if (!isPreviewViewportLike(value)) {
    return migrateViewScaleToViewport(
      isObject(value) && "viewScale" in value ? value.viewScale : value
    )
  }

  const centerX = value.center?.x
  const centerY = value.center?.y

  return {
    mode: value.mode === "manual" ? "manual" : "fit",
    zoom: clampZoom(typeof value.zoom === "number" ? value.zoom : 1),
    center: {
      x: typeof centerX === "number" && Number.isFinite(centerX) ? centerX : 0,
      y: typeof centerY === "number" && Number.isFinite(centerY) ? centerY : 0,
    },
    gridEnabled: value.gridEnabled === true,
    loupeEnabled: value.loupeEnabled === true,
  }
}

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return 1
  }

  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, zoom))
}

export function getWheelZoom(currentZoom: number, deltaY: number): number {
  const factor = deltaY < 0 ? WHEEL_ZOOM_IN_FACTOR : WHEEL_ZOOM_OUT_FACTOR

  return clampZoom(roundZoomPercentToStep(currentZoom * factor))
}

export function clampViewportCenter(
  center: ViewportCenter,
  dimensions: BufferDimensions
): ViewportCenter {
  const maxX = Math.max(0, Math.round(dimensions.width) - 1)
  const maxY = Math.max(0, Math.round(dimensions.height) - 1)

  return {
    x: Math.min(maxX, Math.max(0, center.x)),
    y: Math.min(maxY, Math.max(0, center.y)),
  }
}

export function clampManualViewportCenter({
  center,
  imageHeight,
  imageWidth,
  viewportHeight,
  viewportWidth,
  zoom,
}: ImageDimensions &
  ViewportBox & {
    center: ViewportCenter
    zoom: number
  }): ViewportCenter {
  return {
    x: clampManualCenterAxis(center.x, imageWidth, viewportWidth, zoom),
    y: clampManualCenterAxis(center.y, imageHeight, viewportHeight, zoom),
  }
}

export function getViewportDisplaySize({
  imageHeight,
  imageWidth,
  viewport,
  viewportHeight,
  viewportWidth,
}: ImageDimensions &
  ViewportBox & {
    viewport: PreviewViewport
  }): { height: number; width: number } {
  const safeImageWidth = Math.max(1, imageWidth)
  const safeImageHeight = Math.max(1, imageHeight)

  if (viewport.mode === "manual") {
    const zoom = clampZoom(viewport.zoom)
    return {
      height: safeImageHeight * zoom,
      width: safeImageWidth * zoom,
    }
  }

  const scale = Math.min(
    Math.max(1, viewportWidth) / safeImageWidth,
    Math.max(1, viewportHeight) / safeImageHeight
  )

  return {
    height: Math.max(1, Math.round(safeImageHeight * scale)),
    width: Math.max(1, Math.round(safeImageWidth * scale)),
  }
}

export function getManualViewportTransform({
  imageHeight,
  imageWidth,
  viewport,
  viewportHeight,
  viewportWidth,
}: ImageDimensions &
  ViewportBox & {
    viewport: PreviewViewport
  }) {
  const zoom = clampZoom(viewport.zoom)
  const displayWidth = Math.max(1, imageWidth) * zoom
  const displayHeight = Math.max(1, imageHeight) * zoom
  const center = clampManualViewportCenter({
    center: viewport.center,
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom,
  })

  return {
    displayHeight,
    displayWidth,
    translateX: viewportWidth / 2 - center.x * zoom,
    translateY: viewportHeight / 2 - center.y * zoom,
  }
}

export function getDisplayPointImageCoordinates({
  clientX,
  clientY,
  frameLeft,
  frameTop,
  imageHeight,
  imageWidth,
  viewport,
  viewportHeight,
  viewportWidth,
}: ImageDimensions &
  ViewportBox & {
    clientX: number
    clientY: number
    frameLeft: number
    frameTop: number
    viewport: PreviewViewport
  }): ViewportCenter | null {
  if (viewport.mode === "manual") {
    const transform = getManualViewportTransform({
      imageHeight,
      imageWidth,
      viewport,
      viewportHeight,
      viewportWidth,
    })
    const zoom = clampZoom(viewport.zoom)
    return clampViewportCenter(
      {
        x: (clientX - frameLeft - transform.translateX) / zoom,
        y: (clientY - frameTop - transform.translateY) / zoom,
      },
      { height: imageHeight, width: imageWidth }
    )
  }

  const displaySize = getViewportDisplaySize({
    imageHeight,
    imageWidth,
    viewport,
    viewportHeight,
    viewportWidth,
  })
  const offsetX = (viewportWidth - displaySize.width) / 2
  const offsetY = (viewportHeight - displaySize.height) / 2
  const x = ((clientX - frameLeft - offsetX) / displaySize.width) * imageWidth
  const y = ((clientY - frameTop - offsetY) / displaySize.height) * imageHeight

  if (x < 0 || y < 0 || x >= imageWidth || y >= imageHeight) {
    return null
  }

  return {
    x,
    y,
  }
}

export function getViewportPointImageCoordinates({
  imageHeight,
  imageWidth,
  viewport,
  viewportHeight,
  viewportPoint,
  viewportWidth,
}: ImageDimensions &
  ViewportBox & {
    viewport: PreviewViewport
    viewportPoint: ViewportCenter
  }): ViewportCenter | null {
  if (viewport.mode === "manual") {
    const zoom = clampZoom(viewport.zoom)
    return clampViewportCenter(
      {
        x: viewport.center.x + (viewportPoint.x - viewportWidth / 2) / zoom,
        y: viewport.center.y + (viewportPoint.y - viewportHeight / 2) / zoom,
      },
      { height: imageHeight, width: imageWidth }
    )
  }

  const displaySize = getViewportDisplaySize({
    imageHeight,
    imageWidth,
    viewport,
    viewportHeight,
    viewportWidth,
  })
  const offsetX = (viewportWidth - displaySize.width) / 2
  const offsetY = (viewportHeight - displaySize.height) / 2
  const x = ((viewportPoint.x - offsetX) / displaySize.width) * imageWidth
  const y = ((viewportPoint.y - offsetY) / displaySize.height) * imageHeight

  if (x < 0 || y < 0 || x >= imageWidth || y >= imageHeight) {
    return null
  }

  return { x, y }
}

export function getFramePointImageCoordinates({
  clientX,
  clientY,
  frameLeft,
  frameTop,
  imageHeight,
  imageWidth,
  zoom,
}: ImageDimensions & {
  clientX: number
  clientY: number
  frameLeft: number
  frameTop: number
  zoom: number
}): ViewportCenter | null {
  const safeZoom = clampZoom(zoom)
  const x = (clientX - frameLeft) / safeZoom
  const y = (clientY - frameTop) / safeZoom

  if (x < 0 || y < 0 || x >= imageWidth || y >= imageHeight) {
    return null
  }

  return { x, y }
}

export function getAnchoredZoomViewport({
  anchorImagePoint,
  anchorViewportPoint,
  imageHeight,
  imageWidth,
  nextZoom,
  viewport,
  viewportHeight,
  viewportWidth,
}: ImageDimensions &
  ViewportBox & {
    anchorImagePoint: ViewportCenter
    anchorViewportPoint?: ViewportCenter
    nextZoom: number
    viewport: PreviewViewport
  }): PreviewViewport {
  const zoom = clampZoom(nextZoom)
  const viewportCenter = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
  }
  const anchorScreenPoint =
    anchorViewportPoint ??
    getCurrentAnchorViewportPoint(anchorImagePoint, viewport, viewportCenter)
  const center = clampManualViewportCenter({
    center: {
      x: anchorImagePoint.x - (anchorScreenPoint.x - viewportCenter.x) / zoom,
      y: anchorImagePoint.y - (anchorScreenPoint.y - viewportCenter.y) / zoom,
    },
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom,
  })

  return {
    ...viewport,
    mode: "manual",
    zoom,
    center,
  }
}

function getCurrentAnchorViewportPoint(
  anchorImagePoint: ViewportCenter,
  viewport: PreviewViewport,
  viewportCenter: ViewportCenter
) {
  const currentZoom = clampZoom(viewport.zoom)

  return {
    x:
      viewportCenter.x + (anchorImagePoint.x - viewport.center.x) * currentZoom,
    y:
      viewportCenter.y + (anchorImagePoint.y - viewport.center.y) * currentZoom,
  }
}

export function isPixelGridVisible(viewport: PreviewViewport): boolean {
  return (
    viewport.gridEnabled &&
    viewport.mode === "manual" &&
    viewport.zoom >= PIXEL_GRID_MIN_ZOOM
  )
}

function isPreviewViewportLike(value: unknown): value is {
  mode?: unknown
  zoom?: unknown
  center?: { x?: number; y?: number }
  gridEnabled?: unknown
  loupeEnabled?: unknown
} {
  return isObject(value) && ("mode" in value || "zoom" in value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function clampManualCenterAxis(
  center: number,
  imageSize: number,
  viewportSize: number,
  zoom: number
) {
  const safeImageSize = Math.max(1, imageSize)
  const safeViewportSize = Math.max(1, viewportSize)
  const safeZoom = clampZoom(zoom)
  const halfVisibleImageSize = safeViewportSize / 2 / safeZoom

  if (safeImageSize * safeZoom <= safeViewportSize) {
    return safeImageSize / 2
  }

  const min = halfVisibleImageSize
  const max = safeImageSize - halfVisibleImageSize

  return Math.min(max, Math.max(min, center))
}

function roundZoomPercentToStep(zoom: number) {
  const percent = zoom * 100

  return (
    Math.max(
      WHEEL_ZOOM_PERCENT_STEP,
      Math.round(percent / WHEEL_ZOOM_PERCENT_STEP) * WHEEL_ZOOM_PERCENT_STEP
    ) / 100
  )
}
