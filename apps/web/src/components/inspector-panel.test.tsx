import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { DEMO_AUTO_TUNE_RECOMMENDATIONS } from "@/lib/demo-auto-tune"

import { InspectorPanel } from "./inspector-panel"

describe("InspectorPanel", () => {
  it("renders the accepted inspector tabs with Looks first", () => {
    const markup = renderInspector()

    expect(markup.indexOf("Looks")).toBeLessThan(markup.indexOf("Adjust"))
    expect(markup).toContain("Palette")
    expect(markup).not.toContain("Output")
    expect(markup).toContain("Recipe")
    expect(markup).toContain("Auto-Tune")
  })

  it("keeps image output controls in Adjust and palette editing in a Drawer entry", () => {
    const markup = renderInspector()

    expect(markup).toContain("Width")
    expect(markup).toContain("Resize Kernel")
    expect(markup).toContain("Alpha Flatten")
    expect(markup).toContain("Palette Swatches")
    expect(markup).toContain("Edit colors")
    expect(markup).toContain("drawer-trigger")
    expect(markup).not.toContain("Export Format")
    expect(markup).not.toContain("Export Quality")
    expect(markup).not.toContain("Export JSON")
    expect(markup).not.toContain("Export GPL")
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
      exportFormat="png"
      exportQuality={0.92}
      settings={DEFAULT_SETTINGS}
      sourceAvailable
      resolutionAspectLabel="1:1"
      onAdvancedOpenChange={vi.fn()}
      onApplyAutoTuneRecommendation={vi.fn()}
      onCopyLook={vi.fn()}
      onCopyPaletteJson={vi.fn()}
      onCopySettings={vi.fn()}
      onExportFormatChange={vi.fn()}
      onExportPaletteGpl={vi.fn()}
      onExportPaletteJson={vi.fn()}
      onExportQualityChange={vi.fn()}
      onExtractPalette={vi.fn()}
      onImportPaletteFile={vi.fn()}
      onImportPaletteFromClipboard={vi.fn()}
      onPasteLook={vi.fn()}
      onPasteSettings={vi.fn()}
      onResolutionWidthChange={vi.fn()}
      onReset={vi.fn()}
      onSettingsTransition={vi.fn()}
      {...props}
    />
  )
}
