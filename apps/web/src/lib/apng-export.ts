import { zlibSync } from "fflate"
import type { FrameSequence } from "@workspace/core"

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

export function encodeFrameSequenceToApng(fs: FrameSequence): Uint8Array {
  const { frames, durationsMs, loopCount } = fs
  const numFrames = frames.length

  if (numFrames === 0) {
    throw new Error("Cannot encode empty frame sequence as APNG")
  }

  const firstFrame = frames[0]

  const chunks: Uint8Array[] = [PNG_SIGNATURE]
  chunks.push(makeIhdr(firstFrame.width, firstFrame.height))
  chunks.push(makeAcTl(numFrames, loopCount))

  let seq = 0
  for (let i = 0; i < numFrames; i++) {
    const frame = frames[i]
    const durationMs = durationsMs[i] ?? 100
    const compressed = compressFrame(frame.data, frame.width, frame.height)

    chunks.push(makeFcTl(seq++, frame.width, frame.height, durationMs))

    if (i === 0) {
      chunks.push(makeChunk("IDAT", compressed))
    } else {
      chunks.push(makeFdat(seq++, compressed))
    }
  }

  chunks.push(makeChunk("IEND", new Uint8Array(0)))
  return concat(chunks)
}

function makeIhdr(width: number, height: number): Uint8Array {
  const data = new Uint8Array(13)
  writeU32(data, 0, width)
  writeU32(data, 4, height)
  data[8] = 8 // bit depth
  data[9] = 6 // truecolour alpha
  data[10] = 0 // compression
  data[11] = 0 // filter
  data[12] = 0 // interlace
  return makeChunk("IHDR", data)
}

function makeAcTl(numFrames: number, numPlays: number): Uint8Array {
  const data = new Uint8Array(8)
  writeU32(data, 0, numFrames)
  writeU32(data, 4, numPlays)
  return makeChunk("acTL", data)
}

function makeFcTl(
  seqNum: number,
  width: number,
  height: number,
  delayMs: number
): Uint8Array {
  const data = new Uint8Array(26)
  writeU32(data, 0, seqNum)
  writeU32(data, 4, width)
  writeU32(data, 8, height)
  writeU32(data, 12, 0) // x_offset
  writeU32(data, 16, 0) // y_offset
  // Convert ms to APNG delay: delayNum/delayDen seconds
  // Use common denominator 1000 for ms precision
  writeU16(data, 20, delayMs)
  writeU16(data, 22, 1000)
  data[24] = 0 // dispose_op = NONE
  data[25] = 0 // blend_op = SOURCE
  return makeChunk("fcTL", data)
}

function makeFdat(seqNum: number, compressedData: Uint8Array): Uint8Array {
  const data = new Uint8Array(4 + compressedData.length)
  writeU32(data, 0, seqNum)
  data.set(compressedData, 4)
  return makeChunk("fdAT", data)
}

function compressFrame(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
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
  return zlibSync(raw, { level: 6 })
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const length = new Uint8Array(4)
  writeU32(length, 0, data.length)
  const crcInput = new Uint8Array(typeBytes.length + data.length)
  crcInput.set(typeBytes)
  crcInput.set(data, typeBytes.length)
  const crcVal = crc32(crcInput)
  const crcBytes = new Uint8Array(4)
  writeU32(crcBytes, 0, crcVal)
  return concat([length, typeBytes, data, crcBytes])
}

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

function writeU32(data: Uint8Array, offset: number, value: number): void {
  data[offset] = (value >> 24) & 0xff
  data[offset + 1] = (value >> 16) & 0xff
  data[offset + 2] = (value >> 8) & 0xff
  data[offset + 3] = value & 0xff
}

function writeU16(data: Uint8Array, offset: number, value: number): void {
  data[offset] = (value >> 8) & 0xff
  data[offset + 1] = value & 0xff
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
