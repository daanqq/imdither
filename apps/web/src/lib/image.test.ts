import type { PixelBuffer } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import { drawPixelBufferToCanvasSize } from "./image"

describe("image drawing", () => {
  it("draws a pixel buffer into explicit canvas dimensions", () => {
    const drawImage = vi.fn()
    const putImageData = vi.fn()
    const canvas = {
      height: 0,
      width: 0,
      getContext: () => ({
        drawImage,
        imageSmoothingEnabled: false,
      }),
    } as unknown as HTMLCanvasElement
    const buffer: PixelBuffer = {
      data: new Uint8ClampedArray(16),
      height: 2,
      width: 2,
    }
    const OriginalImageData = globalThis.ImageData
    const OriginalDocument = globalThis.document

    globalThis.ImageData = vi.fn(
      function ImageDataMock() {}
    ) as unknown as typeof ImageData
    globalThis.document = {
      createElement: () => ({
        height: 0,
        width: 0,
        getContext: () => ({ putImageData }),
      }),
    } as unknown as Document

    try {
      drawPixelBufferToCanvasSize(canvas, buffer, { height: 12, width: 20 })
    } finally {
      globalThis.ImageData = OriginalImageData
      globalThis.document = OriginalDocument
    }

    expect(canvas.width).toBe(20)
    expect(canvas.height).toBe(12)
    expect(putImageData).toHaveBeenCalledTimes(1)
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 20, 12)
  })
})
