import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS, PRESET_PALETTES } from "@workspace/core"

import { StackTab } from "./stack-tab"

function renderStackTab(
  overrides: Partial<Parameters<typeof StackTab>[0]> = {}
) {
  const onTransition = vi.fn()

  const element = StackTab({
    settings: DEFAULT_SETTINGS,
    activePaletteColors: PRESET_PALETTES[0].colors.map((color) => color.hex),
    lookRecipeId: "custom",
    lookRecipes: [],
    paletteSelectValue: DEFAULT_SETTINGS.paletteId,
    onCopyPaletteJson: vi.fn(),
    onDeleteLookRecipe: vi.fn(),
    onExportPaletteGpl: vi.fn(),
    onExportPaletteJson: vi.fn(),
    onExtractPalette: vi.fn(),
    onImportPaletteFile: vi.fn(),
    onImportPaletteFromClipboard: vi.fn(),
    onRenameLookRecipe: vi.fn(),
    onSaveLookRecipe: vi.fn(),
    onSelectLookRecipe: vi.fn(),
    onSettingsTransition: onTransition,
    ...overrides,
  })

  return { element, markup: renderToStaticMarkup(element), onTransition }
}

describe("StackTab", () => {
  it("renders Pre, Core, and Post groups", () => {
    const { markup } = renderStackTab()

    expect(markup).toContain("Pre")
    expect(markup).toContain("Core")
    expect(markup).toContain("Post")
  })

  it("shows Palette and Dither labels in Core group", () => {
    const { markup } = renderStackTab()

    expect(markup).toContain("Palette")
    expect(markup).toContain("Dither")
  })

  it("renders the Look Recipe bar above grouped stages", () => {
    const { markup } = renderStackTab()

    expect(markup).toContain("PRESET")
    expect(markup).toContain("Custom")
    expect(markup).toContain("Save look recipe")
    expect(markup).toContain("Look recipe menu")
  })

  it("mirrors Dither and Palette controls inside Core", () => {
    const { markup } = renderStackTab()

    expect(markup).toContain("Algorithm")
    expect(markup).toContain("Bayer Matrix")
    expect(markup).toContain("Color Depth")
    expect(markup).toContain("Matching")
    expect(markup).toContain("Palette Swatches")
    expect(markup).toContain("Edit colors")
  })

  it("shows add-stage affordance in Pre group when empty", () => {
    const { markup } = renderStackTab()

    expect(markup).toContain("Add pre-stage")
  })

  it("shows effect label for a stage with effect param", () => {
    const settingsWithEffect = {
      ...DEFAULT_SETTINGS,
      effectStack: [
        {
          instanceId: "pre-1",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.blur", radius: 1.5 },
        },
        ...DEFAULT_SETTINGS.effectStack,
      ],
    }

    const { markup } = renderStackTab({ settings: settingsWithEffect })

    expect(markup).toContain("blur")
  })

  it("shows enable/disable and remove controls for optional stages", () => {
    const settingsWithEffect = {
      ...DEFAULT_SETTINGS,
      effectStack: [
        {
          instanceId: "pre-1",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.blur", radius: 1.5 },
        },
        ...DEFAULT_SETTINGS.effectStack,
      ],
    }

    const { markup } = renderStackTab({ settings: settingsWithEffect })

    expect(markup).toContain("Remove stage")
  })

  it("shows handle drag and menu fallback when multiple optional stages exist", () => {
    const settingsWithEffects = {
      ...DEFAULT_SETTINGS,
      effectStack: [
        {
          instanceId: "pre-1",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.blur", radius: 1.5 },
        },
        {
          instanceId: "pre-2",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.contrast-shape", amount: 0.3 },
        },
        ...DEFAULT_SETTINGS.effectStack,
      ],
    }

    const { markup } = renderStackTab({ settings: settingsWithEffects })

    expect(markup).toContain("Drag stage")
    expect(markup).toContain("Stage actions")
  })
})
