import { DEFAULT_FIT_INSET } from "@/lib/preview-frame"

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

export const WHEEL_ZOOM_IN_FACTOR = 2 ** 0.25
export const WHEEL_ZOOM_OUT_FACTOR = 1 / WHEEL_ZOOM_IN_FACTOR
export const MIN_PREVIEW_ZOOM = 0.25
export const MAX_PREVIEW_ZOOM = 16

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

  return clampZoom(clampZoom(currentZoom) * factor)
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
}: ImageDimensions &
  ViewportBox & {
    center: ViewportCenter
    zoom: number
  }): ViewportCenter {
  return {
    x: clampManualCenterAxis(center.x, imageWidth),
    y: clampManualCenterAxis(center.y, imageHeight),
  }
}

export function getFitViewportScale({
  fitInset = DEFAULT_FIT_INSET,
  imageHeight,
  imageWidth,
  viewportHeight,
  viewportWidth,
}: ImageDimensions &
  ViewportBox & {
    fitInset?: number
  }): number {
  const safeInset = Math.max(0, fitInset)

  return Math.min(
    Math.max(1, viewportWidth - safeInset) / Math.max(1, imageWidth),
    Math.max(1, viewportHeight - safeInset) / Math.max(1, imageHeight)
  )
}

export function getManualViewportScale({
  fitInset,
  imageHeight,
  imageWidth,
  viewportHeight,
  viewportWidth,
  zoom,
}: ImageDimensions &
  ViewportBox & {
    fitInset?: number
    zoom: number
  }): number {
  return (
    getFitViewportScale({
      fitInset,
      imageHeight,
      imageWidth,
      viewportHeight,
      viewportWidth,
    }) * clampZoom(zoom)
  )
}

export function getManualViewportDisplayMetrics({
  imageHeight,
  imageWidth,
  viewportHeight,
  viewportWidth,
  zoom,
}: ImageDimensions &
  ViewportBox & {
    zoom: number
  }): {
  displayHeight: number
  displayWidth: number
  pixelScaleX: number
  pixelScaleY: number
  scale: number
} {
  const safeImageWidth = Math.max(1, imageWidth)
  const safeImageHeight = Math.max(1, imageHeight)
  const scale = getManualViewportScale({
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom,
  })
  const displayWidth = Math.max(1, Math.round(safeImageWidth * scale))
  const displayHeight = Math.max(1, Math.round(safeImageHeight * scale))

  return {
    displayHeight,
    displayWidth,
    pixelScaleX: displayWidth / safeImageWidth,
    pixelScaleY: displayHeight / safeImageHeight,
    scale,
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
  const fitScale = getFitViewportScale({
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
  })

  if (viewport.mode === "manual") {
    const scale = fitScale * clampZoom(viewport.zoom)
    return {
      height: safeImageHeight * scale,
      width: safeImageWidth * scale,
    }
  }

  return {
    height: Math.max(1, Math.round(safeImageHeight * fitScale)),
    width: Math.max(1, Math.round(safeImageWidth * fitScale)),
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
  const scale = getManualViewportScale({
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom: viewport.zoom,
  })
  const displayWidth = Math.max(1, imageWidth) * scale
  const displayHeight = Math.max(1, imageHeight) * scale
  const center = clampManualViewportCenter({
    center: viewport.center,
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom: viewport.zoom,
  })

  return {
    displayHeight,
    displayWidth,
    translateX: viewportWidth / 2 - center.x * scale,
    translateY: viewportHeight / 2 - center.y * scale,
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
    const scale = getManualViewportScale({
      imageHeight,
      imageWidth,
      viewportHeight,
      viewportWidth,
      zoom: viewport.zoom,
    })
    return clampViewportCenter(
      {
        x: (clientX - frameLeft - transform.translateX) / scale,
        y: (clientY - frameTop - transform.translateY) / scale,
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
    const scale = getManualViewportScale({
      imageHeight,
      imageWidth,
      viewportHeight,
      viewportWidth,
      zoom: viewport.zoom,
    })
    return clampViewportCenter(
      {
        x: viewport.center.x + (viewportPoint.x - viewportWidth / 2) / scale,
        y: viewport.center.y + (viewportPoint.y - viewportHeight / 2) / scale,
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
  viewportHeight,
  viewportWidth,
  zoom,
}: ImageDimensions & {
  clientX: number
  clientY: number
  frameLeft: number
  frameTop: number
  viewportHeight: number
  viewportWidth: number
  zoom: number
}): ViewportCenter | null {
  const scale = getManualViewportScale({
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom,
  })
  const x = (clientX - frameLeft) / scale
  const y = (clientY - frameTop) / scale

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
  const scale = getManualViewportScale({
    imageHeight,
    imageWidth,
    viewportHeight,
    viewportWidth,
    zoom,
  })
  const viewportCenter = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
  }
  const anchorScreenPoint =
    anchorViewportPoint ??
    getCurrentAnchorViewportPoint(
      anchorImagePoint,
      viewport,
      viewportCenter,
      getManualViewportScale({
        imageHeight,
        imageWidth,
        viewportHeight,
        viewportWidth,
        zoom: viewport.zoom,
      })
    )
  const center = clampManualViewportCenter({
    center: {
      x: anchorImagePoint.x - (anchorScreenPoint.x - viewportCenter.x) / scale,
      y: anchorImagePoint.y - (anchorScreenPoint.y - viewportCenter.y) / scale,
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
  viewportCenter: ViewportCenter,
  scale: number
) {
  return {
    x: viewportCenter.x + (anchorImagePoint.x - viewport.center.x) * scale,
    y: viewportCenter.y + (anchorImagePoint.y - viewport.center.y) * scale,
  }
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

function clampManualCenterAxis(center: number, imageSize: number) {
  const safeImageSize = Math.max(1, imageSize)

  return Math.min(safeImageSize, Math.max(0, center))
}
