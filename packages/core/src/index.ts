export {
  analyzeAutoTuneImage,
  createAutoTuneAnalysisSample,
  expandAutoTuneLookCandidates,
  getAutoTuneCandidateDefinitions,
  getPerceptualColorDistance,
  rankAutoTuneLookCandidates,
  recommendAutoTuneLooks,
  scorePaletteFit,
  scoreRenderedAutoTuneCandidate,
  selectDiverseAutoTuneRecommendations,
  type AutoTuneAnalysis,
  type AutoTuneCandidate,
  type AutoTuneContext,
  type AutoTuneRecommendation,
} from "./auto-tune"
export {
  ALGORITHMS_BY_FAMILY,
  DITHER_ALGORITHM_IDS,
  DITHER_ALGORITHM_OPTIONS,
  getAlgorithmsByFamily,
  getDitherAlgorithmMetadataLabel,
  getDitherAlgorithmOption,
  processWithDitherAlgorithm,
} from "./algorithm-registry"
export { createStageCache, hashPixelBuffer } from "./cache"
export {
  applyEffectStages,
  EFFECT_DEFINITIONS,
  type EffectId,
} from "./effect-registry"
export {
  buildCompatibilityStack,
  normalizeEffectStack,
  validateEffectStack,
  type EffectStage,
  type StageKind,
} from "./effect-stack"
export {
  PRESET_PALETTES,
  getEffectivePalette,
  hexToRgb,
  resolvePalette,
} from "./palettes"
export {
  createLookSnapshot,
  decodeLookPayload,
  encodeLookPayload,
  extractLookPayload,
  type LookSnapshot,
} from "./look-snapshot"
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
  DEFAULT_HALFTONE_SCREEN,
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
  ditherJarvisJudiceNinke,
  ditherMattParker,
  ditherOrdered,
  ditherOstromoukhov,
  ditherSierra,
  ditherSierraLite,
  ditherStucki,
  ditherTwoRowSierra,
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
  DitherAlgorithmFamily,
  HalftoneDotShape,
  HalftonePatternSize,
  HalftoneScreenSettings,
} from "./types"
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
  FrameSequence,
  MatchingMode,
  MotionExportSettings,
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
