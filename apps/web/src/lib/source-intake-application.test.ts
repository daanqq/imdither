import { clampOutputSize } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  executeSourceLoadCommand,
  type SourceIntakeRuntimeAdapter,
  type SourceLoadCommand,
} from "./source-intake-application"
import type { LoadedSource } from "./source-intake"

describe("executeSourceLoadCommand", () => {
  const outputSize = clampOutputSize(4096, 4096)
  const acceptedSource = sourceWithSize(4096, 4096)

  function createAdapter(overrides: Partial<SourceIntakeRuntimeAdapter> = {}) {
    return {
      setStatus: vi.fn(),
      setSource: vi.fn(),
      setSourceNotice: vi.fn(),
      setError: vi.fn(),
      resetPreviewCycle: vi.fn(),
      resetPreviewViewport: vi.fn(),
      applyOutputSizeWithoutHistory: vi.fn(),
      ...overrides,
    } satisfies SourceIntakeRuntimeAdapter
  }

  it("executes a file command and applies accepted results through the adapter", async () => {
    const adapter = createAdapter()
    const command: SourceLoadCommand = {
      kind: "file",
      file: new File(["pixels"], "photo.png"),
    }

    await executeSourceLoadCommand(command, adapter, {
      intakeImageFile: async () => ({
        type: "accepted",
        source: acceptedSource,
        outputSize,
        notices: [
          {
            kind: "output-auto-sized",
            message: `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`,
          },
        ],
      }),
    })

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setSource).toHaveBeenCalledWith(acceptedSource)
    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.resetPreviewViewport).toHaveBeenCalledTimes(1)
    expect(adapter.setError).toHaveBeenCalledWith(null)
    expect(adapter.setSourceNotice).toHaveBeenCalledWith(
      `[OUTPUT AUTO-SIZED: ${outputSize.width}x${outputSize.height} / 12MP]`
    )
    expect(adapter.applyOutputSizeWithoutHistory).toHaveBeenCalledWith(
      outputSize.width,
      outputSize.height
    )
  })

  it("executes a file command and applies rejected results without touching source or preview", async () => {
    const adapter = createAdapter()
    const command: SourceLoadCommand = {
      kind: "file",
      file: new File(["huge"], "oversized.png"),
    }

    await executeSourceLoadCommand(command, adapter, {
      intakeImageFile: async () => ({
        type: "rejected",
        message: "Image is too large.",
      }),
    })

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setError).toHaveBeenCalledWith("Image is too large.")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
    expect(adapter.setSource).not.toHaveBeenCalled()
    expect(adapter.resetPreviewCycle).not.toHaveBeenCalled()
    expect(adapter.resetPreviewViewport).not.toHaveBeenCalled()
    expect(adapter.applyOutputSizeWithoutHistory).not.toHaveBeenCalled()
  })

  it("maps file intake exceptions to adapter error", async () => {
    const adapter = createAdapter()
    const command: SourceLoadCommand = {
      kind: "file",
      file: new File(["corrupt"], "bad.png"),
    }

    await executeSourceLoadCommand(command, adapter, {
      intakeImageFile: async () => {
        throw new Error("decode exploded")
      },
    })

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setError).toHaveBeenCalledWith("decode exploded")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
    expect(adapter.setSource).not.toHaveBeenCalled()
    expect(adapter.resetPreviewCycle).not.toHaveBeenCalled()
  })

  it("executes a demo command and applies accepted results when current", async () => {
    const adapter = createAdapter({ isCurrent: () => true })
    const command: SourceLoadCommand = { kind: "demo" }

    await executeSourceLoadCommand(command, adapter, {
      createDemoSourceIntake: async () => ({
        type: "accepted",
        source: acceptedSource,
        outputSize,
        notices: [{ kind: "demo-loaded", message: "[DEMO SOURCE LOADED]" }],
      }),
    })

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setSource).toHaveBeenCalledWith(acceptedSource)
    expect(adapter.resetPreviewCycle).toHaveBeenCalledTimes(1)
    expect(adapter.resetPreviewViewport).toHaveBeenCalledTimes(1)
    expect(adapter.setError).toHaveBeenCalledWith(null)
    expect(adapter.setSourceNotice).toHaveBeenCalledWith("[DEMO SOURCE LOADED]")
  })

  it("ignores demo results when no longer current", async () => {
    const adapter = createAdapter({ isCurrent: () => false })
    const command: SourceLoadCommand = { kind: "demo" }

    await executeSourceLoadCommand(command, adapter, {
      createDemoSourceIntake: async () => ({
        type: "accepted",
        source: acceptedSource,
        outputSize,
        notices: [],
      }),
    })

    expect(adapter.setStatus).toHaveBeenCalledWith("processing")
    expect(adapter.setSource).not.toHaveBeenCalled()
    expect(adapter.resetPreviewCycle).not.toHaveBeenCalled()
    expect(adapter.setError).not.toHaveBeenCalled()
  })

  it("reports demo load failure when current", async () => {
    const adapter = createAdapter({ isCurrent: () => true })
    const command: SourceLoadCommand = { kind: "demo" }

    await executeSourceLoadCommand(command, adapter, {
      createDemoSourceIntake: async () => {
        throw new Error("demo fetch failed")
      },
    })

    expect(adapter.setStatus).toHaveBeenNthCalledWith(1, "processing")
    expect(adapter.setError).toHaveBeenCalledWith("demo fetch failed")
    expect(adapter.setStatus).toHaveBeenLastCalledWith("error")
    expect(adapter.setSource).not.toHaveBeenCalled()
  })

  it("swallows demo load failure when stale", async () => {
    const adapter = createAdapter({ isCurrent: () => false })
    const command: SourceLoadCommand = { kind: "demo" }

    await executeSourceLoadCommand(command, adapter, {
      createDemoSourceIntake: async () => {
        throw new Error("demo fetch failed")
      },
    })

    expect(adapter.setStatus).toHaveBeenCalledWith("processing")
    expect(adapter.setError).not.toHaveBeenCalled()
    expect(adapter.setSource).not.toHaveBeenCalled()
  })

  it("sets loading status before command execution begins", async () => {
    const callOrder: string[] = []
    const adapter = createAdapter({
      setStatus: vi.fn((status: string) => {
        callOrder.push(`status:${status}`)
      }),
      setSource: vi.fn(() => {
        callOrder.push("source")
      }),
    })
    const command: SourceLoadCommand = {
      kind: "file",
      file: new File(["ok"], "ok.png"),
    }

    await executeSourceLoadCommand(command, adapter, {
      intakeImageFile: async () => {
        callOrder.push("intake-start")
        return {
          type: "accepted",
          source: acceptedSource,
          outputSize,
          notices: [],
        }
      },
    })

    expect(callOrder).toEqual(["status:processing", "intake-start", "source"])
  })
})

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
