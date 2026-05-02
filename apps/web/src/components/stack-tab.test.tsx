import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { StackTab } from "./stack-tab"

function renderStackTab(
  overrides: Partial<Parameters<typeof StackTab>[0]> = {}
) {
  const onTransition = vi.fn()

  const element = StackTab({
    settings: DEFAULT_SETTINGS,
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

  it("shows reorder controls when multiple optional stages exist", () => {
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

    expect(markup).toContain("Move stage up")
    expect(markup).toContain("Move stage down")
  })
})
