import type { CSSProperties } from "react"

const DEFAULT_FIT_INSET = 12

type PreviewFrameStyle = CSSProperties & {
  "--preview-aspect"?: string
}

export function getPreviewFrameStyle({
  fitInset = DEFAULT_FIT_INSET,
  sourceHeight,
  sourceWidth,
  viewScale,
}: {
  fitInset?: number
  sourceHeight: number
  sourceWidth: number
  viewScale: "fit" | "actual"
}): PreviewFrameStyle {
  const safeSourceWidth = Math.max(1, sourceWidth)
  const safeSourceHeight = Math.max(1, sourceHeight)

  if (viewScale === "actual") {
    return {
      height: `${safeSourceHeight}px`,
      width: `${safeSourceWidth}px`,
    }
  }

  const safeInset = `${Math.max(0, fitInset)}px`
  const containerWidth = `calc(100cqw - ${safeInset})`
  const containerHeight = `calc(100cqh - ${safeInset})`
  const aspect = safeSourceWidth / safeSourceHeight

  return {
    "--preview-aspect": String(aspect),
    aspectRatio: `${safeSourceWidth} / ${safeSourceHeight}`,
    height: `max(1px, min(${containerHeight}, calc(${containerWidth} / var(--preview-aspect))))`,
    width: `max(1px, min(${containerWidth}, calc(${containerHeight} * var(--preview-aspect))))`,
  }
}
