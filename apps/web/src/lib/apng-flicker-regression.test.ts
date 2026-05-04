import { describe, expect, it } from "vitest"
import type { FrameSequence } from "@workspace/core"
import { decodeApngToFrameSequence } from "./apng-intake"
import { encodeFrameSequenceToApng } from "./apng-export"

function createFramesWithAlpha(): FrameSequence {
  const width = 2
  const height = 2
  // frame 1: opaque red
  const frame1 = new Uint8ClampedArray(width * height * 4)
  frame1.set([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255])
  // frame 2: green with varying alpha (some transparent)
  const frame2 = new Uint8ClampedArray(width * height * 4)
  frame2.set([0, 255, 0, 255, 0, 255, 0, 128, 0, 255, 0, 64, 0, 255, 0, 0])
  return {
    frames: [
      { width, height, data: frame1 },
      { width, height, data: frame2 },
    ],
    durationsMs: [100, 100],
    loopCount: 0,
    sourceWidth: width,
    sourceHeight: height,
  }
}

describe("APNG flicker regression", () => {
  it("preserves alpha channel through round-trip", () => {
    const original = createFramesWithAlpha()
    const bytes = encodeFrameSequenceToApng(original)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    const decoded = decodeApngToFrameSequence(buffer)

    for (let f = 0; f < original.frames.length; f++) {
      const src = original.frames[f].data
      const dst = decoded.frames[f].data
      expect(Array.from(dst)).toEqual(Array.from(src))
    }
  })
})
