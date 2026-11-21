import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { BUILT_IN_LOOK_RECIPES } from "@/lib/look-recipes"
import { DEMO_AUTO_TUNE_RECOMMENDATIONS } from "@/lib/demo-auto-tune"

import { InspectorPanel } from "./inspector-panel"

describe("InspectorPanel", () => {
  it("renders the accepted inspector tabs with Looks first and Look Recipes gallery", () => {
    const markup = renderInspector({
      lookRecipeId: BUILT_IN_LOOK_RECIPES[0].id,
      lookRecipes: BUILT_IN_LOOK_RECIPES,
    })

    expect(markup.indexOf("Looks")).toBeLessThan(markup.indexOf("Manual"))
    expect(markup).toContain("Auto-Tune")
    expect(markup).toContain("Look Recipes")
    expect(markup).toContain("Save Current")
    expect(markup).toContain("Clean Mono")
    expect(markup).toContain('data-active="true" data-slot="look-recipe-card"')
  })

  it("shows Dither-first Manual sections and collapsible Output, Tone, Utility headers", () => {
    const markup = renderInspector()

    expect(markup.indexOf('data-section="dither"')).toBeLessThan(
      markup.indexOf('data-section="palette"')
    )
    expect(markup).toContain("Output")
    expect(markup).toContain("Tone")
    expect(markup).toContain("Utility")
    expect(markup).toContain("Palette Swatches")
    expect(markup).toContain("Edit colors")
    expect(markup).toContain("drawer-trigger")
    expect(markup).not.toContain("Export Format")
    expect(markup).not.toContain("Export Quality")
    expect(markup).not.toContain("Export JSON")
    expect(markup).not.toContain("Export GPL")
  })

  it("shows live output dimensions summary when source width is available", () => {
    const markup = renderInspector({ sourceWidth: 1200 })

    expect(markup).toContain("Output")
    expect(markup).toContain(
      `${DEFAULT_SETTINGS.resize.width}×${DEFAULT_SETTINGS.resize.height}`
    )
  })

  it("threads isAnimated through to ManualTab to control Temporal Stability visibility", () => {
    const staticMarkup = renderInspector({ isAnimated: false })
    expect(staticMarkup).not.toContain("Temporal Stability")

    const animatedMarkup = renderInspector({ isAnimated: true })
    expect(animatedMarkup).toContain("Temporal Stability")
  })
})

function renderInspector(
  props: Partial<ComponentProps<typeof InspectorPanel>> = {}
) {
  return renderToStaticMarkup(
    <InspectorPanel
      advancedOpen={false}
      appliedRecommendationId={null}
      autoTuneError={null}
      autoTuneLoading={false}
      autoTuneRecommendations={DEMO_AUTO_TUNE_RECOMMENDATIONS}
      lookRecipeId="custom"
      lookRecipes={[]}
      settings={DEFAULT_SETTINGS}
      sourceAvailable
      resolutionAspectLabel="1:1"
      onAdvancedOpenChange={vi.fn()}
      onApplyAutoTuneRecommendation={vi.fn()}
      onCopyLook={vi.fn()}
      onCopyPaletteJson={vi.fn()}
      onCopySettings={vi.fn()}
      onExportPaletteGpl={vi.fn()}
      onExportPaletteJson={vi.fn()}
      onExtractPalette={vi.fn()}
      onImportPaletteFile={vi.fn()}
      onImportPaletteFromClipboard={vi.fn()}
      onDeleteLookRecipe={vi.fn()}
      onRenameLookRecipe={vi.fn()}
      onSaveLookRecipe={vi.fn()}
      onSelectLookRecipe={vi.fn()}
      onPasteLook={vi.fn()}
      onPasteSettings={vi.fn()}
      onResolutionWidthChange={vi.fn()}
      onReset={vi.fn()}
      onSettingsTransition={vi.fn()}
      {...props}
    />
  )
}
