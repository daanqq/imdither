import type { MatchingMode, Palette, Rgb } from "./types"

export type PaletteMatcher = {
  nearest: (input: Rgb) => Rgb
}

type PreparedColor = {
  rgb: Rgb
  oklab: readonly [number, number, number]
}

export function createPaletteMatcher(
  palette: Palette,
  mode: MatchingMode
): PaletteMatcher {
  const colors = palette.colors.map((color) => ({
    rgb: color.rgb,
    oklab: rgbToOklab(color.rgb),
  }))

  return {
    nearest: (input) =>
      mode === "perceptual"
        ? nearestOklab(input, colors)
        : nearestRgb(input, colors),
  }
}

function nearestRgb(input: Rgb, colors: PreparedColor[]): Rgb {
  let best = colors[0].rgb
  let bestDistance = Number.POSITIVE_INFINITY

  for (const color of colors) {
    const dr = input[0] - color.rgb[0]
    const dg = input[1] - color.rgb[1]
    const db = input[2] - color.rgb[2]
    const distance = dr * dr + dg * dg + db * db

    if (distance < bestDistance) {
      best = color.rgb
      bestDistance = distance
    }
  }

  return best
}

function nearestOklab(input: Rgb, colors: PreparedColor[]): Rgb {
  const lab = rgbToOklab(input)
  let best = colors[0].rgb
  let bestDistance = Number.POSITIVE_INFINITY

  for (const color of colors) {
    const dl = lab[0] - color.oklab[0]
    const da = lab[1] - color.oklab[1]
    const db = lab[2] - color.oklab[2]
    const distance = dl * dl + da * da + db * db

    if (distance < bestDistance) {
      best = color.rgb
      bestDistance = distance
    }
  }

  return best
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
  const value = channel / 255

  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4)
}
