import { describe, expect, it } from "vitest"
import { hasAcTlChunk } from "./apng-intake-detect"

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

function makeIhdrChunk(): Uint8Array {
  const ihdrData = new Uint8Array([
    0,
    0,
    0,
    1, // width = 1
    0,
    0,
    0,
    1, // height = 1
    8, // bit depth = 8
    6, // color type = RGBA
    0, // compression
    0, // filter
    0, // interlace
  ])
  const type = new TextEncoder().encode("IHDR")
  const length = new Uint8Array([0, 0, 0, 13])
  const crc = new Uint8Array([0, 0, 0, 0])
  return concat([length, type, ihdrData, crc])
}

function makeAcTlChunk(numFrames = 1, numPlays = 0): Uint8Array {
  const actlData = new Uint8Array([
    (numFrames >> 24) & 0xff,
    (numFrames >> 16) & 0xff,
    (numFrames >> 8) & 0xff,
    numFrames & 0xff,
    (numPlays >> 24) & 0xff,
    (numPlays >> 16) & 0xff,
    (numPlays >> 8) & 0xff,
    numPlays & 0xff,
  ])
  const type = new TextEncoder().encode("acTL")
  const length = new Uint8Array([0, 0, 0, 8])
  const crc = new Uint8Array([0, 0, 0, 0])
  return concat([length, type, actlData, crc])
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

function createFileFromBytes(bytes: Uint8Array, name = "test.png"): File {
  return new File([bytes], name, { type: "image/png" })
}

describe("hasAcTlChunk", () => {
  it("returns true for APNG with acTL chunk", async () => {
    const apngBytes = concat([PNG_SIGNATURE, makeIhdrChunk(), makeAcTlChunk()])
    const file = createFileFromBytes(apngBytes)
    await expect(hasAcTlChunk(file)).resolves.toBe(true)
  })

  it("returns false for ordinary PNG without acTL", async () => {
    const pngBytes = concat([PNG_SIGNATURE, makeIhdrChunk()])
    const file = createFileFromBytes(pngBytes)
    await expect(hasAcTlChunk(file)).resolves.toBe(false)
  })

  it("returns false for truncated file", async () => {
    const truncated = new Uint8Array([0x89, 0x50, 0x4e]) // just partial header
    const file = createFileFromBytes(truncated)
    await expect(hasAcTlChunk(file)).resolves.toBe(false)
  })
})
