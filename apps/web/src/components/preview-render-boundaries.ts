import type { PixelBuffer } from "@workspace/core"

import type { PreviewViewport } from "@/lib/preview-viewport"
import type { PreviewSurfaceDisplayModel } from "@/lib/preview-presentation"
import type { ViewScale } from "@/store/editor-store"

export type CanvasPanelProps = {
  buffer: PixelBuffer | null
  expectedHeight: number
  expectedWidth: number
  label: string
  manualExpectedHeight?: number
  manualExpectedWidth?: number
  missing?: boolean
  pixelInspectorEnabled?: boolean
  status?: string
  previewViewport?: PreviewViewport
  viewScale: ViewScale
  onViewportChange: (viewport: Partial<PreviewViewport>) => void
}

export type SlideComparePreviewProps = {
  dividerPercent: number
  displayModel: PreviewSurfaceDisplayModel
  initialViewportBox?: {
    height: number
    width: number
  } | null
  original: PixelBuffer
  processed: PixelBuffer | null
  pixelInspectorEnabled?: boolean
  status?: string
  previewViewport?: PreviewViewport
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
    previous.label !== next.label ||
    previous.manualExpectedHeight !== next.manualExpectedHeight ||
    previous.manualExpectedWidth !== next.manualExpectedWidth ||
    previous.missing !== next.missing ||
    previous.pixelInspectorEnabled !== next.pixelInspectorEnabled ||
    previous.previewViewport !== next.previewViewport ||
    previous.viewScale !== next.viewScale ||
    previous.onViewportChange !== next.onViewportChange
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
    previous.displayModel !== next.displayModel ||
    previous.initialViewportBox !== next.initialViewportBox ||
    previous.original !== next.original ||
    previous.processed !== next.processed ||
    previous.pixelInspectorEnabled !== next.pixelInspectorEnabled ||
    previous.previewViewport !== next.previewViewport ||
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
