import { clampOutputSize, MAX_SOURCE_DIMENSION } from "@workspace/core"

export type OutputSizePolicy = ReturnType<typeof clampOutputSize>

export function resolveOutputSizePolicy(
  width: number,
  height: number
): OutputSizePolicy {
  return clampOutputSize(width, height)
}

export function shouldRejectSourceSize(width: number, height: number): boolean {
  return width > MAX_SOURCE_DIMENSION || height > MAX_SOURCE_DIMENSION
}

export function getSourceRejectionMessage(
  width: number,
  height: number
): string {
  return `Image is too large (${width}x${height}). Maximum source dimension is ${MAX_SOURCE_DIMENSION}px.`
}

export function getOutputAutoSizedNotice(size: OutputSizePolicy): string {
  return `[OUTPUT AUTO-SIZED: ${size.width}x${size.height} / 12MP]`
}

export function getOutputClampedNotice(size: OutputSizePolicy): string {
  return `[OUTPUT CLAMPED: ${size.width}x${size.height} / 12MP]`
}
