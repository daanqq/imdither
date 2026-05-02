import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type EditorSettings,
  type EffectStage,
} from "@workspace/core"

export type LookRecipeStyle = Pick<
  EditorSettings,
  | "algorithm"
  | "bayerSize"
  | "paletteId"
  | "customPalette"
  | "colorDepth"
  | "matchingMode"
  | "preprocess"
  | "effectStack"
>

export type LookRecipe = {
  id: string
  name: string
  style: LookRecipeStyle
  builtIn?: boolean
}

export const BUILT_IN_LOOK_RECIPES: readonly LookRecipe[] = [
  createBuiltInRecipe("clean-mono", "Clean Mono", {
    algorithm: "floyd-steinberg",
    paletteId: "black-white",
    effectStack: DEFAULT_SETTINGS.effectStack,
  }),
  createBuiltInRecipe("warm-grain", "Warm Grain", {
    algorithm: "atkinson",
    paletteId: "sea-glass",
    effectStack: [
      ...DEFAULT_SETTINGS.effectStack,
      effectStage("post-grain", "post", "post.grain", {
        amount: 0.16,
        seed: 31,
      }),
    ],
  }),
  createBuiltInRecipe("poster-edge", "Poster Edge", {
    algorithm: "bayer",
    bayerSize: 4,
    paletteId: "poster-12",
    effectStack: [
      ...DEFAULT_SETTINGS.effectStack,
      effectStage("post-edge", "post", "post.edge-threshold", {
        threshold: 0.32,
        strength: 0.55,
      }),
    ],
  }),
  createBuiltInRecipe("crt-bloom", "CRT Bloom", {
    algorithm: "bayer",
    bayerSize: 4,
    paletteId: "vibrant-2",
    effectStack: [
      ...DEFAULT_SETTINGS.effectStack,
      effectStage("post-crt", "post", "post.crt-bloom", {
        intensity: 0.25,
        radius: 2,
      }),
    ],
  }),
  createBuiltInRecipe("soft-newsprint", "Soft Newsprint", {
    algorithm: "halftone-dot",
    paletteId: "newsprint-mono",
    effectStack: [
      effectStage("pre-blur", "pre", "pre.blur", { radius: 1.1 }),
      ...DEFAULT_SETTINGS.effectStack,
      effectStage("post-paper", "post", "post.paper-noise", {
        amount: 0.1,
        scale: 2,
      }),
    ],
  }),
  createBuiltInRecipe("hard-contrast", "Hard Contrast", {
    algorithm: "stucki",
    paletteId: "screenprint-16",
    effectStack: [
      effectStage("pre-contrast", "pre", "pre.contrast-shape", {
        amount: 0.32,
        curve: "hard",
      }),
      ...DEFAULT_SETTINGS.effectStack,
    ],
  }),
  createBuiltInRecipe("paper-dither", "Paper Dither", {
    algorithm: "sierra-lite",
    paletteId: "gray-4",
    effectStack: [
      ...DEFAULT_SETTINGS.effectStack,
      effectStage("post-paper", "post", "post.paper-noise", {
        amount: 0.14,
        scale: 3,
      }),
    ],
  }),
  createBuiltInRecipe("blurred-bloom", "Blurred Bloom", {
    algorithm: "burkes",
    paletteId: "sea-glass",
    effectStack: [
      effectStage("pre-blur", "pre", "pre.blur", { radius: 1.6 }),
      ...DEFAULT_SETTINGS.effectStack,
      effectStage("post-crt", "post", "post.crt-bloom", {
        intensity: 0.18,
        radius: 2,
      }),
    ],
  }),
] as const

export function captureLookRecipeStyle(
  settings: EditorSettings
): LookRecipeStyle {
  const normalized = normalizeSettings(settings)

  return {
    algorithm: normalized.algorithm,
    bayerSize: normalized.bayerSize,
    colorDepth: normalized.colorDepth,
    customPalette: normalized.customPalette,
    effectStack: normalized.effectStack,
    matchingMode: normalized.matchingMode,
    paletteId: normalized.paletteId,
    preprocess: normalized.preprocess,
  }
}

export function applyLookRecipe(
  current: EditorSettings,
  recipe: LookRecipe
): EditorSettings {
  return normalizeSettings({
    ...current,
    ...recipe.style,
    resize: current.resize,
    alphaBackground: current.alphaBackground,
  })
}

export function matchLookRecipe(
  settings: EditorSettings,
  recipes: readonly LookRecipe[]
): LookRecipe | null {
  const current = stableStyle(
    captureLookRecipeStyle(normalizeSettings(settings))
  )

  return recipes.find((recipe) => stableStyle(recipe.style) === current) ?? null
}

export function normalizeUserLookRecipes(value: unknown): LookRecipe[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!isObject(item) || typeof item.id !== "string") {
      return []
    }

    if (!item.id || typeof item.name !== "string" || !item.name.trim()) {
      return []
    }

    if (!isObject(item.style)) {
      return []
    }

    try {
      const settings = normalizeSettings({
        ...DEFAULT_SETTINGS,
        ...item.style,
      })

      return [
        {
          id: item.id,
          name: item.name,
          style: captureLookRecipeStyle(settings),
        },
      ]
    } catch {
      return []
    }
  })
}

function createBuiltInRecipe(
  id: string,
  name: string,
  patch: Partial<LookRecipeStyle>
): LookRecipe {
  return {
    builtIn: true,
    id,
    name,
    style: captureLookRecipeStyle(
      normalizeSettings({
        ...DEFAULT_SETTINGS,
        ...patch,
      })
    ),
  }
}

function effectStage(
  instanceId: string,
  kind: "pre" | "post",
  effect: string,
  params: Record<string, number | string | boolean>
): EffectStage {
  return {
    enabled: true,
    instanceId,
    kind,
    params: { effect, ...params },
  }
}

function stableStyle(style: LookRecipeStyle): string {
  return JSON.stringify(style)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
