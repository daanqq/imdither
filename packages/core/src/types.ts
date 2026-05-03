import type { DitherAlgorithm } from "./algorithm-registry"

export type DitherAlgorithmFamily =
  | "Direct Mapping"
  | "Ordered"
  | "Error Diffusion"
  | "Blue Noise"
  | "Halftone"
import type { EffectStage } from "./effect-stack"

export type PixelBuffer = {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type Rgb = readonly [number, number, number]

export type PaletteColor = {
  name: string
  hex: string
  rgb: Rgb
}

export type Palette = {
  id: string
  name: string
  colors: PaletteColor[]
  defaultColorMode: ColorMode
}

export type BayerSize = 2 | 4 | 8
export type ResizeMode = "bilinear" | "nearest"
export type ResizeFit = "contain" | "cover" | "stretch"
export type ColorMode = "grayscale-first" | "color-preserve"
export type AlphaBackground = "black" | "white"
export type ColorDepth =
  | { mode: "full" }
  | { mode: "limit"; count: 2 | 4 | 8 | 16 }
export type MatchingMode = "rgb" | "perceptual"

export type HalftoneDotShape = "round" | "square" | "line"
export type HalftonePatternSize = 4 | 6 | 8

export type HalftoneScreenSettings = {
  dotShape: HalftoneDotShape
  angle: number
  frequency: number
  patternSize: HalftonePatternSize
}

export type EditorSettings = {
  schemaVersion: 2 | 3 | 4
  algorithm: DitherAlgorithm
  bayerSize: BayerSize
  paletteId: string
  customPalette?: string[]
  alphaBackground: AlphaBackground
  colorDepth: ColorDepth
  matchingMode: MatchingMode
  effectStack: EffectStage[]
  resize: {
    mode: ResizeMode
    fit: ResizeFit
    width: number
    height: number
  }
  preprocess: {
    brightness: number
    contrast: number
    gamma: number
    invert: boolean
    colorMode: ColorMode
  }
  halftoneScreen: HalftoneScreenSettings
}

export type ProcessingMetadata = {
  sourceWidth: number
  sourceHeight: number
  outputWidth: number
  outputHeight: number
  paletteSize: number
  algorithmName: string
  processingTimeMs: number
  exportFormat: "PNG" | "WebP" | "JPEG"
}

export type ProcessImageResult = {
  image: PixelBuffer
  metadata: ProcessingMetadata
  settings: EditorSettings
  palette: Palette
}

export type StageCache = {
  get: (key: string) => PixelBuffer | undefined
  set: (key: string, value: PixelBuffer) => void
  clear: () => void
}
