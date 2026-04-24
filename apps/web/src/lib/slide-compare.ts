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
