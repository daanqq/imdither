export type PreviewStageFrameDimensions = {
  controlsFrameHeight: number
  controlsFrameWidth: number
  manualFrameHeight: number
  manualFrameWidth: number
  previewFrameHeight: number
  previewFrameWidth: number
}

export function getPreviewStageFrameDimensions({
  isDesktopViewScale,
  outputHeight,
  outputWidth,
  previewTargetHeight,
  previewTargetWidth,
  realPixelsMode,
}: {
  isDesktopViewScale: boolean
  outputHeight?: number
  outputWidth?: number
  previewTargetHeight: number
  previewTargetWidth: number
  realPixelsMode: boolean
}): PreviewStageFrameDimensions {
  const previewFrameWidth =
    isDesktopViewScale || realPixelsMode
      ? (outputWidth ?? previewTargetWidth)
      : previewTargetWidth
  const previewFrameHeight =
    isDesktopViewScale || realPixelsMode
      ? (outputHeight ?? previewTargetHeight)
      : previewTargetHeight
  const controlsFrameWidth = outputWidth ?? previewFrameWidth
  const controlsFrameHeight = outputHeight ?? previewFrameHeight

  return {
    controlsFrameHeight,
    controlsFrameWidth,
    manualFrameHeight: controlsFrameHeight,
    manualFrameWidth: controlsFrameWidth,
    previewFrameHeight,
    previewFrameWidth,
  }
}
