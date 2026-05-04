import { describe, expect, it } from "vitest"
import type { FrameSequence } from "@workspace/core"
import { decodeApngToFrameSequence } from "./apng-intake"
import { encodeFrameSequenceToApng } from "./apng-export"

function createTestFrameSequence(): FrameSequence {
  const width = 2
  const height = 2
  const frame1 = new Uint8ClampedArray(width * height * 4)
  frame1.set([
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
  ])
  const frame2 = new Uint8ClampedArray(width * height * 4)
  frame2.set([
    10, 20, 30, 255, 40, 50, 60, 128, 70, 80, 90, 200, 100, 110, 120, 255,
  ])
  return {
    frames: [
      { width, height, data: frame1 },
      { width, height, data: frame2 },
    ],
    durationsMs: [100, 200],
    loopCount: 0,
    sourceWidth: width,
    sourceHeight: height,
  }
}

describe("encodeFrameSequenceToApng", () => {
  it("round-trips through decode preserving frame count and dimensions", () => {
    const original = createTestFrameSequence()
    const bytes = encodeFrameSequenceToApng(original)
    const decoded = decodeApngToFrameSequence(
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer
    )
    expect(decoded.frames).toHaveLength(2)
    expect(decoded.sourceWidth).toBe(2)
    expect(decoded.sourceHeight).toBe(2)
  })

  it("preserves loop count", () => {
    const original = createTestFrameSequence()
    const bytes = encodeFrameSequenceToApng(original)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    const decoded = decodeApngToFrameSequence(buffer)
    expect(decoded.loopCount).toBe(0)
  })

  it("preserves frame durations", () => {
    const original = createTestFrameSequence()
    const bytes = encodeFrameSequenceToApng(original)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    const decoded = decodeApngToFrameSequence(buffer)
    expect(decoded.durationsMs).toHaveLength(2)
    // Allow small rounding from 1000ms-based APNG timing
    expect(Math.abs(decoded.durationsMs[0] - 100)).toBeLessThanOrEqual(5)
    expect(Math.abs(decoded.durationsMs[1] - 200)).toBeLessThanOrEqual(5)
  })

  it("handles single-frame sequence", () => {
    const original = createTestFrameSequence()
    const single: FrameSequence = {
      ...original,
      frames: [original.frames[0]],
      durationsMs: [100],
    }
    const bytes = encodeFrameSequenceToApng(single)
    expect(bytes.length).toBeGreaterThan(0)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    const decoded = decodeApngToFrameSequence(buffer)
    expect(decoded.frames).toHaveLength(1)
  })

  it("preserves pixel data through round-trip", () => {
    const original = createTestFrameSequence()
    const bytes = encodeFrameSequenceToApng(original)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    const decoded = decodeApngToFrameSequence(buffer)
    for (let i = 0; i < original.frames.length; i++) {
      expect(Array.from(decoded.frames[i].data)).toEqual(
        Array.from(original.frames[i].data)
      )
    }
  })
})
