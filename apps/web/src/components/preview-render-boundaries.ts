import type { PixelBuffer } from "@workspace/core"

import type { PreviewViewport } from "@/lib/preview-viewport"
import type { ViewScale } from "@/store/editor-store"

export type CanvasPanelProps = {
  buffer: PixelBuffer | null
  expectedHeight: number
  expectedWidth: number
  initialViewportBox?: {
    height: number
    width: number
  } | null
  label: string
  missing?: boolean
  pixelInspectorEnabled?: boolean
  status?: string
  previewViewport?: PreviewViewport
  viewScale: ViewScale
  onViewportBoxChange?: (box: { height: number; width: number }) => void
}

export type SlideCompareViewScale = "fit" | "actual"

export type SlideComparePreviewProps = {
  dividerPercent: number
  displayHeight?: number
  displayWidth?: number
  initialViewportBox?: {
    height: number
    width: number
  } | null
  original: PixelBuffer
  processed: PixelBuffer | null
  pixelInspectorEnabled?: boolean
  status?: string
  previewViewport?: PreviewViewport
  viewScale: SlideCompareViewScale
  onDividerChange: (percent: number) => void
  onViewportChange?: (viewport: Partial<PreviewViewport>) => void
  onViewportBoxChange?: (box: { height: number; width: number }) => void
}

export function areCanvasPanelPropsEqual(
  previous: CanvasPanelProps,
  next: CanvasPanelProps
) {
  if (
    previous.buffer !== next.buffer ||
    previous.expectedHeight !== next.expectedHeight ||
    previous.expectedWidth !== next.expectedWidth ||
    previous.initialViewportBox !== next.initialViewportBox ||
    previous.label !== next.label ||
    previous.missing !== next.missing ||
    previous.pixelInspectorEnabled !== next.pixelInspectorEnabled ||
    previous.previewViewport !== next.previewViewport ||
    previous.viewScale !== next.viewScale ||
    previous.onViewportBoxChange !== next.onViewportBoxChange
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
    previous.initialViewportBox !== next.initialViewportBox ||
    previous.original !== next.original ||
    previous.processed !== next.processed ||
    previous.pixelInspectorEnabled !== next.pixelInspectorEnabled ||
    previous.previewViewport !== next.previewViewport ||
    previous.viewScale !== next.viewScale ||
    previous.onDividerChange !== next.onDividerChange ||
    previous.onViewportChange !== next.onViewportChange ||
    previous.onViewportBoxChange !== next.onViewportBoxChange
  ) {
    return false
  }

  if (!previous.processed || !next.processed) {
    return previous.status === next.status
  }

  return true
}
