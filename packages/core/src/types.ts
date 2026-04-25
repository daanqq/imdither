import type { DitherAlgorithm } from "./algorithm-registry"

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

export type EditorSettings = {
  schemaVersion: 1
  algorithm: DitherAlgorithm
  bayerSize: BayerSize
  paletteId: string
  customPalette?: string[]
  alphaBackground: AlphaBackground
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
}

export type ProcessingMetadata = {
  sourceWidth: number
  sourceHeight: number
  outputWidth: number
  outputHeight: number
  paletteSize: number
  algorithmName: string
  processingTimeMs: number
  exportFormat: "PNG"
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
