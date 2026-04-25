import type { PixelBuffer } from "@workspace/core"

export function hidePixelBufferData(buffer: PixelBuffer): PixelBuffer {
  const descriptor = Object.getOwnPropertyDescriptor(buffer, "data")

  if (descriptor && !descriptor.enumerable) {
    return buffer
  }

  Object.defineProperty(buffer, "data", {
    configurable: true,
    enumerable: false,
    value: buffer.data,
    writable: true,
  })

  return buffer
}
