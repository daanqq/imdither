export {
  DITHER_ALGORITHM_IDS,
  DITHER_ALGORITHM_OPTIONS,
  getDitherAlgorithmMetadataLabel,
  getDitherAlgorithmOption,
  processWithDitherAlgorithm,
} from "./algorithm-registry"
export { createStageCache, hashPixelBuffer } from "./cache"
export { PRESET_PALETTES, hexToRgb, resolvePalette } from "./palettes"
export { processImage, type ProcessImageOptions } from "./process"
export {
  DEFAULT_OUTPUT_HEIGHT,
  DEFAULT_OUTPUT_WIDTH,
  DEFAULT_SETTINGS,
  MAX_OUTPUT_PIXELS,
  MAX_SOURCE_DIMENSION,
  clampOutputSize,
  editorSettingsSchema,
  normalizeSettings,
  safeNormalizeSettings,
} from "./settings"
export {
  applyPreprocess,
  clonePixelBuffer,
  ditherAtkinson,
  ditherFloydSteinberg,
  ditherMattParker,
  ditherOrdered,
  flattenAlpha,
  mapToPalette,
  nearestPaletteColor,
  resizeImage,
} from "./stages"
export type {
  DitherAlgorithm,
  DitherAlgorithmCapabilities,
  DitherAlgorithmOption,
} from "./algorithm-registry"
export type {
  AlphaBackground,
  BayerSize,
  ColorMode,
  EditorSettings,
  Palette,
  PaletteColor,
  PixelBuffer,
  ProcessImageResult,
  ProcessingMetadata,
  ResizeFit,
  ResizeMode,
  Rgb,
  StageCache,
} from "./types"
