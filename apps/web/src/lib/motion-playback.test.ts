import type { FrameSequence } from "@workspace/core"
import { describe, expect, it } from "vitest"

import {
  getMotionPlaybackDelay,
  getNextMotionFrameIndex,
  getPreviousMotionFrameIndex,
  isMotionPlayable,
} from "./motion-playback"

describe("motion playback", () => {
  it("advances according to the current frame duration and wraps at the end", () => {
    const sequence = createFrameSequence()

    expect(isMotionPlayable(sequence)).toBe(true)
    expect(getMotionPlaybackDelay(sequence, 1)).toBe(250)
    expect(getNextMotionFrameIndex(sequence, 0)).toBe(1)
    expect(getNextMotionFrameIndex(sequence, 1)).toBe(2)
    expect(getNextMotionFrameIndex(sequence, 2)).toBe(0)
  })

  it("clamps manual previous and next frame commands", () => {
    const sequence = createFrameSequence()

    expect(getPreviousMotionFrameIndex(sequence, 0)).toBe(0)
    expect(getPreviousMotionFrameIndex(sequence, 2)).toBe(1)
    expect(getNextMotionFrameIndex(sequence, 2, { wrap: false })).toBe(2)
  })

  it("does not start playback for missing or single-frame sequences", () => {
    expect(isMotionPlayable(null)).toBe(false)
    expect(
      isMotionPlayable({ ...createFrameSequence(), frames: [createBuffer()] })
    ).toBe(false)
  })
})

function createFrameSequence(): FrameSequence {
  return {
    frames: [createBuffer(), createBuffer(), createBuffer()],
    durationsMs: [100, 250, 400],
    loopCount: 0,
    sourceWidth: 1,
    sourceHeight: 1,
  }
}

function createBuffer() {
  return {
    width: 1,
    height: 1,
    data: new Uint8ClampedArray([0, 0, 0, 255]),
  }
}
