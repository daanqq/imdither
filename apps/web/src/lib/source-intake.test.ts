import { clampOutputSize, MAX_SOURCE_DIMENSION } from "@workspace/core"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  acceptLoadedSource,
  createDemoSourceIntake,
  formatSourceNotices,
  intakeImageFile,
} from "./source-intake"

describe("Source Intake", () => {
  const originalWorker = globalThis.Worker
  const originalCreateImageBitmap = globalThis.createImageBitmap

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()

    if (originalWorker) {
      vi.stubGlobal("Worker", originalWorker)
    }

    if (originalCreateImageBitmap) {
      vi.stubGlobal("createImageBitmap", originalCreateImageBitmap)
    }
  })

  it("accepts Source Images through the async intake boundary without main-thread decode", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => {
        throw new Error("main-thread decode should not run")
      })
    )
    vi.stubGlobal(
      "Worker",
      createFakeIntakeWorkerClass({
        type: "accepted",
        source: sourceWithSize(2, 1),
        outputSize: clampOutputSize(2, 1),
        notices: [],
      })
    )

    const result = await intakeImageFile(new File(["source"], "source.png"))

    expect(result.type).toBe("accepted")

    if (result.type !== "accepted") {
      return
    }

    expect(result.source.name).toBe("source.png")
    expect(result.source.buffer.width).toBe(2)
    expect(result.source.buffer.height).toBe(1)
    expect(result.source.buffer.data).toBeInstanceOf(Uint8ClampedArray)
    expect(Object.keys(result.source.buffer)).toEqual(["width", "height"])
  })

  it("falls back to main-thread Source Intake when workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined)
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 1,
        height: 1,
        close: vi.fn(),
      }))
    )
    vi.stubGlobal("document", createFakeCanvasDocument(1, 1))

    const result = await intakeImageFile(new File(["source"], "source.png"))

    expect(result.type).toBe("accepted")

    if (result.type !== "accepted") {
      return
    }

    expect(result.source.buffer.data).toEqual(
      new Uint8ClampedArray([1, 2, 3, 255])
    )
    expect(Object.keys(result.source.buffer)).toEqual(["width", "height"])
  })

  it("yields before main-thread fallback decode starts", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("Worker", undefined)
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 1,
        height: 1,
        close: vi.fn(),
      }))
    )
    vi.stubGlobal("document", createFakeCanvasDocument(1, 1))

    const resultPromise = intakeImageFile(new File(["source"], "source.png"))

    expect(createImageBitmap).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(0)

    expect(createImageBitmap).toHaveBeenCalledTimes(1)
    await expect(resultPromise).resolves.toMatchObject({ type: "accepted" })
  })

  it("rejects Source Images beyond the source dimension limit", () => {
    const result = acceptLoadedSource(
      sourceWithSize(MAX_SOURCE_DIMENSION + 1, 100)
    )

    expect(result).toEqual({
      type: "rejected",
      message: `Image is too large (${MAX_SOURCE_DIMENSION + 1}x100). Maximum source dimension is ${MAX_SOURCE_DIMENSION}px.`,
    })
  })

  it("recommends an Output Size within the Output Cap", () => {
    const result = acceptLoadedSource(sourceWithSize(4096, 4096))
    const expectedSize = clampOutputSize(4096, 4096)

    expect(result.type).toBe("accepted")

    if (result.type !== "accepted") {
      return
    }

    expect(result.outputSize).toEqual(expectedSize)
    expect(formatSourceNotices(result.notices)).toBe(
      `[OUTPUT AUTO-SIZED: ${expectedSize.width}x${expectedSize.height} / 12MP]`
    )
  })

  it("loads the bundled Demo Image with a Source Notice", async () => {
    vi.stubGlobal("Worker", undefined)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(["demo"], { type: "image/png" }),
      }))
    )
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 1,
        height: 1,
        close: vi.fn(),
      }))
    )
    vi.stubGlobal("document", createFakeCanvasDocument(1, 1))

    const result = await createDemoSourceIntake()

    expect(result.type).toBe("accepted")

    if (result.type !== "accepted") {
      return
    }

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.source.id).toBe("demo")
    expect(result.source.name).toBe("Bundled demo image")
    expect(Object.keys(result.source.buffer)).toEqual(["width", "height"])
    expect(formatSourceNotices(result.notices)).toBe("[DEMO SOURCE LOADED]")
  })
})

function sourceWithSize(width: number, height: number) {
  return {
    id: "source",
    name: "source.png",
    buffer: {
      width,
      height,
      data: new Uint8ClampedArray(0),
    },
    originalWidth: width,
    originalHeight: height,
  }
}

function createFakeIntakeWorkerClass(
  result: Awaited<ReturnType<typeof intakeImageFile>>
) {
  return class FakeWorker extends EventTarget {
    postMessage() {
      queueMicrotask(() => {
        this.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: "complete",
              jobId: 1,
              result,
            },
          })
        )
      })
    }

    terminate() {}
  }
}

function createFakeCanvasDocument(width: number, height: number) {
  return {
    createElement: (tagName: string) => {
      if (tagName !== "canvas") {
        throw new Error(`Unexpected element: ${tagName}`)
      }

      return {
        width,
        height,
        getContext: () => ({
          drawImage: vi.fn(),
          getImageData: () => ({
            width,
            height,
            data: new Uint8ClampedArray([1, 2, 3, 255]),
          }),
        }),
      }
    },
  }
}
