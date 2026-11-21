import { renderToStaticMarkup } from "react-dom/server"
import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import {
  BUILT_IN_LOOK_RECIPES,
  captureLookRecipeStyle,
  type LookRecipe,
} from "@/lib/look-recipes"

import { LookRecipesGallery } from "./look-recipes-gallery"

describe("LookRecipesGallery", () => {
  it("renders built-in and saved look recipes with palette swatch strips and active state", () => {
    const userRecipe: LookRecipe = {
      id: "user-studio-custom",
      name: "Studio Terracotta",
      style: {
        ...captureLookRecipeStyle(DEFAULT_SETTINGS),
        customPalette: ["#1a1815", "#c45b20", "#f8f5ee"],
        paletteId: "custom",
      },
    }
    const recipes = [...BUILT_IN_LOOK_RECIPES, userRecipe]

    const markup = renderToStaticMarkup(
      <LookRecipesGallery
        activeRecipeId={userRecipe.id}
        recipes={recipes}
        onDeleteRecipe={vi.fn()}
        onSaveRecipe={vi.fn()}
        onSelectRecipe={vi.fn()}
      />
    )

    expect(markup).toContain("Look Recipes")
    expect(markup).toContain("Save Current")
    expect(markup).toContain("Saved")
    expect(markup).toContain("Built-in")
    expect(markup).toContain("Studio Terracotta")
    expect(markup).toContain("Clean Mono")
    expect(markup).toContain("Soft Newsprint")
    expect(markup).toContain("background-color:#c45b20")
    expect(markup.match(/data-slot="palette-swatch-bar"/g)).toHaveLength(
      recipes.length
    )
    expect(markup).toContain('data-active="true" data-slot="look-recipe-card"')
    expect(markup).toContain('aria-label="Delete recipe Studio Terracotta"')
    expect(markup).not.toContain('aria-label="Delete recipe Clean Mono"')
  })

  it("counts only enabled pre and post stages in the extra effects badge", () => {
    const cleanMono = BUILT_IN_LOOK_RECIPES.find((r) => r.id === "clean-mono")!
    const warmGrain = BUILT_IN_LOOK_RECIPES.find((r) => r.id === "warm-grain")!
    const softNewsprint = BUILT_IN_LOOK_RECIPES.find(
      (r) => r.id === "soft-newsprint"
    )!

    const cleanMarkup = renderToStaticMarkup(
      <LookRecipesGallery
        activeRecipeId="custom"
        recipes={[cleanMono]}
        onDeleteRecipe={vi.fn()}
        onSaveRecipe={vi.fn()}
        onSelectRecipe={vi.fn()}
      />
    )
    const multiMarkup = renderToStaticMarkup(
      <LookRecipesGallery
        activeRecipeId="custom"
        recipes={[warmGrain, softNewsprint]}
        onDeleteRecipe={vi.fn()}
        onSaveRecipe={vi.fn()}
        onSelectRecipe={vi.fn()}
      />
    )

    expect(cleanMarkup).not.toContain("fx")
    expect(multiMarkup).toContain("+1 fx")
    expect(multiMarkup).toContain("+2 fx")
    expect(multiMarkup).not.toContain("+3 fx")
  })
})
