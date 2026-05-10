import type { FrameSequence } from "@workspace/core"

export function isMotionPlayable(frameSequence: FrameSequence | null): boolean {
  return (frameSequence?.frames.length ?? 0) > 1
}

export function getMotionPlaybackDelay(
  frameSequence: FrameSequence,
  currentFrameIndex: number
): number {
  return frameSequence.durationsMs[currentFrameIndex] ?? 100
}

export function getNextMotionFrameIndex(
  frameSequence: FrameSequence,
  currentFrameIndex: number,
  options: { wrap?: boolean } = {}
): number {
  const maxIndex = Math.max(0, frameSequence.frames.length - 1)

  if (currentFrameIndex >= maxIndex) {
    return options.wrap === false ? maxIndex : 0
  }

  return Math.min(maxIndex, currentFrameIndex + 1)
}

export function getPreviousMotionFrameIndex(
  frameSequence: FrameSequence,
  currentFrameIndex: number
): number {
  return Math.max(0, currentFrameIndex - 1)
}
