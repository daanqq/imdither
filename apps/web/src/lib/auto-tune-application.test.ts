import { describe, expect, it } from "vitest"
import { DEFAULT_SETTINGS } from "@workspace/core"

import { applyAutoTuneLookSettings } from "./auto-tune-application"

describe("Auto-Tune look application", () => {
  it("preserves the current output dimensions when applying a look", () => {
    const current = {
      ...DEFAULT_SETTINGS,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        height: 720,
        width: 1280,
      },
    }
    const recommended = {
      ...DEFAULT_SETTINGS,
      algorithm: "blue-noise" as const,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        height: 960,
        width: 960,
      },
    }

    expect(
      applyAutoTuneLookSettings({ current, recommended }).resize
    ).toMatchObject({
      height: 720,
      width: 1280,
    })
  })
})
