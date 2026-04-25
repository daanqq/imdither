export const SLIDE_COMPARE_MIN = 2
export const SLIDE_COMPARE_MAX = 98
export const SLIDE_COMPARE_DEFAULT = 50

export function clampSlideDivider(percent: number): number {
  if (!Number.isFinite(percent)) {
    return SLIDE_COMPARE_DEFAULT
  }

  return Math.min(SLIDE_COMPARE_MAX, Math.max(SLIDE_COMPARE_MIN, percent))
}

export function getSlideDividerFromClientX(
  clientX: number,
  left: number,
  width: number
): number {
  if (!Number.isFinite(width) || width <= 0) {
    return SLIDE_COMPARE_DEFAULT
  }

  return clampSlideDivider(((clientX - left) / width) * 100)
}

export function getSlideDividerFromKey(
  currentPercent: number,
  key: string,
  shiftKey = false
): number | null {
  const current = clampSlideDivider(currentPercent)
  const step = shiftKey ? 10 : 1

  if (key === "ArrowLeft") {
    return clampSlideDivider(current - step)
  }

  if (key === "ArrowRight") {
    return clampSlideDivider(current + step)
  }

  if (key === "Home") {
    return SLIDE_COMPARE_MIN
  }

  if (key === "End") {
    return SLIDE_COMPARE_MAX
  }

  return null
}

export function getSlideCompareDisplaySize({
  containerHeight,
  containerWidth,
  fitInset = 0,
  sourceHeight,
  sourceWidth,
  viewScale,
}: {
  containerHeight?: number
  containerWidth?: number
  fitInset?: number
  sourceHeight: number
  sourceWidth: number
  viewScale: "fit" | "actual"
}): { height: number; width: number } {
  const safeSourceWidth = Math.max(1, sourceWidth)
  const safeSourceHeight = Math.max(1, sourceHeight)

  if (
    viewScale === "actual" ||
    containerHeight === undefined ||
    containerWidth === undefined
  ) {
    return {
      height: safeSourceHeight,
      width: safeSourceWidth,
    }
  }

  const safeContainerWidth = Math.max(1, containerWidth - fitInset)
  const safeContainerHeight = Math.max(1, containerHeight - fitInset)
  const scale = Math.min(
    safeContainerWidth / safeSourceWidth,
    safeContainerHeight / safeSourceHeight
  )

  return {
    height: Math.max(1, Math.floor(safeSourceHeight * scale)),
    width: Math.max(1, Math.floor(safeSourceWidth * scale)),
  }
}
