import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DEMO_AUTO_TUNE_RECOMMENDATIONS } from "@/lib/demo-auto-tune"

import { AutoTunePanel } from "./auto-tune-panel"

describe("AutoTunePanel", () => {
  it("renders ranked recommendations with compact setting chips and markers", () => {
    const markup = renderToStaticMarkup(
      <AutoTunePanel
        appliedRecommendationId="screenprint-color"
        error={null}
        isLoading={false}
        recommendations={DEMO_AUTO_TUNE_RECOMMENDATIONS}
        sourceAvailable
        onApplyRecommendation={vi.fn()}
      />
    )

    expect(markup).toContain("Generated Auto-Tune Looks")
    expect(markup).toContain("Auto-Tune")
    expect(markup).toContain("Recommended")
    expect(markup).toContain("Applied")
    expect(markup).toContain("Screenprint Color")
    expect(markup).toContain("Fine Ordered Mono")
    expect(markup).toContain("Texture/Noise Look")
    expect(markup).toContain("Soft Poster")
    expect(markup).toContain("Screenprint 16")
    expect(markup).toContain("Blue Noise")
    expect(markup).not.toContain("Details")
    expect(markup).toContain(
      "Color-preserving print palette with perceptual matching."
    )
  })

  it("keeps no-source and error states inline inside the panel", () => {
    const emptyMarkup = renderToStaticMarkup(
      <AutoTunePanel
        appliedRecommendationId={null}
        error={null}
        isLoading={false}
        recommendations={[]}
        sourceAvailable={false}
        onApplyRecommendation={vi.fn()}
      />
    )
    const errorMarkup = renderToStaticMarkup(
      <AutoTunePanel
        appliedRecommendationId={null}
        error="Auto-Tune requires a loaded Source Image"
        isLoading={false}
        recommendations={[]}
        sourceAvailable
        onApplyRecommendation={vi.fn()}
      />
    )

    expect(emptyMarkup).toContain("Load a Source Image")
    expect(errorMarkup).toContain("Auto-Tune requires a loaded Source Image")
  })

  it("shows a spinner while generating auto-tune looks", () => {
    const markup = renderToStaticMarkup(
      <AutoTunePanel
        appliedRecommendationId={null}
        error={null}
        isLoading
        recommendations={[]}
        sourceAvailable
        onApplyRecommendation={vi.fn()}
      />
    )

    expect(markup).toContain("Generating clean")
    expect(markup).toContain("Loading")
  })
})
