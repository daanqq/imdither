import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it } from "vitest"

import {
  BUILT_IN_LOOK_RECIPES,
  applyLookRecipe,
  captureLookRecipeStyle,
  matchLookRecipe,
  normalizeUserLookRecipes,
} from "./look-recipes"

describe("Look Recipes", () => {
  it("ships eight built-in look recipes", () => {
    expect(BUILT_IN_LOOK_RECIPES).toHaveLength(8)
  })

  it("captures look style without output geometry", () => {
    const style = captureLookRecipeStyle({
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1600,
        height: 900,
      },
    })

    expect(style).not.toHaveProperty("resize")
    expect(style.effectStack).toEqual(DEFAULT_SETTINGS.effectStack)
  })

  it("applies look recipe style while preserving output geometry", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        width: 1600,
        height: 900,
      },
    }
    const next = applyLookRecipe(current, BUILT_IN_LOOK_RECIPES[0])

    expect(next.resize).toEqual(current.resize)
    expect(next.effectStack).toEqual(BUILT_IN_LOOK_RECIPES[0].style.effectStack)
  })

  it("matches exact style and ignores output geometry", () => {
    const recipe = BUILT_IN_LOOK_RECIPES[0]
    const settings = applyLookRecipe(
      {
        ...DEFAULT_SETTINGS,
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 1600,
          height: 900,
        },
      },
      recipe
    )

    expect(matchLookRecipe(settings, [recipe])?.id).toBe(recipe.id)
  })

  it("matches saved custom palette recipes after apply canonicalizes core stack", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      customPalette: ["#000000", "#ffffff", "#ff0000"],
      paletteId: "custom",
    }
    const recipe = {
      id: "user-custom",
      name: "User Custom",
      style: captureLookRecipeStyle(current),
    }
    const settings = applyLookRecipe(DEFAULT_SETTINGS, recipe)

    expect(matchLookRecipe(settings, [recipe])?.id).toBe(recipe.id)
  })

  it("normalizes user look recipes from persisted data", () => {
    expect(
      normalizeUserLookRecipes([
        {
          id: "user-1",
          name: "Warm",
          style: captureLookRecipeStyle(DEFAULT_SETTINGS),
        },
        { id: "", name: "bad", style: null },
      ])
    ).toHaveLength(1)
  })
})
