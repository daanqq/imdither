import type { CSSProperties } from "react"

import { DEFAULT_FIT_INSET, getPreviewFrameStyle } from "@/lib/preview-frame"
import {
  SLIDE_COMPARE_MAX,
  SLIDE_COMPARE_MIN,
  clampSlideDivider,
  getSlideCompareDisplaySize,
} from "@/lib/slide-compare"
import {
  clampManualViewportCenter,
  getAnchoredZoomViewport,
  getManualViewportDisplayMetrics,
  getManualViewportScale,
  getViewportPointImageCoordinates,
  getWheelZoom,
  type PreviewViewport,
  type ViewportCenter,
} from "@/lib/preview-viewport"

type ViewScale = "fit" | "actual"

type ViewportBox = {
  height: number
  width: number
}

type ManualMetrics = ReturnType<typeof getManualViewportDisplayMetrics>

export type PreviewPresentationFrame = {
  centeredManualViewport: boolean
  manualMetrics: ManualMetrics | null
  style: CSSProperties
}

export type PreviewPresentationDisplayModel = {
  frameHeight: number
  frameWidth: number
  manualFrameHeight: number
  manualFrameWidth: number
  viewScale: ViewScale
}

export function getPreviewPresentationDisplayModel({
  fullOutputHeight,
  fullOutputWidth,
  previewTargetHeight,
  previewTargetWidth,
  viewport,
}: {
  fullOutputHeight: number
  fullOutputWidth: number
  previewTargetHeight: number
  previewTargetWidth: number
  viewport: PreviewViewport
}): PreviewPresentationDisplayModel {
  const manualFrameHeight = Math.max(1, fullOutputHeight)
  const manualFrameWidth = Math.max(1, fullOutputWidth)

  if (viewport.mode === "manual") {
    return {
      frameHeight: manualFrameHeight,
      frameWidth: manualFrameWidth,
      manualFrameHeight,
      manualFrameWidth,
      viewScale: "actual",
    }
  }

  return {
    frameHeight: Math.max(1, previewTargetHeight),
    frameWidth: Math.max(1, previewTargetWidth),
    manualFrameHeight,
    manualFrameWidth,
    viewScale: "fit",
  }
}

export function getPreviewPresentationFrame({
  imageHeight,
  imageWidth,
  viewport,
  viewportBox,
  viewScale,
}: {
  imageHeight: number
  imageWidth: number
  viewport: PreviewViewport | null | undefined
  viewportBox: ViewportBox | null | undefined
  viewScale: ViewScale
}): PreviewPresentationFrame {
  const centeredManualViewport =
    viewport?.mode === "manual" &&
    viewport.zoom === 1 &&
    Math.round(viewport.center.x) === Math.round(imageWidth / 2) &&
    Math.round(viewport.center.y) === Math.round(imageHeight / 2)
  const manualMetrics =
    viewport?.mode === "manual"
      ? getManualViewportDisplayMetrics({
          imageHeight,
          imageWidth,
          viewportHeight: viewportBox?.height ?? imageHeight,
          viewportWidth: viewportBox?.width ?? imageWidth,
          zoom: viewport.zoom,
        })
      : null
  const frameStyle = getPreviewFrameStyle({
    sourceHeight: imageHeight,
    sourceWidth: imageWidth,
    viewScale: centeredManualViewport ? "fit" : viewScale,
  })

  if (viewport?.mode !== "manual" || centeredManualViewport) {
    return {
      centeredManualViewport,
      manualMetrics,
      style: frameStyle,
    }
  }

  return {
    centeredManualViewport,
    manualMetrics,
    style: {
      height: `${manualMetrics?.displayHeight ?? 1}px`,
      left: "50%",
      marginLeft: `${-Math.round(viewport.center.x * (manualMetrics?.pixelScaleX ?? 1))}px`,
      marginTop: `${-Math.round(viewport.center.y * (manualMetrics?.pixelScaleY ?? 1))}px`,
      position: "absolute",
      top: "50%",
      width: `${manualMetrics?.displayWidth ?? 1}px`,
    },
  }
}

export function getPreviewPresentationPanCenter({
  imageHeight,
  imageWidth,
  pointerDeltaX,
  pointerDeltaY,
  startCenter,
  viewportBox,
  zoom,
}: {
  imageHeight: number
  imageWidth: number
  pointerDeltaX: number
  pointerDeltaY: number
  startCenter: ViewportCenter
  viewportBox: ViewportBox
  zoom: number
}): ViewportCenter {
  const scale = getManualViewportScale({
    imageHeight,
    imageWidth,
    viewportHeight: viewportBox.height,
    viewportWidth: viewportBox.width,
    zoom,
  })

  return clampManualViewportCenter({
    center: {
      x: startCenter.x - pointerDeltaX / scale,
      y: startCenter.y - pointerDeltaY / scale,
    },
    imageHeight,
    imageWidth,
    viewportHeight: viewportBox.height,
    viewportWidth: viewportBox.width,
    zoom,
  })
}

export function getPreviewPresentationWheelViewport({
  deltaY,
  imageHeight,
  imageWidth,
  pointer,
  viewport,
  viewportBox,
}: {
  deltaY: number
  imageHeight: number
  imageWidth: number
  pointer: ViewportCenter
  viewport: PreviewViewport
  viewportBox: ViewportBox
}): PreviewViewport {
  const coordinates = getViewportPointImageCoordinates({
    imageHeight,
    imageWidth,
    viewport,
    viewportHeight: viewportBox.height,
    viewportPoint: pointer,
    viewportWidth: viewportBox.width,
  })
  const nextZoom = getWheelZoom(viewport.zoom, deltaY)

  if (!coordinates) {
    return {
      ...viewport,
      mode: "manual",
      zoom: nextZoom,
    }
  }

  return getAnchoredZoomViewport({
    anchorImagePoint: coordinates,
    anchorViewportPoint: pointer,
    imageHeight,
    imageWidth,
    nextZoom,
    viewport,
    viewportHeight: viewportBox.height,
    viewportWidth: viewportBox.width,
  })
}

export function getPreviewPresentationViewportDividerPercent({
  dividerPercent,
  imageHeight,
  imageWidth,
  viewport,
  viewportBox,
}: {
  dividerPercent: number
  imageHeight: number
  imageWidth: number
  viewport: PreviewViewport | null | undefined
  viewportBox: ViewportBox | null | undefined
}): number {
  if (!viewportBox) {
    return clampSlideDivider(dividerPercent)
  }

  const centeredManualViewport =
    viewport?.mode === "manual" &&
    viewport.zoom === 1 &&
    Math.round(viewport.center.x) === Math.round(imageWidth / 2) &&
    Math.round(viewport.center.y) === Math.round(imageHeight / 2)

  if (viewport?.mode !== "manual" || centeredManualViewport) {
    return getFitFrameViewportPercent({
      dividerPercent,
      imageHeight,
      imageWidth,
      viewportBox,
    })
  }

  const safeImageWidth = Math.max(1, imageWidth)
  const imageSplitX = safeImageWidth * (dividerPercent / 100)
  const scale = getManualViewportScale({
    imageHeight: Math.max(1, imageHeight),
    imageWidth: safeImageWidth,
    viewportHeight: Math.max(1, viewportBox.height),
    viewportWidth: Math.max(1, viewportBox.width),
    zoom: viewport.zoom,
  })
  const viewportX =
    viewportBox.width / 2 + (imageSplitX - viewport.center.x) * scale

  return clampSlideDivider((viewportX / Math.max(1, viewportBox.width)) * 100)
}

export function getPreviewPresentationDividerPercent({
  dividerPercent,
  imageHeight,
  imageWidth,
  viewport,
  viewportBox,
}: {
  dividerPercent: number
  imageHeight: number
  imageWidth: number
  viewport: PreviewViewport | null | undefined
  viewportBox: ViewportBox | null | undefined
}): number {
  const centeredManualViewport =
    viewport?.mode === "manual" &&
    viewport.zoom === 1 &&
    Math.round(viewport.center.x) === Math.round(imageWidth / 2) &&
    Math.round(viewport.center.y) === Math.round(imageHeight / 2)

  if (viewport?.mode !== "manual" || centeredManualViewport || !viewportBox) {
    return clampSlideDivider(dividerPercent)
  }

  const safeImageWidth = Math.max(1, imageWidth)
  const safeViewportWidth = Math.max(1, viewportBox.width)
  const scale = getManualViewportScale({
    imageHeight: Math.max(1, imageHeight),
    imageWidth: safeImageWidth,
    viewportHeight: Math.max(1, viewportBox.height),
    viewportWidth: safeViewportWidth,
    zoom: viewport.zoom,
  })
  const rawViewportX =
    safeViewportWidth / 2 +
    (safeImageWidth * (dividerPercent / 100) - viewport.center.x) * scale
  const clampedViewportX = Math.min(
    safeViewportWidth * (SLIDE_COMPARE_MAX / 100),
    Math.max(safeViewportWidth * (SLIDE_COMPARE_MIN / 100), rawViewportX)
  )
  const imageSplitX =
    viewport.center.x + (clampedViewportX - safeViewportWidth / 2) / scale

  return clampSlideDivider((imageSplitX / safeImageWidth) * 100)
}

function getFitFrameViewportPercent({
  dividerPercent,
  imageHeight,
  imageWidth,
  viewportBox,
}: {
  dividerPercent: number
  imageHeight: number
  imageWidth: number
  viewportBox: ViewportBox
}): number {
  const clampedDivider = clampSlideDivider(dividerPercent)
  const displaySize = getSlideCompareDisplaySize({
    containerHeight: viewportBox.height,
    containerWidth: viewportBox.width,
    fitInset: DEFAULT_FIT_INSET,
    sourceHeight: imageHeight,
    sourceWidth: imageWidth,
    viewScale: "fit",
  })
  const frameLeft = (Math.max(1, viewportBox.width) - displaySize.width) / 2
  const dividerX = frameLeft + displaySize.width * (clampedDivider / 100)

  return Math.min(
    100,
    Math.max(0, (dividerX / Math.max(1, viewportBox.width)) * 100)
  )
}
