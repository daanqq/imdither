import type { PixelBuffer } from "@workspace/core"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_EXPORT_QUALITY,
  EXPORT_FORMAT_OPTIONS,
  encodePixelBuffer,
  makeExportName,
} from "./export-image"

const restoreGlobals: Array<() => void> = []

const buffer: PixelBuffer = {
  data: new Uint8ClampedArray([10, 20, 30, 128, 40, 50, 60, 255]),
  height: 1,
  width: 2,
}

describe("export image layer", () => {
  afterEach(() => {
    restoreGlobals
      .splice(0)
      .reverse()
      .forEach((restore) => restore())
    vi.restoreAllMocks()
  })

  it("defines the supported browser export formats once", () => {
    expect(EXPORT_FORMAT_OPTIONS).toEqual([
      {
        extension: "png",
        id: "png",
        label: "PNG",
        mimeType: "image/png",
        supportsQuality: false,
      },
      {
        extension: "webp",
        id: "webp",
        label: "WebP",
        mimeType: "image/webp",
        supportsQuality: true,
      },
      {
        extension: "jpg",
        id: "jpeg",
        label: "JPEG",
        mimeType: "image/jpeg",
        supportsQuality: true,
      },
    ])
    expect(DEFAULT_EXPORT_QUALITY).toBe(0.9)
    expect(makeExportName("source photo.png", "webp")).toBe(
      "imdither-source-photo.webp"
    )
  })

  it("encodes PNG without lossy quality and WebP with the selected quality", async () => {
    const { toBlob } = installCanvasMock()

    const png = await encodePixelBuffer(buffer, {
      alphaBackground: "black",
      format: "png",
      quality: 0.5,
    })
    const webp = await encodePixelBuffer(buffer, {
      alphaBackground: "black",
      format: "webp",
      quality: 0.7,
    })

    expect(toBlob).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      "image/png",
      undefined
    )
    expect(toBlob).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      "image/webp",
      0.7
    )
    expect(png.type).toBe("image/png")
    expect(webp.type).toBe("image/webp")
    expect(makeExportName("source photo.png", "jpeg")).toBe(
      "imdither-source-photo.jpg"
    )
  })

  it("flattens JPEG alpha against the selected alpha background", async () => {
    const { getContext, putImageData } = installCanvasMock()

    await encodePixelBuffer(buffer, {
      alphaBackground: "white",
      format: "jpeg",
      quality: 0.85,
    })

    expect(getContext).toHaveBeenCalledWith("2d")
    expect(putImageData).toHaveBeenCalledTimes(1)
    const imageData = putImageData.mock.calls[0]?.[0] as ImageData
    expect(Array.from(imageData.data)).toEqual([
      132, 137, 142, 255, 40, 50, 60, 255,
    ])
  })

  it("reports selected format when browser encoding fails", async () => {
    installCanvasMock({ blob: null })

    await expect(
      encodePixelBuffer(buffer, {
        alphaBackground: "black",
        format: "webp",
        quality: 0.8,
      })
    ).rejects.toThrow("WebP export failed")
  })
})

function installCanvasMock(options: { blob?: Blob | null } = {}) {
  const getContext = vi.fn(() => ({ putImageData }))
  const putImageData = vi.fn()
  const toBlob = vi.fn(
    (callback: BlobCallback, type?: string, quality?: number): void => {
      callback(
        options.blob === undefined
          ? new Blob(["encoded"], { type: type ?? "" })
          : options.blob
      )
      void quality
    }
  )
  class ImageDataMock {
    data: Uint8ClampedArray
    height: number
    width: number

    constructor(data: Uint8ClampedArray, width: number, height?: number) {
      this.data = data
      this.width = width
      this.height = height ?? 1
    }
  }
  const documentMock = {
    createElement: () => ({
      height: 0,
      width: 0,
      getContext,
      toBlob,
    }),
  } as unknown as Document

  replaceGlobal("ImageData", ImageDataMock as unknown as typeof ImageData)
  replaceGlobal("document", documentMock)

  return { getContext, putImageData, toBlob }
}

function replaceGlobal(key: "ImageData" | "document", value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)

  Object.defineProperty(globalThis, key, {
    configurable: true,
    value,
  })

  restoreGlobals.push(() => {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
      return
    }

    delete (globalThis as Record<string, unknown>)[key]
  })
}
