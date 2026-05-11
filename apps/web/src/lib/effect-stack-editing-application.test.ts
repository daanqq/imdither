import { DEFAULT_SETTINGS } from "@workspace/core"
import { describe, expect, it } from "vitest"

import {
  buildEffectStackModel,
  executeEffectStackCommand,
} from "./effect-stack-editing-application"

describe("buildEffectStackModel", () => {
  it("returns three groups (Pre, Core, Post) from default settings", () => {
    const model = buildEffectStackModel(DEFAULT_SETTINGS)

    expect(model).toHaveLength(3)
    expect(model[0].kind).toBe("pre")
    expect(model[0].label).toBe("Pre")
    expect(model[1].kind).toBe("core")
    expect(model[1].label).toBe("Core")
    expect(model[2].kind).toBe("post")
    expect(model[2].label).toBe("Post")
  })

  it("includes locked quantize and dither stages in Core group", () => {
    const model = buildEffectStackModel(DEFAULT_SETTINGS)
    const core = model[1]

    expect(core.stages).toHaveLength(2)
    expect(core.stages[0].label).toBe("Palette")
    expect(core.stages[0].kind).toBe("quantize")
    expect(core.stages[1].label).toBe("Dither")
    expect(core.stages[1].kind).toBe("dither")
  })

  it("Pre and Post groups are empty when effectStack has no optional stages", () => {
    const model = buildEffectStackModel(DEFAULT_SETTINGS)

    expect(model[0].stages).toHaveLength(0)
    expect(model[2].stages).toHaveLength(0)
  })

  it("places pre stages in the Pre group and post stages in the Post group", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      effectStack: [
        {
          instanceId: "pre-1",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.blur", radius: 1.5 },
        },
        ...DEFAULT_SETTINGS.effectStack,
        {
          instanceId: "post-1",
          kind: "post" as const,
          enabled: true,
          params: { effect: "post.grain", amount: 0.12 },
        },
      ],
    }

    const model = buildEffectStackModel(settings)

    expect(model[0].stages).toHaveLength(1)
    expect(model[0].stages[0].instanceId).toBe("pre-1")
    expect(model[0].stages[0].label).toBe("blur")

    expect(model[2].stages).toHaveLength(1)
    expect(model[2].stages[0].instanceId).toBe("post-1")
    expect(model[2].stages[0].label).toBe("grain")
  })

  it("marks pre and post stages as reorderable and removable", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      effectStack: [
        {
          instanceId: "pre-1",
          kind: "pre" as const,
          enabled: true,
          params: { effect: "pre.blur", radius: 1.5 },
        },
        ...DEFAULT_SETTINGS.effectStack,
        {
          instanceId: "post-1",
          kind: "post" as const,
          enabled: true,
          params: { effect: "post.grain", amount: 0.12 },
        },
      ],
    }

    const model = buildEffectStackModel(settings)

    expect(model[0].stages[0].reorderable).toBe(true)
    expect(model[0].stages[0].removable).toBe(true)
    expect(model[2].stages[0].reorderable).toBe(true)
    expect(model[2].stages[0].removable).toBe(true)
  })

  it("marks Core stages as non-reorderable and non-removable", () => {
    const model = buildEffectStackModel(DEFAULT_SETTINGS)
    const core = model[1]

    for (const stage of core.stages) {
      expect(stage.reorderable).toBe(false)
      expect(stage.removable).toBe(false)
    }
  })
})

describe("executeEffectStackCommand", () => {
  it("maps add-stage command to add-effect-stage transition", () => {
    const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
      type: "add-stage",
      kind: "pre",
      effect: "pre.blur",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.transition).toEqual({
        type: "add-effect-stage",
        kind: "pre",
        effect: "pre.blur",
      })
    }
  })

  it("allows adding post stages via add-stage command", () => {
    const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
      type: "add-stage",
      kind: "post",
      effect: "post.grain",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.transition).toEqual({
        type: "add-effect-stage",
        kind: "post",
        effect: "post.grain",
      })
    }
  })

  it("rejects add-stage with unknown effect", () => {
    const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
      type: "add-stage",
      kind: "pre",
      effect: "pre.unknown-effect",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("unknown")
    }
  })

  it("rejects add-stage with kind/effect prefix mismatch", () => {
    const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
      type: "add-stage",
      kind: "pre",
      effect: "post.grain",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("kind")
    }
  })

  it("maps remove-stage command to remove-effect-stage transition", () => {
    const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
      type: "remove-stage",
      instanceId: "some-id",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.transition).toEqual({
        type: "remove-effect-stage",
        instanceId: "some-id",
      })
    }
  })

  it("maps toggle-stage command to set-effect-stage-enabled transition", () => {
    const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
      type: "toggle-stage",
      instanceId: "some-id",
      enabled: false,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.transition).toEqual({
        type: "set-effect-stage-enabled",
        instanceId: "some-id",
        enabled: false,
      })
    }
  })

  it("maps reorder-stages command to reorder-effect-stages transition", () => {
    const settingsWithPre = {
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

    const result = executeEffectStackCommand(settingsWithPre, {
      type: "reorder-stages",
      group: "pre",
      fromIndex: 0,
      toIndex: 1,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.transition).toEqual({
        type: "reorder-effect-stages",
        group: "pre",
        fromIndex: 0,
        toIndex: 1,
      })
    }
  })

  it("validates reorder-stages fromIndex within bounds", () => {
    const settingsWithPre = {
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

    const result = executeEffectStackCommand(settingsWithPre, {
      type: "reorder-stages",
      group: "pre",
      fromIndex: -1,
      toIndex: 0,
    })

    expect(result.ok).toBe(false)
  })

  it("validates reorder-stages toIndex within bounds", () => {
    const settingsWithPre = {
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

    const result = executeEffectStackCommand(settingsWithPre, {
      type: "reorder-stages",
      group: "pre",
      fromIndex: 0,
      toIndex: 5,
    })

    expect(result.ok).toBe(false)
  })

  describe("edit-stage-params", () => {
    it("maps valid param edits to set-effect-stage-params transition", () => {
      const settingsWithPre = {
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

      const result = executeEffectStackCommand(settingsWithPre, {
        type: "edit-stage-params",
        instanceId: "pre-1",
        params: { radius: 4 },
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.transition).toEqual({
          type: "set-effect-stage-params",
          instanceId: "pre-1",
          params: { radius: 4 },
        })
      }
    })

    it("rejects param value below minimum bound", () => {
      const settingsWithPre = {
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

      const result = executeEffectStackCommand(settingsWithPre, {
        type: "edit-stage-params",
        instanceId: "pre-1",
        params: { radius: -1 },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("radius")
        expect(result.error).toContain("0.5")
      }
    })

    it("rejects param value above maximum bound", () => {
      const settingsWithPre = {
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

      const result = executeEffectStackCommand(settingsWithPre, {
        type: "edit-stage-params",
        instanceId: "pre-1",
        params: { radius: 20 },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("radius")
        expect(result.error).toContain("8")
      }
    })

    it("rejects invalid option value", () => {
      const settingsWithPre = {
        ...DEFAULT_SETTINGS,
        effectStack: [
          {
            instanceId: "pre-1",
            kind: "pre" as const,
            enabled: true,
            params: {
              effect: "pre.contrast-shape",
              amount: 0.25,
              curve: "soft",
            },
          },
          ...DEFAULT_SETTINGS.effectStack,
        ],
      }

      const result = executeEffectStackCommand(settingsWithPre, {
        type: "edit-stage-params",
        instanceId: "pre-1",
        params: { curve: "extreme" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("curve")
      }
    })

    it("rejects edit when stage instanceId is not found", () => {
      const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
        type: "edit-stage-params",
        instanceId: "non-existent",
        params: { radius: 1 },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain("not found")
      }
    })

    it("passes through param edits on core stages without effect definition", () => {
      const quantizeId = DEFAULT_SETTINGS.effectStack.find(
        (s) => s.kind === "quantize"
      )!.instanceId

      const result = executeEffectStackCommand(DEFAULT_SETTINGS, {
        type: "edit-stage-params",
        instanceId: quantizeId,
        params: { paletteId: "custom" },
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.transition).toEqual({
          type: "set-effect-stage-params",
          instanceId: quantizeId,
          params: { paletteId: "custom" },
        })
      }
    })
  })
})
