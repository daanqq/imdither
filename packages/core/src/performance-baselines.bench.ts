import { bench, describe } from "vitest"

import {
  createBaselineInput,
  getMachineProfile,
  IMAGE_SIZES,
} from "./baseline-runner"
import { processImage } from "./process"
import { DEFAULT_SETTINGS } from "./settings"
import type { EditorSettings } from "./types"

function makeSettings(overrides: Partial<EditorSettings>): EditorSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
    resize: {
      ...DEFAULT_SETTINGS.resize,
      ...(overrides.resize ?? {}),
    },
    preprocess: {
      ...DEFAULT_SETTINGS.preprocess,
      ...(overrides.preprocess ?? {}),
    },
    halftoneScreen: {
      ...DEFAULT_SETTINGS.halftoneScreen,
      ...(overrides.halftoneScreen ?? {}),
    },
  }
}

const inputs = {
  small: createBaselineInput(IMAGE_SIZES.small.width, IMAGE_SIZES.small.height),
  medium: createBaselineInput(
    IMAGE_SIZES.medium.width,
    IMAGE_SIZES.medium.height
  ),
  large: createBaselineInput(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height),
  huge: createBaselineInput(IMAGE_SIZES.huge.width, IMAGE_SIZES.huge.height),
}

function runPipeline(
  settings: EditorSettings,
  size: keyof typeof inputs
): void {
  processImage(inputs[size], settings)
  void 0
}

// ──────────────────────────
//  ordered / threshold dither
// ──────────────────────────
describe("ordered dither", () => {
  bench("bayer 4x4 small", () =>
    runPipeline(makeSettings({ algorithm: "bayer", bayerSize: 4 }), "small"))
  bench("bayer 8x8 medium", () =>
    runPipeline(makeSettings({ algorithm: "bayer", bayerSize: 8 }), "medium"))
  bench("blue-noise small", () =>
    runPipeline(makeSettings({ algorithm: "blue-noise" }), "small"))
  bench("matt-parker small", () =>
    runPipeline(makeSettings({ algorithm: "matt-parker" }), "small"))
})

// ──────────────────────────
//  error diffusion
// ──────────────────────────
describe("error diffusion", () => {
  bench("floyd-steinberg medium", () =>
    runPipeline(makeSettings({ algorithm: "floyd-steinberg" }), "medium"))
  bench("jarvis-judice-ninke medium", () =>
    runPipeline(makeSettings({ algorithm: "jarvis-judice-ninke" }), "medium"))
  bench("sierra medium", () =>
    runPipeline(makeSettings({ algorithm: "sierra" }), "medium"))
  bench("two-row-sierra medium", () =>
    runPipeline(makeSettings({ algorithm: "two-row-sierra" }), "medium"))
  bench("sierra-lite medium", () =>
    runPipeline(makeSettings({ algorithm: "sierra-lite" }), "medium"))
  bench("burkes medium", () =>
    runPipeline(makeSettings({ algorithm: "burkes" }), "medium"))
  bench("stucki medium", () =>
    runPipeline(makeSettings({ algorithm: "stucki" }), "medium"))
  bench("atkinson medium", () =>
    runPipeline(makeSettings({ algorithm: "atkinson" }), "medium"))
  bench("ostromoukhov medium", () =>
    runPipeline(makeSettings({ algorithm: "ostromoukhov" }), "medium"))
})

// ──────────────────────────
//  halftone
// ──────────────────────────
describe("halftone", () => {
  bench("dot round small", () =>
    runPipeline(
      makeSettings({
        algorithm: "halftone-dot",
        halftoneScreen: {
          dotShape: "round",
          angle: 45,
          frequency: 20,
          patternSize: 8,
        },
      }),
      "small"
    ))
  bench("dot square medium", () =>
    runPipeline(
      makeSettings({
        algorithm: "halftone-dot",
        halftoneScreen: {
          dotShape: "square",
          angle: 0,
          frequency: 30,
          patternSize: 8,
        },
      }),
      "medium"
    ))
  bench("line large", () =>
    runPipeline(
      makeSettings({
        algorithm: "halftone-dot",
        halftoneScreen: {
          dotShape: "line",
          angle: 0,
          frequency: 50,
          patternSize: 4,
        },
      }),
      "large"
    ))
})

// ──────────────────────────
//  direct quantization
// ──────────────────────────
describe("direct quantization", () => {
  bench("none grayscale medium", () =>
    runPipeline(
      makeSettings({ algorithm: "none", paletteId: "gray-4" }),
      "medium"
    ))
  bench("none perceptual large", () =>
    runPipeline(
      makeSettings({
        algorithm: "none",
        paletteId: "ink-6",
        matchingMode: "perceptual",
      }),
      "large"
    ))
})

// ──────────────────────────
//  pre + post effects
// ──────────────────────────
describe("effects", () => {
  const blurSettings = makeSettings({
    algorithm: "bayer",
    bayerSize: 4,
    effectStack: [
      {
        kind: "pre",
        instanceId: "blur-1",
        enabled: true,
        params: { effect: "pre.blur", radius: 2 },
      },
    ],
  })

  bench("pre.blur medium", () => {
    runPipeline(blurSettings, "medium")
  })

  const grainSettings = makeSettings({
    algorithm: "floyd-steinberg",
    effectStack: [
      {
        kind: "post",
        instanceId: "grain-1",
        enabled: true,
        params: { effect: "post.grain", amount: 0.5, seed: 42 },
      },
    ],
  })

  bench("post.grain medium", () => {
    runPipeline(grainSettings, "medium")
  })

  const fullStackSettings = makeSettings({
    algorithm: "floyd-steinberg",
    effectStack: [
      {
        kind: "pre",
        instanceId: "blur-1",
        enabled: true,
        params: { effect: "pre.blur", radius: 1 },
      },
      {
        kind: "pre",
        instanceId: "cs-1",
        enabled: true,
        params: { effect: "pre.contrast-shape", shape: "soft", amount: 0.5 },
      },
      {
        kind: "post",
        instanceId: "grain-1",
        enabled: true,
        params: { effect: "post.grain", amount: 0.3, seed: 42 },
      },
      {
        kind: "post",
        instanceId: "pn-1",
        enabled: true,
        params: { effect: "post.paper-noise", amount: 0.2, scale: 4 },
      },
    ],
  })

  bench("full effect stack medium", () => {
    runPipeline(fullStackSettings, "medium")
  })
})

// ──────────────────────────
//  size scaling
// ──────────────────────────
describe("size scaling", () => {
  bench("floyd-steinberg small", () =>
    runPipeline(makeSettings({ algorithm: "floyd-steinberg" }), "small"))
  bench("floyd-steinberg medium", () =>
    runPipeline(makeSettings({ algorithm: "floyd-steinberg" }), "medium"))
  bench("floyd-steinberg large", () =>
    runPipeline(makeSettings({ algorithm: "floyd-steinberg" }), "large"))
  bench("floyd-steinberg huge", () =>
    runPipeline(makeSettings({ algorithm: "floyd-steinberg" }), "huge"))
})

// ──────────────────────────
//  preview vs export
// ──────────────────────────
describe("preview vs export", () => {
  const rawInput = createBaselineInput(1920, 1280)
  const previewSettings = makeSettings({
    algorithm: "bayer",
    bayerSize: 4,
    resize: { ...DEFAULT_SETTINGS.resize, width: 960, height: 640 },
  })
  const exportSettings = makeSettings({
    algorithm: "bayer",
    bayerSize: 4,
    resize: { ...DEFAULT_SETTINGS.resize, width: 1920, height: 1280 },
  })

  bench("preview 960x640", () => {
    processImage(rawInput, previewSettings)
  })
  bench("export 1920x1280", () => {
    processImage(rawInput, exportSettings)
  })
})

// ──────────────────────────
//  palette matching modes
// ──────────────────────────
describe("palette matching", () => {
  const richPalette = "screenprint-16"
  bench("rgb mode medium", () =>
    runPipeline(
      makeSettings({
        algorithm: "none",
        paletteId: richPalette,
        matchingMode: "rgb",
      }),
      "medium"
    ))
  bench("perceptual mode medium", () =>
    runPipeline(
      makeSettings({
        algorithm: "none",
        paletteId: richPalette,
        matchingMode: "perceptual",
      }),
      "medium"
    ))
})

// ──────────────────────────
//  preprocess variants
// ──────────────────────────
describe("preprocess", () => {
  bench("grayscale-first medium", () =>
    runPipeline(
      makeSettings({
        algorithm: "floyd-steinberg",
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          colorMode: "grayscale-first",
        },
      }),
      "medium"
    ))
  bench("full adjust medium", () =>
    runPipeline(
      makeSettings({
        algorithm: "floyd-steinberg",
        preprocess: {
          brightness: 10,
          contrast: 20,
          gamma: 1.2,
          invert: false,
          colorMode: "color-preserve",
        },
      }),
      "medium"
    ))
})

// ──────────────────────────
//  machine profile header
// ──────────────────────────
const _profile = getMachineProfile()
console.log("BASELINE MACHINE PROFILE:", JSON.stringify(_profile))
