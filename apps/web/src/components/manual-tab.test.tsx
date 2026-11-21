import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import * as React from "react"
import { DEFAULT_SETTINGS, PRESET_PALETTES } from "@workspace/core"

import {
  createInitialExpandedStagesState,
  markPendingAutoExpand,
  reconcileExpandedStages,
  toggleStageExpanded,
} from "./manual/effect-stack-helpers"
import { StageRow } from "./manual/effect-stack-section"
import { OutputSection } from "./manual/output-section"
import { UtilitySection } from "./manual/utility-section"
import { ManualTab } from "./manual-tab"

function renderManualTab(
  overrides: Partial<Parameters<typeof ManualTab>[0]> = {}
) {
  const onTransition = vi.fn()
  const props = {
    advancedOpen: false,
    settings: DEFAULT_SETTINGS,
    activePaletteColors: PRESET_PALETTES[0].colors.map((color) => color.hex),
    lookRecipeId: "custom",
    lookRecipes: [],
    paletteSelectValue: DEFAULT_SETTINGS.paletteId,
    resolutionAspectLabel: "1:1",
    onAdvancedOpenChange: vi.fn(),
    onCopyLook: vi.fn(),
    onCopyPaletteJson: vi.fn(),
    onCopySettings: vi.fn(),
    onDeleteLookRecipe: vi.fn(),
    onExportPaletteGpl: vi.fn(),
    onExportPaletteJson: vi.fn(),
    onExtractPalette: vi.fn(),
    onImportPaletteFile: vi.fn(),
    onImportPaletteFromClipboard: vi.fn(),
    onPasteLook: vi.fn(),
    onPasteSettings: vi.fn(),
    onRenameLookRecipe: vi.fn(),
    onReset: vi.fn(),
    onResolutionWidthChange: vi.fn(),
    onSaveLookRecipe: vi.fn(),
    onSelectLookRecipe: vi.fn(),
    onSettingsTransition: onTransition,
    ...overrides,
  }

  return {
    element: React.createElement(ManualTab, props),
    markup: renderToStaticMarkup(React.createElement(ManualTab, props)),
    onTransition,
  }
}

describe("ManualTab", () => {
  it("orders sections Dither-first: Look Recipe -> Dither -> Palette -> Tone -> Effects -> Output -> Utility", () => {
    const { markup } = renderManualTab()

    const lookBarIndex = markup.indexOf('data-slot="look-recipe-bar"')
    const ditherIndex = markup.indexOf('data-section="dither"')
    const paletteIndex = markup.indexOf('data-section="palette"')
    const toneIndex = markup.indexOf('data-section="tone"')
    const effectsIndex = markup.indexOf('data-section="effects"')
    const outputIndex = markup.indexOf('data-section="output"')
    const utilityIndex = markup.indexOf('data-section="utility"')

    expect(lookBarIndex).toBeGreaterThan(-1)
    expect(lookBarIndex).toBeLessThan(ditherIndex)
    expect(ditherIndex).toBeLessThan(paletteIndex)
    expect(paletteIndex).toBeLessThan(toneIndex)
    expect(toneIndex).toBeLessThan(effectsIndex)
    expect(effectsIndex).toBeLessThan(outputIndex)
    expect(outputIndex).toBeLessThan(utilityIndex)
  })

  it("renders a clean Look Recipe bar without the legacy PRESET label box", () => {
    const { markup } = renderManualTab()

    expect(markup).not.toContain(">PRESET<")
    expect(markup).toContain("Custom")
    expect(markup).toContain("Save look recipe")
    expect(markup).toContain("Look recipe menu")
  })

  it("expands Dither and Palette by default while collapsing Tone, Output, and Utility", () => {
    const { markup } = renderManualTab()

    expect(markup).toContain('data-open="true" data-section="dither"')
    expect(markup).toContain('data-open="true" data-section="palette"')
    expect(markup).toContain('data-open="false" data-section="tone"')
    expect(markup).toContain('data-open="false" data-section="output"')
    expect(markup).toContain('data-open="false" data-section="utility"')

    expect(markup).toContain("Algorithm")
    expect(markup).toContain("Bayer Matrix")
    expect(markup).toContain("Color Depth")
    expect(markup).toContain("Matching")
    expect(markup).toContain("Palette Swatches")
    expect(markup).toContain("Edit colors")
  })

  it("renders full-width flex-1 select triggers for Algorithm, Palette, and Matching", () => {
    const { markup } = renderManualTab()
    const selectTriggers =
      markup.match(/data-slot="select-trigger"[^>]*class="[^"]*"/g) ?? []

    expect(selectTriggers.length).toBeGreaterThanOrEqual(4)
    for (const trigger of selectTriggers) {
      expect(trigger).toContain("flex-1")
      expect(trigger).toContain("min-w-0")
    }
  })

  it("hides Temporal Stability for static images and shows it only when isAnimated is true", () => {
    const staticDefault = renderManualTab().markup
    expect(staticDefault).not.toContain("Temporal Stability")
    expect(staticDefault).not.toContain(
      'data-slot="temporal-stability-control"'
    )

    const staticExplicit = renderManualTab({ isAnimated: false }).markup
    expect(staticExplicit).not.toContain("Temporal Stability")

    const animated = renderManualTab({ isAnimated: true }).markup
    expect(animated).toContain("Temporal Stability")
    expect(animated).toContain('data-slot="temporal-stability-control"')
  })

  it("renders Halftone Angle and Frequency via CommittedSliderField with numeric values and units", () => {
    const halftoneSettings = {
      ...DEFAULT_SETTINGS,
      algorithm: "halftone-dot" as const,
      halftoneScreen: {
        dotShape: "round" as const,
        angle: 35,
        frequency: 18,
        patternSize: 6 as const,
      },
    }

    const { markup } = renderManualTab({ settings: halftoneSettings })

    expect(markup).toContain('data-slot="halftone-controls"')
    expect(markup).toContain('data-slot="committed-range-slider"')
    expect(markup).not.toContain('data-slot="slider"')
    expect(markup).toContain("Angle")
    expect(markup).toContain("35")
    expect(markup).toContain("°")
    expect(markup).toContain("Frequency")
    expect(markup).toContain("18")
    expect(markup).toContain("lpi")
  })

  it("caps inline palette swatches at 16 and renders a +N overflow pill for larger palettes", () => {
    const palette32 = Array.from(
      { length: 32 },
      (_, index) => `#${index.toString(16).padStart(2, "0")}4488`
    )

    const { markup } = renderManualTab({
      activePaletteColors: palette32,
      paletteSelectValue: "custom",
    })

    const swatches = markup.match(/data-slot="palette-swatch-item"/g) ?? []
    expect(swatches).toHaveLength(16)
    expect(markup).toContain('data-slot="palette-swatch-overflow"')
    expect(markup).toContain("+16")

    const palette8 = palette32.slice(0, 8)
    const compactMarkup = renderManualTab({
      activePaletteColors: palette8,
      paletteSelectValue: "custom",
    }).markup
    const compactSwatches =
      compactMarkup.match(/data-slot="palette-swatch-item"/g) ?? []
    expect(compactSwatches).toHaveLength(8)
    expect(compactMarkup).not.toContain('data-slot="palette-swatch-overflow"')
  })

  it("shows a Tone modification indicator only when tone settings differ from defaults", () => {
    const defaultMarkup = renderManualTab().markup
    expect(defaultMarkup).toContain(
      'data-modified="false" data-open="false" data-section="tone"'
    )
    expect(defaultMarkup).not.toContain(
      'data-slot="section-modified-indicator"'
    )

    const modifiedMarkup = renderManualTab({
      settings: {
        ...DEFAULT_SETTINGS,
        preprocess: {
          ...DEFAULT_SETTINGS.preprocess,
          contrast: 20,
        },
      },
    }).markup
    expect(modifiedMarkup).toContain(
      'data-modified="true" data-open="false" data-section="tone"'
    )
    expect(modifiedMarkup).toContain('data-slot="section-modified-indicator"')
  })

  it("shows live W x H summary in Output header and quick scale presets when expanded", () => {
    const { markup } = renderManualTab({
      settings: {
        ...DEFAULT_SETTINGS,
        resize: {
          ...DEFAULT_SETTINGS.resize,
          width: 640,
          height: 480,
        },
      },
    })

    expect(markup).toContain('data-slot="output-dimensions-summary"')
    expect(markup).toContain("640×480")

    const expandedOutput = renderToStaticMarkup(
      <OutputSection
        defaultOpen
        resolutionAspectLabel="4:3"
        settings={{
          ...DEFAULT_SETTINGS,
          resize: { ...DEFAULT_SETTINGS.resize, width: 640, height: 480 },
        }}
        sourceWidth={1280}
        onResolutionWidthChange={vi.fn()}
        onSettingsTransition={vi.fn()}
      />
    )
    expect(expandedOutput).toContain("0.5x")
    expect(expandedOutput).toContain("1x")
    expect(expandedOutput).toContain("Bilinear")
    expect(expandedOutput).toContain("Nearest")
  })

  it("renders compact 2-column Utility action grid and full-width Reset to Defaults button", () => {
    const markup = renderToStaticMarkup(
      <UtilitySection
        defaultOpen
        onCopyLook={vi.fn()}
        onCopySettings={vi.fn()}
        onPasteLook={vi.fn()}
        onPasteSettings={vi.fn()}
        onReset={vi.fn()}
      />
    )

    expect(markup).toContain('data-slot="utility-actions-grid"')
    expect(markup).toContain("grid-cols-2")
    expect(markup).toContain("Copy look link")
    expect(markup).toContain("Paste look link")
    expect(markup).toContain("Copy settings")
    expect(markup).toContain("Paste settings")
    expect(markup).toContain("Reset to Defaults")
  })

  it("renders Pre/Post effects with localized names, active count badges, dimming for disabled stages, and drag/reorder actions", () => {
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
          enabled: false,
          params: { effect: "pre.contrast-shape", amount: 0.3, curve: "soft" },
        },
        ...DEFAULT_SETTINGS.effectStack,
        {
          instanceId: "post-1",
          kind: "post" as const,
          enabled: true,
          params: { effect: "post.grain", amount: 0.12, seed: 42 },
        },
      ],
    }

    const { markup } = renderManualTab({ settings: settingsWithEffects })

    expect(markup).toContain("Pre-Effects")
    expect(markup).toContain("Post-Effects")
    expect(markup).toContain("Add Pre-Effect")
    expect(markup).toContain("Add Post-Effect")
    expect(markup).toContain("Blur")
    expect(markup).toContain("Contrast Shape")
    expect(markup).toContain("Grain")
    expect(markup).toContain('data-active-count="1"')
    expect(markup).toContain('data-total-count="2"')
    expect(markup).toContain('data-stage-enabled="false"')
    expect(markup).toContain("opacity-60")
    expect(markup).toContain("Drag stage")
    expect(markup).toContain("Stage actions")
    expect(markup).toContain("Remove stage")
  })

  it("auto-expands newly added Pre or Post stages immediately and renders localized parameter editors", () => {
    const initial = createInitialExpandedStagesState(["pre-existing"])
    expect(initial.expandedIds).toEqual([])

    const afterPresetSwap = reconcileExpandedStages(initial, [
      "pre-existing",
      "post-from-recipe",
    ])
    expect(afterPresetSwap.expandedIds).toEqual([])

    const awaitingAdd = markPendingAutoExpand(afterPresetSwap)
    const afterUserAdd = reconcileExpandedStages(awaitingAdd, [
      "pre-existing",
      "post-from-recipe",
      "pre-new",
    ])
    expect(afterUserAdd.expandedIds).toEqual(["pre-new"])
    expect(afterUserAdd.pendingAutoExpand).toBe(false)

    const collapsed = toggleStageExpanded(afterUserAdd, "pre-new")
    expect(collapsed.expandedIds).toEqual([])

    const expandedStageMarkup = renderToStaticMarkup(
      <StageRow
        expanded
        index={0}
        isFirst
        isLast
        stage={{
          instanceId: "pre-new",
          kind: "pre",
          enabled: true,
          params: { effect: "pre.blur", radius: 2.5 },
        }}
        totalCount={1}
        onSettingsTransition={vi.fn()}
        onToggleExpand={vi.fn()}
      />
    )
    expect(expandedStageMarkup).toContain('data-stage-expanded="true"')
    expect(expandedStageMarkup).toContain("Blur")
    expect(expandedStageMarkup).toContain("Radius")
    expect(expandedStageMarkup).toContain("px")
    expect(expandedStageMarkup).toContain('data-slot="committed-range-slider"')
  })
})
