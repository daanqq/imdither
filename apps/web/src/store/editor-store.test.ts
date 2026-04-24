import { describe, expect, it } from "vitest"

import { normalizeCompareMode } from "./editor-store"

describe("editor store compare mode migration", () => {
  it("migrates old split state to slide mode", () => {
    expect(normalizeCompareMode("split")).toBe("slide")
  })

  it("keeps supported compare modes unchanged", () => {
    expect(normalizeCompareMode("slide")).toBe("slide")
    expect(normalizeCompareMode("processed")).toBe("processed")
    expect(normalizeCompareMode("original")).toBe("original")
  })

  it("falls back to slide for unknown persisted values", () => {
    expect(normalizeCompareMode("unknown")).toBe("slide")
    expect(normalizeCompareMode(null)).toBe("slide")
  })
})
