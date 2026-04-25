import type { PixelBuffer } from "@workspace/core"

import type { ViewScale } from "@/store/editor-store"

export type CanvasPanelProps = {
  buffer: PixelBuffer | null
  expectedHeight: number
  expectedWidth: number
  label: string
  missing?: boolean
  status?: string
  viewScale: ViewScale
}

export type SlideCompareViewScale = "fit" | "actual"

export type SlideComparePreviewProps = {
  dividerPercent: number
  displayHeight?: number
  displayWidth?: number
  original: PixelBuffer
  processed: PixelBuffer | null
  status?: string
  viewScale: SlideCompareViewScale
  onDividerChange: (percent: number) => void
}

export function areCanvasPanelPropsEqual(
  previous: CanvasPanelProps,
  next: CanvasPanelProps
) {
  if (
    previous.buffer !== next.buffer ||
    previous.expectedHeight !== next.expectedHeight ||
    previous.expectedWidth !== next.expectedWidth ||
    previous.label !== next.label ||
    previous.missing !== next.missing ||
    previous.viewScale !== next.viewScale
  ) {
    return false
  }

  if (previous.missing || next.missing) {
    return previous.status === next.status
  }

  return true
}

export function areSlideComparePreviewPropsEqual(
  previous: SlideComparePreviewProps,
  next: SlideComparePreviewProps
) {
  if (
    previous.dividerPercent !== next.dividerPercent ||
    previous.displayHeight !== next.displayHeight ||
    previous.displayWidth !== next.displayWidth ||
    previous.original !== next.original ||
    previous.processed !== next.processed ||
    previous.viewScale !== next.viewScale ||
    previous.onDividerChange !== next.onDividerChange
  ) {
    return false
  }

  if (!previous.processed || !next.processed) {
    return previous.status === next.status
  }

  return true
}
