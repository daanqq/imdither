import type { PixelBuffer } from "@workspace/core"

import type { PreviewViewport } from "@/lib/preview-viewport"
import type { ViewScale } from "@/store/editor-store"

export type CanvasPanelProps = {
  buffer: PixelBuffer | null
  expectedHeight: number
  expectedWidth: number
  label: string
  missing?: boolean
  pixelInspectorEnabled?: boolean
  status?: string
  previewViewport?: PreviewViewport
  viewScale: ViewScale
}

export type SlideCompareViewScale = "fit" | "actual"

export type SlideComparePreviewProps = {
  dividerPercent: number
  displayHeight?: number
  displayWidth?: number
  original: PixelBuffer
  processed: PixelBuffer | null
  pixelInspectorEnabled?: boolean
  status?: string
  previewViewport?: PreviewViewport
  viewScale: SlideCompareViewScale
  onDividerChange: (percent: number) => void
  onViewportChange?: (viewport: Partial<PreviewViewport>) => void
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
    previous.pixelInspectorEnabled !== next.pixelInspectorEnabled ||
    previous.previewViewport !== next.previewViewport ||
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
    previous.pixelInspectorEnabled !== next.pixelInspectorEnabled ||
    previous.previewViewport !== next.previewViewport ||
    previous.viewScale !== next.viewScale ||
    previous.onDividerChange !== next.onDividerChange ||
    previous.onViewportChange !== next.onViewportChange
  ) {
    return false
  }

  if (!previous.processed || !next.processed) {
    return previous.status === next.status
  }

  return true
}
