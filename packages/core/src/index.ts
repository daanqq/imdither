export {
  DITHER_ALGORITHM_IDS,
  DITHER_ALGORITHM_OPTIONS,
  getDitherAlgorithmMetadataLabel,
  getDitherAlgorithmOption,
  processWithDitherAlgorithm,
} from "./algorithm-registry"
export { createStageCache, hashPixelBuffer } from "./cache"
export {
  PRESET_PALETTES,
  getEffectivePalette,
  hexToRgb,
  resolvePalette,
} from "./palettes"
export { createPaletteMatcher, type PaletteMatcher } from "./palette-matcher"
export {
  exportPaletteGpl,
  exportPaletteJson,
  normalizePaletteColor,
  normalizePaletteColors,
  parsePaletteText,
  type ParsedPalette,
} from "./palette-codec"
export {
  extractPaletteFromSource,
  type PaletteExtractionSize,
} from "./palette-extraction"
export {
  PROCESSING_PRESET_OPTIONS,
  findProcessingPreset,
  getProcessingPreset,
  getProcessingPresetColorMode,
  matchProcessingPreset,
} from "./processing-presets"
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
  ditherBlueNoise,
  ditherBurkes,
  ditherFloydSteinberg,
  ditherHalftoneDot,
  ditherMattParker,
  ditherOrdered,
  ditherSierraLite,
  ditherStucki,
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
  ProcessingPresetId,
  ProcessingPresetOption,
  ProcessingPresetRecipe,
} from "./processing-presets"
export type {
  AlphaBackground,
  BayerSize,
  ColorDepth,
  ColorMode,
  EditorSettings,
  MatchingMode,
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
