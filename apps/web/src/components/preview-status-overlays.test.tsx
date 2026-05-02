import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  ProcessingOverlay,
  SourceErrorOverlay,
} from "./preview-status-overlays"

describe("ProcessingOverlay", () => {
  it("returns null when not busy and not preview reduced", () => {
    const html = renderToStaticMarkup(
      <ProcessingOverlay
        algorithm="floyd-steinberg"
        busy={false}
        previewReduced={false}
        status="ready"
      />
    )

    expect(html).toBe("")
  })

  it("shows processing status while queued", () => {
    const html = renderToStaticMarkup(
      <ProcessingOverlay
        algorithm="floyd-steinberg"
        busy
        previewReduced={false}
        status="queued"
      />
    )

    expect(html).toContain("PROCESSING PREVIEW")
    expect(html).toContain("Queued. Controls remain editable.")
  })

  it("shows exporting status", () => {
    const html = renderToStaticMarkup(
      <ProcessingOverlay
        algorithm="floyd-steinberg"
        busy
        previewReduced={false}
        status="exporting"
      />
    )

    expect(html).toContain("EXPORTING")
    expect(html).toContain("Preparing full-size export.")
  })

  it("shows reduced preview status with algorithm name", () => {
    const html = renderToStaticMarkup(
      <ProcessingOverlay
        algorithm="bayer"
        busy={false}
        previewReduced
        status="ready"
      />
    )

    expect(html).toContain("PREVIEW ONLY")
    expect(html).toContain(
      "Showing reduced preview while full bayer output catches up."
    )
  })

  it("shows algorithm worker running status", () => {
    const html = renderToStaticMarkup(
      <ProcessingOverlay
        algorithm="floyd-steinberg"
        busy
        previewReduced={false}
        status="processing"
      />
    )

    expect(html).toContain("PROCESSING PREVIEW")
    expect(html).toContain(
      "floyd-steinberg worker is running. New changes replace queued preview."
    )
  })

  it("renders pulse animation elements", () => {
    const html = renderToStaticMarkup(
      <ProcessingOverlay
        algorithm="floyd-steinberg"
        busy
        previewReduced={false}
        status="processing"
      />
    )

    expect(html.match(/animate-pulse/g)).toHaveLength(10)
  })
})

describe("SourceErrorOverlay", () => {
  it("returns null when status is not error", () => {
    const html = renderToStaticMarkup(
      <SourceErrorOverlay error="Some error" status="ready" />
    )

    expect(html).toBe("")
  })

  it("returns null when status is error but no error message", () => {
    const html = renderToStaticMarkup(
      <SourceErrorOverlay error={null} status="error" />
    )

    expect(html).toBe("")
  })

  it("shows error message with alert role", () => {
    const html = renderToStaticMarkup(
      <SourceErrorOverlay
        error="Image too large (5000x5000). Max dimension 4096px."
        status="error"
      />
    )

    expect(html).toContain("SOURCE REJECTED")
    expect(html).toContain("Image too large (5000x5000). Max dimension 4096px.")
    expect(html).toContain('role="alert"')
    expect(html).toContain("text-destructive")
  })
})
