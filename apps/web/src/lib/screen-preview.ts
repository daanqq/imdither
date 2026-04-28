import type { ViewScale } from "@/store/editor-store"
import { DEFAULT_FIT_INSET } from "@/lib/preview-frame"

export type PreviewTarget = {
  height: number
  width: number
}

export const FIT_PREVIEW_PIXEL_RATIO = 2

export function getScreenPreviewTarget({
  displayHeight,
  displayWidth,
  fitInset = DEFAULT_FIT_INSET,
  outputHeight,
  outputWidth,
  viewScale,
}: {
  displayHeight?: number
  displayWidth?: number
  fitInset?: number
  outputHeight: number
  outputWidth: number
  viewScale: ViewScale
}): PreviewTarget | null {
  const safeOutputWidth = Math.max(1, Math.round(outputWidth))
  const safeOutputHeight = Math.max(1, Math.round(outputHeight))

  if (
    viewScale !== "fit" ||
    displayWidth === undefined ||
    displayHeight === undefined ||
    displayWidth <= 0 ||
    displayHeight <= 0
  ) {
    return null
  }

  const safeFitInset = Math.max(0, Math.round(fitInset))
  const safeDisplayWidth = Math.max(1, Math.round(displayWidth) - safeFitInset)
  const safeDisplayHeight = Math.max(
    1,
    Math.round(displayHeight) - safeFitInset
  )
  const scale = Math.min(
    1,
    (safeDisplayWidth * FIT_PREVIEW_PIXEL_RATIO) / safeOutputWidth,
    (safeDisplayHeight * FIT_PREVIEW_PIXEL_RATIO) / safeOutputHeight
  )

  return {
    height: Math.max(1, Math.round(safeOutputHeight * scale)),
    width: Math.max(1, Math.round(safeOutputWidth * scale)),
  }
}
