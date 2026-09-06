import type { MatchingMode, Palette, Rgb } from "./types"

export type PaletteMatcher = {
  nearest: (input: Rgb) => Rgb
}

type PreparedColor = {
  rgb: Rgb
  oklab: readonly [number, number, number]
}

const CACHE_SIZE = 4096
const CACHE_HASH = 0x9e3779b1
const CACHE_PROBE_LIMIT = 256
const SRGB_TO_LINEAR = Float64Array.from({ length: 256 }, (_, channel) =>
  srgbToLinearExact(channel)
)

type NearestCache = {
  keys: Uint32Array
  indices: Int32Array
}

export function createPaletteMatcher(
  palette: Palette,
  mode: MatchingMode
): PaletteMatcher {
  const colors = palette.colors.map((color) => ({
    rgb: color.rgb,
    oklab: rgbToOklab(color.rgb),
  }))
  const cache: NearestCache = {
    keys: new Uint32Array(CACHE_SIZE),
    indices: new Int32Array(CACHE_SIZE),
  }
  cache.indices.fill(-1)
  const findNearest =
    mode === "perceptual" ? nearestOklabIndex : nearestRgbIndex
  let cacheEnabled = true
  let cacheLookups = 0
  let cacheHits = 0

  return {
    nearest: (input) => {
      if (!cacheEnabled) {
        return colors[findNearest(input, colors)].rgb
      }

      const key = getByteRgbKey(input)

      if (key === undefined) {
        return colors[findNearest(input, colors)].rgb
      }

      cacheLookups += 1
      // Use high product bits so all three channels affect the cache slot.
      const slot = Math.imul(key, CACHE_HASH) >>> 20
      const storedKey = key + 1

      if (cache.keys[slot] === storedKey) {
        cacheHits += 1
        return colors[cache.indices[slot]].rgb
      }

      const index = findNearest(input, colors)

      // Avoid probing a cold cache when a stream is mostly unique RGB values.
      if (cacheLookups >= CACHE_PROBE_LIMIT && cacheHits * 16 <= cacheLookups) {
        cacheEnabled = false
      } else {
        cache.keys[slot] = storedKey
        cache.indices[slot] = index
      }

      return colors[index].rgb
    },
  }
}

function nearestRgbIndex(input: Rgb, colors: PreparedColor[]): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < colors.length; index += 1) {
    const color = colors[index]
    const dr = input[0] - color.rgb[0]
    const dg = input[1] - color.rgb[1]
    const db = input[2] - color.rgb[2]
    const distance = dr * dr + dg * dg + db * db

    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  }

  return best
}

function nearestOklabIndex(input: Rgb, colors: PreparedColor[]): number {
  const lab = rgbToOklab(input)
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < colors.length; index += 1) {
    const color = colors[index]
    const dl = lab[0] - color.oklab[0]
    const da = lab[1] - color.oklab[1]
    const db = lab[2] - color.oklab[2]
    const distance = dl * dl + da * da + db * db

    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  }

  return best
}

function getByteRgbKey(input: Rgb): number | undefined {
  if (!isByte(input[0]) || !isByte(input[1]) || !isByte(input[2])) {
    return undefined
  }

  return input[0] * 65536 + input[1] * 256 + input[2]
}

function isByte(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255
}

function rgbToOklab(rgb: Rgb): readonly [number, number, number] {
  const red = srgbToLinear(rgb[0])
  const green = srgbToLinear(rgb[1])
  const blue = srgbToLinear(rgb[2])
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
  )
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
  )
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue
  )

  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ]
}

function srgbToLinear(channel: number): number {
  return isByte(channel) ? SRGB_TO_LINEAR[channel] : srgbToLinearExact(channel)
}

function srgbToLinearExact(channel: number): number {
  const value = channel / 255

  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4)
}
