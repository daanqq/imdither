import {
  DEFAULT_SETTINGS,
  createLookSnapshot,
  type AutoTuneRecommendation,
} from "@workspace/core"

const DEMO_CREATED_AT = "2026-04-26T00:00:00.000Z"

export const DEMO_AUTO_TUNE_RECOMMENDATIONS: AutoTuneRecommendation[] = [
  recommendation(1, true, "fine-ordered-mono", "Fine Ordered Mono", {
    algorithm: "bayer",
    bayerSize: 8,
    paletteId: "gray-4",
    preprocess: {
      ...DEFAULT_SETTINGS.preprocess,
      colorMode: "grayscale-first",
    },
  }),
  recommendation(2, false, "screenprint-color", "Screenprint Color", {
    algorithm: "none",
    paletteId: "screenprint-16",
    matchingMode: "perceptual",
    preprocess: {
      ...DEFAULT_SETTINGS.preprocess,
      contrast: 6,
      colorMode: "color-preserve",
    },
  }),
  recommendation(3, false, "texture-noise-look", "Texture/Noise Look", {
    algorithm: "blue-noise",
    paletteId: "risograph",
    matchingMode: "perceptual",
    preprocess: {
      ...DEFAULT_SETTINGS.preprocess,
      contrast: 8,
      colorMode: "color-preserve",
    },
  }),
  recommendation(4, false, "newsprint-mono", "Newsprint Mono", {
    algorithm: "halftone-dot",
    paletteId: "black-white",
    preprocess: {
      ...DEFAULT_SETTINGS.preprocess,
      contrast: 22,
      gamma: 0.95,
      colorMode: "grayscale-first",
    },
  }),
  recommendation(5, false, "clean-reduction", "Clean Reduction", {
    algorithm: "none",
    paletteId: "custom",
    customPalette: [
      "#ddd4c5",
      "#d2bd9e",
      "#bbad99",
      "#c1984d",
      "#af9681",
      "#908676",
      "#a7774f",
      "#82715a",
      "#88593b",
      "#b14736",
      "#615b4e",
      "#76563e",
      "#574e3e",
      "#453e32",
      "#442a16",
      "#211a10",
    ],
    colorDepth: { mode: "limit", count: 16 },
    matchingMode: "perceptual",
    preprocess: {
      ...DEFAULT_SETTINGS.preprocess,
      colorMode: "color-preserve",
    },
  }),
]

function recommendation(
  rank: number,
  recommended: boolean,
  id: AutoTuneRecommendation["id"],
  label: string,
  settingsPatch: Partial<typeof DEFAULT_SETTINGS>
): AutoTuneRecommendation {
  return {
    id,
    label,
    intent: getIntent(id),
    rank,
    recommended,
    snapshot: createLookSnapshot({
      createdAt: DEMO_CREATED_AT,
      name: label,
      settings: {
        ...DEFAULT_SETTINGS,
        ...settingsPatch,
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 960,
          height: 960,
          ...settingsPatch.resize,
        },
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          ...settingsPatch.preprocess,
        },
      },
    }),
  }
}

function getIntent(id: AutoTuneRecommendation["id"]): string {
  switch (id) {
    case "clean-reduction":
      return "Plain mapped color with minimal texture for logos and flat art."
    case "fine-ordered-mono":
      return "Controlled monochrome Bayer texture for photos and soft gradients."
    case "high-contrast-ink":
      return "Graphic black and white output with firm edge emphasis."
    case "screenprint-color":
      return "Color-preserving print palette with perceptual matching."
    case "texture-noise-look":
      return "Visible screen texture for smooth fields and atmospheric images."
    case "soft-poster":
      return "Reduced poster color with a quieter tonal curve."
    case "newsprint-mono":
      return "Halftone newspaper texture with a hard monochrome palette."
    case "low-noise-photo":
      return "Gentler diffusion for scans and noisy photographic sources."
    case "arcade-color":
      return "Game-like ordered color using a compact retro palette."
    case "ink-wash":
      return "Soft monochrome wash with visible grain and less edge bite."
  }
}
