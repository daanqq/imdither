import { clampOutputSize, MAX_SOURCE_DIMENSION } from "@workspace/core"
import i18n from "@/i18n"

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
  return i18n.t("error.imageTooLargeDimension", {
    width,
    height,
    max: MAX_SOURCE_DIMENSION,
  })
}

export function getOutputAutoSizedNotice(size: OutputSizePolicy): string {
  return `[OUTPUT AUTO-SIZED: ${size.width}x${size.height} / 12MP]`
}

export function getOutputClampedNotice(size: OutputSizePolicy): string {
  return `[OUTPUT CLAMPED: ${size.width}x${size.height} / 12MP]`
}
