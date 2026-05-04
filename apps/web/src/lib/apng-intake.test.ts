import { describe, expect, it } from "vitest"
import { zlibSync } from "fflate"
import { decodeApngToFrameSequence } from "./apng-intake"

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const length = new Uint8Array([
    (data.length >> 24) & 0xff,
    (data.length >> 16) & 0xff,
    (data.length >> 8) & 0xff,
    data.length & 0xff,
  ])
  const crcInput = new Uint8Array(typeBytes.length + data.length)
  crcInput.set(typeBytes)
  crcInput.set(data, typeBytes.length)
  const crc = crc32(crcInput)
  const crcBytes = new Uint8Array([
    (crc >> 24) & 0xff,
    (crc >> 16) & 0xff,
    (crc >> 8) & 0xff,
    crc & 0xff,
  ])
  return concat([length, typeBytes, data, crcBytes])
}

function makeIhdrData(width: number, height: number): Uint8Array {
  return new Uint8Array([
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    8, // bit depth
    6, // RGBA
    0, // compression
    0, // filter
    0, // interlace
  ])
}

function makeAcTlData(numFrames: number, numPlays: number): Uint8Array {
  return new Uint8Array([
    (numFrames >> 24) & 0xff,
    (numFrames >> 16) & 0xff,
    (numFrames >> 8) & 0xff,
    numFrames & 0xff,
    (numPlays >> 24) & 0xff,
    (numPlays >> 16) & 0xff,
    (numPlays >> 8) & 0xff,
    numPlays & 0xff,
  ])
}

function makeFcTlData(
  seqNum: number,
  width: number,
  height: number,
  delayNum: number,
  delayDen: number
): Uint8Array {
  const buf = new Uint8Array(26)
  let o = 0
  // sequence_number
  buf[o++] = (seqNum >> 24) & 0xff
  buf[o++] = (seqNum >> 16) & 0xff
  buf[o++] = (seqNum >> 8) & 0xff
  buf[o++] = seqNum & 0xff
  // width
  buf[o++] = (width >> 24) & 0xff
  buf[o++] = (width >> 16) & 0xff
  buf[o++] = (width >> 8) & 0xff
  buf[o++] = width & 0xff
  // height
  buf[o++] = (height >> 24) & 0xff
  buf[o++] = (height >> 16) & 0xff
  buf[o++] = (height >> 8) & 0xff
  buf[o++] = height & 0xff
  // x_offset = 0
  buf[o++] = 0
  buf[o++] = 0
  buf[o++] = 0
  buf[o++] = 0
  // y_offset = 0
  buf[o++] = 0
  buf[o++] = 0
  buf[o++] = 0
  buf[o++] = 0
  // delay_num
  buf[o++] = (delayNum >> 8) & 0xff
  buf[o++] = delayNum & 0xff
  // delay_den
  buf[o++] = (delayDen >> 8) & 0xff
  buf[o++] = delayDen & 0xff
  // dispose_op = 0 (NONE)
  buf[o++] = 0
  // blend_op = 0 (SOURCE)
  buf[o++] = 0
  return buf
}

function compressFrame(
  width: number,
  height: number,
  pixels: Uint8Array
): Uint8Array {
  const raw = new Uint8Array(width * height * 4 + height)
  let offset = 0
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0 // filter None
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 4
      raw[offset++] = pixels[pi]
      raw[offset++] = pixels[pi + 1]
      raw[offset++] = pixels[pi + 2]
      raw[offset++] = pixels[pi + 3]
    }
  }
  return zlibSync(raw, { level: 0 })
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

describe("decodeApngToFrameSequence", () => {
  it("decodes a multi-frame APNG into a FrameSequence", () => {
    const w = 2,
      h = 2
    const frame1Pixels = new Uint8Array([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ])
    const frame2Pixels = new Uint8Array([
      0, 0, 0, 255, 128, 128, 128, 255, 50, 100, 150, 255, 200, 200, 200, 255,
    ])
    const compressed1 = compressFrame(w, h, frame1Pixels)
    const compressed2 = compressFrame(w, h, frame2Pixels)

    const apng = concat([
      PNG_SIGNATURE,
      makeChunk("IHDR", makeIhdrData(w, h)),
      makeChunk("acTL", makeAcTlData(2, 0)),
      makeChunk("fcTL", makeFcTlData(0, w, h, 100, 1000)),
      makeChunk("IDAT", compressed1),
      makeChunk("fcTL", makeFcTlData(1, w, h, 200, 1000)),
      makeChunk(
        "fdAT",
        concat([
          new Uint8Array([0, 0, 0, 1]), // sequence_number = 1
          compressed2,
        ])
      ),
      makeChunk("IEND", new Uint8Array(0)),
    ])

    const result = decodeApngToFrameSequence(apng.buffer as ArrayBuffer)

    expect(result.frames).toHaveLength(2)
    expect(result.sourceWidth).toBe(w)
    expect(result.sourceHeight).toBe(h)
    expect(result.loopCount).toBe(0)
    expect(result.durationsMs).toHaveLength(2)
    expect(result.durationsMs[0]).toBe(100)
    expect(result.durationsMs[1]).toBe(200)
    expect(Array.from(result.frames[0].data)).toEqual(Array.from(frame1Pixels))
    expect(Array.from(result.frames[1].data)).toEqual(Array.from(frame2Pixels))
  })

  it("handles single-frame APNG", () => {
    const w = 1,
      h = 1
    const pixels = new Uint8Array([128, 64, 32, 255])
    const compressed = compressFrame(w, h, pixels)

    const apng = concat([
      PNG_SIGNATURE,
      makeChunk("IHDR", makeIhdrData(w, h)),
      makeChunk("acTL", makeAcTlData(1, 0)),
      makeChunk("fcTL", makeFcTlData(0, w, h, 50, 1000)),
      makeChunk("IDAT", compressed),
      makeChunk("IEND", new Uint8Array(0)),
    ])

    const result = decodeApngToFrameSequence(apng.buffer as ArrayBuffer)
    expect(result.frames).toHaveLength(1)
    expect(result.durationsMs[0]).toBe(50)
    expect(Array.from(result.frames[0].data)).toEqual(Array.from(pixels))
  })

  it("throws on empty buffer", () => {
    expect(() => decodeApngToFrameSequence(new ArrayBuffer(0))).toThrow()
  })
})
