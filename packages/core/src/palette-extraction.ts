import type { PixelBuffer, Rgb } from "./types"

export type PaletteExtractionSize = 2 | 4 | 8 | 16 | 32

type ColorPoint = {
  blue: number
  green: number
  red: number
  count: number
}

const SUPPORTED_EXTRACTION_SIZES = new Set<number>([2, 4, 8, 16, 32])

export function extractPaletteFromSource(
  source: PixelBuffer,
  requestedSize: PaletteExtractionSize
): string[] {
  if (!SUPPORTED_EXTRACTION_SIZES.has(requestedSize)) {
    throw new Error("Palette extraction size must be 2, 4, 8, 16, or 32")
  }

  const uniqueColors = getUniqueOpaqueColors(source)

  if (uniqueColors.length < 2) {
    throw new Error("Source Image must contain at least 2 unique colors")
  }

  const buckets = medianCut(
    uniqueColors,
    Math.min(requestedSize, uniqueColors.length)
  )
  const extracted = buckets.map(averageBucketColor).sort(compareByLuminance)

  return extracted.map(rgbToHex)
}

function getUniqueOpaqueColors(source: PixelBuffer): ColorPoint[] {
  const counts = new Map<string, ColorPoint>()

  for (let index = 0; index < source.data.length; index += 4) {
    const alpha = source.data[index + 3]

    if (alpha === 0) {
      continue
    }

    const red = source.data[index]
    const green = source.data[index + 1]
    const blue = source.data[index + 2]
    const key = `${red},${green},${blue}`
    const existing = counts.get(key)

    if (existing) {
      existing.count += 1
    } else {
      counts.set(key, { red, green, blue, count: 1 })
    }
  }

  return [...counts.values()]
}

function medianCut(
  colors: ColorPoint[],
  requestedSize: number
): ColorPoint[][] {
  let buckets: ColorPoint[][] = [[...colors]]

  while (buckets.length < requestedSize) {
    const nextBucketIndex = getNextBucketIndex(buckets)

    if (nextBucketIndex === -1) {
      break
    }

    const bucket = buckets[nextBucketIndex]
    const [left, right] = splitBucket(bucket)

    buckets = [
      ...buckets.slice(0, nextBucketIndex),
      left,
      right,
      ...buckets.slice(nextBucketIndex + 1),
    ]
  }

  return buckets
}

function getNextBucketIndex(buckets: ColorPoint[][]): number {
  let nextBucketIndex = -1
  let nextBucketScore = -1

  buckets.forEach((bucket, index) => {
    if (bucket.length <= 1) {
      return
    }

    const channel = widestChannel(bucket)
    const score = getRange(bucket, channel)

    if (score > nextBucketScore) {
      nextBucketIndex = index
      nextBucketScore = score
    }
  })

  return nextBucketIndex
}

function splitBucket(bucket: ColorPoint[]): [ColorPoint[], ColorPoint[]] {
  const channel = widestChannel(bucket)
  const sorted = [...bucket].sort(
    (left, right) => left[channel] - right[channel]
  )
  const midpoint = Math.ceil(sorted.length / 2)

  return [sorted.slice(0, midpoint), sorted.slice(midpoint)]
}

function widestChannel(bucket: ColorPoint[]): "red" | "green" | "blue" {
  const ranges = {
    red: getRange(bucket, "red"),
    green: getRange(bucket, "green"),
    blue: getRange(bucket, "blue"),
  }

  if (ranges.red >= ranges.green && ranges.red >= ranges.blue) {
    return "red"
  }

  if (ranges.green >= ranges.blue) {
    return "green"
  }

  return "blue"
}

function getRange(
  bucket: ColorPoint[],
  channel: "red" | "green" | "blue"
): number {
  let min = 255
  let max = 0

  for (const color of bucket) {
    min = Math.min(min, color[channel])
    max = Math.max(max, color[channel])
  }

  return max - min
}

function averageBucketColor(bucket: ColorPoint[]): Rgb {
  let total = 0
  let red = 0
  let green = 0
  let blue = 0

  for (const color of bucket) {
    total += color.count
    red += color.red * color.count
    green += color.green * color.count
    blue += color.blue * color.count
  }

  return [
    Math.round(red / total),
    Math.round(green / total),
    Math.round(blue / total),
  ]
}

function compareByLuminance(left: Rgb, right: Rgb): number {
  return luminance(right) - luminance(left)
}

function luminance(color: Rgb): number {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722
}

function rgbToHex(color: Rgb): string {
  return `#${color.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}
