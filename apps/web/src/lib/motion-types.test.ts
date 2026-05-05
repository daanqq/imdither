import { describe, expect, it } from "vitest"
import type { FrameSequence } from "@workspace/core"
import {
  calculateFrameStep,
  sampleFrames,
  isVideoFile,
  VIDEO_MIME_TYPES,
  VIDEO_EXTENSIONS,
} from "./motion-types"

describe("calculateFrameStep", () => {
  it("returns 1 when total frames <= cap", () => {
    expect(calculateFrameStep(100, 120)).toBe(1)
    expect(calculateFrameStep(50, 120)).toBe(1)
    expect(calculateFrameStep(120, 120)).toBe(1)
  })

  it("computes step to reduce frames at or below cap", () => {
    const step = calculateFrameStep(300, 120)
    expect(step).toBe(3)
  })

  it("handles edge cases", () => {
    expect(calculateFrameStep(0, 120)).toBe(1)
    expect(calculateFrameStep(1, 0)).toBe(1)
  })
})

describe("sampleFrames", () => {
  function makeSequence(frameCount: number): FrameSequence {
    return {
      frames: Array.from({ length: frameCount }, (_, i) => ({
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([
          i,
          0,
          0,
          255,
          0,
          0,
          0,
          255,
          0,
          0,
          0,
          255,
          0,
          0,
          0,
          255,
        ]),
      })),
      durationsMs: Array.from({ length: frameCount }, (_, i) => 100 + i * 10),
      loopCount: 0,
      sourceWidth: 2,
      sourceHeight: 2,
    }
  }

  it("returns identity when step <= 1", () => {
    const fs = makeSequence(10)
    expect(sampleFrames(fs, 1)).toBe(fs)
    expect(sampleFrames(fs, 0)).toBe(fs)
  })

  it("selects every Nth frame and adjusts durations", () => {
    const fs = makeSequence(10)
    const sampled = sampleFrames(fs, 3)
    expect(sampled.frames).toHaveLength(4)
    expect(sampled.durationsMs).toEqual([100, 130, 160, 190])
    expect(sampled.frames[0].data[0]).toBe(0)
    expect(sampled.frames[1].data[0]).toBe(3)
    expect(sampled.frames[2].data[0]).toBe(6)
    expect(sampled.frames[3].data[0]).toBe(9)
  })

  it("drops audio track when sampling", () => {
    const fs = makeSequence(5)
    const withAudio: FrameSequence = {
      ...fs,
      audioTrack: {
        codec: "opus",
        data: new ArrayBuffer(10),
        sampleRate: 48000,
        numberOfChannels: 2,
      },
    }
    const sampled = sampleFrames(withAudio, 2)
    expect(sampled.audioTrack).toBeUndefined()
  })
})

describe("isVideoFile", () => {
  it("detects video files by MIME type", () => {
    expect(isVideoFile(new File([], "test.mp4", { type: "video/mp4" }))).toBe(
      true
    )
    expect(isVideoFile(new File([], "test.webm", { type: "video/webm" }))).toBe(
      true
    )
    expect(
      isVideoFile(new File([], "test.mov", { type: "video/quicktime" }))
    ).toBe(true)
  })

  it("detects video files by extension", () => {
    expect(isVideoFile(new File([], "video.mp4", { type: "" }))).toBe(true)
    expect(isVideoFile(new File([], "clip.webm", { type: "" }))).toBe(true)
    expect(isVideoFile(new File([], "movie.mkv", { type: "" }))).toBe(true)
  })

  it("rejects non-video files", () => {
    expect(isVideoFile(new File([], "image.png", { type: "image/png" }))).toBe(
      false
    )
    expect(
      isVideoFile(new File([], "doc.pdf", { type: "application/pdf" }))
    ).toBe(false)
  })

  it("covers expected MIME types", () => {
    expect(VIDEO_MIME_TYPES).toContain("video/mp4")
    expect(VIDEO_MIME_TYPES).toContain("video/webm")
    expect(VIDEO_MIME_TYPES).toContain("video/quicktime")
    expect(VIDEO_MIME_TYPES).toContain("video/x-matroska")
    expect(VIDEO_MIME_TYPES).toContain("video/x-msvideo")
    expect(VIDEO_MIME_TYPES).toContain("video/mpeg")
    expect(VIDEO_MIME_TYPES).toContain("video/mp2t")
  })

  it("covers expected extensions", () => {
    expect(VIDEO_EXTENSIONS).toContain(".mp4")
    expect(VIDEO_EXTENSIONS).toContain(".m4v")
    expect(VIDEO_EXTENSIONS).toContain(".webm")
    expect(VIDEO_EXTENSIONS).toContain(".mov")
    expect(VIDEO_EXTENSIONS).toContain(".mkv")
    expect(VIDEO_EXTENSIONS).toContain(".avi")
    expect(VIDEO_EXTENSIONS).toContain(".mpeg")
    expect(VIDEO_EXTENSIONS).toContain(".mpg")
    expect(VIDEO_EXTENSIONS).toContain(".ts")
  })
})
