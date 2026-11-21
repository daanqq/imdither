import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import i18n from "@/test/i18n"
import { formatSourceNotice } from "@/lib/notice-formatter"

import { SourceNoticeToast } from "./source-notice-toast"

describe("formatSourceNotice", () => {
  it("formats known bracketed notices into friendly copy", () => {
    expect(formatSourceNotice("[LOOK COPIED TO CLIPBOARD]", i18n.t)).toBe(
      "Look link copied to clipboard"
    )
    expect(formatSourceNotice("[SETTINGS COPIED TO CLIPBOARD]", i18n.t)).toBe(
      "Settings copied to clipboard"
    )
    expect(formatSourceNotice("[PALETTE EXTRACTED: 8 COLORS]", i18n.t)).toBe(
      "Palette extracted: 8 colors"
    )
    expect(formatSourceNotice("[IMAGE COPIED TO CLIPBOARD]", i18n.t)).toBe(
      "Image copied to clipboard"
    )
    expect(formatSourceNotice("[IMAGE COPY FAILED]", i18n.t)).toBe(
      "Failed to copy image to clipboard"
    )
    expect(formatSourceNotice("[IMAGE COPY UNSUPPORTED]", i18n.t)).toBe(
      "Image clipboard copy is not supported in this browser"
    )
  })

  it("formats compound bracketed notices without leaking raw brackets", () => {
    const formatted = formatSourceNotice(
      "[AUTO-TUNE APPLIED: Cool Mono] [OUTPUT CLAMPED: 4000x3000 / 12MP]",
      i18n.t
    )

    expect(formatted).toBe(
      "Auto-Tune applied: Cool Mono · Output clamped: 4000x3000 / 12MP"
    )
    expect(formatted).not.toContain("[")
    expect(formatted).not.toContain("]")
  })

  it("handles unknown bracket prefixes and plain notices gracefully", () => {
    expect(formatSourceNotice("[CUSTOM EVENT: Ready]", i18n.t)).toBe(
      "Custom event: Ready"
    )
    expect(formatSourceNotice("Saved look recipe: Studio Warm", i18n.t)).toBe(
      "Saved look recipe: Studio Warm"
    )
  })
})

describe("SourceNoticeToast", () => {
  it("renders nothing when notice is null", () => {
    const html = renderToStaticMarkup(
      <SourceNoticeToast notice={null} onDismiss={vi.fn()} />
    )

    expect(html).toBe("")
  })

  it("renders accessible status toast with formatted message and close control", () => {
    const html = renderToStaticMarkup(
      <SourceNoticeToast
        notice="[AUTO-TUNE APPLIED: Screenprint Color]"
        onDismiss={vi.fn()}
      />
    )

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain("Auto-Tune applied: Screenprint Color")
    expect(html).not.toContain("[AUTO-TUNE APPLIED")
    expect(html).toContain('aria-label="Dismiss notification"')
  })
})
