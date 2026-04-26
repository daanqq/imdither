import type {
  AlphaBackground,
  BayerSize,
  EditorSettings,
  Palette,
  MatchingMode,
  PixelBuffer,
  ResizeFit,
  Rgb,
} from "./types"
import { createPaletteMatcher } from "./palette-matcher"

const BAYER_MATRICES: Record<BayerSize, number[][]> = {
  2: [
    [0, 2],
    [3, 1],
  ],
  4: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ],
  8: [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ],
}

const PARKER_INDEX = [
  [0.23, 0.41, 0.29],
  [0.41, 0.37, 0.01],
  [0.29, 0.01, 0.47],
] as const

const BLUE_NOISE_MATRIX = [
  [36, 12, 52, 24, 43, 7, 59, 18],
  [4, 48, 20, 61, 15, 39, 27, 55],
  [57, 31, 9, 45, 50, 22, 2, 34],
  [16, 41, 26, 6, 63, 30, 47, 11],
  [44, 1, 54, 21, 37, 13, 60, 28],
  [25, 62, 14, 40, 5, 49, 19, 56],
  [53, 23, 35, 10, 58, 32, 8, 46],
  [0, 38, 29, 51, 17, 42, 33, 3],
]

const HALFTONE_DOT_MATRIX = [
  [63, 52, 44, 40, 41, 45, 53, 62],
  [51, 35, 27, 23, 24, 28, 36, 54],
  [43, 26, 14, 8, 9, 15, 29, 46],
  [39, 22, 7, 0, 1, 10, 25, 42],
  [38, 21, 6, 2, 3, 11, 30, 47],
  [37, 20, 13, 5, 4, 16, 31, 48],
  [50, 34, 19, 12, 17, 32, 49, 56],
  [61, 55, 33, 18, 57, 58, 59, 60],
]

export function clonePixelBuffer(buffer: PixelBuffer): PixelBuffer {
  return {
    width: buffer.width,
    height: buffer.height,
    data: new Uint8ClampedArray(buffer.data),
  }
}

export function flattenAlpha(
  input: PixelBuffer,
  background: AlphaBackground
): PixelBuffer {
  const output = createBuffer(input.width, input.height)
  const bg = background === "white" ? 255 : 0

  for (let index = 0; index < input.data.length; index += 4) {
    const alpha = input.data[index + 3] / 255
    output.data[index] = mix(bg, input.data[index], alpha)
    output.data[index + 1] = mix(bg, input.data[index + 1], alpha)
    output.data[index + 2] = mix(bg, input.data[index + 2], alpha)
    output.data[index + 3] = 255
  }

  return output
}

export function resizeImage(
  input: PixelBuffer,
  resize: EditorSettings["resize"],
  fill: AlphaBackground
): PixelBuffer {
  const width = Math.max(1, Math.round(resize.width))
  const height = Math.max(1, Math.round(resize.height))
  const output = createBuffer(width, height, fill === "white" ? 255 : 0)
  const geometry = getResizeGeometry(input, width, height, resize.fit)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = (x - geometry.offsetX + 0.5) / geometry.scale - 0.5
      const sourceY = (y - geometry.offsetY + 0.5) / geometry.scale - 0.5

      if (
        sourceX < 0 ||
        sourceY < 0 ||
        sourceX > input.width - 1 ||
        sourceY > input.height - 1
      ) {
        continue
      }

      const sampled =
        resize.mode === "nearest"
          ? sampleNearest(input, sourceX, sourceY)
          : sampleBilinear(input, sourceX, sourceY)
      const targetIndex = (y * width + x) * 4

      output.data[targetIndex] = sampled[0]
      output.data[targetIndex + 1] = sampled[1]
      output.data[targetIndex + 2] = sampled[2]
      output.data[targetIndex + 3] = 255
    }
  }

  return output
}

export function applyPreprocess(
  input: PixelBuffer,
  preprocess: EditorSettings["preprocess"]
): PixelBuffer {
  const output = createBuffer(input.width, input.height)
  const contrast = preprocess.contrast * 2.55
  const contrastFactor =
    (259 * (contrast + 255)) / (255 * (259 - contrast || 1))
  const brightness = preprocess.brightness * 2.55

  for (let index = 0; index < input.data.length; index += 4) {
    let red = input.data[index]
    let green = input.data[index + 1]
    let blue = input.data[index + 2]

    if (preprocess.colorMode === "grayscale-first") {
      const luma = red * 0.2126 + green * 0.7152 + blue * 0.0722
      red = luma
      green = luma
      blue = luma
    }

    red = adjustChannel(red, brightness, contrastFactor, preprocess.gamma)
    green = adjustChannel(green, brightness, contrastFactor, preprocess.gamma)
    blue = adjustChannel(blue, brightness, contrastFactor, preprocess.gamma)

    if (preprocess.invert) {
      red = 255 - red
      green = 255 - green
      blue = 255 - blue
    }

    output.data[index] = red
    output.data[index + 1] = green
    output.data[index + 2] = blue
    output.data[index + 3] = 255
  }

  return output
}

export function mapToPalette(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  const output = createBuffer(input.width, input.height)
  const matcher = createPaletteMatcher(palette, matchingMode)

  for (let index = 0; index < input.data.length; index += 4) {
    const nearest = matcher.nearest([
      input.data[index],
      input.data[index + 1],
      input.data[index + 2],
    ])

    output.data[index] = nearest[0]
    output.data[index + 1] = nearest[1]
    output.data[index + 2] = nearest[2]
    output.data[index + 3] = 255
  }

  return output
}

export function ditherOrdered(
  input: PixelBuffer,
  palette: Palette,
  size: BayerSize,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return ditherWithThresholdMatrix(
    input,
    palette,
    BAYER_MATRICES[size],
    size,
    matchingMode
  )
}

export function ditherBlueNoise(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return ditherWithThresholdMatrix(
    input,
    palette,
    BLUE_NOISE_MATRIX,
    8,
    matchingMode
  )
}

export function ditherHalftoneDot(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return ditherWithThresholdMatrix(
    input,
    palette,
    HALFTONE_DOT_MATRIX,
    8,
    matchingMode
  )
}

function ditherWithThresholdMatrix(
  input: PixelBuffer,
  palette: Palette,
  matrix: number[][],
  size: number,
  matchingMode: MatchingMode
): PixelBuffer {
  const output = createBuffer(input.width, input.height)
  const matcher = createPaletteMatcher(palette, matchingMode)
  const divisor = size * size
  const strength = palette.colors.length <= 2 ? 96 : 56

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const index = (y * input.width + x) * 4
      const threshold =
        ((matrix[y % size][x % size] + 0.5) / divisor - 0.5) * strength
      const nearest = matcher.nearest([
        clampByte(input.data[index] + threshold),
        clampByte(input.data[index + 1] + threshold),
        clampByte(input.data[index + 2] + threshold),
      ])

      output.data[index] = nearest[0]
      output.data[index + 1] = nearest[1]
      output.data[index + 2] = nearest[2]
      output.data[index + 3] = 255
    }
  }

  return output
}

export function ditherMattParker(
  input: PixelBuffer,
  palette: Palette
): PixelBuffer {
  const output = createBuffer(input.width, input.height)
  const paletteLevels = [...palette.colors]
    .map((color) => ({
      luma: rgbLuma(color.rgb),
      rgb: color.rgb,
    }))
    .sort((left, right) => left.luma - right.luma)

  if (paletteLevels.length === 0) {
    return output
  }

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const index = (y * input.width + x) * 4
      const luma =
        (input.data[index] * 0.2126 +
          input.data[index + 1] * 0.7152 +
          input.data[index + 2] * 0.0722) /
        255
      const gammaCorrected = Math.pow(luma, 2.2)
      const parkerValue = PARKER_INDEX[x % 3][y % 3]
      const scaledLevel = gammaCorrected * (paletteLevels.length - 1)
      const lowerIndex = Math.floor(scaledLevel)
      const upperIndex = Math.min(paletteLevels.length - 1, lowerIndex + 1)
      const levelIndex =
        scaledLevel - lowerIndex >= parkerValue ? upperIndex : lowerIndex
      const nearest = paletteLevels[levelIndex].rgb

      output.data[index] = nearest[0]
      output.data[index + 1] = nearest[1]
      output.data[index + 2] = nearest[2]
      output.data[index + 3] = 255
    }
  }

  return output
}

export function ditherFloydSteinberg(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return diffuseError(
    input,
    palette,
    [
      [1, 0, 7 / 16],
      [-1, 1, 3 / 16],
      [0, 1, 5 / 16],
      [1, 1, 1 / 16],
    ],
    matchingMode
  )
}

export function ditherBurkes(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return diffuseError(
    input,
    palette,
    [
      [1, 0, 8 / 32],
      [2, 0, 4 / 32],
      [-2, 1, 2 / 32],
      [-1, 1, 4 / 32],
      [0, 1, 8 / 32],
      [1, 1, 4 / 32],
      [2, 1, 2 / 32],
    ],
    matchingMode
  )
}

export function ditherStucki(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return diffuseError(
    input,
    palette,
    [
      [1, 0, 8 / 42],
      [2, 0, 4 / 42],
      [-2, 1, 2 / 42],
      [-1, 1, 4 / 42],
      [0, 1, 8 / 42],
      [1, 1, 4 / 42],
      [2, 1, 2 / 42],
      [-2, 2, 1 / 42],
      [-1, 2, 2 / 42],
      [0, 2, 4 / 42],
      [1, 2, 2 / 42],
      [2, 2, 1 / 42],
    ],
    matchingMode
  )
}

export function ditherSierraLite(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return diffuseError(
    input,
    palette,
    [
      [1, 0, 2 / 4],
      [-1, 1, 1 / 4],
      [0, 1, 1 / 4],
    ],
    matchingMode
  )
}

export function ditherAtkinson(
  input: PixelBuffer,
  palette: Palette,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  return diffuseError(
    input,
    palette,
    [
      [1, 0, 1 / 8],
      [2, 0, 1 / 8],
      [-1, 1, 1 / 8],
      [0, 1, 1 / 8],
      [1, 1, 1 / 8],
      [0, 2, 1 / 8],
    ],
    matchingMode
  )
}

export function nearestPaletteColor(input: Rgb, palette: Palette): Rgb {
  let best = palette.colors[0].rgb
  let bestDistance = Number.POSITIVE_INFINITY

  for (const color of palette.colors) {
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

function rgbLuma(color: Rgb): number {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722
}

function diffuseError(
  input: PixelBuffer,
  palette: Palette,
  kernel: Array<readonly [number, number, number]>,
  matchingMode: MatchingMode = "rgb"
): PixelBuffer {
  const output = createBuffer(input.width, input.height)
  const work = new Float32Array(input.data.length)
  const matcher = createPaletteMatcher(palette, matchingMode)

  for (let index = 0; index < input.data.length; index += 1) {
    work[index] = input.data[index]
  }

  for (let y = 0; y < input.height; y += 1) {
    const reverse = y % 2 === 1
    const start = reverse ? input.width - 1 : 0
    const end = reverse ? -1 : input.width
    const step = reverse ? -1 : 1

    for (let x = start; x !== end; x += step) {
      const index = (y * input.width + x) * 4
      const oldColor: Rgb = [
        clampByte(work[index]),
        clampByte(work[index + 1]),
        clampByte(work[index + 2]),
      ]
      const nextColor = matcher.nearest(oldColor)
      const error: Rgb = [
        oldColor[0] - nextColor[0],
        oldColor[1] - nextColor[1],
        oldColor[2] - nextColor[2],
      ]

      output.data[index] = nextColor[0]
      output.data[index + 1] = nextColor[1]
      output.data[index + 2] = nextColor[2]
      output.data[index + 3] = 255

      for (const [kernelX, kernelY, factor] of kernel) {
        const targetX = x + (reverse ? -kernelX : kernelX)
        const targetY = y + kernelY

        if (
          targetX < 0 ||
          targetX >= input.width ||
          targetY < 0 ||
          targetY >= input.height
        ) {
          continue
        }

        const targetIndex = (targetY * input.width + targetX) * 4
        work[targetIndex] += error[0] * factor
        work[targetIndex + 1] += error[1] * factor
        work[targetIndex + 2] += error[2] * factor
      }
    }
  }

  return output
}

function createBuffer(width: number, height: number, fill = 0): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let index = 0; index < data.length; index += 4) {
    data[index] = fill
    data[index + 1] = fill
    data[index + 2] = fill
    data[index + 3] = 255
  }

  return { width, height, data }
}

function getResizeGeometry(
  input: PixelBuffer,
  width: number,
  height: number,
  fit: ResizeFit
): { scale: number; offsetX: number; offsetY: number } {
  if (fit === "stretch") {
    return {
      scale: width / input.width,
      offsetX: 0,
      offsetY: 0,
    }
  }

  const scale =
    fit === "cover"
      ? Math.max(width / input.width, height / input.height)
      : Math.min(width / input.width, height / input.height)

  return {
    scale,
    offsetX: (width - input.width * scale) / 2,
    offsetY: (height - input.height * scale) / 2,
  }
}

function sampleNearest(input: PixelBuffer, x: number, y: number): Rgb {
  const safeX = Math.max(0, Math.min(input.width - 1, Math.round(x)))
  const safeY = Math.max(0, Math.min(input.height - 1, Math.round(y)))
  const index = (safeY * input.width + safeX) * 4

  return [input.data[index], input.data[index + 1], input.data[index + 2]]
}

function sampleBilinear(input: PixelBuffer, x: number, y: number): Rgb {
  const x0 = Math.max(0, Math.min(input.width - 1, Math.floor(x)))
  const y0 = Math.max(0, Math.min(input.height - 1, Math.floor(y)))
  const x1 = Math.max(0, Math.min(input.width - 1, x0 + 1))
  const y1 = Math.max(0, Math.min(input.height - 1, y0 + 1))
  const tx = x - x0
  const ty = y - y0
  const c00 = sampleNearest(input, x0, y0)
  const c10 = sampleNearest(input, x1, y0)
  const c01 = sampleNearest(input, x0, y1)
  const c11 = sampleNearest(input, x1, y1)

  return [
    bilinear(c00[0], c10[0], c01[0], c11[0], tx, ty),
    bilinear(c00[1], c10[1], c01[1], c11[1], tx, ty),
    bilinear(c00[2], c10[2], c01[2], c11[2], tx, ty),
  ]
}

function bilinear(
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number,
  tx: number,
  ty: number
): number {
  const top = topLeft + (topRight - topLeft) * tx
  const bottom = bottomLeft + (bottomRight - bottomLeft) * tx
  return top + (bottom - top) * ty
}

function adjustChannel(
  value: number,
  brightness: number,
  contrastFactor: number,
  gamma: number
): number {
  const contrasted = contrastFactor * (value - 128) + 128 + brightness
  const normalized = Math.max(0, Math.min(1, contrasted / 255))
  return clampByte(Math.pow(normalized, 1 / gamma) * 255)
}

function mix(background: number, foreground: number, alpha: number): number {
  return clampByte(background * (1 - alpha) + foreground * alpha)
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}
