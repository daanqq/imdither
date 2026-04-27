import type { PixelBuffer, Rgb } from "./types"

export type PaletteExtractionSize = 2 | 4 | 8 | 16 | 32

type ColorPoint = {
  blue: number
  green: number
  red: number
  count: number
}

type ColorChannel = "red" | "green" | "blue"

type ColorBucket = {
  channel: ColorChannel
  colors: ColorPoint[]
  score: number
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
  const counts = new Map<number, ColorPoint>()

  for (let index = 0; index < source.data.length; index += 4) {
    const alpha = source.data[index + 3]

    if (alpha === 0) {
      continue
    }

    const red = source.data[index]
    const green = source.data[index + 1]
    const blue = source.data[index + 2]
    const key = (red << 16) | (green << 8) | blue
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
  let buckets: ColorBucket[] = [createBucket([...colors])]

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

  return buckets.map((bucket) => bucket.colors)
}

function getNextBucketIndex(buckets: ColorBucket[]): number {
  let nextBucketIndex = -1
  let nextBucketScore = -1

  buckets.forEach((bucket, index) => {
    if (bucket.colors.length <= 1) {
      return
    }

    if (bucket.score > nextBucketScore) {
      nextBucketIndex = index
      nextBucketScore = bucket.score
    }
  })

  return nextBucketIndex
}

function splitBucket(bucket: ColorBucket): [ColorBucket, ColorBucket] {
  const sorted = [...bucket.colors].sort(
    (left, right) => left[bucket.channel] - right[bucket.channel]
  )
  const midpoint = Math.ceil(sorted.length / 2)

  return [
    createBucket(sorted.slice(0, midpoint)),
    createBucket(sorted.slice(midpoint)),
  ]
}

function createBucket(colors: ColorPoint[]): ColorBucket {
  let redMin = 255
  let redMax = 0
  let greenMin = 255
  let greenMax = 0
  let blueMin = 255
  let blueMax = 0

  for (const color of colors) {
    if (color.red < redMin) redMin = color.red
    if (color.red > redMax) redMax = color.red
    if (color.green < greenMin) greenMin = color.green
    if (color.green > greenMax) greenMax = color.green
    if (color.blue < blueMin) blueMin = color.blue
    if (color.blue > blueMax) blueMax = color.blue
  }

  const ranges = {
    red: redMax - redMin,
    green: greenMax - greenMin,
    blue: blueMax - blueMin,
  }

  if (ranges.red >= ranges.green && ranges.red >= ranges.blue) {
    return { channel: "red", colors, score: ranges.red }
  }

  if (ranges.green >= ranges.blue) {
    return { channel: "green", colors, score: ranges.green }
  }

  return { channel: "blue", colors, score: ranges.blue }
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
