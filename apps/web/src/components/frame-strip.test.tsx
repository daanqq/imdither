import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import * as React from "react"

import { FrameStrip } from "./frame-strip"

describe("FrameStrip", () => {
  it("shows play button when paused and pause button when playing", () => {
    const paused = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 3,
        currentFrame: 0,
        isPlaying: false,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: vi.fn(),
        onNextFrame: vi.fn(),
      })
    )
    const playing = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 3,
        currentFrame: 0,
        isPlaying: true,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: vi.fn(),
        onNextFrame: vi.fn(),
      })
    )

    expect(paused).toContain("Play")
    expect(playing).toContain("Pause")
  })

  it("shows current frame indicator", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 5,
        currentFrame: 2,
        isPlaying: false,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: vi.fn(),
        onNextFrame: vi.fn(),
      })
    )

    expect(markup).toContain("3 / 5")
  })

  it("renders prev and next buttons", () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const markup = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 3,
        currentFrame: 0,
        isPlaying: false,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: onPrev,
        onNextFrame: onNext,
      })
    )

    expect(markup).toContain("Previous frame")
    expect(markup).toContain("Next frame")
  })

  it("disables prev button at frame 0 and next button at last frame", () => {
    const atStart = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 3,
        currentFrame: 0,
        isPlaying: false,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: vi.fn(),
        onNextFrame: vi.fn(),
      })
    )
    const atEnd = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 3,
        currentFrame: 2,
        isPlaying: false,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: vi.fn(),
        onNextFrame: vi.fn(),
      })
    )

    expect(atStart).toContain("disabled")
    expect(atEnd).toContain("disabled")
  })

  it("renders nothing when frameCount is 0", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FrameStrip, {
        frameCount: 0,
        currentFrame: 0,
        isPlaying: false,
        onPlayPause: vi.fn(),
        onFrameChange: vi.fn(),
        onPrevFrame: vi.fn(),
        onNextFrame: vi.fn(),
      })
    )

    expect(markup).toBe("")
  })
})
