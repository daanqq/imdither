import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it, vi } from "vitest"

import { applyEditorSettingsCommand } from "./editor-settings-command-application"
import type {
  SettingsTransitionContext,
  SettingsTransitionResult,
} from "./editor-settings-transition"

function createAdapter() {
  return { clearAppliedMarker: vi.fn() }
}

function createTransitionSettings(
  resultOverrides: Partial<SettingsTransitionResult> = {}
) {
  return vi.fn(
    (): SettingsTransitionResult => ({
      settings: DEFAULT_SETTINGS,
      ...resultOverrides,
    })
  )
}

describe("applyEditorSettingsCommand", () => {
  it("resets to defaults, clears applied marker, and transitions", () => {
    const adapter = createAdapter()
    const transitionSettings = createTransitionSettings()

    applyEditorSettingsCommand({ type: "reset-defaults" }, adapter, {
      transitionSettings,
    })

    expect(adapter.clearAppliedMarker).toHaveBeenCalledTimes(1)
    expect(transitionSettings).toHaveBeenCalledWith(
      { type: "reset-defaults" },
      undefined
    )
    expect(transitionSettings).toHaveBeenCalledTimes(1)
  })

  it("sets output width, clears applied marker, and transitions with context", () => {
    const adapter = createAdapter()
    const transitionSettings = createTransitionSettings()
    const context: SettingsTransitionContext = {
      sourceDimensions: { width: 1920, height: 1080 },
    }

    applyEditorSettingsCommand(
      { type: "set-output-width", width: 800 },
      adapter,
      { transitionSettings },
      context
    )

    expect(adapter.clearAppliedMarker).toHaveBeenCalledTimes(1)
    expect(transitionSettings).toHaveBeenCalledWith(
      { type: "set-output-width", width: 800 },
      context
    )
  })

  it("passes generic Settings Transition through, clears applied marker", () => {
    const adapter = createAdapter()
    const transitionSettings = createTransitionSettings()

    applyEditorSettingsCommand(
      {
        type: "settings-transition",
        transition: { type: "set-algorithm", algorithm: "floyd-steinberg" },
      },
      adapter,
      { transitionSettings }
    )

    expect(adapter.clearAppliedMarker).toHaveBeenCalledTimes(1)
    expect(transitionSettings).toHaveBeenCalledWith(
      { type: "set-algorithm", algorithm: "floyd-steinberg" },
      undefined
    )
  })

  it("returns the transition result for source notice composition", () => {
    const adapter = createAdapter()
    const transitionSettings = vi.fn(
      (): SettingsTransitionResult => ({
        settings: DEFAULT_SETTINGS,
        sourceNotice: "[OUTPUT CLAMPED: 4000x3000 / 12MP]",
      })
    )

    const result = applyEditorSettingsCommand(
      { type: "reset-defaults" },
      adapter,
      { transitionSettings }
    )

    expect(result.settings).toBe(DEFAULT_SETTINGS)
    expect(result.sourceNotice).toBe("[OUTPUT CLAMPED: 4000x3000 / 12MP]")
  })
})
