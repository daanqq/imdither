import { clampOutputSize } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import { DEFAULT_PREVIEW_VIEWPORT } from "./preview-viewport"
import {
  applySourceIntakeResult,
  runDemoSourceIntake,
  runFileSourceIntake,
} from "./source-intake-application"
import type { LoadedSource } from "./source-intake"

describe("Source Intake application", () => {
  it("applies accepted Source Intake results as one editor transition", () => {
    const source = sourceWithSize(4096, 4096)
    const outputSize = clampOutputSize(4096, 4096)
    const callbacks = createCallbacks()

    const applied = applySourceIntakeResult(
      {
        type: "accepted",
        source,
        outputSize,
        notices: [
          {
            kind: "output-auto-sized",
            message: `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`,
          },
        ],
      },
      callbacks
    )

    expect(applied).toBe(true)
    expect(callbacks.onSourceChange).toHaveBeenCalledWith(source)
    expect(callbacks.onPreviewCycleReset).toHaveBeenCalledTimes(1)
    expect(callbacks.onPreviewViewportChange).toHaveBeenCalledWith(
      DEFAULT_PREVIEW_VIEWPORT
    )
    expect(callbacks.onErrorChange).toHaveBeenCalledWith(null)
    expect(callbacks.onSourceNoticeChange).toHaveBeenCalledWith(
      `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`
    )
    expect(callbacks.onSettingsTransition).toHaveBeenCalledWith(
      {
        type: "set-output-size",
        width: outputSize.width,
        height: outputSize.height,
      },
      undefined,
      { recordHistory: false }
    )
  })

  it("applies rejected Source Intake results without replacing the current source", () => {
    const callbacks = createCallbacks()

    const applied = applySourceIntakeResult(
      {
        type: "rejected",
        message: "Image is too large.",
      },
      callbacks
    )

    expect(applied).toBe(false)
    expect(callbacks.onErrorChange).toHaveBeenCalledWith("Image is too large.")
    expect(callbacks.onStatusChange).toHaveBeenCalledWith("error")
    expect(callbacks.onSourceChange).not.toHaveBeenCalled()
    expect(callbacks.onPreviewCycleReset).not.toHaveBeenCalled()
    expect(callbacks.onSettingsTransition).not.toHaveBeenCalled()
  })

  it("runs file Source Intake and maps decode failures to editor status", async () => {
    const callbacks = createCallbacks()
    const file = new File(["source"], "source.png")

    await runFileSourceIntake(file, {
      intakeImageFile: async () => {
        throw new Error("decode exploded")
      },
      onResult: vi.fn(),
      onErrorChange: callbacks.onErrorChange,
      onStatusChange: callbacks.onStatusChange,
    })

    expect(callbacks.onStatusChange).toHaveBeenNthCalledWith(1, "processing")
    expect(callbacks.onErrorChange).toHaveBeenCalledWith("decode exploded")
    expect(callbacks.onStatusChange).toHaveBeenLastCalledWith("error")
  })

  it("ignores stale Demo Image intake results", async () => {
    const callbacks = createCallbacks()
    const onResult = vi.fn()

    await runDemoSourceIntake({
      createDemoSourceIntake: async () => ({
        type: "accepted",
        source: sourceWithSize(2, 2),
        outputSize: clampOutputSize(2, 2),
        notices: [],
      }),
      isCurrent: () => false,
      onErrorChange: callbacks.onErrorChange,
      onResult,
      onStatusChange: callbacks.onStatusChange,
    })

    expect(callbacks.onStatusChange).toHaveBeenCalledWith("processing")
    expect(onResult).not.toHaveBeenCalled()
    expect(callbacks.onErrorChange).not.toHaveBeenCalled()
  })
})

function createCallbacks() {
  return {
    onErrorChange: vi.fn(),
    onPreviewCycleReset: vi.fn(),
    onPreviewViewportChange: vi.fn(),
    onSettingsTransition: vi.fn(),
    onSourceChange: vi.fn(),
    onSourceNoticeChange: vi.fn(),
    onStatusChange: vi.fn(),
  }
}

function sourceWithSize(width: number, height: number): LoadedSource {
  return {
    id: "source",
    name: "source.png",
    buffer: {
      width,
      height,
      data: new Uint8ClampedArray(0),
    },
    autoTuneAnalysisSample: {
      width,
      height,
      data: new Uint8ClampedArray(0),
    },
    originalWidth: width,
    originalHeight: height,
  }
}
