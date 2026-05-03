import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { DEMO_AUTO_TUNE_RECOMMENDATIONS } from "@/lib/demo-auto-tune"

import { InspectorPanel } from "./inspector-panel"

describe("InspectorPanel", () => {
  it("renders the accepted inspector tabs with Looks first", () => {
    const markup = renderInspector()

    expect(markup.indexOf("Looks")).toBeLessThan(markup.indexOf("Manual"))
    expect(markup).toContain("Auto-Tune")
  })

  it("shows collapsible section headers for Output, Tone, Utility", () => {
    const markup = renderInspector()

    expect(markup).toContain("Output")
    expect(markup).toContain("Tone")
    expect(markup).toContain("Palette Swatches")
    expect(markup).toContain("Edit colors")
    expect(markup).toContain("drawer-trigger")
    expect(markup).not.toContain("Export Format")
    expect(markup).not.toContain("Export Quality")
    expect(markup).not.toContain("Export JSON")
    expect(markup).not.toContain("Export GPL")
  })

  it("shows the Output section header when source width is available", () => {
    const markup = renderInspector({ sourceWidth: 1200 })

    // Content is collapsed by default; only header visible
    expect(markup).toContain("Output")
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
